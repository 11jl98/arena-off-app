# Authentication Module - Arena Off Beach

## Overview

Complete authentication module with JWT, Google OAuth support, and role-based access control.

## Features

- ✅ Email/Password authentication
- ✅ Google OAuth integration (Firebase/Clerk compatible)
- ✅ JWT access & refresh tokens
- ✅ HTTP-only secure cookies
- ✅ Role-based access control (CLIENT, EMPLOYEE, ADMIN)
- ✅ Password hashing with bcrypt
- ✅ Token refresh mechanism
- ✅ Prisma ORM integration
- ✅ Clean architecture with interfaces

## Environment Variables

Add these to your `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/arena_db"

# JWT Configuration
JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Node Environment
NODE_ENV="development"
```

## Setup

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Generate Prisma Client**:
```bash
npx prisma generate
```

3. **Run migrations**:
```bash
npx prisma migrate dev
```

4. **Start the server**:
```bash
npm run start:dev
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg" // optional
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Google Auth
```http
POST /auth/google
Content-Type: application/json

{
  "idToken": "google-id-token-from-firebase-or-clerk",
  "email": "user@gmail.com",
  "name": "John Doe",
  "googleId": "google-user-id",
  "avatarUrl": "https://lh3.googleusercontent.com/..." // optional
}
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Protected Endpoints (Authentication Required)

#### Get Current User
```http
GET /auth/me
Authorization: Bearer {access_token}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer {access_token}
```

## Response Format

### Success Response
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://example.com/avatar.jpg",
    "role": "CLIENT",
    "createdAt": "2026-03-18T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Error Response
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

## Authentication Flow

### 1. Client Login/Register
```
Client → POST /auth/login
        ↓
Server validates credentials
        ↓
Server generates JWT tokens
        ↓
Server sets HTTP-only cookies
        ↓
Server returns user data + tokens
```

### 2. Accessing Protected Routes
```
Client → GET /some-protected-route
        ↓
JwtAuthGuard intercepts request
        ↓
Extracts token from cookie or Bearer header
        ↓
Validates token
        ↓
Attaches user to request object
        ↓
Controller receives authenticated user
```

### 3. Token Refresh
```
Client → POST /auth/refresh (with refresh token)
        ↓
Server validates refresh token
        ↓
Server generates new access token
        ↓
Server returns new tokens
```

## Role-Based Access Control

Use the `@Roles()` decorator to protect routes:

```typescript
import { Roles } from 'src/app/commons/decorators/roles.decorator';
import { Role } from 'generated/prisma';

@Get('admin/dashboard')
@Roles(Role.ADMIN)
async adminDashboard() {
  return { message: 'Admin only' };
}

@Get('staff/panel')
@Roles(Role.ADMIN, Role.EMPLOYEE)
async staffPanel() {
  return { message: 'Staff only' };
}
```

## Public Routes

Mark routes as public to skip authentication:

```typescript
import { Public } from 'src/app/commons/decorators/public.decorator';

@Public()
@Get('public-data')
async getPublicData() {
  return { data: 'Available to everyone' };
}
```

## Get Current User

Access authenticated user in controllers:

```typescript
import { CurrentUser } from 'src/app/commons/decorators/current-user.decorator';

@Get('profile')
async getProfile(@CurrentUser() user: RequestUser) {
  return user; // { id, email, role }
}

@Get('email')
async getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

## Architecture

```
src/infra/modules/auth/
├── controllers/
│   └── auth.controller.ts          # HTTP endpoints
├── services/
│   ├── auth.service.ts             # Business logic
│   ├── token.service.ts            # JWT operations
│   └── cookie.service.ts           # Cookie management
├── repositories/
│   └── user.repository.ts          # Database operations
├── guards/
│   ├── jwt-auth.guard.ts           # JWT validation
│   └── roles.guard.ts              # Role-based access
├── strategies/
│   └── jwt.strategy.ts             # Passport JWT strategy
├── dtos/
│   ├── request/                    # Input DTOs
│   └── response/                   # Output DTOs
├── interfaces/
│   ├── jwt-payload.interface.ts
│   └── request-user.interface.ts
└── auth.module.ts                  # Module configuration
```

## Security Features

### 1. Password Hashing
- bcrypt with 10 salt rounds
- Passwords never stored in plain text

### 2. JWT Tokens
- Access tokens: Short-lived (1 hour)
- Refresh tokens: Long-lived (7 days)
- Separate secrets for each token type

### 3. HTTP-Only Cookies
- Prevents XSS attacks
- Secure flag in production
- SameSite attribute configured

### 4. Account Protection
- Blocked user check
- Email uniqueness validation
- Google ID conflict detection

## Testing

### Register a Test User
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### Access Protected Route
```bash
curl -X GET http://localhost:8080/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Integration with Frontend

### React Example (with Firebase Auth)
```typescript
// After Firebase Google sign-in
const idToken = await user.getIdToken();

const response = await fetch('http://localhost:8080/auth/google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    idToken,
    email: user.email,
    name: user.displayName,
    googleId: user.uid,
    avatarUrl: user.photoURL
  }),
  credentials: 'include' // Important for cookies
});

const data = await response.json();
localStorage.setItem('accessToken', data.accessToken);
```

### Axios Configuration
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true // Important for cookies
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const { data } = await api.post('/auth/refresh', { refreshToken });
      localStorage.setItem('accessToken', data.accessToken);
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Troubleshooting

### Common Issues

**1. "Invalid or expired token"**
- Token might have expired
- Try refreshing the token
- Check if user account is blocked

**2. "Email already registered"**
- User already exists
- Use login instead of register
- Or try password reset flow (to be implemented)

**3. Cookies not being set**
- Check `withCredentials: true` in frontend
- Verify CORS configuration
- Ensure domain matches in production

**4. "Cannot find module 'generated/prisma'"**
- Run `npx prisma generate`
- Restart your TS server

## Performance Optimizations

1. **Database Queries**
   - Indexed email, googleId for fast lookups
   - Selective field returns
   - Connection pooling via Prisma

2. **Token Generation**
   - Parallel JWT signing (access + refresh)
   - Async operations throughout

3. **Password Hashing**
   - Optimized bcrypt rounds (10)
   - Async hashing to avoid blocking

## Next Steps

- [ ] Implement password reset flow
- [ ] Add email verification
- [ ] Implement rate limiting per user
- [ ] Add 2FA support
- [ ] Create admin user management endpoints
- [ ] Add session management
- [ ] Implement remember me feature

## Contributing

This module follows clean architecture principles with clear separation of concerns:
- Controllers handle HTTP
- Services contain business logic
- Repositories manage data access
- Guards handle authorization
- Strategies handle authentication

---
