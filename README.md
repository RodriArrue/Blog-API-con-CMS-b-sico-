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
├── common/                    # Utilidades compartidas
│   ├── dto/
│   │   └── pagination.dto.ts  # DTO de paginación
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── transform.interceptor.ts
├── config/
│   └── database.config.ts     # Configuración de PostgreSQL
├── users/
│   ├── entities/
│   │   └── user.entity.ts     # Entidad User (admin, editor, reader)
│   └── users.module.ts
├── categories/
│   ├── entities/
│   │   └── category.entity.ts # Entidad Category (OneToMany → Post)
│   └── categories.module.ts
├── tags/
│   ├── entities/
│   │   └── tag.entity.ts      # Entidad Tag (ManyToMany ↔ Post)
│   └── tags.module.ts
├── posts/
│   ├── entities/
│   │   └── post.entity.ts     # Entidad Post (relaciones a User, Category, Tags, Comments)
│   └── posts.module.ts
├── comments/
│   ├── entities/
│   │   └── comment.entity.ts  # Entidad Comment (ManyToOne → Post)
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

## Endpoints (próximamente)

Los endpoints CRUD se implementarán en las siguientes PRs.

## Licencia

MIT
