# Patient Management System

Minimal-code full-stack app using React (CRA) and NestJS with JWT auth, Casbin RBAC, Nodemailer, and PostgreSQL via TypeORM.

## Stack
- Client: React (CRA, TypeScript), MUI, Axios, React Router
- Server: NestJS, Passport JWT, Casbin + TypeORM Adapter, Nodemailer, TypeORM (PostgreSQL)
- Docker: docker-compose with `db` (Postgres), `server` (NestJS), `client` (React), `mailpit` (SMTP/UI)

## Structure
```
client/
  src/
    api/axios.ts
    hooks/useAuth.ts
    pages/{LoginPage,DoctorDashboard,PatientDashboard}.tsx
    utils/EnvironmentUtils.ts
  test/
server/
  src/
    auth/{auth.controller.ts,auth.module.ts,auth.service.ts,jwt.guard.ts,jwt.strategy.ts,dt o.ts}
    patients/{patients.controller.ts,patients.module.ts,patients.service.ts}
    casbin/casbin.module.ts
    entities/{user.entity.ts,email-verification-token.entity.ts,patient-invite.entity.ts}
    utils/EnvironmentUtils.ts
    {app.module.ts,main.ts}
  test/
    e2e-flow.ts (API-only E2E)
e2e/ (Playwright browser tests)
  tests/flow.spec.ts
  playwright.config.ts
  package.json
  tsconfig.json
docker-compose.yml
```

## Environment
See `.env.example` in each service.

Server required vars:
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME
- JWT_SECRET, JWT_EXPIRES_IN
- EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
- CLIENT_URL (e.g., `http://localhost:3002`)

Client required vars:
- REACT_APP_API_BASE_URL (e.g., `http://localhost:3001`)

## Auth Flow
1) Doctor registers -> verification email
2) Verified doctor logs in -> gets JWT
3) Doctor invites patient -> email with login link token
4) Patient clicks link -> JWT issued (account auto-created if new)

### Diagram
```
Doctor -> [POST /auth/register] -> Email(verify link)
Doctor -> [GET /auth/verify-email?token] -> Verified
Doctor -> [POST /auth/login] -> JWT
Doctor -> [POST /auth/invite] -> Email(patient link)
Patient -> [GET /auth/patient-login?token] -> JWT
```

## RBAC Matrix (Casbin)
- doctor: manage patients
- patient: read self

## Local Setup
Prereqs: Node 20+, Docker

### Without Docker
1. Start Postgres locally and set server `.env` accordingly
2. Server
   ```bash
   cd server
   npm ci
   npm run start:dev
   ```
3. Client
   ```bash
   cd client
   npm ci
   npm start
   ```

### With Docker
```bash
docker compose up --build -d
```
- Client: http://localhost:3002
- Server: http://localhost:3001
- Mail UI (Mailpit): http://localhost:8026 (SMTP listens on 1026)

## Minimal Test Instructions
```bash
cd server && npm test
cd ../client && npm test
```

## End-to-End (Playwright)
We include browser E2E tests under `e2e/` adhering to common industry structure.

Setup:
```bash
cd e2e
npm i
npm run install:browsers
```

Run (Docker stack must be running):
```bash
docker compose up -d
cd e2e
npm test           # headless
npm run test:ui    # UI mode
```

Environment overrides (if ports differ) — use 127.0.0.1 to avoid IPv6 localhost issues:
```bash
CLIENT_URL=http://127.0.0.1:3002 \
SERVER_URL=http://127.0.0.1:3001 \
MAILPIT_URL=http://127.0.0.1:8026 \
npm test
```

The main spec `e2e/tests/flow.spec.ts` covers:
- Doctor register (API) → email verification (Mailpit) → login (UI)
- Invite patient (UI) → patient login link (Mailpit) → patient dashboard (UI)
- Validate `/patients/me` with the browser-stored JWT

## API Overview (minimal endpoints)
- POST `/auth/register` { email, password } → sends verification email
- GET `/auth/verify-email?token=...` → marks doctor as verified
- POST `/auth/login` { email, password } → { accessToken, role }
- POST `/auth/invite` { email } (doctor JWT) → sends patient login link
- GET `/auth/patient-login?token=...` → { accessToken, role }
- GET `/patients/me` (JWT) → current user profile

### Quick cURL examples
```bash
# Register doctor
curl -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"doc@example.com","password":"Passw0rd!"}'

# Verify doctor (replace TOKEN from Mailpit snippet)
curl "http://localhost:3001/auth/verify-email?token=TOKEN"

# Login doctor
curl -X POST http://localhost:3001/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"doc@example.com","password":"Passw0rd!"}'

# Invite patient (replace $JWT)
curl -X POST http://localhost:3001/auth/invite \
  -H "Authorization: Bearer $JWT" -H 'Content-Type: application/json' \
  -d '{"email":"pat@example.com"}'

# Patient login (replace PTOKEN from Mailpit snippet)
curl "http://localhost:3001/auth/patient-login?token=PTOKEN"

# Me (replace $PJWT)
curl http://localhost:3001/patients/me -H "Authorization: Bearer $PJWT"
```

## Auth and RBAC
- JWT via `@nestjs/passport` + `passport-jwt`; `JwtAuthGuard` protects endpoints
- Casbin with TypeORM adapter seeds:
  - doctor → can `manage` `patients`
  - patient → can `read` `self`

## Implementation Notes
- Minimal custom logic; libraries handle auth, RBAC, ORM, email
- TypeORM `synchronize: true` in dev; disable in production
- Emails sent through Mailpit in Docker for easy inspection
- `EnvironmentUtils.ts` in both client and server provide safe env access

## Deployment
- Build images via Dockerfiles in `client/` and `server/`
- Adjust `docker-compose.yml` env for production and remove `synchronize: true`
- Provide real SMTP credentials instead of Mailpit
- Set strong `JWT_SECRET`

## Troubleshooting
- Port conflicts: we map Client → 3002, Server → 3001, DB → 5433, Mailpit UI → 8026, SMTP → 1026
- If E2E cannot reach server, ensure Docker is running and `curl http://localhost:3001/health` returns `ok`
- For browser tests, prefer `127.0.0.1` over `localhost` in envs to avoid IPv6 resolution issues

## Notes
- Business logic minimized; uses defaults and library wiring
- TypeORM `synchronize=true` for dev only
- Casbin policies are seeded at startup


