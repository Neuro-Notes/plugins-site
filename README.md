# Neuro Notes Plugins

Full-stack Nuxt 4 marketplace for community plugins used by Neuro Notes.

The first release contains a public bilingual catalog, VitePress developer documentation,
submission workflow, and administrator moderation. Plugin code and release
artifacts remain on public GitHub repositories; this service stores only
validated metadata and immutable release references.

## Local development

Copy the environment template and start the development stack:

```bash
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

The gateway serves the Nuxt marketplace at <http://localhost:3000> and the
VitePress documentation at <http://localhost:3000/docs/ru/> and
<http://localhost:3000/docs/en/>. PostgreSQL and Redis are kept
inside the Compose network and are not exposed on host ports.
Set `APP_PORT` when port 3000 is already in use, for example `APP_PORT=3300`.

For a production-like local run:

```bash
docker compose up --build
```

## Application commands

Run from `app/`:

```bash
yarn install --frozen-lockfile
yarn styles:check
yarn test:unit
yarn typecheck
NN_SKIP_WEB_LITERTLM=1 yarn build
yarn test:e2e
```

Run the documentation locally from `docs/`:

```bash
yarn install --frozen-lockfile
yarn dev
yarn build
```

The end-to-end suite starts the full Compose stack by default because it checks
navigation and theme persistence across the two applications. Set
`PLAYWRIGHT_EXTERNAL_SERVER=1` when the stack is already running.

Database migrations are committed under `app/drizzle/` and applied by the
one-shot `migrate` Compose service before Nuxt starts.

## Services

- Nuxt/Nitro owns both the SSR frontend and `/api/v1` backend.
- VitePress owns the bilingual `/docs/` application and local documentation search.
- Nginx exposes one public port and routes marketplace, API, and documentation requests.
- PostgreSQL stores users, submissions, reviews, plugins, and versions.
- Redis stores encrypted opaque sessions, rate-limit counters, and public API
  caches.
- Neuro Notes backend remains the identity provider.
- GitHub REST API is used only for public repository, release, manifest, and
  entry-file validation.

See `/docs/ru/` or `/docs/en/` for the supported plugin API v1 contract and
current runtime limitations.
