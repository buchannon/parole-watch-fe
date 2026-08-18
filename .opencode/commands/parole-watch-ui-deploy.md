# Deploy: Parole Watch UI

**Manual only — the agent must never run these steps.**

The server has no Node runtime; the UI is a static build served from the Namecheap
`public_html/` directory on `parole-watch.jshowers.com`, next to the Passenger/Django
app (`parole-watch-api`).

## 1. Build locally

```bash
npm run build
```

Produces `dist/` (`index.html`, `assets/`, `favicon.svg`).

## 2. Upload to Namecheap

- Via FTP or cPanel File Manager, upload the **contents of `dist/`** (not the `dist/`
  folder itself) into the account home's `public_html/`.
- Do **not** overwrite the Django/Passenger files already in `public_html/`
  (`passenger_wsgi.py`, the API subdirectory, existing `.htaccess` Passenger
  directives).

## 3. SPA history routing: root `.htaccess`

Create or merge the following into `public_html/.htaccess`, preserving any existing
Passenger/rewrite rules:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On

    # Never rewrite existing files or directories
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # Rewrite every non-/api request to index.html for SPA history routing
    RewriteRule !^api index.html [L]
</IfModule>
```

Why this works:

- `/api/*` paths do **not** match `!^api`, so they keep routing to the Passenger/Django
  app untouched (API endpoints + auth cookies).
- Every other non-file request (e.g. `/offenders`, `/login`, `/offenders/<id>`) is
  rewritten to `index.html`, letting react-router's BrowserRouter (history API) take over.
- `index.html` must sit at the `public_html/` root so the relative `index.html` target
  resolves.

## 4. Verify

- `https://parole-watch.jshowers.com/offenders` loads the SPA (route falls back to
  `index.html`; hard-refresh a deep route like `/offenders/<id>` works too).
- Log in, then add/edit/delete an offender and a subscriber; confirm status badges and
  the status-history timeline render.
- `https://parole-watch.jshowers.com/api/auth/me/` still returns the Django API response
  (proves `/api` routing is untouched).
