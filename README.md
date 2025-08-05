# Patient Case Notes System

A secure, role-based patient case management system for NHS doctors with patient invitation and management capabilities.

## Features

- Doctor registration with email verification
- Secure JWT-based authentication
- Doctor can invite patients via email
- Patient registration via invite links
- Role-based access control (RBAC)
- Secure password handling with bcrypt
- Email notifications using MailHog (development)

## Prerequisites

- Docker and Docker Compose
- Node.js (for development)
- Postman (for testing, optional)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/burrows99/Patient-Case-Notes-System.git
   cd Patient-Case-Notes-System
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. The application will be available at:
   - API: http://localhost:4000
   - MailHog (for viewing sent emails): http://localhost:8025

## API Endpoints

### Base URL
All API endpoints are prefixed with `/api`

### Doctor Endpoints

#### 1. Register a Doctor
```bash
curl -X POST http://localhost:4000/api/doctor/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "SecurePass123!"
  }'
```

#### 2. Verify Doctor Email
```bash
# Use the verification link sent to the doctor's email
curl -X GET "http://localhost:4000/api/doctor/verify?token=VERIFICATION_TOKEN"
```

#### 3. Doctor Login
```bash
curl -X POST http://localhost:4000/api/doctor/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "SecurePass123!"
  }'
```

#### 4. Invite a Patient (Doctor Auth Required)
```bash
curl -X POST http://localhost:4000/api/doctor/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer DOCTOR_JWT_TOKEN" \
  -d '{
    "email": "patient@example.com"
  }'
```

### Patient Endpoints

#### 1. Register with Invite Token
```bash
curl -X POST http://localhost:4000/api/patient/register \
  -H "Content-Type: application/json" \
  -d '{
    "inviteToken": "INVITE_TOKEN_FROM_EMAIL",
    "password": "PatientPass123!"
  }'
```

#### 2. Patient Login
```bash
curl -X POST http://localhost:4000/api/patient/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "PatientPass123!"
  }'
```

## Postman Collection

A Postman collection is included in the repository at `server/Patient_Case_Notes_System.json`. You can import this collection into Postman to test all the API endpoints with pre-configured requests.

To import:
1. Open Postman
2. Click "Import"
3. Select the `Patient_Case_Notes_System.json` file
4. Set up environment variables in Postman:
   - `baseURL`: `http://localhost:4000`
   - `token`: (Will be set automatically after login)

## Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
NODE_ENV=development
PORT=4000
JWT_SECRET=your_jwt_secret_key
DB_HOST=postgres
DB_PORT=5432
DB_NAME=nhs
DB_USER=postgres
DB_PASSWORD=postgres
SMTP_HOST=mailhog
SMTP_PORT=1025
BASE_URL=http://localhost:4000
```

## Development

### Running Tests
```bash
docker-compose exec server npm test
```

### Database Migrations
```bash
docker-compose exec server npx sequelize-cli db:migrate
```

## License

This project is licensed under the Apache License - see the [LICENSE](LICENSE) file for details.
