# Story Arc — API Reference

This document provides the complete API specification for the Story Arc backend server (`/api/v1`).

---

## Table of Contents

- [Global Conventions](#global-conventions)
  - [Base URL](#base-url)
  - [Authentication](#authentication)
  - [CSRF Guard Protection](#csrf-guard-protection)
  - [Standard Response Envelope](#standard-response-envelope)
  - [Error Response Format](#error-response-format)
- [Health Check](#health-check)
- [Authentication & Identity (`/auth`)](#authentication--identity-auth)
- [Users Management (`/users`)](#users-management-users)
- [Books Catalog (`/books`)](#books-catalog-books)
- [Genres Management (`/genres`)](#genres-management-genres)
- [Reviews & Moderation (`/reviews`)](#reviews--moderation-reviews)
- [Shelf & Reading Tracker (`/shelf`)](#shelf--reading-tracker-shelf)
- [Tutorials Catalog (`/tutorials`)](#tutorials-catalog-tutorials)
- [Admin Dashboard Analytics (`/dashboard`)](#admin-dashboard-analytics-dashboard)

---

## Global Conventions

### Base URL

```text
http://localhost:8000/api/v1
```

All application routes are prefixed with `/api/v1`.

### Authentication

Story Arc utilizes pure **HTTP-Only Cookie Authentication** for maximum browser security against XSS token theft:

- **`accessToken`**: Automatically set in an HTTP-only cookie upon login (`path: /api/v1`, `SameSite: lax`, `httpOnly: true`). Sent automatically by the browser and verified on all protected routes.
- **`refreshToken`**: Automatically set in an HTTP-only cookie upon login (`path: /api/v1/auth`, `SameSite: strict`, `httpOnly: true`). Exchanged exclusively at `/api/v1/auth/refresh` for Refresh Token Rotation (RTR).

> [!NOTE]
> Frontend clients (e.g. Next.js, React) must specify `credentials: 'include'` (or `withCredentials: true` in Axios).
> When testing via cURL or Postman, capture cookies upon login (`-c cookies.txt`) and send them on subsequent requests (`-b cookies.txt`).

### CSRF Guard Protection

State-changing requests (`POST`, `PATCH`, `DELETE`) as well as session management routes (`/auth/refresh`, `/auth/logout`) enforce the **Double-Check Guard**:

- **`Origin` Header**: Must match an allowed origin defined in `CLIENT_URLS` (e.g., `http://localhost:3000`).
- **`X-Requested-With` Header**: Required custom request header (e.g., `XMLHttpRequest` or `fetch`) to trigger and verify CORS preflight.

```http
Origin: http://localhost:3000
X-Requested-With: XMLHttpRequest
Content-Type: application/json
```

### Standard Response Envelope

All successful responses return a uniform envelope:

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

_(The `meta` object is included automatically on paginated list endpoints)._

### Error Response Format

Heterogeneous runtime and validation errors are normalized into a standardized error contract:

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

---

## Health Check

### Check Server Health

- **Endpoint**: `GET /health`
- **Access**: Public
- **Rate Limit**: Standard

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Server is healthy",
  "data": {
    "uptime": 12.34
  }
}
```

---

## Authentication & Identity (`/auth`)

Base path: `/api/v1/auth`

### 1. Register User

- **Endpoint**: `POST /register`
- **Access**: Public
- **Rate Limit**: Strict

#### Request Body

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password@123",
  "profileImage": "https://example.com/avatar.png"
}
```

- `fullName`: string (3–50 chars, required)
- `email`: valid email address (required)
- `password`: strong password (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char, required)
- `profileImage`: valid image URL (optional)

#### Response (`202 Accepted`)

```json
{
  "success": true,
  "message": "We have sent a verification link to your email address. Please check your inbox.",
  "data": null
}
```

---

### 2. Verify Email

- **Endpoint**: `POST /verify-email`
- **Access**: Public
- **Rate Limit**: Strict

#### Request Body

```json
{
  "token": "4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a"
}
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Email verified successfully. Please log in.",
  "data": null
}
```

---

### 3. Resend Email Verification

- **Endpoint**: `POST /resend-verification`
- **Access**: Public
- **Rate Limit**: Identity-Keyed (Per target email address)

#### Request Body

```json
{
  "email": "jane@example.com"
}
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "If an unverified account exists with that email, a verification link has been sent.",
  "data": null
}
```

---

### 4. User Login

- **Endpoint**: `POST /login`
- **Access**: Public
- **Rate Limit**: Strict

#### Request Body

```json
{
  "email": "jane@example.com",
  "password": "Password@123"
}
```

#### Response (`200 OK`)

_Sets `accessToken` and `refreshToken` in HTTP-only cookies._

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": "651f1b2c4f1a2b3c4d5e6f7a",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "role": "user",
      "isEmailVerified": true,
      "authProviders": ["local"],
      "profileImage": "https://example.com/avatar.png",
      "createdAt": "2026-10-18T10:00:00.000Z",
      "updatedAt": "2026-10-18T10:00:00.000Z"
    }
  }
}
```

---

### 5. Google SSO Login

- **Endpoint**: `POST /google`
- **Access**: Public
- **Rate Limit**: Strict

#### Request Body

```json
{
  "idToken": "google_jwt_id_token",
  "accessToken": "google_oauth_access_token"
}
```

_(At least one of `idToken` or `accessToken` is required)._

#### Response (`200 OK`)

_Sets `accessToken` and `refreshToken` in HTTP-only cookies._

---

### 6. Forgot Password

- **Endpoint**: `POST /forgot-password`
- **Access**: Public
- **Rate Limit**: Identity-Keyed (Per recipient email)

#### Request Body

```json
{
  "email": "jane@example.com"
}
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent.",
  "data": null
}
```

---

### 7. Reset Password

- **Endpoint**: `POST /reset-password`
- **Access**: Public
- **Rate Limit**: Strict

#### Request Body

```json
{
  "token": "4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a",
  "newPassword": "NewStrongPassword@123"
}
```

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Password has been reset successfully. Please log in with your new password.",
  "data": null
}
```

---

### 8. Refresh Token (RTR)

- **Endpoint**: `POST /refresh`
- **Access**: Refresh Token Cookie
- **Rate Limit**: Moderate
- **CSRF Required**: Yes (`Origin` + `X-Requested-With`)

#### Response (`200 OK`)

_Rotates `accessToken` and `refreshToken` cookies._

```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": null
}
```

---

### 9. User Logout

- **Endpoint**: `POST /logout`
- **Access**: Cookie / Authenticated
- **CSRF Required**: Yes (`Origin` + `X-Requested-With`)

#### Response (`200 OK`)

_Clears `accessToken` and `refreshToken` cookies and revokes token in DB._

```json
{
  "success": true,
  "message": "User logged out successfully",
  "data": null
}
```

---

## Users Management (`/users`)

Base path: `/api/v1/users`

### 1. Get Current User Profile

- **Endpoint**: `GET /me`
- **Access**: Authenticated (`user`, `admin`)

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "651f1b2c4f1a2b3c4d5e6f7a",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "isEmailVerified": true,
    "authProviders": ["local"],
    "profileImage": "https://example.com/avatar.png",
    "createdAt": "2026-10-18T10:00:00.000Z",
    "updatedAt": "2026-10-18T10:00:00.000Z"
  }
}
```

---

### 2. Update Current User Profile

- **Endpoint**: `PATCH /me`
- **Access**: Authenticated (`user`, `admin`)
- **CSRF Required**: Yes

#### Request Body

```json
{
  "fullName": "Jane Smith",
  "profileImage": "https://example.com/new-avatar.png"
}
```

_(At least one field is required)._

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

### 3. Get All Users (Admin)

- **Endpoint**: `GET /`
- **Access**: Admin only
- **Query Parameters**:
  - `page` (number, default: `1`): Current page.
  - `limit` (number, default: `10`, max: `100`): Items per page.
  - `search` (string, optional): Search by name or email.
  - `role` (`user` | `admin`, optional): Filter by user role.

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  },
  "data": [ ... ]
}
```

---

### 4. Get User by ID (Admin)

- **Endpoint**: `GET /:id`
- **Access**: Admin only
- **URL Parameters**:
  - `id`: 24-character hexadecimal MongoDB ObjectId.

---

### 5. Update User Role (Admin)

- **Endpoint**: `PATCH /:id/role`
- **Access**: Admin only
- **CSRF Required**: Yes

#### Request Body

```json
{
  "role": "admin"
}
```

_(Values: `"user"` or `"admin"`)._

---

## Books Catalog (`/books`)

Base path: `/api/v1/books`

### 1. Get Distinct Book Genres

- **Endpoint**: `GET /genres`
- **Access**: Authenticated

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Genres retrieved successfully",
  "data": ["Fiction", "Technology", "Science", "History"]
}
```

---

### 2. List Books (Catalog Search & Filter)

- **Endpoint**: `GET /`
- **Access**: Authenticated
- **Query Parameters**:
  - `page` (number, default: `1`)
  - `limit` (number, default: `10`, max: `100`)
  - `search` (string, optional): Full-text search on title and author.
  - `genre` (string, optional): Filter by genre.
  - `minRating` (number, 0–5, optional): Filter minimum average rating.
  - `maxRating` (number, 0–5, optional): Filter maximum average rating.
  - `sort` (enum, optional): `newest`, `rating_desc`, `shelved_desc`, `title_asc`, `title_desc`.
  - `ids` (string, optional): Comma-separated list of book ObjectIds.

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Books retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "totalPages": 12
  },
  "data": [
    {
      "id": "651f1b2c4f1a2b3c4d5e6f7a",
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "cover": "https://example.com/cover.jpg",
      "description": "A craftsman's guide to software structure and design.",
      "genre": "Technology",
      "publishedDate": "2017-09-20",
      "rating": 4.8,
      "totalReviews": 142,
      "shelvedCount": 380,
      "createdAt": "2026-10-18T10:00:00.000Z",
      "updatedAt": "2026-10-18T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Book by ID

- **Endpoint**: `GET /:id`
- **Access**: Authenticated

---

### 4. Create Book (Admin)

- **Endpoint**: `POST /`
- **Access**: Admin only
- **CSRF Required**: Yes

#### Request Body

```json
{
  "title": "Designing Data-Intensive Applications",
  "author": "Martin Kleppmann",
  "genre": "Technology",
  "cover": "https://example.com/cover.jpg",
  "description": "The definitive guide to data systems architecture.",
  "publishedDate": "2017-03-16"
}
```

#### Response (`201 Created`)

---

### 5. Update Book (Admin)

- **Endpoint**: `PATCH /:id`
- **Access**: Admin only
- **CSRF Required**: Yes

#### Request Body

```json
{
  "title": "Updated Title",
  "genre": "Engineering"
}
```

_(At least one valid field is required)._

---

### 6. Delete Book (Admin)

- **Endpoint**: `DELETE /:id`
- **Access**: Admin only
- **CSRF Required**: Yes

---

## Genres Management (`/genres`)

Base path: `/api/v1/genres`

### 1. List Genres

- **Endpoint**: `GET /`
- **Access**: Authenticated
- **Query Parameters**: `page`, `limit`

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Genres retrieved successfully",
  "meta": { "page": 1, "limit": 10, "total": 15, "totalPages": 2 },
  "data": [
    {
      "id": "651f1b2c4f1a2b3c4d5e6f7b",
      "name": "Technology",
      "bookCount": 24,
      "createdAt": "2026-10-18T10:00:00.000Z",
      "updatedAt": "2026-10-18T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Genre by ID

- **Endpoint**: `GET /:id`
- **Access**: Authenticated

---

### 3. Create Genre (Admin)

- **Endpoint**: `POST /`
- **Access**: Admin only
- **CSRF Required**: Yes

#### Request Body

```json
{
  "name": "Philosophy"
}
```

---

### 4. Update Genre (Admin)

- **Endpoint**: `PATCH /:id`
- **Access**: Admin only
- **CSRF Required**: Yes

---

### 5. Delete Genre (Admin)

- **Endpoint**: `DELETE /:id`
- **Access**: Admin only
- **CSRF Required**: Yes

---

## Reviews & Moderation (`/reviews`)

Base path: `/api/v1/reviews`

### 1. Get My Submitted Reviews

- **Endpoint**: `GET /me`
- **Access**: Authenticated (`user`, `admin`)
- Returns all reviews authored by the current user across statuses (`pending`, `approved`, `rejected`).

---

### 2. Get Approved Book Reviews

- **Endpoint**: `GET /book/:bookId`
- **Access**: Authenticated
- Returns all publicly approved reviews for a given book.

---

### 3. Admin Review Queue

- **Endpoint**: `GET /admin`
- **Access**: Admin only
- **Query Parameters**:
  - `page`, `limit`
  - `status` (`pending` | `approved` | `rejected`, optional)

---

### 4. Submit Review

- **Endpoint**: `POST /`
- **Access**: Authenticated
- **CSRF Required**: Yes

#### Request Body

```json
{
  "bookId": "651f1b2c4f1a2b3c4d5e6f7a",
  "rating": 5,
  "comment": "An outstanding book on software design patterns."
}
```

- `rating`: integer (1–5, required)
- `comment`: string (10–2000 chars, required)

_(Reviews default to `pending` status until approved by an administrator)._

---

### 5. Update My Review

- **Endpoint**: `PATCH /:id`
- **Access**: Authenticated (Review Author)
- **CSRF Required**: Yes

_(Resets the review status back to `pending` moderation and updates book ratings)._

---

### 6. Update Review Status (Admin Moderation)

- **Endpoint**: `PATCH /:id/status`
- **Access**: Admin only
- **CSRF Required**: Yes

#### Request Body

```json
{
  "status": "approved",
  "rejectionReason": ""
}
```

_(Status options: `"pending"`, `"approved"`, `"rejected"`)._

---

### 7. Delete Review (Admin)

- **Endpoint**: `DELETE /:id`
- **Access**: Admin only
- **CSRF Required**: Yes

---

## Shelf & Reading Tracker (`/shelf`)

Base path: `/api/v1/shelf`

### 1. Get My Reading Shelf

- **Endpoint**: `GET /`
- **Access**: Authenticated
- **Query Parameters**:
  - `page`, `limit`
  - `status`: `"Want to Read"`, `"Currently Reading"`, `"Read"`, or `"all"`
  - `sort`: `"newest"`, `"oldest"`, `"progress_desc"`, `"progress_asc"`

---

### 2. Add Book to Shelf

- **Endpoint**: `POST /`
- **Access**: Authenticated
- **CSRF Required**: Yes

#### Request Body

```json
{
  "bookId": "651f1b2c4f1a2b3c4d5e6f7a",
  "status": "Currently Reading",
  "progress": 30,
  "totalPages": 300
}
```

---

### 3. Check Book in Shelf

- **Endpoint**: `GET /book/:bookId`
- **Access**: Authenticated

---

### 4. Update Shelf Item Reading Progress

- **Endpoint**: `PATCH /book/:bookId`
- **Access**: Authenticated
- **CSRF Required**: Yes

#### Request Body

```json
{
  "progress": 150,
  "status": "Currently Reading"
}
```

_(Automatically tracks calendar-day reading streak)._

---

### 5. Remove Book from Shelf

- **Endpoint**: `DELETE /book/:bookId`
- **Access**: Authenticated
- **CSRF Required**: Yes

---

### 6. Get Personal Reading Analytics

- **Endpoint**: `GET /stats`
- **Access**: Authenticated

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Reading stats retrieved successfully",
  "data": {
    "shelfCounts": {
      "wantToRead": 5,
      "currentlyReading": 2,
      "read": 14,
      "totalShelved": 21
    },
    "goal": {
      "target": 25,
      "completed": 14,
      "percentage": 56,
      "year": 2026
    },
    "streak": {
      "currentStreak": 7,
      "longestStreak": 14,
      "lastReadDate": "2026-10-18T00:00:00.000Z"
    }
  }
}
```

---

### 7. Set / Update Reading Goal

- **Endpoint**: `POST /goal` or `PATCH /goal`
- **Access**: Authenticated
- **CSRF Required**: Yes

#### Request Body

```json
{
  "target": 30,
  "year": 2026
}
```

---

### 8. Get Personalized Recommendations

- **Endpoint**: `GET /recommendations`
- **Access**: Authenticated
- Returns top-rated books matching the user's preferred genres that are not currently on their shelf.

---

## Tutorials Catalog (`/tutorials`)

Base path: `/api/v1/tutorials`

### 1. List Tutorials

- **Endpoint**: `GET /`
- **Access**: Authenticated
- **Query Parameters**: `page`, `limit`, `category`, `search`

---

### 2. Get Tutorial by ID

- **Endpoint**: `GET /:id`
- **Access**: Authenticated

---

### 3. Create Tutorial (Admin)

- **Endpoint**: `POST /`
- **Access**: Admin only
- **CSRF Required**: Yes

#### Request Body

```json
{
  "title": "Clean Code in TypeScript",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "category": "Architecture"
}
```

---

### 4. Update Tutorial (Admin)

- **Endpoint**: `PATCH /:id`
- **Access**: Admin only
- **CSRF Required**: Yes

---

### 5. Delete Tutorial (Admin)

- **Endpoint**: `DELETE /:id`
- **Access**: Admin only
- **CSRF Required**: Yes

---

## Admin Dashboard Analytics (`/dashboard`)

Base path: `/api/v1/dashboard`

### 1. Get KPI Statistics

- **Endpoint**: `GET /stats`
- **Access**: Admin only

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "totalBooks": 128,
    "totalUsers": 1420,
    "pendingReviews": 18
  }
}
```

---

### 2. Get Genre Distribution Charts

- **Endpoint**: `GET /charts`
- **Access**: Admin only

#### Response (`200 OK`)

```json
{
  "success": true,
  "message": "Dashboard chart data retrieved successfully",
  "data": {
    "genreData": [
      { "genre": "Fiction", "count": 45 },
      { "genre": "Technology", "count": 32 },
      { "genre": "Science", "count": 21 }
    ]
  }
}
```
