import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  // Listar comentarios de un post con paginación
  async findByPost(
    postId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<Comment>> {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    await this.validatePostExists(postId);

    const data = await this.commentsRepository
      .createQueryBuilder('comment')
      .where('comment.post_id = :postId', { postId })
      .orderBy('comment.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    const total = await this.commentsRepository
      .createQueryBuilder('comment')
      .where('comment.post_id = :postId', { postId })
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

  // Crear un comentario en un post
  async create(postId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    await this.validatePostExists(postId);

    // Extraer datos del DTO anidado
    const { content, author } = createCommentDto;

    const comment = this.commentsRepository.create({
      content,
      authorName: author.name,
      authorEmail: author.email,
      postId,
    });

    return this.commentsRepository.save(comment);
  }

  // Actualizar el contenido de un comentario
  async update(id: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOneOrFail(id);

    Object.assign(comment, updateCommentDto);

    return this.commentsRepository.save(comment);
  }

  // Aprobar un comentario (solo admin/editor)
  async approve(id: string): Promise<Comment> {
    const comment = await this.findOneOrFail(id);

    comment.isApproved = true;

    return this.commentsRepository.save(comment);
  }

  // Eliminar un comentario
  async remove(id: string): Promise<void> {
    const comment = await this.findOneOrFail(id);
    await this.commentsRepository.remove(comment);
  }

  // Buscar un comentario o lanzar 404
  private async findOneOrFail(id: string): Promise<Comment> {
    const comment = await this.commentsRepository
      .createQueryBuilder('comment')
      .where('comment.id = :id', { id })
      .getOne();

    if (!comment) {
      throw new NotFoundException(`Comentario con ID "${id}" no encontrado`);
    }

    return comment;
  }

  // Verificar que el post existe
  private async validatePostExists(postId: string): Promise<void> {
    const exists = await this.postsRepository
      .createQueryBuilder('post')
      .where('post.id = :postId', { postId })
      .getCount();

    if (!exists) {
      throw new NotFoundException(`Post con ID "${postId}" no encontrado`);
    }
  }
}
