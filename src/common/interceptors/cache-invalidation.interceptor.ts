import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

// Interceptor que invalida keys de cache cuando se modifican datos
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Solo invalidar en operaciones de escritura
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(async () => {
          // Resetear todo el cache al modificar datos
          await this.cacheManager.clear();
        }),
      );
    }

    return next.handle();
  }
}
