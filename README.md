# Story Arc Backend

The dedicated backend server for Story Arc, handling authentication, data management, and secure API endpoints for the book tracking platform. Built with Node.js and Express, it leverages MongoDB for efficient data storage and advanced aggregation.

## Table of Contents

- [Tools & Technology](#tools--technology-used)
- [Key Features](#key-features)
- [Run it Locally](#run-it-locally)
- [API Endpoints](#api-endpoints)
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

- **RESTful API**: Structured endpoints for Books, Users, Reviews, and Genres.
- **Advanced Aggregation**: Complex MongoDB pipelines for dashboard stats and book details lookup.
- **Secure Authentication**: Middleware for JWT verification and Admin role checking.
- **Review Moderation**: Logic for submitting, approving, and calculating book ratings.
- **Dashboard Data**: Optimized endpoints for fetching admin dashboard statistics and charts.

## Run it Locally

1. **Clone the repository**

   ```bash
   git clone https://github.com/sagormajomder/story-arc-backend.git
   ```

2. **Navigate to the directory**

   ```bash
   cd story-arc-backend
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up Environment Variables**
   Create a \`.env\` file in the root directory:

   ```env
   PORT=8000
   DB_URI=<your-mongodb-connection-string>
   ACCESS_TOKEN_SECRET=<your-secret>
   ```

5. **Run the server**
   ```bash
   npm run dev
   ```

## API Endpoints

- **Books**: `GET /api/v1/books`, `POST /api/v1/books`
- **Reviews**: `GET /api/v1/reviews/admin/all`, `POST /api/v1/reviews`
- **Dashboard**: `GET /api/v1/dashboard/stats`, `GET /api/v1/dashboard/charts`

## Design Principles & Patterns

The codebase is engineered with production-grade architectural patterns and software design principles to ensure maintainability, scalability, testability, and strict decoupling.

<details>
<summary><strong>1. SOLID Principles</strong> (SRP, OCP, LSP, ISP, DIP)</summary>

<br />

- **Single Responsibility Principle (SRP)**:
  - _Applied in_: Clear segregation across layers (`auth.controller.ts`, `auth.service.ts`, `user.repository.ts`, `hasher.service.ts`, `error.middleware.ts`, `env.ts`).
  - _Why_: Each class and module has only one reason to change. Controllers strictly manage HTTP semantics; services execute domain business rules; repositories isolate database queries; and configuration validates environment variables.
- **Open/Closed Principle (OCP)**:
  - _Applied in_: Service dependencies (`UserService`, `AuthService`) depend on abstract interfaces (`IPasswordHasher`, `IUserRepository`, `ITokenService`).
  - _Why_: New hashing algorithms (e.g., Scrypt, PBKDF2) or storage backends (e.g., PostgreSQL, Redis) can be introduced by creating new classes implementing existing interfaces, without modifying existing service logic.
- **Liskov Substitution Principle (LSP)**:
  - _Applied in_: Implementations like `Argon2PasswordHasher` and `JoseTokenService` satisfy `IPasswordHasher` and `ITokenService`.
  - _Why_: Any conforming implementation or test mock can substitute production classes without breaking application behavior or violating runtime expectations.
- **Interface Segregation Principle (ISP)**:
  - _Applied in_: Granular, purpose-driven interfaces (`IPasswordHasher`, `ITokenService`, `IUserRepository`, `IUserService`).
  - _Why_: Prevents bloated interfaces. Consumers are never forced to depend on methods they do not need or use.
- **Dependency Inversion Principle (DIP)**:
  - _Applied in_: High-level domain services depend upon abstractions (interfaces) rather than concrete low-level implementations (`IPasswordHasher` instead of `Argon2PasswordHasher`).
  - _Why_: Decouples business logic from specific third-party libraries, native compiled binaries, and database drivers.

</details>

<details>
<summary><strong>2. Architectural Patterns</strong> (Layered Architecture, Modular Monolith & Boundaries)</summary>

<br />

- **Layered Architecture (Controller-Service-Repository)**:
  - _Applied in_: Three-tier division (`src/modules/*`):
    - **Controller Layer**: Handles HTTP transport (request parsing, query validation, cookie management, HTTP status codes).
    - **Service Layer**: Pure domain logic, workflows, password hashing, and token generation. Independent of the Express framework.
    - **Repository Layer**: Data persistence and database queries via Mongoose models.
  - _Why_: Decouples the transport protocol (Express/REST) and data persistence (MongoDB) from core business logic, enabling independent evolution and isolated unit testing.
- **Modular Monolith & Architectural Boundary Enforcement (`eslint-plugin-boundaries`)**:
  - _Applied in_: Explicit ESLint boundary policies in `eslint.config.js` defining a directed dependency graph (`auth` &rarr; `user`, `user` &rarr; `[]`).
  - _Why_: Enforces strict architectural separation at build time. Cross-module imports must pass through public entry points (`*.index.ts`), shared layers cannot import feature modules (no upward dependency leaks), and circular dependencies are eliminated (`import/no-cycle`).

</details>

<details>
<summary><strong>3. Software Design Patterns</strong> (Repository, DI, Facade, Decorator, DTO, Error Chain, Singleton)</summary>

<br />

- **Repository Pattern**:
  - _Applied in_: `UserRepository` implementing `IUserRepository`.
  - _Why_: Encapsulates Mongoose-specific query logic, schemas, and aggregations. Changes to schemas or queries do not ripple into domain services.
- **Dependency Injection (DI) & Inversion of Control (IoC)**:
  - _Applied in_: Constructor injection with default fallback singletons (`constructor(private readonly repo: IUserRepository = userRepository) {}`).
  - _Why_: Allows instantaneous swapping of real database dependencies with lightweight mock objects during unit testing, without requiring heavy dependency injection containers or runtime overhead.
- **Facade / Public API Pattern (Module Barrel Exports)**:
  - _Applied in_: `user.index.ts` exporting only public services and DTOs.
  - _Why_: Enforces information hiding and domain encapsulation; internal models and repositories remain private to their respective module.
- **Decorator / Higher-Order Middleware Pattern**:
  - _Applied in_: `asyncCatch` (controller error wrapper) and `validate(schema)` (Zod validation factory).
  - _Why_: Removes repetitive `try/catch` and validation boilerplate across controllers, ensuring all asynchronous errors are safely forwarded to the global error handler.
- **Data Transfer Object (DTO) Pattern & Field Exclusion**:
  - _Applied in_: Typed DTOs (`RegisterDto`, `LoginDto`, `UserResponseDto`) and `excludeFields` utility.
  - _Why_: Guarantees type safety at API boundaries, prevents mass-assignment vulnerabilities, and ensures sensitive fields (like password hashes) are stripped before sending responses.
- **Centralized Error Handling (Chain of Responsibility)**:
  - _Applied in_: `AppError` class and global `errorHandler` middleware.
  - _Why_: Normalizes diverse error types (`AppError`, `ZodError`, Mongoose ValidationError, CastError, Mongo Duplicate Key 11000) into a consistent error contract (`IErrorSource[]`), while withholding internal stack traces in production.
- **Standardized Response Envelope Pattern**:
  - _Applied in_: `sendResponse` utility enforcing `{ success, message, meta, data }`.
  - _Why_: Delivers a predictable and consistent API response contract for frontend consumption.
- **Singleton Pattern**:
  - _Applied in_: Pre-instantiated exports for stateless or connection-bound services (`logger`, `tokenService`, `argon2PasswordHasher`, `userService`, `userRepository`).
  - _Why_: Reuses database connection pools and logging streams efficiently without redundant instantiations across incoming HTTP requests.

</details>

<details>
<summary><strong>4. Security & Production Engineering Patterns</strong> (Timing Defense, Zero-PII, Fail-Fast, Shutdown)</summary>

<br />

- **Timing Attack Defense via Dummy Hash**:
  - _Applied in_: `Argon2PasswordHasher` maintaining a static pre-computed hash and `auth.service.ts`.
  - _Why_: Eliminates response-time discrepancies between existing and non-existing email lookups, neutralizing side-channel account enumeration attacks.
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

## Connect with Me

- **GitHub**: [sagormajomder](https://github.com/sagormajomder)
- **LinkedIn**: [Sagor Majomder](https://www.linkedin.com/in/sagormajomder/)
