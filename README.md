# easygenerator-auth-app

Authentication demo with a React and TypeScript frontend and a NestJS backend.

## Project structure

- `frontend/` - React, TypeScript, and Vite application ([details](frontend/README.md)).
- `backend/` - NestJS API and MongoDB integration.

## Prerequisites

- Node.js 22+ and npm
- A MongoDB instance (local or hosted)

## Run locally

Install dependencies in each application directory.

**Backend** (terminal 1): copy the example environment file, fill in real values,
then start the API on `http://localhost:3000`:

```bash
cd backend
cp .env.example .env   # set MONGODB_URI and a strong JWT_SECRET
npm install
npm run start:dev
```

| Variable      | Required | Description                                                       |
| ------------- | -------- | ----------------------------------------------------------------- |
| `MONGODB_URI` | yes      | MongoDB connection string.                                        |
| `JWT_SECRET`  | yes      | Secret used to sign access tokens (at least 32 characters).       |
| `JWT_EXPIRES_IN_SECONDS` | no | Access-token lifetime in seconds (default `900`).          |
| `PORT`        | no       | API port (default `3000`).                                        |
| `CORS_ORIGIN` | no       | Comma-separated allowed browser origins (default `http://localhost:5173`). |
| `NODE_ENV`    | no       | Set to `production` to turn off the `/docs` page.                 |

The API checks these values at startup and refuses to start, listing every
problem, if a required one is missing or a value is invalid.

**Frontend** (terminal 2), served on `http://localhost:5173`:

```bash
cd frontend
npm install
npm run dev
```

The frontend calls the API at `VITE_API_BASE_URL` (default
`http://localhost:3000` in development). See `frontend/.env.example`.

Keep credentials and local environment files out of Git. See each directory's
README for additional details.

## API

| Method | Path            | Auth   | Body                        | Success response                                         |
| ------ | --------------- | ------ | --------------------------- | -------------------------------------------------------- |
| POST   | `/auth/signup`  | -      | `{ name, email, password }` | `201 { message, user }`; `409` if the email exists        |
| POST   | `/auth/signin`  | -      | `{ email, password }`       | `200 { accessToken, tokenType, expiresIn, user }`; `401` |
| GET    | `/auth/profile` | Bearer | -                           | `200 { message, user: { userId, email } }`; `401`        |

Interactive API docs (Swagger) are served at `http://localhost:3000/docs`
outside production.

Validation: name ≥ 3 characters (after trimming); valid email; password ≥ 8 characters with at
least one letter, one number and one special character.

## Security

- Passwords are hashed with bcrypt (cost 12) and never returned or logged.
- Rate limits per IP: 5 sign-ups and 10 sign-ins per minute, 100 requests per
  minute elsewhere. Excess requests get `429`.
- Signing in with an unknown email takes as long as a wrong password, so
  response time does not reveal which emails are registered.
- `helmet` sets standard security headers; CORS is limited to `CORS_ORIGIN`.
- Each request is logged with method, path, status and duration. Bodies,
  headers and emails are not logged.

## Quality checks

```bash
# frontend
cd frontend && npm run lint && npm test && npm run build

# backend
cd backend && npm run lint && npm run build && npm test
# backend end-to-end (needs .env and a running MongoDB)
cd backend && npm run test:e2e
```
