# Frontend

React 19 + TypeScript + Vite client for the authentication module: sign-up,
sign-in and a protected application page.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # optional, see "Configuration"
npm run dev            # http://localhost:5173
```

The backend must be running (see the root [README](../README.md)) and must allow
the frontend origin via `CORS_ORIGIN` (defaults to `http://localhost:5173`).

## Configuration

| Variable            | Default (dev)           | Description                                  |
| ------------------- | ----------------------- | -------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the NestJS API, no trailing `/`. |

`VITE_*` variables are embedded into the JavaScript bundle at build time and are
visible to anyone using the app, so never put secrets in them. If the variable
is unset in a production build, the app calls the API on its own origin (useful
behind a reverse proxy that routes `/auth/*` to the backend).

## Scripts

| Command              | Description                                   |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Start the Vite dev server with hot reload.    |
| `npm run build`      | Type-check (`tsc -b`) and build into `dist/`. |
| `npm run preview`    | Serve the production build locally.           |
| `npm run lint`       | Run ESLint.                                   |
| `npm test`           | Run the Vitest suite once.                    |
| `npm run test:watch` | Run Vitest in watch mode.                     |

## How it talks to the backend

| Page               | Route     | Backend call                                            |
| ------------------ | --------- | ------------------------------------------------------- |
| Sign up            | `/signup` | `POST /auth/signup` `{ name, email, password }`         |
| Sign in            | `/signin` | `POST /auth/signin` `{ email, password }`               |
| Application (auth) | `/app`    | `GET /auth/profile` with `Authorization: Bearer <token>` |

- All requests go through `src/api/client.ts`. It applies the base URL, JSON
  headers and a 15 s timeout, and it turns HTTP, network, timeout and malformed
  responses into a single `ApiError` type. `src/api/auth.ts` checks the shape of
  each response before the app uses it.
- Form rules in `src/lib/validation.ts` mirror the backend DTOs (name ≥ 3 chars,
  valid email, password ≥ 8 chars with a letter, a number and a special
  character). They give immediate feedback, and the backend still validates
  every request.
- After a successful sign-up the page signs in with the same credentials and
  opens `/app`. If that sign-in fails (for example a network error or the
  sign-in rate limit), the user lands on the sign-in page with the email filled
  in.
- `/app` is wrapped in `ProtectedRoute`. On load, the page calls the protected
  endpoint to confirm the token. A `401` ends the local session and sends the
  user back to sign-in with a "session expired" notice. The route guard only
  affects the UI; the backend's JWT guard enforces access.

## Feedback and dialogs

- **Inline errors** (invalid credentials, duplicate email, network failure)
  appear above the form as `role="alert"` and stay until the user acts.
- **Transient notices** ("Account created", "Signed out", "Session expired")
  appear as toasts via [`sonner`](https://sonner.emilkowal.ski). They are
  announced to screen readers, close automatically and have a close button.
- **Logout** asks for confirmation in a native `<dialog>` opened with
  `showModal()`, which provides the focus trap, Escape to close and an inert
  background. Focus starts on "Cancel".

## Session and token storage

The backend returns a 15-minute bearer token in the response body. There is no
refresh token or cookie. The frontend stores the token, its expiry time and the
basic user info in **`sessionStorage`**:

- The session survives a page reload, is limited to one tab, and is removed
  when the tab closes.
- When the token expires, the app signs the user out automatically, and expired
  or malformed stored sessions are discarded on load.
- Passwords are never stored or logged, and a password field is masked again
  as soon as its form is submitted.

**Trade-off:** any JavaScript running on the page can read `sessionStorage`, so
this storage does not protect the token from XSS. The stronger design is for the
backend to issue the token in an `httpOnly`, `Secure`, `SameSite` cookie, with
CSRF protection. That needs backend changes and is outside the current scope.

## Styling

Styling uses [Tailwind CSS v4](https://tailwindcss.com) via the
`@tailwindcss/vite` plugin. No `tailwind.config.js` is needed. Design tokens
(colors, shadow, font) are defined once in `src/index.css` under `@theme` and
exposed as semantic utilities such as `bg-surface`, `text-muted`,
`border-line` and `text-danger`.

**Dark mode:** a sun/moon toggle sits in the app header and on the auth pages.
The theme follows the operating system until the user picks one, and that
choice is saved in `localStorage`. An inline script in `index.html` sets
`<html data-theme>` before the first paint, so the page never flashes the
wrong theme. `:root[data-theme='dark']` overrides the colour variables, so
components don't need `dark:` variants. `dark:` still works if needed, through
`@custom-variant`.

## Project structure

```
src/
  api/          API client, error handling, typed auth endpoints
  auth/         Session storage, AuthProvider/context, route guards
  components/   Reusable UI (TextField, PasswordField, Button, Alert, layout)
  hooks/        useForm (validation and submit state), useDocumentTitle
  lib/          Validation rules shared by the forms, `cn` class-name helper
  pages/        SignUpPage, SignInPage, ApplicationPage
  test/         Vitest setup and test helpers
```

Tests sit next to the code they cover (`*.test.ts(x)`). They use Vitest, jsdom
and Testing Library, with `fetch` mocked.
