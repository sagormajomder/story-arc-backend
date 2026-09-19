# Story Arc Backend

The dedicated backend server for Story Arc, handling authentication, data management, and secure API endpoints for the book tracking platform. Built with Node.js and Express, it leverages MongoDB for efficient data storage and advanced aggregation.

## Table of Contents

- [Tools & Technology](#tools--technology-used)
- [Key Features](#key-features)
- [Run it Locally](#run-it-locally)
- [API Endpoints](#api-endpoints)
- [Connect With Me](#connect-with-me)

## Tools & Technology Used

### Technology

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Native Driver)
- **Authentication**: JWT (JSON Web Tokens)

### Tools

- **Vercel**: For deployment

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
   npm install or pnpm install
   ```

4. **Set up Environment Variables**
   Create a \`.env\` file in the root directory:

   ```env
   PORT=8000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_ACCESS_SECRET=<your-secret>
   ```

5. **Run the server**
   ```bash
   npm run dev or pnpm dev
   ```

## API Endpoints

### Users

- `POST /api/v1/users`
- `POST /api/v1/users/login`
- `POST /api/v1/users/google`
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id/role`
- `POST /api/v1/users/:id/shelf`
- `PATCH /api/v1/users/:id/shelf/:bookId`
- `GET /api/v1/users/:id/stats`
- `GET /api/v1/users/:id/recommendations`
- `POST /api/v1/users/:id/goal`

### Books

- `GET /api/v1/books/genres`
- `GET /api/v1/books`
- `GET /api/v1/books/:id`
- `POST /api/v1/books`
- `PUT /api/v1/books/:id`
- `DELETE /api/v1/books/:id`

### Genres

- `GET /api/v1/genres`
- `POST /api/v1/genres`
- `PUT /api/v1/genres/:id`
- `DELETE /api/v1/genres/:id`

### Tutorials

- `GET /api/v1/tutorials`
- `POST /api/v1/tutorials`
- `PUT /api/v1/tutorials/:id`
- `DELETE /api/v1/tutorials/:id`

### Reviews

- `GET /api/v1/reviews/:bookId`
- `POST /api/v1/reviews`
- `GET /api/v1/reviews/admin/all`
- `PATCH /api/v1/reviews/:id/approve`
- `DELETE /api/v1/reviews/:id`

### Dashboard

- `GET /api/v1/dashboard/stats`
- `GET /api/v1/dashboard/charts`

## Connect with Me

- **GitHub**: [sagormajomder](https://github.com/sagormajomder)
- **LinkedIn**: [Sagor Majomder](https://www.linkedin.com/in/sagormajomder/)
