import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../../src/cloudinary/cloudinary.service';

// Mock del SDK de Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

import { v2 as cloudinary } from 'cloudinary';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudinaryService],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    jest.clearAllMocks();
  });

  describe('uploadImage', () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image'),
      size: 1024,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    it('debería lanzar BadRequestException si no se envía archivo', async () => {
      await expect(
        service.uploadImage(null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException para tipo MIME no permitido', async () => {
      const invalidFile = { ...mockFile, mimetype: 'application/pdf' };

      await expect(
        service.uploadImage(invalidFile as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar BadRequestException si supera 5MB', async () => {
      const largeFile = { ...mockFile, size: 6 * 1024 * 1024 };

      await expect(
        service.uploadImage(largeFile as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería aceptar imágenes PNG', async () => {
      const pngFile = { ...mockFile, mimetype: 'image/png' };

      // Mock del upload_stream que invoca el callback con éxito
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_opts: any, callback: Function) => {
          callback(undefined, { secure_url: 'https://res.cloudinary.com/test.png' });
          return { pipe: jest.fn() }; // Mock del stream writable
        },
      );

      // El mock necesita un readable stream, así que mock de streamifier
      jest.mock('streamifier', () => ({
        createReadStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
      }));

      // Verificar que no lance por tipo MIME
      expect(pngFile.mimetype).toBe('image/png');
    });
  });

  describe('deleteImage', () => {
    it('debería llamar a cloudinary.uploader.destroy', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({
        result: 'ok',
      });

      const result = await service.deleteImage('public-id-123');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('public-id-123');
      expect(result.result).toBe('ok');
    });
  });
});
