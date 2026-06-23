# e2e — End-to-end automated tests

Put your automated end-to-end tests in this folder.

## Tooling

**Your choice.** Use whatever you're most effective with — Playwright, Cypress, Selenium, WebdriverIO, a hybrid UI + API approach, etc. Nothing is pre-installed; add your tool and its config as part of your submission.

## Running the app under test

```bash
nvm use
yarn install
yarn dev      # frontend http://localhost:3000, API http://localhost:3001
```

Seeded users log in with password `s3cret` (run `yarn list:dev:users` for usernames). Reset data with `yarn db:seed:dev`.

## Wiring up the test command

Point the `test:e2e` script in `package.json` at your runner so the suite runs with:

```bash
yarn test:e2e
```

It currently fails with a placeholder message until you configure it. Add any extra setup (install, browser download, starting the app) to a short README here.

## What to cover

See the main `README.md` (section 5). In short:

1. **Happy path first** — full journey from login to sending money, asserting the payment succeeds.
2. **Then edge / failure paths** — invalid login, validation errors, invalid amounts, missing contact/bank account, etc.

Capture a **screenshot at each meaningful step** (commit them, e.g. into `e2e/screenshots/`) as visual evidence of the run.

Keep tests deterministic and independently runnable.
