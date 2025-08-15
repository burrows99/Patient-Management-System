# NHS MOA Triage System

A React-based NHS.UK-styled client with an OAuth 2.1 (OIDC) provider for authentication. This repo includes:

- `client/`: React app styled with NHS.UK frontend design system.
- `oauth-server/`: Local OIDC provider using `oidc-provider` (PKCE, refresh tokens, logout redirect).
- `docker-compose.yml`: One command to run client and OAuth server.


## Quick start

Prereqs: Docker Desktop (or Docker Engine) and Node 18+ if running locally.

- With Docker (recommended):
  - `docker compose up --build`
  - Open http://localhost:3000

- Client only (local):
  - `cd client && npm ci && npm start`
  - Open http://localhost:3000 (make sure OAuth server is running at 4000)

- OAuth server only (local):
  - `cd oauth-server && npm ci && npm start`
  - OIDC issuer at http://localhost:4000


## Architecture

- `client/src/components/` implements SOLID:
  - `Header.jsx`: NHS header + logo
  - `Layout.jsx`: Wrapper for NHS.UK page structure and main spacing
  - `Footer.jsx`: NHS.UK footer with support links
- `client/src/App.js` composes the above and mounts auth-related UI and callbacks.
- `client/src/index.js` imports `nhsuk-frontend/dist/nhsuk.css`.
- `oauth-server/index.js` configures an OIDC provider with:
  - `authorization_code` + `refresh_token`
  - PKCE S256 required
  - `post_logout_redirect_uris` to return users to the client after sign-out


## Environment & config

- Client env (via `.env` or docker compose):
  - `REACT_APP_OAUTH_BASE_URL=http://localhost:4000`
  - `REACT_APP_OAUTH_CLIENT_ID=9c7c344a-51e3-41c0-a655-a3467f2aca57`
  - `REACT_APP_REDIRECT_URI=http://localhost:3000/callback`
  - `REACT_APP_SCOPES=openid profile offline_access`

- OAuth server client config (in `oauth-server/index.js`):
  - `redirect_uris: ["http://localhost:3000/callback"]`
  - `post_logout_redirect_uris: ["http://localhost:3000/"]`


## Development workflow

- Start everything: `docker compose up --build`
- Iterate on client: hot reload at http://localhost:3000
- Iterate on OAuth server: nodemon-style restart if configured; otherwise re-run container


## UI, layout, and accessibility

This project follows the NHS.UK Design System for accessibility and consistency.

- Styles are imported from `nhsuk-frontend/dist/nhsuk.css`
- Body has `nhsuk-template__body` class for template spacing
- `Layout.jsx` applies `nhsuk-main-wrapper nhsuk-main-wrapper--auto-spacing` and `nhsuk-width-container`
- Footer uses the recommended structure (`nhsuk-footer`, `nhsuk-footer__meta`, and `nhsuk-footer__list--three-columns`) so links render left-to-right on desktop and stack on mobile

Reference: NHS Design System components
- https://service-manual.nhs.uk/design-system/components/


## Common issues & fixes

- Webpack "Can't resolve 'nhsuk-frontend/dist/nhsuk.css'" inside Docker:
  - Ensure the client service does NOT mount `/app/node_modules` as a bind mount (it hides installed deps). This compose file already removes it.

- Logout does not redirect to client home:
  - Confirm `post_logout_redirect_uris` is set in `oauth-server/index.js` and that the client calls `signoutRedirect({ post_logout_redirect_uri: window.location.origin })`.

- Footer items stack vertically:
  - Ensure correct NHS.UK footer structure and React `className` attributes, and include `nhsuk-footer__list--three-columns`.


## Scripts

- Client: `npm start`, `npm run build`, `npm test`
- OAuth Server: `npm start`


## Data integrations (future work)

- Explore ingesting NHS England aggregate datasets (RTT, diagnostics, A&E) and/or proxy NHS Scotland open data for real-time wait times.
- Use public FHIR test servers (e.g., SMART Health IT, HAPI) or Synthea for synthetic patient records.


## License

This project may integrate NHS.UK assets subject to their terms. See NHS.UK licensing guidance.
