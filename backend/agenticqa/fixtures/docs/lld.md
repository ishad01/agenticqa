# Low-Level Design — Login Form & API

## Frontend — `<LoginForm />`

Route: `/login`. Header modal mounts the same component with `mode="modal"`.

### Selectors (stable, used by tests)

- `[data-testid="login-email"]` — email input
- `[data-testid="login-password"]` — password input
- `[data-testid="login-submit"]` — submit button (disabled while pending)
- `[data-testid="login-error"]` — inline error region (ARIA live)
- `[data-testid="login-spinner"]` — spinner shown during submit

### Validation

- Email — non-empty, matches `/.+@.+\..+/` (loose by design).
- Password — non-empty (no client-side length check; backend is source of truth).
- Inline errors appear on blur and on submit. Field-level errors clear on input.

### States

| State              | Behavior                                                   |
| ------------------ | ---------------------------------------------------------- |
| idle               | inputs enabled, submit enabled when fields non-empty       |
| submitting         | inputs disabled, spinner visible, submit disabled          |
| error              | inline error rendered, password field cleared, email kept  |
| success            | redirect to `/dashboard` via `router.push`                 |

## API — `POST /api/auth/login`

Request:

```json
{ "email": "user@example.com", "password": "..." }
```

Responses:

- `200 OK` — `Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax; Path=/`
- `401 Unauthorized` — `{ "error": "invalid_credentials" }` (generic; same for
  unknown-email and wrong-password to avoid enumeration)
- `423 Locked` — `{ "error": "account_locked", "retry_after": <epoch> }`
- `400 Bad Request` — `{ "error": "validation_failed", "fields": {...} }`
- `429 Too Many Requests` — IP-level rate limit; `Retry-After` header set

## Test environment

- `npm run dev:e2e` boots the stack against the in-memory user store.
- Seeded users:
  - `qa.user@example.com` / `Correct-Horse-Battery-Staple-1!` (good)
  - `locked.user@example.com` (locked, retry after far future)
- Reset attempt counts and lockouts via `POST /api/test/reset-auth` (e2e only).
