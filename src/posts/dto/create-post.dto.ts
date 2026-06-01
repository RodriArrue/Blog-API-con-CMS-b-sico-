import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostStatus } from '../entities/post.entity';

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string;

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  // DTO anidado: ID de la categoría
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  // DTO anidado: array de IDs de tags
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];
}
