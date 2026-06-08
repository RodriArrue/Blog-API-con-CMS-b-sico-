import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/auth/auth.service';
import { User, UserRole } from '../../src/users/entities/user.entity';

// Mock de bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersRepository: any;
  let mockJwtService: any;

  // Usuario de prueba
  const mockUser: Partial<User> = {
    id: 'uuid-123',
    username: 'testuser',
    email: 'test@email.com',
    password: 'hashed_password',
    role: UserRole.READER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUsersRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    const registerDto = {
      username: 'testuser',
      email: 'test@email.com',
      password: 'Password123!',
    };

    it('debería registrar un usuario y devolver token', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.create.mockReturnValue(mockUser);
      mockUsersRepository.save.mockResolvedValue(mockUser);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.register(registerDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(mockUsersRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar ConflictException si el email ya existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue({
        ...mockUser,
        email: 'test@email.com',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'test@email.com', password: 'Password123!' };

    it('debería autenticar y devolver token', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
    });

    it('debería lanzar UnauthorizedException si el email no existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('debería devolver el perfil sin password', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile('uuid-123');

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('username', 'testuser');
    });

    it('debería lanzar UnauthorizedException si no existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.getProfile('uuid-inexistente')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
