import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  // Listar categorías con paginación y conteo de posts
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Category>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoin('category.posts', 'post')
      .addSelect('COUNT(post.id)', 'postsCount')
      .groupBy('category.id')
      .orderBy('category.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const total = await this.categoriesRepository
      .createQueryBuilder('category')
      .getCount();

    const data = await queryBuilder.getMany();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    };
  }

  // Buscar una categoría por ID con sus posts
  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.posts', 'post')
      .where('category.id = :id', { id })
      .getOne();

    if (!category) {
      throw new NotFoundException(`Categoría con ID "${id}" no encontrada`);
    }

    return category;
  }

  // Buscar categoría por slug
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.posts', 'post')
      .where('category.slug = :slug', { slug })
      .getOne();

    if (!category) {
      throw new NotFoundException(`Categoría con slug "${slug}" no encontrada`);
    }

    return category;
  }

  // Crear una nueva categoría
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name } = createCategoryDto;

    // Generar slug a partir del nombre
    const slug = this.generateSlug(name);

    // Verificar que no exista una categoría con el mismo nombre o slug
    const existing = await this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.name = :name OR category.slug = :slug', { name, slug })
      .getOne();

    if (existing) {
      throw new ConflictException(`Ya existe una categoría con ese nombre`);
    }

    const category = this.categoriesRepository.create({
      ...createCategoryDto,
      slug,
    });

    return this.categoriesRepository.save(category);
  }

  // Actualizar una categoría existente
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Si se actualiza el nombre, regenerar el slug
    if (updateCategoryDto.name) {
      const slug = this.generateSlug(updateCategoryDto.name);

      // Verificar que el nuevo slug no esté en uso por otra categoría
      const existing = await this.categoriesRepository
        .createQueryBuilder('category')
        .where('category.slug = :slug AND category.id != :id', { slug, id })
        .getOne();

      if (existing) {
        throw new ConflictException(`Ya existe una categoría con ese nombre`);
      }

      category.slug = slug;
    }

    Object.assign(category, updateCategoryDto);

    return this.categoriesRepository.save(category);
  }

  // Eliminar una categoría
  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepository.remove(category);
  }

  // Genera un slug URL-friendly a partir de un texto
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '-')     // Reemplazar caracteres especiales por guiones
      .replace(/^-+|-+$/g, '');         // Quitar guiones al inicio y final
  }
}
