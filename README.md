# Blog API con CMS básico

API REST para un blog con sistema de gestión de contenido (CMS) básico, construida con **NestJS**, **TypeORM** y **PostgreSQL**.

## Características

- Posts, categorías, tags y comentarios
- Paginación, búsqueda y subida de imágenes
- Almacenamiento en Cloudinary
- Búsqueda full-text
- Paginación cursor-based
- Cache con Redis

## Conceptos NestJS demostrados

- Upload de archivos
- Query builders
- DTOs anidados
- Relaciones ORM

## Tech Stack

- **Framework:** NestJS 11
- **ORM:** TypeORM
- **Base de datos:** PostgreSQL 16
- **Auth:** JWT + Passport
- **Lenguaje:** TypeScript

## Requisitos previos

- Node.js >= 18
- Docker y Docker Compose

## Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd blog-api

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Levantar la base de datos
docker compose up -d

# Iniciar en modo desarrollo
npm run start:dev
```

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_NAME` | Nombre de la base de datos | `blog_api` |
| `DB_USER` | Usuario de la base de datos | `blog_user` |
| `DB_PASSWORD` | Contraseña de la base de datos | — |
| `APP_PORT` | Puerto de la aplicación | `3000` |
| `JWT_SECRET` | Secret para tokens JWT | — |
| `JWT_EXPIRATION` | Expiración de tokens JWT | `24h` |

## Estructura del proyecto

```
src/
├── auth/                      # Autenticación JWT
│   ├── decorators/
│   │   ├── get-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interfaces/
│   │   └── jwt-payload.interface.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── common/                    # Utilidades compartidas
│   ├── dto/
│   │   ├── pagination.dto.ts
│   │   └── cursor-pagination.dto.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── transform.interceptor.ts
├── config/
│   └── database.config.ts
├── users/
│   ├── entities/
│   │   └── user.entity.ts     # Roles: admin, editor, reader
│   └── users.module.ts
├── categories/
│   ├── dto/
│   │   ├── create-category.dto.ts
│   │   └── update-category.dto.ts
│   ├── entities/
│   │   └── category.entity.ts
│   ├── categories.controller.ts
│   ├── categories.module.ts
│   └── categories.service.ts  # Usa QueryBuilder
├── tags/
│   ├── dto/
│   │   ├── create-tag.dto.ts
│   │   └── update-tag.dto.ts
│   ├── entities/
│   │   └── tag.entity.ts
│   ├── tags.controller.ts
│   ├── tags.module.ts
│   └── tags.service.ts        # Usa QueryBuilder
├── posts/
│   ├── dto/
│   │   ├── create-post.dto.ts   # DTOs anidados (categoryId, tagIds[])
│   │   └── update-post.dto.ts
│   ├── entities/
│   │   └── post.entity.ts
│   ├── posts.controller.ts
│   ├── posts.module.ts
│   └── posts.service.ts     # Full-text search + cursor pagination
├── comments/
│   ├── dto/
│   │   ├── create-comment.dto.ts  # DTO anidado (author como sub-objeto)
│   │   └── update-comment.dto.ts
│   ├── entities/
│   │   └── comment.entity.ts
│   ├── comments.controller.ts
│   ├── comments.module.ts
│   └── comments.service.ts
├── app.module.ts
└── main.ts
```

## Modelo de datos

```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  users   │     │    posts     │     │   tags   │
├──────────┤     ├──────────────┤     ├──────────┤
│ id (PK)  │────<│ author_id    │     │ id (PK)  │
│ username │     │ id (PK)      │>────│ name     │
│ email    │     │ title        │     │ slug     │
│ password │     │ slug         │     └──────────┘
│ role     │     │ content      │         ↕ M:M
│          │     │ excerpt      │    (post_tags)
└──────────┘     │ featured_img │
                 │ status       │
┌──────────┐     │ published_at │     ┌───────────┐
│categories│     │ category_id  │     │ comments  │
├──────────┤     └──────────────┘     ├───────────┤
│ id (PK)  │────<   1:M              │ id (PK)   │
│ name     │                     M:1 >│ post_id   │
│ slug     │                          │ content   │
│ descript.│                          │ author    │
└──────────┘                          │ email     │
                                      │ approved  │
                                      └───────────┘
```

## Scripts disponibles

```bash
npm run start:dev    # Modo desarrollo (watch)
npm run build        # Compilar
npm run start:prod   # Modo producción
npm run lint         # Linting
npm run test         # Tests unitarios
npm run test:e2e     # Tests e2e
```

## Endpoints

### Auth (`/api/auth`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Registrar nuevo usuario | ❌ |
| `POST` | `/auth/login` | Iniciar sesión | ❌ |
| `GET` | `/auth/profile` | Obtener perfil del usuario autenticado | ✅ JWT |

#### Registro

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@blog.com",
    "password": "password123"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@blog.com",
    "password": "password123"
  }'
```

#### Perfil (requiere token)

```bash
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer <tu-token-jwt>"
```

### Categories (`/api/categories`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/categories` | Listar categorías (paginado) | ❌ |
| `GET` | `/categories/:id` | Obtener categoría por ID | ❌ |
| `GET` | `/categories/slug/:slug` | Obtener categoría por slug | ❌ |
| `POST` | `/categories` | Crear categoría | ✅ Admin/Editor |
| `PATCH` | `/categories/:id` | Actualizar categoría | ✅ Admin/Editor |
| `DELETE` | `/categories/:id` | Eliminar categoría | ✅ Admin |

#### Crear categoría

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -d '{
    "name": "Tecnología",
    "description": "Posts sobre desarrollo y tech"
  }'
```

> El `slug` se genera automáticamente a partir del `name` (ej: "Tecnología" → "tecnologia")

#### Listar con paginación

```bash
curl "http://localhost:3000/api/categories?page=1&limit=10"
```

### Tags (`/api/tags`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/tags` | Listar tags (paginado) | ❌ |
| `GET` | `/tags/:id` | Obtener tag por ID | ❌ |
| `GET` | `/tags/slug/:slug` | Obtener tag por slug | ❌ |
| `POST` | `/tags` | Crear tag | ✅ Admin/Editor |
| `PATCH` | `/tags/:id` | Actualizar tag | ✅ Admin/Editor |
| `DELETE` | `/tags/:id` | Eliminar tag | ✅ Admin |

#### Crear tag

```bash
curl -X POST http://localhost:3000/api/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -d '{ "name": "NestJS" }'
```

### Posts (`/api/posts`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/posts` | Listar posts (cursor-based, búsqueda, filtros) | ❌ |
| `GET` | `/posts/:slug` | Obtener post por slug | ❌ |
| `POST` | `/posts` | Crear post | ✅ Admin/Editor |
| `PATCH` | `/posts/:id` | Actualizar post | ✅ Admin/Editor |
| `DELETE` | `/posts/:id` | Eliminar post | ✅ Admin |

#### Crear post

```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -d '{
    "title": "Mi primer post",
    "content": "Contenido del post...",
    "excerpt": "Resumen corto",
    "status": "published",
    "categoryId": "<uuid-de-categoria>",
    "tagIds": ["<uuid-tag-1>", "<uuid-tag-2>"]
  }'
```

#### Listar con búsqueda full-text y filtros

```bash
# Búsqueda full-text
curl "http://localhost:3000/api/posts?search=nestjs&limit=10"

# Filtrar por categoría
curl "http://localhost:3000/api/posts?categoryId=<uuid>"

# Paginación cursor-based (usar nextCursor de la respuesta anterior)
curl "http://localhost:3000/api/posts?cursor=<uuid-ultimo-post>&limit=10"
```

### Comments (`/api/posts/:postId/comments` y `/api/comments`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/posts/:postId/comments` | Listar comentarios de un post (paginado) | ❌ |
| `POST` | `/posts/:postId/comments` | Crear comentario en un post | ❌ |
| `PATCH` | `/comments/:id` | Editar comentario | ✅ Admin/Editor |
| `PATCH` | `/comments/:id/approve` | Aprobar comentario | ✅ Admin/Editor |
| `DELETE` | `/comments/:id` | Eliminar comentario | ✅ Admin |

#### Crear comentario (DTO anidado)

El campo `author` es un **sub-objeto anidado** con validación propia:

```bash
curl -X POST http://localhost:3000/api/posts/<uuid-del-post>/comments \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Excelente artículo!",
    "author": {
      "name": "Juan Pérez",
      "email": "juan@email.com"
    }
  }'
```

#### Aprobar comentario

```bash
curl -X PATCH http://localhost:3000/api/comments/<uuid>/approve \
  -H "Authorization: Bearer <tu-token-jwt>"
```

## Licencia

MIT
