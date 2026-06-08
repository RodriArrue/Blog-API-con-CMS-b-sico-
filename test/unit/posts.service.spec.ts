import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PostsService } from '../../src/posts/posts.service';
import { Post, PostStatus } from '../../src/posts/entities/post.entity';
import { Tag } from '../../src/tags/entities/tag.entity';

describe('PostsService', () => {
  let service: PostsService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  };

  const mockPostsRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTagsRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  // Post de prueba
  const mockPost: Partial<Post> = {
    id: 'uuid-post-1',
    title: 'Mi primer post',
    slug: 'mi-primer-post',
    content: 'Contenido del post de prueba',
    excerpt: 'Resumen',
    status: PostStatus.DRAFT,
    featuredImage: null,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    authorId: 'uuid-author-1',
  };

  const mockTag: Partial<Tag> = {
    id: 'uuid-tag-1',
    name: 'NestJS',
    slug: 'nestjs',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: mockPostsRepository },
        { provide: getRepositoryToken(Tag), useValue: mockTagsRepository },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    jest.clearAllMocks();
    mockPostsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockTagsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('findOne', () => {
    it('debería devolver un post por ID', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockPost);

      const result = await service.findOne('uuid-post-1');

      expect(result).toEqual(mockPost);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySlug', () => {
    it('debería devolver un post por slug', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockPost);

      const result = await service.findBySlug('mi-primer-post');

      expect(result).toEqual(mockPost);
    });

    it('debería lanzar NotFoundException si el slug no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findBySlug('slug-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      title: 'Mi primer post',
      content: 'Contenido del post de prueba',
      excerpt: 'Resumen',
    };

    it('debería crear un post con slug automático', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null); // Sin duplicado
      mockPostsRepository.create.mockReturnValue(mockPost);
      mockPostsRepository.save.mockResolvedValue(mockPost);

      const result = await service.create(createDto, 'uuid-author-1');

      expect(result).toEqual(mockPost);
      expect(mockPostsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'mi-primer-post' }),
      );
    });

    it('debería lanzar ConflictException si el slug ya existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockPost); // Slug duplicado

      await expect(
        service.create(createDto, 'uuid-author-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('debería resolver tags por IDs', async () => {
      // Primero retorna null (no duplicado), luego los tags
      mockQueryBuilder.getOne.mockResolvedValueOnce(null);
      mockQueryBuilder.getMany.mockResolvedValueOnce([mockTag]);

      const postWithTags = { ...mockPost, tags: [] };
      mockPostsRepository.create.mockReturnValue(postWithTags);
      mockPostsRepository.save.mockResolvedValue({
        ...postWithTags,
        tags: [mockTag],
      });

      const result = await service.create(
        { ...createDto, tagIds: ['uuid-tag-1'] },
        'uuid-author-1',
      );

      expect(result.tags).toContainEqual(mockTag);
    });

    it('debería setear publishedAt si se publica', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const publishedPost = {
        ...mockPost,
        status: PostStatus.PUBLISHED,
        publishedAt: null,
      };
      mockPostsRepository.create.mockReturnValue(publishedPost);
      mockPostsRepository.save.mockResolvedValue(publishedPost);

      await service.create(
        { ...createDto, status: PostStatus.PUBLISHED },
        'uuid-author-1',
      );

      expect(publishedPost.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateFeaturedImage', () => {
    it('debería actualizar la imagen destacada', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({ ...mockPost });
      const updatedPost = {
        ...mockPost,
        featuredImage: 'https://res.cloudinary.com/image.jpg',
      };
      mockPostsRepository.save.mockResolvedValue(updatedPost);

      const result = await service.updateFeaturedImage(
        'uuid-post-1',
        'https://res.cloudinary.com/image.jpg',
      );

      expect(result.featuredImage).toBe(
        'https://res.cloudinary.com/image.jpg',
      );
    });
  });

  describe('remove', () => {
    it('debería eliminar un post existente', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockPost);
      mockPostsRepository.remove.mockResolvedValue(undefined);

      await expect(service.remove('uuid-post-1')).resolves.not.toThrow();
      expect(mockPostsRepository.remove).toHaveBeenCalledWith(mockPost);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.remove('uuid-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
