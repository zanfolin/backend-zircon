# Zircon Backend API

Backend API for Zircon - A job/service marketplace platform focused on home office opportunities.

## 🚀 Tech Stack

- **Runtime**: Node.js 24+
- **Framework**: Express.js
- **Database**: SQLite (embedded) with Knex.js for migrations/seeds
- **Authentication**: JWT (Access Token 15min + Refresh Token 7d)
- **Password Hashing**: bcryptjs (12 rounds)
- **Validation**: Zod
- **File Upload**: Multer (local storage)
- **Email**: Nodemailer (generic SMTP)
- **Document Validation**: cpf-cnpj-validator (CPF/CNPJ)
- **Security**: Helmet, CORS

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.js   # Knex database connection
│   ├── jwt.js        # JWT configuration
│   ├── email.js      # Nodemailer configuration
│   └── multer.js     # Multer upload configuration
├── controllers/      # Request handlers
│   ├── authController.js
│   ├── userController.js
│   ├── opportunityController.js
│   └── applicationController.js
├── middlewares/      # Express middlewares
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   ├── platformMiddleware.js
│   ├── validationMiddleware.js
│   ├── uploadMiddleware.js
│   └── errorMiddleware.js
├── models/           # Data models (Knex query builders)
│   ├── userModel.js
│   ├── opportunityModel.js
│   └── applicationModel.js
├── routes/           # Route definitions
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── opportunityRoutes.js
│   └── applicationRoutes.js
├── services/         # Business logic services
│   ├── tokenService.js
│   ├── emailService.js
│   ├── validationService.js
│   ├── passwordService.js
│   └── uploadService.js
├── validations/      # Zod validation schemas
│   ├── authSchemas.js
│   ├── userSchemas.js
│   ├── opportunitySchemas.js
│   └── applicationSchemas.js
├── database/
│   ├── migrations/   # Knex migration files
│   └── seeds/        # Knex seed files
├── app.js            # Express app setup
└── server.js         # Entry point
```

## 🔧 Setup

### Prerequisites

- Node.js 24+
- npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend-zircon

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required: JWT secrets, SMTP settings, etc.

# Run migrations
npm run migrate

# Run seeds (creates admin user)
npm run seed

# Start development server
npm run dev

# Start production server
npm start
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `HOST` | Server host | `localhost` |
| `DB_FILENAME` | SQLite database path | `./data/zircon.db` |
| `JWT_ACCESS_SECRET` | Access token secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `SMTP_HOST` | SMTP server host | Required |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS | `false` |
| `SMTP_USER` | SMTP username | Required |
| `SMTP_PASS` | SMTP password | Required |
| `SMTP_FROM` | From email address | `Zircon <noreply@zircon.com>` |
| `FRONTEND_WEB_URL` | Web frontend URL | `http://localhost:5173` |
| `FRONTEND_MOBILE_URL` | Mobile app URL scheme | `zircon://` |
| `UPLOAD_DIR` | Upload directory | `./uploads/avatars` |
| `MAX_FILE_SIZE` | Max file size (bytes) | `5242880` (5MB) |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5173,http://localhost:3000` |

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

All protected routes require the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Platform Detection

The API detects platform via `x-platform` header:
- `mobile` - Mobile app
- `web` - Web application

### User Roles

- **ADMIN** - Full access to all resources
- **EMPRESA** - Can create/manage opportunities, view/manage applications
- **PROFISSIONAL** - Can view opportunities, create/manage applications

---

## 🔐 Auth Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login |
| POST | `/auth/verify-email` | Public | Verify email with code |
| POST | `/auth/resend-verification` | Public | Resend verification code |
| POST | `/auth/forgot-password` | Public | Request password reset |
| POST | `/auth/reset-password` | Public | Reset password with token |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | Protected | Logout |
| GET | `/auth/me` | Protected | Get current user profile |
| PUT | `/auth/change-password` | Protected | Change password |

### Register Request

```json
{
  "email": "user@example.com",
  "password": "Senha123!",
  "user_type": "PROFISSIONAL",
  "document_type": "CPF",
  "document_number": "11144477735",
  "full_name": "John Doe",
  "phone_number": "(11)99999-9999"
}
```

### Login Request

```json
{
  "email": "user@example.com",
  "password": "Senha123!"
}
```

### Login Response

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "user_type": "PROFISSIONAL",
      "full_name": "John Doe",
      "verified_email": 1
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

## 👤 User Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/users/profile` | All | Get own profile |
| PUT | `/users/profile` | All | Update own profile |
| PUT | `/users/avatar` | All | Upload avatar |
| PUT | `/users/password` | All | Change password |
| DELETE | `/users/account` | All | Delete own account (soft) |
| GET | `/users` | ADMIN | List all users |
| GET | `/users/:id` | ADMIN | Get user by ID |
| PUT | `/users/:id` | ADMIN | Update user |
| DELETE | `/users/:id` | ADMIN | Delete user (soft) |

### Update Profile Request

```json
{
  "full_name": "New Name",
  "bio": "New bio",
  "phone_number": "(11)88888-8888"
}
```

---

## 💼 Opportunity Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/opportunities` | EMPRESA, ADMIN | Create opportunity |
| GET | `/opportunities` | Public | List opportunities |
| GET | `/opportunities/sectors` | Public | List sectors |
| GET | `/opportunities/:id` | Public | Get opportunity |
| PUT | `/opportunities/:id` | EMPRESA (owner), ADMIN | Update opportunity |
| DELETE | `/opportunities/:id` | EMPRESA (owner), ADMIN | Delete opportunity |
| GET | `/opportunities/my` | EMPRESA, ADMIN | List own opportunities |
| GET | `/opportunities/admin/all` | ADMIN | List all opportunities |
| PUT | `/opportunities/admin/:id/status` | ADMIN | Update opportunity status |

### Create Opportunity Request

```json
{
  "company_sector": "Tecnologia",
  "job_title": "Desenvolvedor Node.js",
  "job_description": "Vaga para desenvolvedor backend...",
  "payment_value": 8000,
  "benefits_text": "Vale refeição, plano de saúde, home office",
  "work_modality": "HOME_OFFICE",
  "status": "ATIVA"
}
```

### Query Parameters for Listing

- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` (ATIVA, PAUSADA, FINALIZADA, CANCELADA)
- `work_modality` (HOME_OFFICE, HIBRIDO, PRESENCIAL)
- `company_sector`
- `search` (searches title, description, sector)

---

## 📝 Application Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/applications` | PROFISSIONAL, ADMIN | Apply to opportunity |
| GET | `/applications/my` | PROFISSIONAL, ADMIN | List own applications |
| GET | `/applications/:id` | Owner, Company, ADMIN | Get application details |
| GET | `/applications/opportunity/:id` | EMPRESA (owner), ADMIN | List applications for opportunity |
| PUT | `/applications/:id/status` | EMPRESA (owner), ADMIN | Update application status |
| DELETE | `/applications/:id` | PROFISSIONAL (owner), ADMIN | Cancel application |
| GET | `/applications/admin/all` | ADMIN | List all applications |

### Create Application Request

```json
{
  "vacancy_id": 1
}
```

### Update Status Request

```json
{
  "status": "APROVADA"
}
```

### Valid Status Transitions

- `PENDENTE` → `EM_ANALISE`, `APROVADA`, `REJEITADA`, `CANCELADA`
- `EM_ANALISE` → `APROVADA`, `REJEITADA`, `CANCELADA`
- `APROVADA` → (final)
- `REJEITADA` → (final)
- `CANCELADA` → (final)

---

## 📤 File Upload

### Upload Avatar

```bash
curl -X PUT http://localhost:3000/api/users/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/path/to/image.jpg"
```

**Constraints:**
- Max file size: 5MB
- Allowed types: JPEG, PNG, WebP
- Stored in: `uploads/avatars/`
- Accessible at: `http://localhost:3000/uploads/avatars/<filename>`

---

## 🗄️ Database Schema

### Users Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| email | TEXT | NOT NULL, UNIQUE |
| verified_email | INTEGER | NOT NULL, DEFAULT 0 |
| code_email_verification | TEXT | NULLABLE |
| password | TEXT | NOT NULL |
| user_type | TEXT | NOT NULL, ENUM(ADMIN, EMPRESA, PROFISSIONAL) |
| status | TEXT | NOT NULL, ENUM(ATIVO, INATIVO, BLOQUEADO) |
| full_name | TEXT | NULLABLE |
| avatar_url | TEXT | NULLABLE |
| bio | TEXT | NULLABLE |
| phone_number | TEXT | NULLABLE |
| document_type | TEXT | ENUM(CPF, CNPJ, Passaporte) |
| document_number | TEXT | NOT NULL |
| created_at | TEXT | NOT NULL (ISO-8601) |
| updated_at | TEXT | NOT NULL (ISO-8601) |
| deleted_at | TEXT | NULLABLE (soft delete) |

### Opportunities Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK → users.id (RESTRICT) |
| company_sector | TEXT | NULLABLE |
| job_title | TEXT | NOT NULL |
| job_description | TEXT | NULLABLE |
| payment_value | REAL | NULLABLE |
| benefits_text | TEXT | NULLABLE |
| work_modality | TEXT | NOT NULL, ENUM(HOME_OFFICE, HIBRIDO, PRESENCIAL) |
| status | TEXT | NOT NULL, ENUM(ATIVA, PAUSADA, FINALIZADA, CANCELADA) |
| created_at | TEXT | NOT NULL (ISO-8601) |
| updated_at | TEXT | NOT NULL (ISO-8601) |
| deleted_at | TEXT | NULLABLE (soft delete) |

### Applications Table

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| user_id | INTEGER | NOT NULL, FK → users.id (RESTRICT) |
| vacancy_id | INTEGER | NOT NULL, FK → opportunities.id (CASCADE) |
| status | TEXT | NOT NULL, ENUM(PENDENTE, EM_ANALISE, APROVADA, REJEITADA, CANCELADA) |
| expiration_date | TEXT | NULLABLE (ISO-8601) |
| created_at | TEXT | NOT NULL (ISO-8601) |
| updated_at | TEXT | NOT NULL (ISO-8601) |
| deleted_at | TEXT | NULLABLE (soft delete) |

**Unique Constraint**: `(user_id, vacancy_id)` - One application per user per opportunity

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

---

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with auto-reload |
| `npm start` | Start production server |
| `npm run migrate` | Run pending migrations |
| `npm run migrate:rollback` | Rollback last migration |
| `npm run migrate:make <name>` | Create new migration |
| `npm run seed` | Run seeds |
| `npm run seed:make <name>` | Create new seed |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run db:reset` | Rollback, migrate, and seed |

---

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Configurable origin whitelist
- **JWT** - Stateless authentication with short-lived access tokens
- **bcryptjs** - Password hashing (12 rounds)
- **Zod** - Input validation
- **Rate Limiting Ready** - Can be added with express-rate-limit
- **Soft Deletes** - Data retention with `deleted_at` column
- **Foreign Key Constraints** - Data integrity

---

## 📧 Email Templates

The system sends emails for:
1. **Email Verification** - 6-digit code sent on registration
2. **Password Reset** - Token link sent on request
3. **Application Notification** - Sent to company when professional applies
4. **Status Change Notification** - Sent to professional when application status changes

Configure SMTP in `.env` to enable emails.

---

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
3. Configure production SMTP
4. Set up reverse proxy (nginx) with SSL
5. Configure `CORS_ORIGIN` for production domains
6. Set up process manager (PM2)
7. Configure backup strategy for SQLite database

### Docker (Optional)

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run migrate
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📄 License

MIT License - see LICENSE file for details.