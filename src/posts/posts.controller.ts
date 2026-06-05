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
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { PostsService } from './posts.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CursorPaginationDto } from '../common/dto/cursor-pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CacheInvalidationInterceptor } from '../common/interceptors/cache-invalidation.interceptor';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Posts')
@ApiBearerAuth('JWT')
@Controller('posts')
@UseInterceptors(CacheInvalidationInterceptor)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // GET /api/posts (paginación cursor-based, búsqueda full-text, filtros)
  @Get()
  @UseInterceptors(CacheInterceptor) // Cachea la respuesta
  async findAll(@Query() query: CursorPaginationDto) {
    return this.postsService.findAll(query);
  }

  // GET /api/posts/:slug (buscar por slug)
  @Get(':slug')
  @UseInterceptors(CacheInterceptor)
  async findBySlug(@Param('slug') slug: string) {
    return this.postsService.findBySlug(slug);
  }

  // POST /api/posts (solo admin y editor)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async create(
    @Body() createPostDto: CreatePostDto,
    @GetUser('id') authorId: string,
  ) {
    return this.postsService.create(createPostDto, authorId);
  }

  // POST /api/posts/:id/image — Subir imagen destacada a Cloudinary
  @Post(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  async uploadImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.cloudinaryService.uploadImage(file, 'blog-api/posts');
    const post = await this.postsService.updateFeaturedImage(id, result.secure_url);

    return {
      imageUrl: result.secure_url,
      post,
    };
  }

  // PATCH /api/posts/:id (solo admin y editor)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostDto);
  }

  // DELETE /api/posts/:id (solo admin)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.postsService.remove(id);
    return { message: 'Post eliminado correctamente' };
  }
}
