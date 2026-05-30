import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // Registra un usuario nuevo y devuelve el token
  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    const { username, email, password } = registerDto;

    // Verificar duplicados
    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ConflictException(
        existingUser.email === email
          ? 'El email ya está registrado'
          : 'El nombre de usuario ya está en uso',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.usersRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    await this.usersRepository.save(user);

    const accessToken = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  // Autentica al usuario y devuelve el token
  async login(
    loginDto: LoginDto,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    const { email, password } = loginDto;

    // Traer el password explícitamente (está excluido por defecto en la entidad)
    const user = await this.usersRepository.findOne({
      where: { email },
      select: { id: true, username: true, email: true, password: true, role: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken,
    };
  }

  // Devuelve los datos del usuario autenticado
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return this.sanitizeUser(user);
  }

  // Genera el JWT con los datos del usuario
  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  // Quita el password antes de devolver el usuario
  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
