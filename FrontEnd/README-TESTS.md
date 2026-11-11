# FrontEnd testing notes

This project previously used a lightweight Node test runner for small component tests.

Recommendations:
- Add `vitest` + `@testing-library/react` for component/unit tests.
- Add `@playwright/test` for E2E tests and accessibility checks.

Run (example):
pnpm exec vitest run
