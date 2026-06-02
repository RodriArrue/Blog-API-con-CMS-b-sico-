import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(2000)
  content?: string;
}
