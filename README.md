# easygenerator-auth-app

Authentication demo with a React and TypeScript frontend and a NestJS backend.

## Project structure

- `frontent/` - React, TypeScript, and Vite application.
- `backend/` - NestJS API and MongoDB integration.

## Run locally

Install dependencies in each application directory:

```bash
cd frontent
npm install
npm run dev
```

In a second terminal, configure the backend's required environment variables
locally, then run:

```bash
cd backend
npm install
npm run start:dev
```

Keep credentials and local environment files out of Git. See each directory's
README for additional details.
