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

- **Nodemon**: For development workflow

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

## Connect with Me

- **GitHub**: [sagormajomder](https://github.com/sagormajomder)
- **LinkedIn**: [Sagor Majomder](https://www.linkedin.com/in/sagormajomder/)
