# High-Level Design — Authentication

## Overview

The authentication subsystem handles credential-based login, session management,
and password reset for the consumer product. It is the front door to every
authenticated experience and the most heavily tested surface area in the
platform.

## Components

- **Web UI (React)** — `/login`, `/reset-password`, header sign-in modal
- **Auth API (FastAPI)** — `POST /api/auth/login`, `POST /api/auth/logout`,
  `POST /api/auth/reset-request`, `POST /api/auth/reset-confirm`
- **Session store (Redis)** — opaque session IDs keyed by httpOnly cookie
- **User store (Postgres)** — `users(email, password_hash, status, locked_until)`
- **Rate limiter (Redis)** — per-email and per-IP buckets for login + reset

## Key flows

1. **Login** — UI POSTs `{email, password}` over HTTPS. API verifies via argon2id,
   issues opaque session ID, sets httpOnly + SameSite=Lax cookie, returns 200.
2. **Lockout** — 5 failed attempts in a rolling 15-minute window per email lock
   the account for 30 minutes; status moves to `locked` and `locked_until` is set.
3. **Session resume** — every subsequent request carries the cookie; API validates
   against Redis on hit, falls through to a signature check otherwise.

## Non-functional requirements

- Login p95 latency < 800 ms end-to-end.
- No account-existence enumeration via error messages or timing.
- All auth events emitted to the audit log (Kafka topic `auth.events`).
