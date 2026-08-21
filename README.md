# Parole Watch UI

Front-end for **Parole Watch**, an offender status-tracking tool. Users log in, manage a
list of Texas parolees (offenders), and maintain an email notification subscriber list.
A separate Django repo (`parole-watch-api`) provides the REST API; this repo is the
React SPA that talks to it.

## Stack

- React 18 + TypeScript (strict) + Vite 6
- Tailwind CSS v3 (via PostCSS — not Tailwind v4)
- react-router-dom v7
- @tanstack/react-query v5 for all server state
- axios (`withCredentials: true`) for HTTP
- vitest v3 + @testing-library/react for tests

## Getting started

Requires Node 20+. The local Django API must be running on `http://localhost:8000`.

```bash
npm install
npm run dev
```

Vite serves the app at http://localhost:5173 and proxies `/api` → `http://localhost:8000`.

## Scripts

| Command            | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `npm run dev`      | Dev server at http://localhost:5173 (proxies `/api`)     |
| `npm run build`    | Typecheck + production build (`tsc -b && vite build`)    |
| `npm run preview`  | Serve the built `dist/` locally                          |
| `npm run test`     | Run the vitest suite                                     |

## Features

- Cookie-based auth (login/logout), protected routes, auto-redirect to login on 401
- Offender list with search (`?q=`), status filter chips, and active-state filter
- Add / edit / delete offenders (optimistic updates via React Query mutations)
- Offender detail view with full field display and a status-history timeline
- Subscriber list with add form, active toggle, and confirmed delete

## Project structure

```
src/
  api/              axios client + typed query/mutation hooks + logger
  auth/             AuthContext + route guards (RequireAuth / RedirectIfAuthed)
  components/       Modal, StatusBadge, DataTable, ErrorBanner, forms, ErrorBoundary
  pages/            Login, OffenderList, OffenderDetail, Subscribers, NotFound
  router.tsx        route definitions
  types.ts          TS interfaces mirroring the API payloads
  utils.ts          helpers (classnames, date/status formatting, error extraction)
  App.tsx           QueryClientProvider + BrowserRouter + AuthProvider
  main.tsx          entry point
```

## API contract

The app talks to the Django backend at same-origin `/api`. The full endpoint contract
is documented in [`AGENTS.md`](./AGENTS.md).

## Deploy

The UI is a static build served from the `parole.watch` docroot (`/parole.watch/` on FTP —
**not** `public_html/`, which is the WordPress blog). The Django API lives outside the
docroot and is mounted at `/api` via Passenger. See
[`.opencode/commands/parole-watch-ui-deploy.md`](./.opencode/commands/parole-watch-ui-deploy.md)
for the manual deploy steps.
