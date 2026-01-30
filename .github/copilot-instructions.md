# Medical Platform API - Setup Instructions

This file contains workspace-specific setup and development guidelines.

## Project Overview

A comprehensive Node.js/Express API for a medical platform with support for:
- Patient management
- Appointment scheduling
- Medical records management
- User authentication (to be implemented)
- RESTful API design

## Setup Checklist

- [x] Node.js project initialized
- [x] Dependencies installed (Express, dotenv, cors, uuid)
- [x] Project structure created
- [x] Environment configuration set up
- [ ] Database integration (Configure DATABASE_URL in .env)
- [ ] API endpoints implementation
- [ ] Authentication middleware
- [ ] API documentation (Swagger)
- [ ] Unit tests

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

3. **Test Health Endpoint**
   ```bash
   curl http://localhost:5000/api/v1/health
   ```

## Development Guidelines

- Use `.env` file for environment-specific configuration
- Add new routes in `src/routes/`
- Add business logic in `src/controllers/`
- Define data structures in `src/models/`
- Use middleware for cross-cutting concerns
- Follow REST API conventions

## Environment Variables

Required variables in `.env`:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `API_VERSION` - API version prefix (default: v1)
- `DATABASE_URL` - Database connection string (when ready)

## Project Structure

```
src/
├── server.js              # Express app initialization
├── routes/                # Route handlers
├── controllers/           # Business logic
├── models/               # Data models
├── middleware/           # Custom middleware
└── config/               # Configuration
```

## Next Steps

1. Implement database integration
2. Create patient management endpoints
3. Add appointment scheduling features
4. Implement user authentication
5. Add API documentation with Swagger
6. Write unit tests
