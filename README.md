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
│   │   └── pagination.dto.ts
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
│   ├── entities/
│   │   └── category.entity.ts
│   └── categories.module.ts
├── tags/
│   ├── entities/
│   │   └── tag.entity.ts
│   └── tags.module.ts
├── posts/
│   ├── entities/
│   │   └── post.entity.ts
│   └── posts.module.ts
├── comments/
│   ├── entities/
│   │   └── comment.entity.ts
│   └── comments.module.ts
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

### Demás endpoints

Los endpoints CRUD de Categories, Tags, Posts y Comments se implementarán en las siguientes PRs.

## Licencia

MIT
