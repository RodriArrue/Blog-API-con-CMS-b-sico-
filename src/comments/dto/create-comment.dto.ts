import { IsString, IsEmail, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Sub-objeto anidado para los datos del autor
export class CommentAuthorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  content: string;

  // DTO anidado: los datos del autor vienen como sub-objeto
  @ValidateNested()
  @Type(() => CommentAuthorDto)
  author: CommentAuthorDto;
}
