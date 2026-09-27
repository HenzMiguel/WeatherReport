# Administrative panel — Access

- Provide an administrative login endpoint at `POST /auth/login`.
- Administrators are listed in the untracked `admins.txt` file, one `email:password` pair per line. The signing secret is configured through `AUTH_SECRET`; neither passwords nor the secret are committed.
- Issue a one-hour, signed JWT carrying only the `ADMIN` role after valid credentials.
- Restrict administrative endpoints server-side. Missing, malformed, tampered, expired, or non-admin tokens return the standard 401 error and never expose protected content.
- Expose `GET /admin/sessao` only to a validated administrator so a client can verify a session before rendering protected content.
