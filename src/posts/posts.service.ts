import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './entities/post.entity';
import { Tag } from '../tags/entities/tag.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  CursorPaginationDto,
  CursorPaginatedResult,
} from '../common/dto/cursor-pagination.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
  ) {}

  // Listar posts con paginación cursor-based, búsqueda full-text y filtros
  async findAll(
    query: CursorPaginationDto,
  ): Promise<CursorPaginatedResult<Post>> {
    const { cursor, limit, search, categoryId, tagId, status } = query;

    const qb = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tag')
      .select([
        'post.id',
        'post.title',
        'post.slug',
        'post.excerpt',
        'post.featuredImage',
        'post.status',
        'post.publishedAt',
        'post.createdAt',
        'author.id',
        'author.username',
        'category.id',
        'category.name',
        'category.slug',
        'tag.id',
        'tag.name',
        'tag.slug',
      ]);

    // Búsqueda full-text en PostgreSQL usando to_tsvector y plainto_tsquery
    if (search) {
      qb.andWhere(
        `to_tsvector('spanish', post.title || ' ' || post.content) @@ plainto_tsquery('spanish', :search)`,
        { search },
      );
    }

    // Filtro por categoría
    if (categoryId) {
      qb.andWhere('post.category_id = :categoryId', { categoryId });
    }

    // Filtro por tag
    if (tagId) {
      qb.andWhere('tag.id = :tagId', { tagId });
    }

    // Filtro por estado
    if (status) {
      qb.andWhere('post.status = :status', { status });
    }

    // Cursor: traer posts creados antes del cursor
    if (cursor) {
      const cursorPost = await this.postsRepository.findOne({
        where: { id: cursor },
        select: { id: true, createdAt: true },
      });

      if (cursorPost) {
        qb.andWhere(
          '(post.created_at < :cursorDate OR (post.created_at = :cursorDate AND post.id < :cursorId))',
          { cursorDate: cursorPost.createdAt, cursorId: cursor },
        );
      }
    }

    qb.orderBy('post.created_at', 'DESC')
      .addOrderBy('post.id', 'DESC')
      .take(limit + 1); // Traer uno extra para saber si hay más

    const results = await qb.getMany();

    // Verificar si hay página siguiente
    const hasNextPage = results.length > limit;
    if (hasNextPage) {
      results.pop(); // Quitar el elemento extra
    }

    const nextCursor = hasNextPage
      ? results[results.length - 1].id
      : null;

    // Contar total (sin cursor ni limit)
    const totalQb = this.postsRepository.createQueryBuilder('post');
    if (search) {
      totalQb.andWhere(
        `to_tsvector('spanish', post.title || ' ' || post.content) @@ plainto_tsquery('spanish', :search)`,
        { search },
      );
    }
    if (categoryId) {
      totalQb.andWhere('post.category_id = :categoryId', { categoryId });
    }
    if (status) {
      totalQb.andWhere('post.status = :status', { status });
    }
    const total = await totalQb.getCount();

    return {
      data: results,
      meta: {
        hasNextPage,
        nextCursor,
        total,
      },
    };
  }

  // Buscar post por slug con todas sus relaciones
  async findBySlug(slug: string): Promise<Post> {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tag')
      .leftJoinAndSelect('post.comments', 'comment', 'comment.is_approved = true')
      .select([
        'post',
        'author.id',
        'author.username',
        'category.id',
        'category.name',
        'category.slug',
        'tag.id',
        'tag.name',
        'tag.slug',
        'comment',
      ])
      .where('post.slug = :slug', { slug })
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post con slug "${slug}" no encontrado`);
    }

    return post;
  }

  // Buscar post por ID
  async findOne(id: string): Promise<Post> {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tag')
      .select([
        'post',
        'author.id',
        'author.username',
        'category.id',
        'category.name',
        'category.slug',
        'tag.id',
        'tag.name',
        'tag.slug',
      ])
      .where('post.id = :id', { id })
      .getOne();

    if (!post) {
      throw new NotFoundException(`Post con ID "${id}" no encontrado`);
    }

    return post;
  }

  // Crear un post nuevo
  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const { tagIds, ...postData } = createPostDto;

    const slug = this.generateSlug(postData.title);

    // Verificar slug duplicado
    const existing = await this.postsRepository
      .createQueryBuilder('post')
      .where('post.slug = :slug', { slug })
      .getOne();

    if (existing) {
      throw new ConflictException(`Ya existe un post con ese título`);
    }

    const post = this.postsRepository.create({
      ...postData,
      slug,
      authorId,
    });

    // Si se publica, setear la fecha
    if (postData.status === PostStatus.PUBLISHED) {
      post.publishedAt = new Date();
    }

    // Resolver los tags por sus IDs
    if (tagIds && tagIds.length > 0) {
      post.tags = await this.tagsRepository
        .createQueryBuilder('tag')
        .where('tag.id IN (:...tagIds)', { tagIds })
        .getMany();
    }

    return this.postsRepository.save(post);
  }

  // Actualizar un post existente
  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.findOne(id);
    const { tagIds, ...updateData } = updatePostDto;

    // Regenerar slug si cambia el título
    if (updateData.title) {
      const slug = this.generateSlug(updateData.title);

      const existing = await this.postsRepository
        .createQueryBuilder('post')
        .where('post.slug = :slug AND post.id != :id', { slug, id })
        .getOne();

      if (existing) {
        throw new ConflictException(`Ya existe un post con ese título`);
      }

      post.slug = slug;
    }

    // Si pasa a published y no tenía fecha, setearla
    if (
      updateData.status === PostStatus.PUBLISHED &&
      !post.publishedAt
    ) {
      post.publishedAt = new Date();
    }

    Object.assign(post, updateData);

    // Actualizar tags si se envían
    if (tagIds !== undefined) {
      post.tags = tagIds.length > 0
        ? await this.tagsRepository
            .createQueryBuilder('tag')
            .where('tag.id IN (:...tagIds)', { tagIds })
            .getMany()
        : [];
    }

    return this.postsRepository.save(post);
  }

  // Actualizar la imagen destacada de un post
  async updateFeaturedImage(id: string, imageUrl: string): Promise<Post> {
    const post = await this.findOne(id);
    post.featuredImage = imageUrl;
    return this.postsRepository.save(post);
  }

  // Eliminar un post
  async remove(id: string): Promise<void> {
    const post = await this.findOne(id);
    await this.postsRepository.remove(post);
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
