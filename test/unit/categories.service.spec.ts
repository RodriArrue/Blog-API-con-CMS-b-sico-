import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoriesService } from '../../src/categories/categories.service';
import { Category } from '../../src/categories/entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;

  // Mock del QueryBuilder encadenado
  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  };

  const mockRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  // Categoría de prueba
  const mockCategory: Partial<Category> = {
    id: 'uuid-cat-1',
    name: 'Tecnología',
    slug: 'tecnologia',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
    // Resetear el mock del QueryBuilder
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('findAll', () => {
    it('debería devolver categorías paginadas', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockCategory]);
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
    });

    it('debería calcular correctamente hasNextPage', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockCategory]);
      mockQueryBuilder.getCount.mockResolvedValue(25);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    it('debería devolver una categoría por ID', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockCategory);

      const result = await service.findOne('uuid-cat-1');

      expect(result).toEqual(mockCategory);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlug', () => {
    it('debería devolver una categoría por slug', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockCategory);

      const result = await service.findBySlug('tecnologia');

      expect(result).toEqual(mockCategory);
    });

    it('debería lanzar NotFoundException si el slug no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findBySlug('slug-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('debería crear una categoría con slug automático', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null); // No duplicada
      mockRepository.create.mockReturnValue(mockCategory);
      mockRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create({ name: 'Tecnología' });

      expect(result).toEqual(mockCategory);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'tecnologia' }),
      );
    });

    it('debería lanzar ConflictException si el nombre ya existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockCategory);

      await expect(service.create({ name: 'Tecnología' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('debería eliminar una categoría existente', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockCategory);
      mockRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('uuid-cat-1')).resolves.not.toThrow();
      expect(mockRepository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.remove('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
