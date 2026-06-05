import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CacheInvalidationInterceptor } from '../common/interceptors/cache-invalidation.interceptor';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Categories')
@ApiBearerAuth('JWT')
@Controller('categories')
@UseInterceptors(CacheInvalidationInterceptor)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // GET /api/categories
  @Get()
  @UseInterceptors(CacheInterceptor)
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.categoriesService.findAll(paginationDto);
  }

  // GET /api/categories/:id
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  // GET /api/categories/slug/:slug
  @Get('slug/:slug')
  @UseInterceptors(CacheInterceptor)
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  // POST /api/categories (solo admin y editor)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  // PATCH /api/categories/:id (solo admin y editor)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  // DELETE /api/categories/:id (solo admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.categoriesService.remove(id);
    return { message: 'Categoría eliminada correctamente' };
  }
}
