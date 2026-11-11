# QA Testing Playbook

FastAPI Backend + ML Module + Next.js Frontend

This repository-scoped QA playbook captures strategy, functional and non-functional test plans, tooling, and runbooks. It is derived from the user's requested playbook and tailored to this codebase.

Contents
- Testing strategy overview
- Functional tests by layer
- Non-functional tests by layer
- Tooling recommendations
- AI prompt for automated assistance (see AI_PROMPT.txt)
- Report template (see REPORT_TEMPLATE.md)

See the companion files in the `QA/` folder for the AI prompt and report template.

Quick start (Day 1)
- Add `pytest`, `pytest-cov`, `httpx`, `pytest-asyncio` to BackEnd/requirements-dev.txt
- Add `Jest`/`@testing-library/react` and `@playwright/test` to FrontEnd dev dependencies
- Create one test per critical endpoint and wire CI

Change log
- 2026-05-05: Initial playbook added by automated assistant.
