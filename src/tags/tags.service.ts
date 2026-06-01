import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  // Listar tags con paginación y conteo de posts
  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Tag>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const data = await this.tagsRepository
      .createQueryBuilder('tag')
      .leftJoin('tag.posts', 'post')
      .addSelect('COUNT(post.id)', 'postsCount')
      .groupBy('tag.id')
      .orderBy('tag.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const total = await this.tagsRepository
      .createQueryBuilder('tag')
      .getCount();

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

  // Buscar tag por ID con sus posts
  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagsRepository
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.posts', 'post')
      .where('tag.id = :id', { id })
      .getOne();

    if (!tag) {
      throw new NotFoundException(`Tag con ID "${id}" no encontrado`);
    }

    return tag;
  }

  // Buscar tag por slug
  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagsRepository
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.posts', 'post')
      .where('tag.slug = :slug', { slug })
      .getOne();

    if (!tag) {
      throw new NotFoundException(`Tag con slug "${slug}" no encontrado`);
    }

    return tag;
  }

  // Crear un tag nuevo
  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { name } = createTagDto;
    const slug = this.generateSlug(name);

    // Verificar duplicados
    const existing = await this.tagsRepository
      .createQueryBuilder('tag')
      .where('tag.name = :name OR tag.slug = :slug', { name, slug })
      .getOne();

    if (existing) {
      throw new ConflictException(`Ya existe un tag con ese nombre`);
    }

    const tag = this.tagsRepository.create({ name, slug });

    return this.tagsRepository.save(tag);
  }

  // Actualizar un tag
  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);

    // Si se actualiza el nombre, regenerar el slug
    if (updateTagDto.name) {
      const slug = this.generateSlug(updateTagDto.name);

      const existing = await this.tagsRepository
        .createQueryBuilder('tag')
        .where('tag.slug = :slug AND tag.id != :id', { slug, id })
        .getOne();

      if (existing) {
        throw new ConflictException(`Ya existe un tag con ese nombre`);
      }

      tag.slug = slug;
    }

    Object.assign(tag, updateTagDto);

    return this.tagsRepository.save(tag);
  }

  // Eliminar un tag
  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);
    await this.tagsRepository.remove(tag);
  }

  // Genera un slug URL-friendly
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
