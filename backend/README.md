# Backend

NestJS 12 + MongoDB (Mongoose) API for the authentication module: sign-up,
sign-in and a JWT-protected profile endpoint.

## Setup

```bash
cd backend
cp .env.example .env   # set MONGODB_URI and a JWT_SECRET of 32+ characters
npm install
npm run start:dev      # http://localhost:3000, API docs at /docs
```

The environment variables are listed in the root [README](../README.md). They
are validated at startup by `src/config/env.validation.ts`; a missing or invalid
value stops the app with a message listing every problem.

## Scripts

| Command              | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `npm run start:dev`  | Start in watch mode.                                     |
| `npm run build`      | Compile into `dist/`.                                    |
| `npm run start:prod` | Run the compiled app (`node dist/main`).                 |
| `npm run lint`       | Run oxlint.                                              |
| `npm run format`     | Format `src/` and `test/` with Prettier.                 |
| `npm test`           | Run the unit tests once (Vitest).                        |
| `npm run test:watch` | Run the unit tests in watch mode.                        |
| `npm run test:e2e`   | Boot the whole app; needs `.env` and a running MongoDB.  |

## Structure

| Path                                   | Contents                                                        |
| -------------------------------------- | --------------------------------------------------------------- |
| `src/main.ts`                          | Bootstrap: helmet, CORS, global `ValidationPipe`, Swagger.      |
| `src/app.module.ts`                    | Config, MongoDB, rate limiting and request logging.             |
| `src/auth/`                            | Sign-up / sign-in endpoints, JWT strategy and guard, DTOs.      |
| `src/users/`                           | User schema and `UsersService` (create, find by email).         |
| `src/config/env.validation.ts`         | Typed, validated environment.                                   |
| `src/common/request-logging.middleware.ts` | One log line per request (no bodies or headers).            |

`UsersService` has no HTTP controller of its own: users are created only through
`POST /auth/signup`, and there is no endpoint that lists users.

## Notes

- **Validation.** `SignupDto` and `SigninDto` use `class-validator`. Name and
  email are trimmed before validation; the password is never trimmed. The global
  `ValidationPipe` rejects unknown fields.
- **Passwords** are hashed with bcrypt (cost 12). The schema excludes the hash
  from queries by default (`select: false`), and it is never returned.
- **Duplicate emails** return `409`, including when two sign-ups race and the
  unique index rejects the second.
- **Tests** run on Vitest with SWC, because NestJS 12 is ESM-only and SWC emits
  the decorator metadata Nest's dependency injection needs.
