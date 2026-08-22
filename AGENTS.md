# Parole Watch UI

Front-end for **Parole Watch**, an offender status-tracking tool. Users log in, manage a
list of Texas parolees (offenders) within their group, and view a read-only Settings page
(group name + current user). A separate Django repo (`parole-watch-api`) provides the REST
API; this repo is the React SPA that talks to it.

## Stack

- React 18 + TypeScript (strict) + Vite 6
- Tailwind CSS v3 (via PostCSS — do NOT upgrade to v4)
- react-router-dom v7 (drop-in from v6; only v6-compatible API is used)
- @tanstack/react-query v5 for all server state
- axios (`withCredentials: true`) for HTTP
- vitest v3 + @testing-library/react for tests
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
    signup.ts         useSignup (public account-signup POST to /signup/)
    billing.ts        useCreateCheckoutSession (POST /billing/checkout/ → {checkout_url, session_id})
    offenders.ts      useOffenders / useOffender / useOffenderStatuses / create / unfollow
  auth/             AuthContext (user state, login/logout/me/refreshUser), RequireAuth + RedirectIfAuthed
                    guards, RequireSubscription (paywall Outlet guard), subscription helpers
    subscription.ts   isSubscribed(user) + isSubscriptionError(error) + SUBSCRIPTION_INACTIVE_DETAIL
  components/       Modal, StatusBadge, DataTable, ErrorBanner, Spinner, EmptyState, ErrorBoundary, Turnstile, forms
  pages/            Login, Signup, Paywall, OffenderList, OffenderDetail, Settings, NotFound
  router.tsx        route definitions
  states.ts         US state code → {name, flag} map (`US_STATES`) + `getState()`
  types.ts          TS interfaces mirroring the API payloads
  utils.ts          classnames helper, date/status formatters, error extraction
  App.tsx           QueryClientProvider + BrowserRouter + AuthProvider
  main.tsx          entry (ReactDOM + ErrorBoundary)
public/flags/       Vendored US state flag SVGs (`<code>.svg`, Wikimedia Commons) served at `/flags/<code>.svg`
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
  table defaults to `status asc` so **Approved offenders appear at the top**
  (the API applies the same default); the tie-break is display name.
  Header clicks toggle asc/desc (the active column shows ▲/▼ + `aria-sort`).
- Table cells that navigate to a detail view must use `<Link>` (a real `<a
  href>`), never a `<button>` calling `navigate()`, so ctrl/cmd+click,
  middle-click, and right-click → open in new tab work natively.
- Auth is cookie-based (httpOnly JWT). Tokens are never read/written in JS.
- Logging: use `src/api/logger.ts` — INFO for login/logout + CRUD mutations, WARN/ERROR
  for failed requests and auth failures. No raw `console.*` in app code.
- Field names in the UI mirror the API payloads (snake_case).

## API contract (Django backend at `/api`, same-origin, no CORS)

All endpoints except login require auth (httpOnly-cookie JWT).

### Auth
| Method | Path                  | Body                    | Notes |
| ------ | --------------------- | ----------------------- | ----- |
| POST   | `/api/auth/login/`    | `{username, password, cf_turnstile_response?}`  | sets access+refresh httpOnly cookies; returns `{username, email, name, groups: string[], group_settings, settings}`; 401 on bad creds; 400 if Turnstile verification fails (only when backend `TURNSTILE_SECRET_KEY` is set) |
| POST   | `/api/auth/logout/`   |                         | clears cookies |
| POST   | `/api/auth/refresh/`  |                         | refreshes access cookie from refresh cookie |
| GET    | `/api/auth/me/`       |                         | returns `{username, email, name, groups: string[], group_settings, settings}`; 401 if not authenticated |
| GET    | `/api/auth/settings/` |                         | returns `UserSettings`; 401 if not authenticated |
| PATCH  | `/api/auth/settings/` | partial `UserSettings`  | values must be booleans; returns the full updated `UserSettings` |

### Signup (public, no auth)
| Method | Path            | Body                                  | Notes |
| ------ | --------------- | ------------------------------------- | ----- |
| POST   | `/api/signup/`  | `{name, email, law_firm_name, cf_turnstile_response?}`          | `AllowAny`; creates a new group (law firm name) + new user (name/email, username = email) in one transaction, emails the user a generated password + notifies the owner, then auto-logs in (sets the JWT cookies) and returns **201** with the same `{username, email, name, groups, group_settings, settings}` payload as login. DRF-style field errors on missing/invalid input; 400 on duplicate email or duplicate firm name; 400 if Turnstile verification fails (only when backend `TURNSTILE_SECRET_KEY` is set). |

`name` is the user's full name (falls back to username). `groups` are the current user's
group names (e.g. `["The Law Office of Mani Nezami"]`), shown on the read-only Settings page.

`group_settings` is a read-only per-group settings list
(`[{name: <group>, operating_state: <US state code>, is_subscribed: <boolean>}]`, ordered by group
name, scoped to the caller's groups; groups without a row are omitted). The Settings page shows the
**first** group's Operating State as a featured row below the group name — the state name + its flag
icon (`getState()` in `src/states.ts`; flag SVGs served from `/flags/<code>.svg`). Not editable on
the Settings page — the API has no write endpoint for group settings.

`is_subscribed` gates feature access: new signups always come back `false`; existing accounts
`true`. The front-end treats the user as subscribed if **any** group is subscribed
(`isSubscribed()` in `src/auth/subscription.ts`) — this mirrors the backend, which 403s offender
endpoints only when **all** of the user's groups are unsubscribed (or the user has no group).

`settings` is `{receive_email_alerts_for_offender_status_changes: boolean,
receive_offender_summary_report: boolean}` (both default true) and is included in the
login/me payloads too. PATCH is partial — send only the changed key. The two toggles on the
Settings page are independent; toggling either only affects that setting.

CSRF: mutations require an `X-CSRFToken` header taken from the `csrftoken` cookie (set at
login and signup). Done automatically by the axios request interceptor in `src/api/client.ts`.

### Turnstile anti-spam

Login and Signup render `src/components/Turnstile.tsx` — an invisible Cloudflare
Turnstile widget (non-interactive `execution: 'execute'`) that lazily loads
`challenges.cloudflare.com`'s script and exposes an `execute()` imperative handle
returning the token. The sitekey comes from `VITE_TURNSTILE_SITEKEY` (baked in at
build time via the deploy workflow's `Build` step secret; unset locally means the
widget is skipped entirely and forms submit without a token). Each form passes a
stable `action` to the widget (`login` on the Login page, `signup` on the Signup
page) which the backend requires back from siteverify. The token is sent as
`cf_turnstile_response` in the login/signup POST body. The component degrades
gracefully when the script is blocked (empty token, form still submits) — the
backend only enforces verification when its `TURNSTILE_SECRET_KEY` env var is set,
so dev/test flows are unchanged. Backend verification lives in
`parole-watch-api`'s `parole_watch/utils/turnstile.py` (`verify_turnstile`,
fail-closed, checks `success` + `action` + hostname allowlist) and is wired into
`LoginView` and `SignupView`.

### Billing (Stripe subscription)
| Method | Path                     | Notes |
| ------ | ------------------------ | ----- |
| POST   | `/api/billing/checkout/` | authenticated; creates a Stripe Checkout Session for the user's group subscription and returns `{checkout_url, session_id}`; 400 `{"detail": "..."}` on no groups / billing unconfigured / Stripe error. **Not** subscription-gated — it is how an unsubscribed user pays. |
| POST   | `/api/stripe/webhook/`   | unauthenticated, signature-verified; Stripe server-to-server only. Flips `is_subscribed` on `checkout.session.completed` + subscription lifecycle events. The front-end never calls it. |

### Subscription gating (paywall)

Feature access (the offender endpoints below) is gated on the user's group subscription. The
front-end decides what to show from the auth payload's `group_settings[].is_subscribed`, and treats
a subscription-403 on any offender call as the paywall state (the subscription may have lapsed
mid-session).

- `RequireSubscription` (in `src/auth/RequireAuth.tsx`) is an Outlet guard wrapping the
  `/offenders` and `/offenders/:id` routes inside the `RequireAuth`/`Layout` route. It renders
  `<Outlet />` when `isSubscribed(user)` is true, else `src/pages/Paywall.tsx`. `/settings` stays
  ungated (settings/logout remain reachable while unsubscribed). Auth endpoints (login, me, logout,
  refresh, settings), ping, signup, and billing are all accessible to unsubscribed users.
- `src/pages/Paywall.tsx` shows the group name, a **Subscribe** button that runs
  `useCreateCheckoutSession()` (`src/api/billing.ts`) and redirects the browser to
  `checkout_url` on success (`window.location.assign`); failures render an `ErrorBanner`. On mount it
  calls `refreshUser()` (a fresh `GET /auth/me/`) and, if the group is now subscribed, invalidates
  the offender queries — this picks up the subscribed state when Stripe redirects back to the app's
  success URL (a full page load re-runs `meRequest()` in `AuthProvider` anyway; `refreshUser` covers
  the webhook race). If subscribed after the refresh it renders `null` and the guard flips to the app.
- `OffenderList` and `OffenderDetail` additionally render `<Paywall />` when their query error matches
  `isSubscriptionError()` (axios 403 + `detail === SUBSCRIPTION_INACTIVE_DETAIL`), and offender
  create/unfollow mutations trigger the same paywall state on that 403.
- The response interceptor in `src/api/client.ts` is unchanged: only 401 bounces to `/login`; a 403
  subscription error is surfaced by the components above.

### Offenders
| Method | Path                            | Notes |
| ------ | ------------------------------- | ----- |
| GET    | `/api/offenders/`               | array (no pagination wrapper); `?q=` (name/tdcj/sid), `?status=IN_REVIEW|NOT_IN_REVIEW|UNKNOWN|APPROVED`, `?active=true|false`, `?ordering=` (comma-separated, `-` prefix = desc; fields: `display_name`, `tdcj_number`, `parole_eligibility_date`, `next_parole_review_date`, `status`; nulls sort last) |
| POST   | `/api/offenders/`               | `{tdcj_number}` required; API resolves sid/profile server-side via TDCJ search; 400 on duplicate/invalid |
| GET    | `/api/offenders/{id}/`          | detail (read-only) |
| POST   | `/api/offenders/{id}/unfollow/` | removes only the caller's group link; never deletes offender data |
| GET    | `/api/offenders/{id}/statuses/` | status history, newest first; items `{id, status, created, edited}` |

**All offender endpoints return 403 `{"detail": "Your group subscription is not active."}` until
subscribed** (superusers bypass). A user with no groups now gets 403 on offender endpoints too
(previously they could still add offenders). Unauthenticated requests still get 401.

Offender payload fields mirror `src/types.ts`. `status` is computed by the API from the
latest `OffenderStatus`; labels map `IN_REVIEW → "In Parole Review"`,
`NOT_IN_REVIEW → "Not in Parole Review"`, `UNKNOWN → "Unknown"`,
`APPROVED → "Approved"`. Dates are ISO
`YYYY-MM-DD`; raw HTML detail/review fields are not exposed.
The default status sort order (and the `?ordering=status` sort) places Approved
first, then In Parole Review, Not in Parole Review, Unknown.
`next_parole_review_date` is always the 1st of the month (the day is meaningless) and
null when unknown — the UI renders it month/year only via `formatMonthYear()` (e.g.
`2027-03-01 → "03/2027"`) and `—` when null. It appears as the "Next review" sortable
column on the offender table, as a "Next parole review" row in the detail fields
table (always shown, regardless of status), and in a banner at the top of the detail
view. That banner uses the same background/border/text color as the offender's
current status (see StatusBadge palette below) and is **not rendered at all when the
status is Approved**. When the status is In Parole Review, the banner shows just the
text "In Parole Review" (no date); otherwise it shows "Next parole review" plus the
month/year value.
On the detail view, a "Links" section sits between the status banners and the detail
fields grid. It shows two external links that open in a new tab: "View profile"
(`profile_url`) and "View parole details" (`parole_details_url`); each renders `—`
when its URL is empty.

Status badges use the daily summary-report email color scheme: Approved green
(`bg-green-100 text-green-800`), In Parole Review blue (`bg-blue-100
text-blue-800`), Not in Parole Review gray (`bg-gray-100 text-gray-800`), Unknown
red (`bg-red-100 text-red-700`).

### Errors
DRF-style: `{"field_name": ["message"]}`; 401 for unauthenticated. Use
`extractErrorMessage()` (in `src/utils.ts`) to turn these into UI messages.

## Tests

- `src/auth/RequireAuth.test.tsx` — guard redirects unauthenticated users to `/login`,
  renders children when authenticated; `RequireSubscription` renders children when the group is
  subscribed and the paywall when not.
- `src/pages/OffenderList.test.tsx` — smoke test: mocked offender hooks render the table,
  status badges, search box, and empty state; a subscription-403 query error renders the paywall.
- `src/pages/Paywall.test.tsx` — renders the subscription message + Subscribe button; a successful
  checkout redirects to `checkout_url`; a failure renders an error banner.
- `src/pages/Settings.test.tsx` — renders account details, the featured Operating State row
  (state name + flag icon) below the group name, and both email-alert toggles
  (status-change alerts + weekly summary report); each toggle reflects its setting and
  fires a partial PATCH mutation when flipped.
- `src/pages/Signup.test.tsx` — renders the signup headline, 3 benefit bullets, and
  Name/Email/Law firm name fields; submit fires the `useSignup` mutation with the entered
  values; success auto-logs the user in (sets the auth user) and navigates to `/offenders`.
- `src/pages/Login.test.tsx` — renders the username/password fields, submits credentials
  through the auth context, and shows an error banner on failure. Both Login/Signup tests
  mock `../components/Turnstile` (a no-op stub) since the real widget needs a sitekey +
  script that jsdom doesn't provide.

## Deploy

**Primary method: GitHub Actions** — `.github/workflows/deploy.yml` runs on push to
`main` (and manual `workflow_dispatch`): `npm ci` + `npm run build`, copies the
committed root `.htaccess` into `dist/`, then `rsync --delete`s `dist/` to the docroot
over SSH (`jshomoek@jshowers.com:21098`) with `--exclude='api/' --exclude='cgi-bin/'
--exclude='.well-known/'`. Full procedure documented in
`.opencode/commands/parole-watch-ui-deploy.md` (manual steps there are fallback only).

GitHub secrets required: `DEPLOY_SSH_KEY` (ed25519 deploy key, public half in
`~/.ssh/authorized_keys` on the server), `DEPLOY_SSH_HOST` = `jshowers.com`,
`DEPLOY_SSH_PORT` = `21098`, `DEPLOY_SSH_USER` = `jshomoek`, plus
`VITE_TURNSTILE_SITEKEY` (public Cloudflare Turnstile sitekey, injected into the Build step).

**⚠️ Never touch `public_html/`** — it is the WordPress blog at `https://jshowers.com/`.
The real docroot for the parole-watch site is **not** `public_html`. It is the domain's
own folder, `/parole.watch/` on the FTP server (SSH:
`ssh parole-watch-server` → `/home/jshomoek/parole.watch/`). The front-end
build lives there at the root (`index.html`, `assets/`, `favicon.svg`). The Django repo
sits **outside** the docroot at `/home/jshomoek/parole.watch.api`; the API is mounted at
`/api` only via the CloudLinux Passenger config in `api/.htaccess`
(`PassengerBaseURI "/api"`, `PassengerAppRoot "/home/jshomoek/parole.watch.api"`) — never
edit or delete that file.

The docroot `api/` directory is the **Passenger mount point** for the API. It contains
**only** the generated `.htaccess` (no app code — the Django code lives outside the
docroot), so it is not part of the front-end build. It must **never** be deleted, renamed
(e.g. to `api_OLD/` — that breaks `/api` with LiteSpeed 404s), or overwritten during a
deploy. Deploys must **not** `rsync --delete` against the docroot; if any sync tool is
used, explicitly exclude `api/`, `cgi-bin/`, and `.well-known/`.

Upload the build to the docroot **root**; the docroot `.htaccess`
SPA rewrite must keep the `favicon.*` exclusion (see deploy doc) so `/favicon.ico` 404s
instead of returning `index.html`; otherwise Chrome shows a generic globe icon on
cold/incognito loads instead of `/favicon.svg`.
