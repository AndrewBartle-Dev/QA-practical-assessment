# e2e — End-to-end automated tests

Playwright + TypeScript. Page Object Model, data-driven cases, screenshots captured at each step.

## Install

From the project root:

```bash
yarn install               # installs @playwright/test along with everything else
npx playwright install chromium
```

That's the only extra tool needed — nothing else to configure.

## Run

Start the app first, in one terminal:

```bash
yarn dev      # frontend http://localhost:3000, API http://localhost:3001
```

Then, in another terminal:

```bash
yarn test:e2e            # headless
yarn test:e2e:headed     # same suite, browser visible
```

`e2e/.env` already has the seeded test user's credentials committed (see `03-technical-criteria.md` for why that's safe here). `global-setup.ts` resets the database to its seeded state before the suite runs.

## Output

- Screenshots: `e2e/screenshots/`
- HTML report: `e2e/playwright-report/` (open with `npx playwright show-report e2e/playwright-report`)
