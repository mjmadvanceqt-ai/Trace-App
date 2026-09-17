# Database setup

The app supports a real Postgres database through the `DATABASE_URL` environment variable. This is the production-ready path for a normal app with user data, route storage, and shared state.

## Recommended setup

Use a managed Postgres service such as Neon, Supabase, or another compatible provider and set:

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Then restart the app and run migrations:

```bash
npm run build
```

The project already includes migration support and will use the configured Postgres database automatically when `DATABASE_URL` is present.

## Local fallback

When `DATABASE_URL` is unset, the app falls back to the embedded PGLite database so the project still runs in preview and development.
