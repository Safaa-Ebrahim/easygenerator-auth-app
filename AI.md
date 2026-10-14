# AI usage

## Tools

- Claude Code (Anthropic), used in VS Code, for the frontend implementation and
  for a later review and hardening pass over the backend.
- GitHub Copilot, to plan the backend: it turned the task into a step-by-step
  guide that I followed to build the first version.

## Backend

### Planning the first version

Before writing any backend code, I asked GitHub Copilot to analyse the task and
give me a step-by-step guide covering everything it required, so I wouldn't
miss anything. The guide went in order: create the NestJS project, connect it to
MongoDB, run it, and test each endpoint with Postman.

This worked well because it turned the requirements (field rules, a protected
endpoint, MongoDB, a README) into a checklist with a clear order. I could
confirm each step worked in Postman before moving on, instead of debugging
everything at the end.

Postman tests requests one at a time, so it did not catch everything. Problems
like concurrent sign-ups, inputs padded with spaces, and endpoints left open
without authentication only showed up in the review pass below.

### Review and hardening pass

Once both apps worked, I asked the assistant to review the backend and list what
to add or improve, ranked by severity, before changing anything. I then chose
which items to apply. Asking for a ranked list first kept the changes small and
let me reject suggestions instead of undoing them.

Real bugs the review found, each fixed with a test that covers it:

- **Public user endpoints.** A `UsersController` exposed
  `GET /users` and `GET /users/:id` without authentication, so anyone could
  list every user's name and email. The controller was removed; users are
  created only through `/auth/signup`.
- **`500` for names with spaces.** The DTO checked the name's length before
  `UsersService` trimmed it, so `"  ab"` passed validation and then failed the
  Mongoose schema. Name and email are now trimmed in the DTO, before validation.
- **`500` on concurrent sign-ups.** Two sign-ups with the same email could both
  pass the "already exists" check; the unique index then rejected the second
  with an unhandled duplicate-key error. It is now mapped to `409`.
- **Token lifetime defined twice.** The JWT was signed with `'15m'` while the
  response hardcoded `expiresIn: 900`. Both now read one validated
  `JWT_EXPIRES_IN_SECONDS` value, and a test checks that the token's real
  lifetime matches what the client is told.
- **No working tests.** The generated specs could not run (TypeScript 6 needs
  `rootDir`), and they only checked "should be defined". They were replaced with
  tests for the services, DTO rules, controller and environment validation.

Hardening added afterwards: per-IP rate limiting on sign-in and sign-up,
`helmet`, request logging that never records bodies or emails, Swagger docs at
`/docs`, environment validation at startup (including a 32-character minimum
for `JWT_SECRET`), and a bcrypt comparison even for unknown emails, so response
time does not reveal which accounts exist.

### What needed correcting

- **Test runner.** The assistant's first fix for the tests ran Jest in ESM mode,
  because NestJS 12 ships ES modules only. Adding `@nestjs/throttler`, which is
  still CommonJS, broke that again: Jest on Node 22 cannot load a CommonJS
  package that requires an ES module. The assistant stopped and laid out three
  options (switch to Vitest, require Node 24.9+, or stub the throttler in
  tests). I chose Vitest with SWC: it works on Node 22, matches the frontend,
  and keeps the real rate limiter under test.

## Frontend

### Approach and prompt

I gave the assistant a single detailed prompt. It asked the assistant to:

1. Read the original task and the actual backend source (DTOs, response
   shapes, guards) before writing any code, without assuming API contracts.
2. Build the sign-up, sign-in and protected application pages in React and
   TypeScript, using one API client and a configurable base URL.
3. Meet specific constraints: no `any`, no disabled lint rules, no secrets in
   code, accessible forms, prevention of duplicate submissions, and documented
   token-storage trade-offs.
4. Run build, lint and tests, and report only results it had actually
   observed.

What made this prompt effective was requiring inspection before implementation
and asking for verified results rather than claimed ones.

### What the assistant generated

- An API layer (`src/api`) with one error type for HTTP, network, timeout and
  malformed responses, and runtime checks of response shapes based on the
  backend's `AuthService` return values.
- Session handling (`src/auth`): `sessionStorage` persistence, automatic
  sign-out when the token expires, and `ProtectedRoute` and `PublicOnlyRoute`
  guards.
- Forms: a small `useForm` hook (validation, error visibility, guard against
  duplicate submits), plus reusable `TextField`, `PasswordField` (accessible
  show/hide toggle), `Button` and `Alert` components.
- Validation rules mirroring the backend DTO regex, and a live checklist of
  password requirements.
- The `/app` page checks the token against `GET /auth/profile` before showing
  "Welcome to the application.", and a `401` ends the session.
- A Vitest and Testing Library suite covering validation, session storage, the
  API client, the theme toggle, and the page flows with `fetch` mocked.
- Backend: `app.enableCors` with a configurable `CORS_ORIGIN`. Without it,
  browser requests from the Vite dev server were blocked.

### What was found and fixed during the session

- **Missing CORS:** the backend never enabled CORS. This only showed up from
  reading `main.ts`, because the API calls had previously been tested with
  tools that don't enforce CORS.
- **React Compiler lint rule (`react-hooks/refs`):** the first version kept the
  duplicate-submit `useRef` in each page, and the rule flagged it. The guard
  moved into `useForm`, which removed duplicated code from both pages.
- **Password toggle accessibility:** the first toggle used `aria-pressed` and
  also changed its label, which sends screen readers mixed signals. Its
  accessible name was also built from a visually hidden span, which jsdom
  computed as "Showpassword". The final version uses a single `aria-label`
  ("Show password" / "Hide password") that contains the visible text.
- **Fast-refresh lint:** route constants moved out of a component file so
  `react-refresh/only-export-components` passes.
- **Theme store.** A later review of `src/theme/theme.ts` found that every
  component using the hook added its own OS-theme listener, that other open
  tabs did not follow a theme change, and that an explicit choice was lost when
  storage was unavailable. All three were fixed. The new tests were run against
  the old code first, to confirm they fail on the bugs they cover.

### Decisions

- **`sessionStorage` instead of `localStorage`** for the token, with the XSS
  trade-off documented. An `httpOnly` cookie would be stronger but needs
  backend changes.
- **No form or component library.** The forms are small enough that a short
  hook is clearer than adding react-hook-form, zod or a component framework.
  `react-router` is the only new runtime dependency.
- **Tailwind CSS v4 for styling.** The assistant first wrote a hand-written
  stylesheet with CSS-variable tokens. I asked it to switch to Tailwind v4. The
  same tokens now live in `@theme`, so components use semantic utilities
  (`bg-surface`, `text-danger`), and dark mode still works by overriding the
  variables.
- **Toasts and logout confirmation.** The first version showed "signed out"
  and "session expired" as static banners on the sign-in page, and they
  couldn't be dismissed. I asked for dismissible toasts and a logout
  confirmation dialog. Notices now use `sonner`. Form errors stay inline,
  because errors the user needs to fix shouldn't disappear on a timer. The
  dialog uses the native `<dialog>` element instead of a UI library.
- **A single light/dark toggle instead of a three-way switch.** The assistant
  built a Light / System / Dark radio group. I replaced it with one button that
  switches between light and dark. The app still follows the OS theme until the
  user makes a choice, so a separate "System" option added a control without
  adding much value.
  assistant's suggestions.

## Verification

- Automated, in both `frontend/` and `backend/`: lint, unit tests and build. The
  backend also has a Prettier check and an end-to-end test that boots the app
  against MongoDB. GitHub Actions (`.github/workflows/ci.yml`) runs all of these
  on every push and pull request.
- The frontend API module ran against the live backend (signup, duplicate
  email, wrong password, weak password, sign-in plus profile, invalid token).
- The hardened backend was checked by running the built app and calling it
  directly: security headers present, the 11th sign-in in a minute gets `429`,
  `/users` returns `404`, a padded short name gets `400`, and a sign-in with an
  unknown email takes as long as one with a wrong password.
