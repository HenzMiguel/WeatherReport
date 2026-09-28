# Validation — Administrative access

Technical validation completed on 2026-09-27.

- PASS: valid configured credentials return a signed `ADMIN` bearer token.
- PASS: `GET /admin/sessao` rejects requests without a token and accepts a valid administrator token.
- PASS: invalid credentials and tampered sessions return 401 without protected data.

Evidence: `backend/test/auth.test.js`.
