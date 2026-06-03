import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  // Sube una imagen a Cloudinary usando streams (sin guardar en disco)
  async uploadImage(
    file: Express.Multer.File,
    folder = 'blog-api',
  ): Promise<UploadApiResponse> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos válidos: ${allowedMimeTypes.join(', ')}`,
      );
    }

    // Validar tamaño (máx 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('El archivo no puede superar los 5MB');
    }

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 1200, crop: 'limit' }, // Limitar ancho máximo
            { quality: 'auto', fetch_format: 'auto' }, // Optimizar calidad y formato
          ],
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(new BadRequestException(`Error al subir imagen: ${error.message}`));
          } else {
            resolve(result!);
          }
        },
      );

      // Convertir el buffer del archivo a un stream y enviarlo a Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // Elimina una imagen de Cloudinary por su public_id
  async deleteImage(publicId: string): Promise<{ result: string }> {
    return cloudinary.uploader.destroy(publicId);
  }
}
