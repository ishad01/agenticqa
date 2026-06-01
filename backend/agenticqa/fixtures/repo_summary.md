# Repository summary (mock)

## Top-level layout

```
web/
  src/
    pages/
      Login.tsx          # mounts <LoginForm mode="page" />
      Dashboard.tsx
    components/
      auth/
        LoginForm.tsx    # data-testid="login-*"
        ResetForm.tsx
    lib/
      api.ts             # fetch wrapper with cookie handling
      session.ts         # useSession hook
e2e/
  playwright.config.ts
  fixtures/
    seedUsers.ts         # qa.user@example.com / locked.user@example.com
  tests/
    auth/                # existing happy-path covered here; gaps below
api/
  src/
    routes/auth.py       # POST /api/auth/login etc.
    services/lockout.py
    services/rate_limit.py
```

## Existing Playwright coverage (auth)

- `e2e/tests/auth/login-happy.spec.ts` — login with valid credentials
- `e2e/tests/auth/logout.spec.ts` — logout clears session

## Gaps relevant to PROJ-123

- No tests for invalid-credentials inline error or password field clearing.
- No tests for account-locked state.
- No tests for client-side validation (empty fields).
- No tests for session persistence across reload.

## Helpful conventions

- All Playwright tests use `data-testid` selectors only.
- `e2e/fixtures/seedUsers.ts` is the source of truth for test accounts.
- Reset auth state between tests via `POST /api/test/reset-auth`.
