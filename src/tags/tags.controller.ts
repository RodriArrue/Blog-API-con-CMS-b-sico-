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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CacheInvalidationInterceptor } from '../common/interceptors/cache-invalidation.interceptor';

@Controller('tags')
@UseInterceptors(CacheInvalidationInterceptor)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // GET /api/tags
  @Get()
  @UseInterceptors(CacheInterceptor)
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.tagsService.findAll(paginationDto);
  }

  // GET /api/tags/:id
  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tagsService.findOne(id);
  }

  // GET /api/tags/slug/:slug
  @Get('slug/:slug')
  @UseInterceptors(CacheInterceptor)
  async findBySlug(@Param('slug') slug: string) {
    return this.tagsService.findBySlug(slug);
  }

  // POST /api/tags (solo admin y editor)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  // PATCH /api/tags/:id (solo admin y editor)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(id, updateTagDto);
  }

  // DELETE /api/tags/:id (solo admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.tagsService.remove(id);
    return { message: 'Tag eliminado correctamente' };
  }
}
