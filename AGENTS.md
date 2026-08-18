# Parole Watch UI

Front-end for **Parole Watch**, an offender status-tracking tool. Users log in, manage a
list of Texas parolees (offenders) within their group, and view a read-only Settings page
(group name + current user). A separate Django repo (`parole-watch-api`) provides the REST
API; this repo is the React SPA that talks to it.

## Stack

- React 18 + TypeScript (strict) + Vite
- Tailwind CSS v3 (via PostCSS — do NOT upgrade to v4)
- react-router-dom v6
- @tanstack/react-query v5 for all server state
- axios (`withCredentials: true`) for HTTP
- vitest + @testing-library/react for tests
- No state-management library — React Query + React Context (auth only)

## Commands

| Command         | Description                                                                      |
| --------------- | -------------------------------------------------------------------------------- |
| `npm run dev`   | Vite dev server at http://localhost:5173; proxies `/api` → `http://localhost:8000` (local Django) |
| `npm run build` | `tsc -b && vite build` → `dist/` (typecheck + build)                             |
| `npm run preview` | Serve the built `dist/` locally                                                |
| `npm run test`  | `vitest run` (jsdom)                                                             |

## Structure

```
src/
  api/              axios client + typed query/mutation hooks + logger
    client.ts         axios instance, baseURL '/api', CSRF header, 401 handling
    logger.ts         logInfo / logWarn / logError helpers
    auth.ts           login / logout / me requests
    offenders.ts      useOffenders / useOffender / useOffenderStatuses / create / unfollow
  auth/             AuthContext (user state, login/logout/me), RequireAuth + RedirectIfAuthed guards
  components/       Modal, StatusBadge, DataTable, ErrorBanner, Spinner, EmptyState, ErrorBoundary, forms
  pages/            Login, OffenderList, OffenderDetail, Settings, NotFound
  router.tsx        route definitions
  types.ts          TS interfaces mirroring the API payloads
  utils.ts          classnames helper, date/status formatters, error extraction
  App.tsx           QueryClientProvider + BrowserRouter + AuthProvider
  main.tsx          entry (ReactDOM + ErrorBoundary)
```

## Conventions

- Strict TS. Type-only imports must use `import type` (`verbatimModuleSyntax`).
- All HTTP goes through `src/api/client.ts`. It attaches `X-CSRFToken` (read from the
  `csrftoken` cookie) on unsafe methods and routes 401 responses to an
  `UnauthorizedWatcher` that bounces to `/login`.
- Server state lives in React Query hooks under `src/api/`. Optimistic updates for
  create/unfollow are implemented in the mutations there, with rollback on error.
- `DataTable` supports server-side sorting: sortable columns set `sortable: true`
  and the owning page holds a `SortState` (`{key, direction}`), derives an
  `?ordering=` string, and passes it through `OffenderFilters`. The Offender
  table defaults to `status asc` so **In Parole Review offenders appear at the
  top** (the API applies the same default); the tie-break is display name.
  Header clicks toggle asc/desc (the active column shows ▲/▼ + `aria-sort`).
- Auth is cookie-based (httpOnly JWT). Tokens are never read/written in JS.
- Logging: use `src/api/logger.ts` — INFO for login/logout + CRUD mutations, WARN/ERROR
  for failed requests and auth failures. No raw `console.*` in app code.
- Field names in the UI mirror the API payloads (snake_case).

## API contract (Django backend at `/api`, same-origin, no CORS)

All endpoints except login require auth (httpOnly-cookie JWT).

### Auth
| Method | Path                  | Body                    | Notes |
| ------ | --------------------- | ----------------------- | ----- |
| POST   | `/api/auth/login/`    | `{username, password}`  | sets access+refresh httpOnly cookies; returns `{username, email, name, groups: string[]}`; 401 on bad creds |
| POST   | `/api/auth/logout/`   |                         | clears cookies |
| POST   | `/api/auth/refresh/`  |                         | refreshes access cookie from refresh cookie |
| GET    | `/api/auth/me/`       |                         | returns `{username, email, name, groups: string[]}`; 401 if not authenticated |

`name` is the user's full name (falls back to username). `groups` are the current user's
group names (e.g. `["The Law Office of Mani Nezami"]`), shown on the read-only Settings page.

CSRF: mutations require an `X-CSRFToken` header taken from the `csrftoken` cookie (set at
login). Done automatically by the axios request interceptor in `src/api/client.ts`.

### Offenders
| Method | Path                            | Notes |
| ------ | ------------------------------- | ----- |
| GET    | `/api/offenders/`               | array (no pagination wrapper); `?q=` (name/tdcj/sid), `?status=IN_REVIEW|NOT_IN_REVIEW|UNKNOWN`, `?active=true|false`, `?ordering=` (comma-separated, `-` prefix = desc; fields: `display_name`, `tdcj_number`, `parole_eligibility_date`, `status`) |
| POST   | `/api/offenders/`               | `{tdcj_number}` required; API resolves sid/profile server-side via TDCJ search; 400 on duplicate/invalid |
| GET    | `/api/offenders/{id}/`          | detail (read-only) |
| POST   | `/api/offenders/{id}/unfollow/` | removes only the caller's group link; never deletes offender data |
| GET    | `/api/offenders/{id}/statuses/` | status history, newest first; items `{id, status, created, edited}` |

Offender payload fields mirror `src/types.ts`. `status` is computed by the API from the
latest `OffenderStatus`; labels map `IN_REVIEW → "In Parole Review"`,
`NOT_IN_REVIEW → "Not in Parole Review"`, `UNKNOWN → "Unknown"`. Dates are ISO
`YYYY-MM-DD`; raw HTML detail/review fields are not exposed.

### Errors
DRF-style: `{"field_name": ["message"]}`; 401 for unauthenticated. Use
`extractErrorMessage()` (in `src/utils.ts`) to turn these into UI messages.

## Tests

- `src/auth/RequireAuth.test.tsx` — guard redirects unauthenticated users to `/login`,
  renders children when authenticated.
- `src/pages/OffenderList.test.tsx` — smoke test: mocked offender hooks render the table,
  status badges, search box, and empty state.

## Deploy

Documented in `.opencode/commands/parole-watch-ui-deploy.md`. Manual only — never run.

**⚠️ Never touch `public_html/`** — it is the WordPress blog at `https://jshowers.com/`.
The real docroot for the parole-watch subdomain is **not** `public_html`. It is the
subdomain's own folder, `/parole-watch.jshowers.com/` on the FTP server (SSH:
`ssh parole-watch-server` → `/home/jshomoek/parole-watch.jshowers.com/`). The front-end
build lives there at the root (`index.html`, `assets/`, `favicon.svg`), alongside the
deployed Django repo. The API is mounted at `/api` only via the CloudLinux Passenger
config in `api/.htaccess` (`PassengerBaseURI "/api"`) — never edit that file. Upload the
build to the docroot **root**; an earlier deploy wrongly placed it inside the Django
package folder `parole_watch/`, which caused a directory listing instead of the SPA. The
docroot `.htaccess` SPA rewrite must keep the `favicon.*` exclusion (see deploy doc) so
`/favicon.ico` 404s instead of returning `index.html`; otherwise Chrome shows a generic
globe icon on cold/incognito loads instead of `/favicon.svg`.
