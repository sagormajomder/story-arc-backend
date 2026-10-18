# Story Arc Backend

The dedicated backend server for Story Arc, handling authentication, data management, and secure API endpoints for the book tracking platform. Built with Node.js and Express, it leverages MongoDB for efficient data storage and advanced aggregation.

## Table of Contents

- [Tools & Technology](#tools--technology-used)
- [Key Features](#key-features)
- [Run it Locally](#run-it-locally)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Installation](#step-by-step-installation)
  - [Environment Configuration (.env)](#environment-configuration-env)
  - [Database Seeding](#database-seeding)
  - [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
  - [Security & Request Headers](#security--request-headers)
  - [Standard Response Formats](#standard-response-formats)
  - [Route Matrix](#route-matrix)
  - [Detailed API Specification](#detailed-api-specification)
- [Design Principles & Patterns](#design-principles--patterns)
- [Architectural FAQs](#architectural-faqs)
- [Connect With Me](#connect-with-me)

## Tools & Technology Used

### Core Technologies

- **Runtime & Language**: Node.js (ESM) & TypeScript
- **Framework**: Express.js (v5)
- **Database & ODM**: MongoDB & Mongoose
- **Authentication & Security**: `jose` (JWT), `argon2` (Argon2id), `helmet`, `hpp`, `express-rate-limit`
- **Validation**: Zod
- **Logging**: Pino & Pino-HTTP

### Development & Tooling

- **Execution**: TSX (TypeScript Execute with Watch Mode)
- **Code Quality**: ESLint (v10 with TypeScript ESLint & `eslint-plugin-boundaries`)

## Key Features

- **Robust Authentication & Identity**: Multi-provider auth (Argon2id local & Google OAuth2 SSO), Refresh Token Rotation (RTR) with session family tracking and reuse detection, account pre-hijacking mitigation, email verification, and password reset workflows.
- **Modular RESTful Architecture**: Clean domain segregation for Auth, Users, Books, Genres, Reviews, Shelf, Tutorials, and Dashboard.
- **Architectural Boundary Enforcement**: Build-time lint rules enforcing a Directed Acyclic Graph (DAG) across modules with public entry point contracts (`*.index.ts`).
- **Shelf & Reading Progress**: Personal library management (`want_to_read`, `currently_reading`, `read`), reading goals, and calendar-day UTC reading streak tracking.
- **Review Moderation Workflow**: State machine with pending review submissions, admin approval/rejection auditing, and automatic book rating synchronization.
- **Advanced Aggregation & Analytics**: MongoDB aggregation pipelines for admin dashboard stats, genre distributions, and personalized book recommendations.
- **Multi-Tier & Identity-Keyed Defense**: Layered rate limiting (global, auth, refresh, and recipient-email keyed) paired with double-check CSRF protection and zero-PII structured logging.

## Run it Locally

Follow these steps to set up and run the Story Arc backend on your local development machine.

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js**: `v20.6.0` or higher (Node 20+ supports the native `--env-file` flag used in scripts and modern ESM features). Check with `node -v`.
- **Package Manager**: [pnpm](https://pnpm.io/) (`v9+` recommended, lockfile provided) or `npm` / `yarn`.
- **MongoDB**: MongoDB Server `v6.0+` running locally (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud cluster URI.
- **OpenSSL**: For generating high-entropy cryptographic secrets (`openssl rand -base64 32`).

---

### Step-by-Step Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/sagormajomder/story-arc-backend.git
   cd story-arc-backend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   # or if using npm:
   # npm install
   ```

3. **Set up Environment Variables**

   Copy the example environment configuration template to create your `.env` file:

   ```bash
   cp .env.example .env
   ```

   Generate two distinct, secure 256-bit secrets for JWT signing:

   ```bash
   openssl rand -base64 32
   ```

   Open `.env` and fill in your secrets and database connection details:

   ```env
   NODE_ENV=development
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/story_arc_dev
   CLIENT_URLS=http://localhost:3000,http://localhost:5173
   JWT_ACCESS_SECRET=your_generated_access_secret_min_32_characters
   JWT_REFRESH_SECRET=your_generated_refresh_secret_min_32_characters
   ```

4. **Seed the Super Admin Account**

   Story Arc includes an idempotent database seeder that automatically checks for an administrative user and provisions one according to your `.env` configuration (`SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`):

   ```bash
   pnpm seed:admin
   # or: npm run seed:admin
   ```

   > [!NOTE]
   > The seeder is idempotent. If a user with `SUPER_ADMIN_EMAIL` already exists, it safely promotes that user to the `admin` role without creating duplicate records or modifying other account fields.

5. **Start the Development Server**

   Launch the server with live reloading powered by TSX and native environment loading:

   ```bash
   pnpm dev
   # or: npm run dev
   ```

   The server will start at:
   - **Base URL**: `http://localhost:8000`
   - **API Root**: `http://localhost:8000/api/v1`
   - **Health Check**: `http://localhost:8000/api/v1/health`

6. **Verify the Installation**

   Send a quick health check request using `curl` or your browser:

   ```bash
   curl -i http://localhost:8000/api/v1/health
   ```

   You should receive a `200 OK` response:

   ```json
   {
     "success": true,
     "message": "Server is healthy",
     "data": {
       "uptime": 2.45
     }
   }
   ```

---

### Environment Configuration (.env)

The application utilizes strict Zod schema validation (`src/config/env.ts`) during startup. If any required variable is missing or malformed, the server fails fast with explicit error diagnostics.

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `test`, `production`). |
| `PORT` | No | `5000` | HTTP port on which the Express server listens. |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string (`mongodb://...` or `mongodb+srv://...`). |
| `CLIENT_URLS` | No | `http://localhost:3000,http://localhost:5173` | Comma-separated whitelist of allowed frontend origins for CORS and CSRF verification. |
| `CLIENT_URL` | No | First origin in `CLIENT_URLS` | Primary frontend web client URL (used for password reset & email verification links). |
| `JWT_ACCESS_SECRET` | **Yes** | — | Cryptographic secret for signing short-lived Access Tokens (minimum 32 characters). |
| `JWT_REFRESH_SECRET` | **Yes** | — | Cryptographic secret for signing long-lived Refresh Tokens (minimum 32 characters). |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Lifetime of Access Tokens (e.g. `15m`, `1h`). |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Lifetime of Refresh Tokens (e.g. `7d`, `30d`). |
| `RATE_LIMIT_WINDOW_MINUTES` | No | `15` | Window size (in minutes) for the global rate limiter. |
| `RATE_LIMIT_MAX` | No | `100` | Maximum requests per window for the global rate limiter. |
| `AUTH_RATE_LIMIT_WINDOW_MINUTES` | No | `15` | Window size for authentication endpoints (`/login`, `/register`). |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Maximum attempts for authentication endpoints. |
| `REFRESH_RATE_LIMIT_WINDOW_MINUTES` | No | `15` | Window size for the token refresh endpoint (`/refresh`). |
| `REFRESH_RATE_LIMIT_MAX` | No | `20` | Maximum refresh requests per window. |
| `EMAIL_FROM_NAME` | No | `Story Arc` | Display name of the sender for outgoing transactional emails. |
| `EMAIL_FROM_ADDRESS` | No | `noreply@storyarc.com` | From email address for transactional emails. |
| `BREVO_API_KEY` | Optional in Dev / **Yes** in Prod | — | Sendinblue / Brevo API key for transactional emails in production. |
| `PASSWORD_RESET_EXPIRES_MINUTES` | No | `15` | Expiration window for password reset tokens. |
| `PASSWORD_RESET_EMAIL_RATE_LIMIT_WINDOW_MINUTES` | No | `60` | Window size for identity-keyed password reset rate limiting. |
| `PASSWORD_RESET_EMAIL_RATE_LIMIT_MAX` | No | `3` | Maximum reset emails that can be requested per target email address per hour. |
| `EMAIL_VERIFICATION_EXPIRES_HOURS` | No | `24` | Expiration window for email verification tokens. |
| `RESEND_VERIFICATION_EMAIL_RATE_LIMIT_WINDOW_MINUTES` | No | `60` | Window size for resending verification emails. |
| `RESEND_VERIFICATION_EMAIL_RATE_LIMIT_MAX` | No | `3` | Maximum resend verification emails per recipient address per hour. |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth2 Client ID for Google SSO authentication. |
| `SUPER_ADMIN_NAME` | No | `Super Admin` | Full name of the initial admin provisioned by `pnpm seed:admin`. |
| `SUPER_ADMIN_EMAIL` | No | `admin@storyarc.com` | Email of the initial admin provisioned by `pnpm seed:admin`. |
| `SUPER_ADMIN_PASSWORD` | No | Configurable (dev fallback) | Initial administrator password provisioned by `pnpm seed:admin` (min 8 chars; must be set securely in production). |

> [!TIP]
> **Email Testing in Development**: You do NOT need a Brevo account or live SMTP server for local development! When `NODE_ENV=development`, Story Arc automatically initializes a virtual [Ethereal](https://ethereal.email/) test email account using Nodemailer. When a verification or password reset email is triggered, a live preview URL (e.g., `https://ethereal.email/message/...`) is logged directly to your terminal.

---

### Database Seeding

To bootstrap the database with the initial administrator account, run:

```bash
pnpm seed:admin
```

This script:
1. Connects to your MongoDB instance using `MONGODB_URI`.
2. Inspects the user directory for `SUPER_ADMIN_EMAIL`.
3. If not found, provisions a verified `admin` account with Argon2id password hashing.
4. If the user already exists with role `user`, safely updates their role to `admin`.
5. Exits cleanly with status code `0`.

---

### Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `pnpm dev` | `tsx watch --env-file=.env src/server.ts` | Start the development server with live reload and automatic `.env` injection. |
| `pnpm seed:admin` | `tsx --env-file=.env src/scripts/seed.ts` | Seed or upgrade the Super Admin account in MongoDB. |
| `pnpm build` | `tsc && tsc-alias` | Compile TypeScript into ES modules in `dist/` with resolved path aliases. |
| `pnpm start` | `node --env-file=.env dist/server.js` | Launch the compiled production server. |
| `pnpm lint` | `eslint src` | Run ESLint with TypeScript ESLint and `eslint-plugin-boundaries` DAG rules. |

---

## API Overview

All API endpoints are versioned under the `/api/v1` prefix.

> [!TIP]
> 📖 **Comprehensive API Documentation**: For complete request/response schemas, validation rules, query parameter specifications, and interactive cURL examples for all 48 endpoints, refer to the dedicated [**API Reference Guide (`docs/API_REFERENCE.md`)**](docs/API_REFERENCE.md).

---

### Security & Request Headers

#### 1. Cookie-Based Authentication
Story Arc utilizes **HTTP-Only Cookies** for secure, tamper-proof session management:
- **`accessToken`**: Automatically set in an HTTP-only cookie upon login (`path: /api/v1`, `SameSite: lax`, `httpOnly: true`). Sent automatically by the browser and verified on all protected routes.
- **`refreshToken`**: Automatically set in an HTTP-only cookie upon login (`path: /api/v1/auth`, `SameSite: strict`, `httpOnly: true`). Exchanged exclusively at `/api/v1/auth/refresh` for Refresh Token Rotation (RTR).

> [!NOTE]
> Frontend clients (e.g., Next.js, React, Vue) should include credentials on all requests (`credentials: 'include'` in `fetch` or `withCredentials: true` in Axios) so cookies are attached automatically.
> When testing via cURL, use `-c cookies.txt` on login to store session cookies, and `-b cookies.txt` on subsequent calls to pass them.

#### 2. CSRF Guard Protection
To defend against Cross-Site Request Forgery on cookie-authenticated requests, all state-changing endpoints (`POST`, `PATCH`, `DELETE`) as well as session rotation routes (`/auth/refresh`, `/auth/logout`) enforce the **Double-Check Guard**:
- **`Origin` Header**: Must match an allowed origin specified in `CLIENT_URLS` (e.g., `http://localhost:3000`).
- **`X-Requested-With` Header**: Custom request header present (e.g., `XMLHttpRequest` or `fetch`) to trigger and require CORS preflight verification.

```bash
# Step 1: Log in and store HTTP-only session cookies in a cookie jar:
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "admin@storyarc.com", "password": "your_admin_password"}'

# Step 2: Make a protected state-changing request using the saved cookies + CSRF headers:
curl -X POST http://localhost:8000/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -H "X-Requested-With: XMLHttpRequest" \
  -b cookies.txt \
  -d '{"title": "Clean Architecture", "author": "Robert C. Martin"}'
```

---

### Standard Response Formats

The API enforces a predictable envelope contract across all responses:

<details>
<summary><strong>View Response Envelopes (Success & Error Contracts)</strong></summary>

<br />

#### Success Envelope (`200 OK`, `201 Created`, `202 Accepted`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  },
  "data": { ... }
}
```
*(The `meta` object is automatically provided on all paginated query endpoints).*

#### Error Envelope (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`)
```json
{
  "success": false,
  "message": "Validation failed",
  "errorSources": [
    {
      "path": "email",
      "message": "Please provide valid email address"
    }
  ]
}
```

</details>

---

### Route Matrix

#### 1. System & Health
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/health` | Public | Server uptime and health probe (excluded from HTTP logger). |

#### 2. Authentication & Identity (`/api/v1/auth`)
| Method | Endpoint | Access | CSRF | Rate Limit | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `POST` | `/register` | Public | No | Strict | Registers account with Argon2id; sends email verification link. |
| `POST` | `/verify-email` | Public | No | Strict | Verifies email via SHA-256 hashed one-time token. |
| `POST` | `/resend-verification` | Public | No | Identity-Keyed | Resends verification email (rate-limited per target email address). |
| `POST` | `/login` | Public | No | Strict | Authenticates user; issues `accessToken` & `refreshToken` cookies. |
| `POST` | `/google` | Public | No | Strict | Google OAuth2 SSO; handles pre-hijacking account linking. |
| `POST` | `/forgot-password` | Public | No | Identity-Keyed | Sends password recovery email with secure reset token. |
| `POST` | `/reset-password` | Public | No | Strict | Resets password; triggers multi-device session revocation. |
| `POST` | `/refresh` | Cookie | **Yes** | Moderate | Refresh Token Rotation (RTR) with family reuse detection. |
| `POST` | `/logout` | Cookie | **Yes** | Standard | Revokes session refresh token from DB; clears auth cookies. |

#### 3. Users Management (`/api/v1/users`)
| Method | Endpoint | Access | CSRF | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/me` | User / Admin | No | Retrieve profile of the authenticated user. |
| `PATCH` | `/me` | User / Admin | **Yes** | Update personal profile (`fullName`, `profileImage`). |
| `GET` | `/` | **Admin** | No | Paginated directory of users with search and role filters. |
| `GET` | `/:id` | **Admin** | No | Retrieve user profile by MongoDB ObjectId. |
| `PATCH` | `/:id/role` | **Admin** | **Yes** | Update user authorization role (`user` \| `admin`). |

#### 4. Books Catalog (`/api/v1/books`)
| Method | Endpoint | Access | CSRF | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/genres` | User / Admin | No | Get distinct list of all active book genres. |
| `GET` | `/` | User / Admin | No | Paginated catalog with full-text search, genre, rating, and sorting. |
| `GET` | `/:id` | User / Admin | No | Get specific book details by ID. |
| `POST` | `/` | **Admin** | **Yes** | Create a new book record. |
| `PATCH` | `/:id` | **Admin** | **Yes** | Update book metadata by ID. |
| `DELETE` | `/:id` | **Admin** | **Yes** | Permanently delete a book record. |

#### 5. Genres Management (`/api/v1/genres`)
| Method | Endpoint | Access | CSRF | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/` | User / Admin | No | Paginated list of genres with dynamic `bookCount` aggregation. |
| `GET` | `/:id` | User / Admin | No | Get single genre by ID. |
| `POST` | `/` | **Admin** | **Yes** | Create a new genre name. |
| `PATCH` | `/:id` | **Admin** | **Yes** | Update genre name. |
| `DELETE` | `/:id` | **Admin** | **Yes** | Delete a genre by ID. |

#### 6. Reviews & Moderation (`/api/v1/reviews`)
| Method | Endpoint | Access | CSRF | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/me` | User / Admin | No | View all reviews submitted by the current user. |
| `GET` | `/book/:bookId` | User / Admin | No | View all **approved** reviews for a specific book. |
| `GET` | `/admin` | **Admin** | No | Moderation queue with `status` filter (`pending`, `approved`, `rejected`). |
| `POST` | `/` | User / Admin | **Yes** | Submit review (defaults to `pending` moderation state). |
| `PATCH` | `/:id` | User / Admin | **Yes** | Edit own review (resets status to `pending`; recalculates ratings). |
| `PATCH` | `/:id/status` | **Admin** | **Yes** | Moderation action: approve or reject review with audit reason. |
| `DELETE` | `/:id` | **Admin** | **Yes** | Delete review and trigger automatic book rating recalculation. |

#### 7. Shelf & Reading Tracker (`/api/v1/shelf`)
| Method | Endpoint | Access | CSRF | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/` | User / Admin | No | View personal reading shelf with status filters & progress sorting. |
| `POST` | `/` | User / Admin | **Yes** | Add book to shelf; atomically increments book `shelvedCount`. |
| `GET` | `/book/:bookId` | User / Admin | No | Check shelf progress for a specific book. |
| `PATCH` | `/book/:bookId` | User / Admin | **Yes** | Update reading progress; manages calendar-day UTC reading streaks. |
| `DELETE` | `/book/:bookId` | User / Admin | **Yes** | Remove book from shelf; atomically decrements `shelvedCount`. |
| `GET` | `/stats` | User / Admin | No | Retrieve shelf counts, annual goal progress, and streak statistics. |
| `POST` | `/goal` | User / Admin | **Yes** | Set or update annual reading target. |
| `PATCH` | `/goal` | User / Admin | **Yes** | Update annual reading target. |
| `GET` | `/recommendations` | User / Admin | No | Top-rated recommendations excluding books currently on user's shelf. |

#### 8. Tutorials Catalog (`/api/v1/tutorials`)
| Method | Endpoint | Access | CSRF | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/` | User / Admin | No | Paginated video tutorials with category and search filters. |
| `GET` | `/:id` | User / Admin | No | Retrieve tutorial details by ID. |
| `POST` | `/` | **Admin** | **Yes** | Create tutorial; automatically extracts YouTube ID & generates thumbnail. |
| `PATCH` | `/:id` | **Admin** | **Yes** | Update tutorial metadata (recalculates video ID if URL changes). |
| `DELETE` | `/:id` | **Admin** | **Yes** | Delete tutorial record. |

#### 9. Admin Dashboard Analytics (`/api/v1/dashboard`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/stats` | **Admin** | KPI statistics: `{ totalBooks, totalUsers, pendingReviews }`. |
| `GET` | `/charts` | **Admin** | Aggregated genre distribution analytics via MongoDB aggregation pipeline. |

---

### Detailed API Specification

For full request/response JSON schemas, field validation rules, and curl recipes, see the comprehensive [**API Reference (`docs/API_REFERENCE.md`)**](docs/API_REFERENCE.md).

## Design Principles & Patterns

The codebase is engineered with production-grade architectural patterns and software design principles to ensure maintainability, scalability, testability, and strict decoupling.

<details>
<summary><strong>1. SOLID Principles</strong> (SRP, OCP, LSP, ISP, DIP)</summary>

<br />

- **Single Responsibility Principle (SRP)**:
  - _Applied in_: Distinct separation of concerns across dedicated layers (`*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.mapper.ts`, `*.validate.ts`, `hasher.service.ts`, `error.middleware.ts`, `env.ts`).
  - _Why_: Each class and module has a single axis of change. Controllers strictly handle HTTP parsing, cookies, and response status codes; services encapsulate pure domain business rules and workflows; repositories isolate database operations and queries; mappers transform documents into sanitized DTOs; and validation schemas enforce runtime contract boundaries.
- **Open/Closed Principle (OCP)**:
  - _Applied in_: Core services depend on abstract contracts (`IPasswordHasher`, `ITokenHasher`, `ITokenService`, `IEmailService`, `IAuthMailer`, `IUserRepository`, `IBookRepository`, `IShelfRepository`).
  - _Why_: Components are open for extension but closed for modification. New storage drivers (e.g., PostgreSQL, Redis), email providers (e.g., SendGrid, AWS SES), or hashing algorithms (e.g., Scrypt) can be integrated by authoring new implementations of existing interfaces without altering core domain business logic.
- **Liskov Substitution Principle (LSP)**:
  - _Applied in_: Implementations such as `Argon2PasswordHasher`, `SHA256TokenHasher`, `JoseTokenService`, and Mongoose repository implementations satisfy their respective interfaces without behavioral variance.
  - _Why_: Any conforming implementation or test double (mock) can seamlessly substitute production dependencies without violating runtime expectations or breaking caller contracts.
- **Interface Segregation Principle (ISP)**:
  - _Applied in_: Focused, client-specific interfaces (`IPasswordHasher`, `ITokenHasher`, `ITokenService`, `IAuthService`, `IUserService`, `IBookService`, `IShelfService`, `IReviewService`).
  - _Why_: Eliminates bloated "fat" interfaces. Consumers depend only on the methods they strictly require, preventing unnecessary coupling and unintended side effects.
- **Dependency Inversion Principle (DIP)**:
  - _Applied in_: High-level domain services depend exclusively on abstractions (interfaces) rather than concrete low-level implementations (`IPasswordHasher` instead of `Argon2PasswordHasher`, `IBookRepository` instead of `BookRepository`).
  - _Why_: Decouples business logic from native binaries, third-party libraries, and database drivers, fostering high testability and architectural resilience.

</details>

<details>
<summary><strong>2. Architectural Patterns</strong> (Layered Architecture, Modular Monolith & Boundaries, Data Mapper, State Machines, Denormalization, Atomic Concurrency)</summary>

<br />

- **Layered Architecture (Controller-Service-Repository-Mapper)**:
  - _Applied in_: Four-tier structural decomposition across feature modules (`src/modules/*`):
    - **Controller Layer**: Handles HTTP protocol semantics (header/cookie parsing, query transformation, status codes, DTO delivery).
    - **Service Layer**: Pure domain logic, transaction orchestration, business validation, and workflows; completely agnostic of the Express framework.
    - **Repository Layer**: Data persistence, Mongoose model abstractions, complex filtering, and MongoDB aggregation pipelines.
    - **Data Mapper Layer**: Explicit mapping between persistence entities and client response DTOs.
  - _Why_: Completely isolates HTTP transport mechanics and database persistence concerns from domain rules, enabling independent evolution and isolated unit testing.
- **Modular Monolith & Architectural Boundary Enforcement (`eslint-plugin-boundaries`)**:
  - _Applied in_: Build-time ESLint boundary policies in `eslint.config.js` defining a Directed Acyclic Graph (DAG) for module dependencies:
    - `auth` &rarr; `['user']`
    - `genre` &rarr; `['book']`
    - `review` &rarr; `['book', 'user']`
    - `dashboard` &rarr; `['book', 'user', 'review']`
    - `shelf` &rarr; `['book', 'review']`
    - `user`, `book`, `tutorial` &rarr; `[]` (leaf modules)
  - _Why_: Prevents the "Big Ball of Mud" anti-pattern. Inter-module communication is restricted to public module entry points (`*.index.ts`), shared and config layers cannot depend on domain modules (no upward dependency leaks), and circular dependencies are eliminated (`import/no-cycle`).
- **Data Mapper Pattern (`*.mapper.ts`)**:
  - _Applied in_: Dedicated mappers across every module (`user.mapper.ts`, `book.mapper.ts`, `shelf.mapper.ts`, `review.mapper.ts`, `genre.mapper.ts`, `tutorial.mapper.ts`).
  - _Why_: Decouples database schema design from API response contracts. Normalizes MongoDB `_id` into client-friendly `id`, strips internal fields (such as `password`, `__v`), and formats populated relations consistently. Changes to database models do not leak into API consumers.
- **Domain State Machine & Moderation Workflow Pattern**:
  - _Applied in_: Review status transitions (`pending` &rarr; `approved` / `rejected`) in `review.service.ts` and shelf reading lifecycles (`want_to_read` &rarr; `currently_reading` &rarr; `read`) in `shelf.service.ts`.
  - _Why_: Encapsulates valid state transitions and guarantees reactive domain side effects. For example, approving or rejecting a review triggers automatic book rating recalculations (`updateBookRating`), while updating shelf progress automatically manages `startedAt`/`finishedAt` timestamps and reading streak updates.
- **Snapshot & Denormalization Pattern for Read-Heavy Queries**:
  - _Applied in_: Storing user metadata (`userName`, `userEmail`, `userImage`) and book metadata (`bookTitle`, `bookAuthor`, `bookCover`) directly within the `Review` document.
  - _Why_: Book review listings and moderation tables are heavily read-dominated. Denormalizing essential display fields eliminates expensive cross-collection `$lookup` joins in MongoDB, dramatically reducing CPU and RAM overhead while preserving historical integrity if a user's name or book title changes later.
- **Atomic State Mutation Pattern (Concurrency & Race Condition Defense)**:
  - _Applied in_: Atomic counter increments (`$inc: { shelvedCount: amount }` in `BookRepository.adjustShelvedCount`) and atomic updates across repository operations.
  - _Why_: Eliminates check-then-act race conditions that arise in concurrent environments when multiple users shelf or unshelf books simultaneously, avoiding the complexity and overhead of distributed locking.

</details>

<details>
<summary><strong>3. Software Design Patterns</strong> (Repository, DI, Facade, Strategy/Adapter, Decorator, DTO, Zod Pipeline, UTC Normalization, Seeding, Error Chain, Singleton)</summary>

<br />

- **Repository Pattern**:
  - _Applied in_: Dedicated repositories implementing abstract contracts (`UserRepository`, `BookRepository`, `ShelfRepository`, `ReviewRepository`, `GenreRepository`, `RefreshTokenRepository`, `PasswordResetTokenRepository`, `EmailVerificationTokenRepository`).
  - _Why_: Centralizes data access logic, query construction, and aggregations. Services remain unaware of Mongoose query operators, schemas, and persistence details.
- **Dependency Injection (DI) & Inversion of Control (IoC)**:
  - _Applied in_: Constructor injection with default fallback singletons across all services and repositories (e.g., `constructor(private readonly repo: IBookRepository = bookRepository) {}`).
  - _Why_: Eliminates hardcoded dependencies and allows frictionless injection of mock objects during unit testing without requiring runtime IoC container overhead.
- **Facade / Public API Pattern (Module Barrel Exports)**:
  - _Applied in_: Module-level public entry points (`*.index.ts`) exporting only authorized services, DTOs, and types.
  - _Why_: Enforces domain encapsulation and information hiding. Internal models, query builders, and private repositories cannot be reached from other modules.
- **Strategy & Adapter Pattern**:
  - _Applied in_: Pluggable hashing strategies (`Argon2PasswordHasher`, `SHA256TokenHasher`), token strategies (`JoseTokenService`), and mailing adapters (`NodemailerEmailService`).
  - _Why_: The core application interacts only with abstract strategy interfaces. Swapping mail providers (e.g., Brevo API vs SMTP) or token mechanisms requires authoring a single adapter class with zero modifications to business services.
- **Decorator / Higher-Order Middleware Pattern**:
  - _Applied in_: `asyncCatch` (asynchronous controller wrapper), `validate(schema)` (Zod validation factory), and `authorize(...allowedRoles)` (RBAC middleware).
  - _Why_: Eliminates boilerplate `try/catch` and validation logic, ensuring consistent error propagation and declarative endpoint authorization.
- **Data Transfer Object (DTO) Pattern & Strict Field Exclusion**:
  - _Applied in_: Strongly typed DTOs derived from Zod schemas and dedicated response DTOs (`RegisterDto`, `LoginDto`, `BookResponseDto`, `ShelfItemResponseDto`).
  - _Why_: Enforces type safety at system boundaries, prevents mass-assignment vulnerabilities, and guarantees that internal attributes are never returned to clients.
- **Request Transformation & Coercion Pipeline (Zod Preprocessing)**:
  - _Applied in_: `validate.middleware.ts`, `transformers.ts` (`emptyStringToUndefined`, `emptyPasswordToUndefined`), and `env.ts`.
  - _Why_: Normalizes incoming HTTP request payloads by transforming empty or whitespace-only strings (`""`) into `undefined` before schema parsing, enabling fallback to default values for optional query and body parameters while preserving intentional password whitespace.
- **Calendar-Day UTC Normalization Pattern (Streak Algorithm)**:
  - _Applied in_: `calculateReadingStreak`, `getUtcDayDiff`, and `getActiveStreak` in `shelf.utils.ts`.
  - _Why_: Streak tracking cannot depend on 24-hour elapsed millisecond timers (e.g., reading at 11:59 PM and 12:05 AM is 6 minutes apart but represents 2 distinct calendar days; reading at 8:00 AM and 9:00 PM the following day is 37 hours apart yet represents consecutive days). Normalizing dates to UTC calendar day integers (`Date.UTC`) makes streak calculations immune to timezone offsets and Daylight Saving Time (DST) shifts.
- **Idempotent Database Seeding Pattern**:
  - _Applied in_: Super Admin seeding script (`src/scripts/seed.ts`).
  - _Why_: Safe for repeated execution during deployment pipelines or container bootstrapping. Validates environment configurations, checks existing records, and upgrades roles idempotently without crashing or creating duplicates.
- **Centralized Error Handling (Chain of Responsibility)**:
  - _Applied in_: `AppError` class and global `errorHandler` middleware.
  - _Why_: Normalizes heterogeneous errors (`AppError`, `ZodError`, Mongoose `ValidationError`, `CastError`, Mongo Duplicate Key `11000`, CORS errors) into a standardized response contract (`IErrorSource[]`), while withholding internal stack traces in production.
- **Standardized Response Envelope Pattern**:
  - _Applied in_: `sendResponse` utility enforcing `{ success, message, meta, data }`.
  - _Why_: Delivers a predictable API response contract for client applications, simplifying frontend response parsing and error handling.
- **Singleton Pattern**:
  - _Applied in_: Pre-instantiated module exports for stateless services, token handlers, and repository instances (`logger`, `tokenService`, `argon2PasswordHasher`, `userService`, `bookService`).
  - _Why_: Efficiently reuses connection pools, logging streams, and pre-computed cryptographic state without redundant instantiations across incoming HTTP requests.

</details>

<details>
<summary><strong>4. Security & Production Engineering Patterns</strong> (Refresh Token Rotation, Opaque Token Hashing, Multi-Tier Rate Limiting, CSRF Guard, Timing Defense, Pre-Hijacking Mitigation, Session Revocation, TTL Indexes, Connection Pooling, Zero-PII, Fail-Fast, Shutdown)</summary>

<br />

- **Refresh Token Rotation (RTR) with Family Tracking & Automatic Reuse Detection**:
  - _Applied in_: `auth.service.ts`, `refresh-token.repository.ts`, and `refresh-token.model.ts`.
  - _Why_: Every refresh request issues a new refresh token and immediately marks the previous token as revoked. Tokens are grouped under a unique `familyId`. If a revoked token is used (beyond a 30s network grace period), the system detects a token theft/replay attack and immediately invalidates the entire session family (`deleteAllByFamilyId`), neutralizing the attacker and forcing re-authentication.
- **Opaque Token Hashing at Rest (SHA-256 for Database Tokens)**:
  - _Applied in_: `RefreshToken`, `PasswordResetToken`, and `EmailVerificationToken` collections.
  - _Why_: Adheres to the cryptographic principle of never storing bearer credentials in plaintext. Clients receive the raw unguessable token, while the database persists only its SHA-256 hash. If the database is compromised or a backup leaks, tokens cannot be forged or used to hijack sessions or reset passwords.
- **Multi-Tier & Identity-Keyed Rate Limiting Pattern**:
  - _Applied in_: `rateLimit.middleware.ts` across four specialized limiters:
    - **Global Limiter**: Blanket protection placed *before* body parsing to conserve CPU and RAM.
    - **Auth Limiter**: Strict throttle on sensitive authentication endpoints (`/login`, `/register`).
    - **Refresh Limiter**: Controlled throttle on `/refresh` to prevent token churn.
    - **Identity-Keyed Email Limiter**: Limits password reset and email verification attempts *keyed by target email address* (`keyGenerator: req => 'reset-email:' + email`).
  - _Why_: IP-based rate limiting alone is ineffective against distributed botnets rotating thousands of residential proxies. Keying rate limits by recipient email prevents targeted inbox flooding (email bombing) attacks against specific user accounts.
- **Custom CSRF Defense (Double-Check Guard: Origin Whitelist + Custom Header)**:
  - _Applied in_: `csrfGuard` middleware in `security.middleware.ts`.
  - _Why_: State-changing endpoints verify that the `Origin` header matches an allowed whitelist `Set` (O(1) lookup) AND require an `X-Requested-With` custom header. Standard cross-origin HTML `<form>` submissions, embedded image tags, and unauthorized cross-site scripts cannot attach custom headers, defeating CSRF without requiring heavy stateful anti-CSRF token synchronization.
- **Timing Attack Defense via Dummy Hash**:
  - _Applied in_: `Argon2PasswordHasher` maintaining a static pre-computed hash and `auth.service.ts`.
  - _Why_: Eliminates response-time discrepancies between existing and non-existing email lookups, neutralizing side-channel account enumeration attacks.
- **Account Pre-Hijacking Mitigation (Google SSO & Local Account Linking)**:
  - _Applied in_: `auth.service.ts` (`googleLogin`).
  - _Why_: If an attacker creates an unverified local account using a victim's email before the victim signs up, and the victim subsequently logs in with verified Google OAuth, Story Arc purges the unverified local password, assigns ownership to Google SSO, and dispatches a security alert email—preventing pre-hijacking account takeover.
- **Password History & Re-Use Prevention**:
  - _Applied in_: `auth.service.ts` (`resetPassword`).
  - _Why_: Verifies candidate reset passwords against the user's existing Argon2 hash and rejects identical passwords, preventing users from recycling compromised credentials.
- **Automatic Multi-Device Session Revocation on Security Events**:
  - _Applied in_: `auth.service.ts` (`resetPassword`).
  - _Why_: When a user resets their password, all active refresh tokens (`deleteAllByUserId`) are immediately purged, severing active sessions across all devices and browsers.
- **MongoDB TTL (Time-To-Live) Automatic Document Purging**:
  - _Applied in_: `refresh-token.model.ts`, `password-reset-token.model.ts`, and `email-verification-token.model.ts` with `{ expires: 0 }`.
  - _Why_: Offloads expired token cleanup to MongoDB's internal background thread, eliminating the need for cron jobs, background schedulers, or distributed lock management.
- **Production-Grade MongoDB Connection Pooling & Resilience**:
  - _Applied in_: `src/shared/database/db.ts`.
  - _Why_: Configures `minPoolSize: 10` to eliminate connection cold starts, `maxPoolSize: 50` for high concurrency, disables `autoIndex` in production to prevent startup collection locks, enforces `w: 'majority'` write concern for cluster durability, and disables command buffering to fail fast on disconnection.
- **Compound Indexing adhering to the ESR (Equality, Sort, Range) Rule**:
  - _Applied in_: Review schema (`{ bookId: 1, status: 1, createdAt: -1 }`), Shelf schema (`{ userId: 1, status: 1 }`, `{ userId: 1, bookId: 1 }`), and Reading Goal schema (`{ userId: 1, year: 1 }`).
  - _Why_: Optimizes index traversal ($O(\log N)$) and allows MongoDB to satisfy queries directly from index trees without memory-intensive collection scans (`COLLSCAN`) or un-indexed in-memory sorting.
- **Zero-PII Structured Logging**:
  - _Applied in_: Custom serializers in `pinoHttpLogger` (`httpLogger.middleware.ts`).
  - _Why_: Whitelists only safe request metadata (`id`, `method`, `url`, `query`, `statusCode`) while strictly stripping headers, cookies, and bodies from log outputs to prevent tokens and sensitive user data from leaking into logs. Health check probes (`/api/v1/health`) are also excluded to prevent log pollution.
- **Fail-Fast Configuration Pattern**:
  - _Applied in_: Zod-validated `env.ts` with `Object.freeze`.
  - _Why_: Crashes immediately during bootstrap if critical environment variables are missing or malformed, preventing runtime surprises in production.
- **Graceful Shutdown & Connection Draining**:
  - _Applied in_: Signal listeners (`SIGTERM`, `SIGINT`) and process error hooks (`unhandledRejection`, `uncaughtException`) in `server.ts`.
  - _Why_: Allows in-flight HTTP requests to complete, safely disconnects MongoDB connection pools, and enforces a fallback exit watchdog timer to avoid hanging containers during rolling deployments.
- **Reverse Proxy Connection Optimization**:
  - _Applied in_: HTTP server `keepAliveTimeout` (65s) and `headersTimeout` (66s) configuration.
  - _Why_: Prevents race conditions and unexpected `502 Bad Gateway` errors when deploying behind reverse proxies or load balancers (AWS ALB, Nginx, Cloudflare).
- **Defense-in-Depth Security**:
  - _Applied in_: `helmet` (security headers), `hpp` (HTTP parameter pollution defense), body size limits (`16kb`), and global rate limiting executed before body parsing.
  - _Why_: Protects against denial-of-service (DoS), memory exhaustion, and common web attack vectors.

</details>

## Architectural FAQs

<details>
<summary><strong>1. Why use the Controller-Service-Repository pattern?</strong></summary>

<br />

- **Separation of Concerns (SoC)**: Each layer has a single, well-defined responsibility:
  - **Controllers**: Handle HTTP transport concerns only (validating request schemas, parsing cookies/headers, calling services, and formatting HTTP response codes). They remain completely unaware of database logic.
  - **Services**: Encapsulate pure business logic, workflows, hashing, token issuance, and domain rules. They are decoupled from the Express framework and HTTP transport (`req`, `res`).
  - **Repositories**: Encapsulate database persistence, queries, and aggregations using Mongoose.
- **Maintainability & Decoupling**: If the database changes (e.g., migrating from MongoDB to PostgreSQL) or the transport layer changes (e.g., adding GraphQL or WebSocket endpoints), only the relevant layer needs changes without affecting business rules.
- **Improved Testability**: Decoupling business logic from Express `req`/`res` objects allows services to be unit-tested cleanly in isolation as plain TypeScript functions.

</details>

<details>
<summary><strong>2. Why program against interfaces instead of importing concrete classes directly?</strong></summary>

<br />

- **Dependency Inversion Principle (DIP)**: In accordance with SOLID principles, high-level modules should not depend on low-level concrete implementations; both should depend on abstractions (interfaces like `IUserRepository`, `IPasswordHasher`, `ITokenService`).
- **Loose Coupling**: Consumers depend strictly on behavioral contracts rather than specific class implementations. Internal changes or optimizations to a class do not break calling code as long as the interface contract is fulfilled.
- **Frictionless Mocking for Unit Tests**: In test suites, services can be provided with lightweight test doubles/mock objects conforming to the interface without needing to instantiate or monkey-patch production classes.
- **Clear Architectural Contracts**: Interfaces make module expectations explicit, serving as clean documentation for expected methods, arguments, and return types.

</details>

<details>
<summary><strong>3. Why use Dependency Injection (DI)?</strong></summary>

<br />

- **Eliminates Hardcoded Dependencies**: Rather than creating dependencies internally using `new ClassName()`, dependencies are supplied via constructor parameters (`constructor injection`).
- **Isolated & Fast Unit Testing**: Eliminates the need to connect to real databases or run expensive hashing rounds in unit tests. Mock repositories and mock hashers can be injected into services effortlessly.
- **Default Fallback Convenience**: Using default parameters in constructors (e.g., `constructor(private readonly repo: IUserRepository = userRepository)`) provides zero boilerplate when instantiated in production routes, while keeping classes 100% open for dependency override in tests.
- **Extensibility & Swappability**: Different implementations (such as alternative storage backends, email providers, or cloud services) can be plugged in seamlessly without altering service code.

</details>

<details>
<summary><strong>4. Why use Argon2 instead of bcrypt / bcryptjs?</strong></summary>

<br />

- **Modern Standard & Industry Recommendation**: Argon2 is the winner of the Password Hashing Competition (PHC) and is recommended by OWASP, IETF (RFC 9106), and modern security guidelines as the preferred password hashing algorithm over legacy schemes like bcrypt and PBKDF2.
- **Memory-Hardness & Hardware Attack Resistance**: Bcrypt is solely compute-bound and uses a fixed 4 KB memory footprint, leaving it vulnerable to highly parallel brute-force attacks via modern GPUs and custom ASICs. Argon2 (specifically `argon2id`) is memory-hard, allowing configurable memory usage, time iterations, and parallelism to make specialized hardware attacks prohibitively expensive.
- **Protection Against Side-Channel Attacks**: We employ `argon2id`, a hybrid configuration that combines the side-channel attack resistance of Argon2i with the GPU cracking resistance of Argon2d.
- **No 72-Byte Password Limit**: Bcrypt has a known limitation where passwords beyond 72 bytes are silently truncated. Argon2 has no such constraint and safely hashes arbitrary-length inputs.
- **Performance & Efficiency**: Compared to `bcryptjs` (a pure JS implementation that runs significantly slower and burdens Node's event loop), native `argon2` bindings leverage compiled multithreading performance.

</details>

<details>
<summary><strong>5. Why use <code>jose</code> instead of <code>jsonwebtoken</code>?</strong></summary>

<br />

- **Modern Web Standards & Universal Runtime Support**: `jose` is built around native Web Crypto API standards (`crypto.subtle`). It operates consistently across multiple JavaScript runtimes—such as Node.js, Deno, Bun, and Edge environments (Cloudflare Workers, Vercel Edge)—without dependency on legacy Node-specific `crypto` APIs.
- **Native ESM & First-Class TypeScript Support**: This project uses native ECMAScript Modules (`"type": "module"`). `jose` is ESM-first and includes comprehensive TypeScript definitions out of the box, eliminating the need for outdated or fragmented third-party `@types` packages.
- **Zero External Dependencies**: Unlike `jsonwebtoken`, which relies on multiple transitive dependencies (such as `jws`, `jwa`, etc.), `jose` has zero external dependencies, significantly reducing bundle footprint and supply chain security risks.
- **Secure by Default & Strict Error Handling**: `jsonwebtoken` has a history of security vulnerabilities, including algorithm confusion and insecure header handling. `jose` enforces secure defaults by requiring explicit algorithm declarations during verification (`jwtVerify`) and providing granular error classes (e.g., `errors.JWTExpired`, `errors.JWTInvalid`) for clean error handling.
- **Async/Promise-First Architecture**: `jose` is natively asynchronous and designed from the ground up for `async/await`, avoiding callback boilerplate and promisification wrappers.

</details>

<details>
<summary><strong>6. Why use a pre-computed dummy hash during authentication?</strong></summary>

<br />

- **Mitigation of Side-Channel Timing Attacks**: In standard authentication flows, when an email is not found, the server immediately returns a `401 Unauthorized` without hashing (taking ~1–2ms). Conversely, when an email exists but the password is wrong, the server performs expensive Argon2 verification (taking ~50–100ms). Attackers can analyze these response time differences to enumerate valid user emails.
- **Constant-Time Execution Flow**: By verifying the submitted password against a pre-computed `dummyHash` even when no user record exists, both paths incur identical computational latency, effectively neutralizing username/email enumeration via timing side-channels.
- **Performance-Conscious Implementation**: The dummy hash is pre-computed statically at startup rather than re-hashed on every failure, saving CPU cycles while preserving security.

</details>

<details>
<summary><strong>7. Why use Refresh Token Rotation (RTR) with Family Tracking and Token Reuse Detection?</strong></summary>

<br />

- **The Problem with Long-Lived Refresh Tokens**: A leaked long-lived refresh token allows an attacker persistent access to an account until the token reaches its expiration date.
- **Single-Use Rotation**: Refresh Token Rotation ensures that every refresh token can only be exchanged once. Issuing a new token automatically revokes the previous one.
- **Family ID Tracking**: Tokens issued from the same root login session share a `familyId`. If an attacker attempts to replay an already revoked token, the server detects token theft and immediately purges all tokens in that family (`deleteAllByFamilyId`), terminating the compromised session on all ends.
- **Grace Period Resilience**: In real-world networks (especially mobile networks), connection drops, retries, or concurrent duplicate requests can cause the client to submit the old token shortly after a refresh. Story Arc incorporates a 30-second grace period for recently rotated tokens to prevent accidental session termination while still detecting genuine attacks.

</details>

<details>
<summary><strong>8. Why hash tokens (SHA-256) before storing them in the database?</strong></summary>

<br />

- **Defense-in-Depth for Stored Credentials**: Tokens stored in the database (refresh tokens, password reset tokens, email verification tokens) are bearer credentials. If stored in plaintext, a database leak, unredacted query log, or read-replica compromise grants an attacker immediate unauthorized access.
- **One-Way Cryptographic Proof**: By persisting only `SHA-256(rawToken)`, the server cannot recover the token from the database. When the client presents the raw token, the server computes its SHA-256 hash and compares it against the stored value.
- **Performance**: Unlike passwords (which require computationally intensive, memory-hard Argon2 hashing to thwart brute force), high-entropy 256-bit random tokens cannot be brute-forced. SHA-256 provides lightning-fast $O(1)$ hashing with negligible CPU footprint.

</details>

<details>
<summary><strong>9. Why use Identity-Keyed Rate Limiting in addition to IP-based Rate Limiting?</strong></summary>

<br />

- **The Shortcoming of IP-Only Rate Limiting**: Attackers targeting email endpoints (such as `/forgot-password` or `/resend-verification`) can easily bypass IP rate limits using botnets or rotating proxy pools. Each request arrives from a different IP, exhausting IP rate limits without protection.
- **Email Bombing & Resource Exhaustion Defense**: An attacker could flood a victim's inbox with hundreds of password reset emails. Story Arc implements `forgotPasswordEmailLimiter` and `resendVerificationEmailLimiter` using a custom key generator:
  ```ts
  keyGenerator: req => req.body?.email ? `reset-email:${req.body.email.trim().toLowerCase()}` : 'anonymous'
  ```
- **Guaranteed Boundary**: Regardless of how many distinct IP addresses or proxies the attacker routes requests through, a single target email can trigger at most 3 reset requests per hour.

</details>

<details>
<summary><strong>10. Why enforce Architectural Boundaries with <code>eslint-plugin-boundaries</code> in a Modular Monolith?</strong></summary>

<br />

- **Preventing "Big Ball of Mud"**: In Node.js codebases, developers can easily import internal files from any module into any other module, creating tightly tangled dependencies that make refactoring or extracting services nearly impossible.
- **Explicit Dependency Graph**: `eslint.config.js` formalizes allowable dependencies as a Directed Acyclic Graph (DAG). If a module attempts to import from an unauthorized domain, the linter fails at build time.
- **Information Hiding**: Cross-module imports are restricted strictly to public entry points (`*.index.ts`). A module cannot import another module's internal Mongoose models, private helpers, or repositories directly.
- **Microservices Readiness**: Because each module is completely self-contained and communicates only through public service contracts, any module can be extracted into an independent microservice in the future with minimal architectural friction.

</details>

<details>
<summary><strong>11. Why use Data Mappers (<code>*.mapper.ts</code>) instead of returning Mongoose documents directly?</strong></summary>

<br />

- **Decoupling Storage from Transport**: Mongoose documents contain database-specific properties (`_id`, `__v`, internal getters/setters, methods). Exposing them directly tightly couples the API contract to MongoDB implementation details.
- **Preventing Information Disclosure**: Mappers explicitly construct output objects, guaranteeing that internal state, password hashes, and sensitive administrative flags are never serialized into API responses.
- **Consistent Schema Evolution**: If database fields are renamed or restructured internally, updating the mapper ensures that the client-facing API response contract remains unchanged without breaking mobile or web frontend clients.

</details>

<details>
<summary><strong>12. Why use Denormalization and Snapshotting in the Review and Shelf domains?</strong></summary>

<br />

- **Optimized for Read-Heavy Workloads**: In a book-tracking platform, reading book details, user reviews, and shelf status occurs orders of magnitude more frequently than writing them.
- **Eliminating Distributed Join Overhead**: MongoDB `$lookup` stages across multiple large collections are memory and CPU expensive. Denormalizing essential reviewer details (`userName`, `userImage`) and book details (`bookTitle`, `bookAuthor`, `bookCover`) allows review lists to be satisfied with a single query.
- **Historical Snapshot Integrity**: If a user updates their username or profile picture in the future, past reviews retain the context of who authored them at that point in time, avoiding historical anomalies in published reviews.

</details>

<details>
<summary><strong>13. Why use MongoDB TTL (Time-To-Live) indexes instead of Cron Jobs for token expiration?</strong></summary>

<br />

- **Native Database Engine Automation**: MongoDB provides native TTL indexes (`{ expires: 0 }`) that automatically delete documents whose `expiresAt` timestamp has passed using an efficient internal background thread.
- **Zero Infrastructure Overhead**: Eliminates the operational complexity of configuring separate cron jobs, message queues (e.g., BullMQ), or external workers (e.g., Redis) just to periodically purge expired tokens.
- **Automatic Scalability**: Document deletion scales directly with the database engine without imposing additional load or scheduler coordination on application server instances.

</details>

<details>
<summary><strong>14. Why use a custom CSRF Guard (<code>Origin</code> + <code>X-Requested-With</code>) instead of stateful anti-CSRF tokens?</strong></summary>

<br />

- **Stateless Architecture**: Traditional anti-CSRF tokens require server-side session stores or synchronized encrypted cookie pairs, adding statefulness and complexity across clustered server environments.
- **Browser Security Invariants**: Modern browsers prevent cross-origin HTML `<form>` submissions, `<img>` tags, and standard script tags from attaching custom HTTP headers like `X-Requested-With`.
- **Double-Check Verification**: `csrfGuard` checks that:
  1. The request `Origin` strictly matches the whitelisted `CLIENT_URLS` (`Set` lookup in $O(1)$ time).
  2. The custom header `X-Requested-With` is present.
  This provides foolproof defense against Cross-Site Request Forgery for cookie-authenticated endpoints with zero server memory footprint.

</details>

<details>
<summary><strong>15. Why use UTC Calendar-Day arithmetic for Reading Streaks instead of 24-hour elapsed timers?</strong></summary>

<br />

- **The Flaw of 24-Hour Windows**: Calculating streaks by checking if 24 hours (86,400,000 ms) have passed fails in standard human reading patterns:
  - If a user reads at 11:55 PM on Monday and 12:05 AM on Tuesday (10 minutes apart), they read on two consecutive calendar days. A 24-hour elapsed timer would consider this the same session.
  - If a user reads at 8:00 AM on Monday and 9:00 PM on Tuesday (37 hours apart), they still read on consecutive calendar days. A 24-hour timer would incorrectly mark the streak as broken.
- **Normalized UTC Date Math**: By converting dates to UTC midnight integers (`Date.UTC(year, month, day)`), the difference in days is calculated as:
  $$\Delta \text{days} = \text{round}\left(\frac{\text{UTC}_{\text{today}} - \text{UTC}_{\text{last}}}{\text{MS\_PER\_DAY}}\right)$$
  - $\Delta = 0$: Already read today (streak unchanged).
  - $\Delta = 1$: Consecutive day reading (streak incremented).
  - $\Delta > 1$: Broken streak (streak resets to 1).
- **Timezone & DST Immunity**: UTC calendar arithmetic ensures that reading streak calculations are completely immune to Daylight Saving Time shifts and server timezone differences.

</details>

<details>
<summary><strong>16. Why configure MongoDB Connection Pooling and disable <code>autoIndex</code> in production?</strong></summary>

<br />

- **Connection Pool Tuning**: Opening and closing TCP sockets and TLS handshakes to MongoDB Atlas for each request incurs massive latency. Setting `minPoolSize: 10` keeps pre-warmed connections ready to eliminate cold-start spikes, while `maxPoolSize: 50` allows the server to handle concurrent traffic spikes without connection exhaustion.
- **Disabling <code>autoIndex</code> in Production**: Mongoose's `autoIndex` attempts to verify and build indexes on every application startup. In production with large datasets, background index builds can cause significant CPU spikes, table locks, and deployment timeouts. Setting `autoIndex: env.isDevelopment` ensures indexes are built intentionally during development or dedicated migration scripts.
- **Durability with <code>w: 'majority'</code>**: Enforcing `w: 'majority'` write concern ensures that write operations are acknowledged by a majority of replica set nodes before responding, safeguarding against data loss in the event of primary node failover.

</details>

## Connect with Me

- **GitHub**: [sagormajomder](https://github.com/sagormajomder)
- **LinkedIn**: [Sagor Majomder](https://www.linkedin.com/in/sagormajomder/)
