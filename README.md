# Medical Platform API

A comprehensive Node.js/Express API for a medical platform supporting patient management, appointments, and medical records.

## Project Structure

```
medical-platform-api/
├── src/
│   ├── server.js          # Main application entry point
│   ├── routes/            # API route handlers
│   │   └── health.js      # Health check endpoint
│   ├── models/            # Data models
│   ├── controllers/       # Business logic controllers
│   ├── middleware/        # Custom middleware
│   └── config/            # Configuration files
├── .env                   # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Update `.env` file with your configuration
   - Set `DATABASE_URL` when database is ready
   - Configure `PORT`, `NODE_ENV`, and `API_VERSION` as needed

### Running the Application

**Development Mode** (with hot reload):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

The API will start on `http://localhost:5000` by default.

### API Endpoints

#### Health Check
- **GET** `/api/v1/health` - Check API health status

## Features to Implement

- [ ] Patient Management (CRUD operations)
- [ ] Appointment Scheduling
- [ ] Medical Records Management
- [ ] User Authentication & Authorization
- [ ] Data Validation
- [ ] Error Handling
- [ ] Database Integration
- [ ] API Documentation (Swagger)

## Environment Variables

```
PORT=5000                    # Server port
NODE_ENV=development         # Environment (development/production)
DATABASE_URL=               # Database connection string
API_VERSION=v1              # API version prefix
```

## Technology Stack

- **Framework**: Express.js
- **Language**: Node.js
- **Utilities**: dotenv, cors, uuid

## Development Tools

- **nodemon**: For automatic server restart during development

## License

ISC
