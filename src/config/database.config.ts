import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'blog_user',
  password: process.env.DB_PASSWORD || 'blog_password_123',
  database: process.env.DB_NAME || 'blog_api',
  autoLoadEntities: true,
  synchronize: true, // Solo en desarrollo
  logging: process.env.NODE_ENV === 'development',
}));
