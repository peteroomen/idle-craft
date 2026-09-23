# idle-craft

An idle/incremental game about skills and crafting. This repo holds three related
projects: two implementations of the game and the sprite artwork they share.

| Directory | What it is | Stack |
| --- | --- | --- |
| [`next-idle/`](next-idle) | First implementation. A single Next.js app. | Next.js 15, React 19, Ant Design, Tailwind 4 |
| [`next-idle-sprites/`](next-idle-sprites) | Source artwork for the item and skill icons. | Aseprite |
| [`idle-craft/`](idle-craft) | Second implementation. Splits the game into an API and a web client. | Nx 20, Express, Vite, React 19 |

Both implementations use MongoDB for storage and Auth.js for sign-in. `next-idle`
offers Google, GitHub and email/password. `idle-craft` offers Google and
email/password.

Neither project is finished. In both, the email/password path calls
`AuthMissingCredentialsError()` and `AuthInvalidCredentialsError()` without
importing them, and `lib/exceptions.ts` does not export them. Fix that before
you test the credentials provider.

## next-idle

The original version. It puts the UI, the API routes and the data access in one
Next.js App Router project.

- `src/app/skills/` — one page for each skill: woodcutting, mining, firemaking,
  fletching, smithing, crafting, enchanting, exploration, attack, strength,
  defense, ranged and magic.
- `src/app/api/skills/` — the REST routes the pages read through SWR.
- `src/app/lib/db.ts` — the MongoDB client.
- `src/app/auth.ts` — Auth.js v5 with the MongoDB adapter.

Run it:

```bash
cd next-idle && npm install && npm run dev
```

The app serves on http://localhost:3000. Use Node 22.14.0, as `.nvmrc` records.

It needs a `.env.local` file with these keys:

```
AUTH_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
MONGODB_URI
```

## next-idle-sprites

The pixel art, as `.aseprite` sources next to their exported `.png` files.

- `skills/` — icons for woodcutting, mining, firemaking and fletching.
- `items/logs/` — eight log types, from oak to magic.
- `items/weapons/` — six swords, from bronze to orichalcum.

The exported PNGs are copied into `next-idle/public/icons/`. Edit the `.aseprite`
file here, then re-export into that directory.

## idle-craft

A second take on the same game. It is an Nx workspace that separates the server
from the client.

- `apps/idle-craft-api/` — an Express server. It uses `@auth/express` instead of
  NextAuth.
- `apps/idle-craft-web/` — a React single-page app, built with Vite and
  React Router.
- `apps/idle-craft-api-e2e/` and `apps/idle-craft-web-e2e/` — Jest and Playwright
  end-to-end projects.

This version is the less complete of the two. The API mounts Auth.js on
`/auth/*`, but the game routes in `src/main.ts` are still placeholders that
return fixed strings.

Run it:

```bash
cd idle-craft && npm install && npx nx serve idle-craft-api
```

The API needs a `.env.local` file in `apps/idle-craft-api/` with these keys:

```
PORT
AUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MONGODB_URI
```

## Note on the repo

These three directories were separate working copies. This repo combines them,
so the commit history before the first commit here is not present. No `.env`
file is tracked, in either project.
