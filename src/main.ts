import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Habilitar CORS
  app.enableCors();

  // Pipes de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si se envían propiedades no definidas
      transform: true,            // Transforma automáticamente los tipos
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Interceptor global de respuesta
  app.useGlobalInterceptors(new TransformInterceptor());

  // Filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`Blog API running on: http://localhost:${port}/api`);
}

bootstrap();
