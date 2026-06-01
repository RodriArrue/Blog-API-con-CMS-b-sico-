import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Paginación basada en cursor (más eficiente para feeds/timelines)
export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string; // ID del último elemento de la página anterior

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsString()
  search?: string; // Término de búsqueda full-text

  @IsOptional()
  @IsString()
  categoryId?: string; // Filtrar por categoría

  @IsOptional()
  @IsString()
  tagId?: string; // Filtrar por tag

  @IsOptional()
  @IsString()
  status?: string; // Filtrar por estado (draft/published)
}

export interface CursorPaginatedResult<T> {
  data: T[];
  meta: {
    hasNextPage: boolean;
    nextCursor: string | null;
    total: number;
  };
}
