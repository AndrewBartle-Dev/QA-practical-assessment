# RWA-142 · Technical Criteria for Test Creation

## Tooling Choice

**Primary tool:** Playwright with TypeScript — reliable built-in waiting, network inspection alongside UI actions, screenshots/traces/HTML reporting, and cross-browser support if needed later.

The suite is UI-first, per the assignment's required deliverable, not a separate coded API-test layer. *API Endpoints and Contracts* below documents where that layer would add value even though it wasn't built out this pass.

---

## Selectors and Test IDs

Tests use the app's existing `data-test` attributes, verified directly against the component source rather than guessed.

| Flow | Element | Selector | Status |
|---|---|---|---|
| Sign-in | Username / password input | `signin-username` / `signin-password` | Present, but on the `TextField` wrapper `<div>`, not the `<input>` — see *Defects* below |
| Sign-in | Remember me / submit / error | `signin-remember-me` / `signin-submit` / `signin-error` | Verified |
| Navigation | New transaction / notifications | `nav-top-new-transaction` / `nav-top-notifications-link` / `nav-top-notifications-count` | Verified |
| New transaction — step 1 | Contact search / list / row | `user-list-search-input` / `users-list` / `user-list-item-{userId}` | Verified — dynamic id, matched by visible name |
| New transaction — step 2 | Amount / note input | `transaction-create-amount-input` / `transaction-create-description-input` | Present, same wrapper-div issue |
| New transaction — step 2 | Pay / Request buttons | `transaction-create-submit-payment` / `transaction-create-submit-request` | Verified |
| New transaction — step 3 | Return to feed / create another | `new-transaction-return-to-transactions` / `new-transaction-create-another-transaction` | Verified |
| New transaction — step 3 | Payment confirmation | *(none)* | **Missing — propose adding** |
| New transaction — step 2 | Selected contact indicator | *(none)* | **Missing — propose adding** |
| Feed | List / tabs / row | `transaction-list`, `nav-personal-tab`, `nav-public-tab`, `nav-contacts-tab`, `transaction-item-{transactionId}` | Verified |

**Defects found:**

- **Missing entirely** — propose `data-test="transaction-create-confirmation"` on the `Typography` in `TransactionCreateStepThree.tsx` ("Paid $X for Y"; currently a text-pattern fallback locator), and `data-test="transaction-selected-contact"` on the receiver name in `TransactionCreateStepTwo.tsx`.
- **Present, wrong element** — `SignInForm.tsx` and `TransactionCreateStepTwo.tsx` pass `data-test` directly to MUI's `<TextField>`, which lands it on the wrapper `<div>`, not the `<input>`. `UserListSearchForm.tsx` already shows the right pattern in this codebase (`inputProps={{ "data-test": "..." }}`). Same defect also exists, unexercised, in `BankAccountForm.tsx`. Suite works around it today with `.locator("input")`.

Dynamic ids (`user-list-item-{userId}`, `transaction-item-{transactionId}`) are matched by stable visible content, not by id.

---

## API Endpoints and Contracts

Confirmed directly against `backend/*.ts`, not assumed.

- **`POST /login`** (`backend/auth.ts`) — session-cookie auth (`express-session` + `passport-local`, sets `connect.sid`), not JWT. Assert: success status, `user.username` matches, cookie set; invalid credentials → failure status, no session. A storageState-caching shortcut here was tried and reverted — see *Test Data Strategy*.
- **`POST /transactions`** (`backend/transaction-routes.ts`) — request `{ receiverId, description, amount, transactionType }`, response wraps the created `transaction`. `validators.ts`'s `isTransactionPayloadValidator` only checks `isNumeric()` on amount — no positivity check, same gap confirmed on the client (see `bug-report.md`), visible again here: `amount: -25` would very likely get a 200.
- **`GET /users`** (`backend/user-routes.ts`) — powers contact search, returns `{ results: User[] }`. Assert the expected user is present.
- **`GET /bankAccounts`, `POST /bankAccounts`** (`backend/bankaccount-routes.ts`) — relevant to the story's bank-account precondition, not automated this pass; a global onboarding modal blocks bank-account-less users with no skip option, but whether it reliably blocks every path needs manual confirmation before it's worth a test.
- **`GET /notifications`** (`backend/notification-routes.ts`) — relevant to AC2, not in this pass's scope; the endpoint to assert against rather than the notification badge.

**UI vs. API:** sign-in, contact selection, confirmation, and feed appearance are all verified at the UI layer in the current suite, with the corresponding API response noted above as the stronger check if extended. Amount validation is the one case where the UI check (Pay button state) can't tell you whether the gap is a display issue or the backend has no floor — `POST /transactions`'s contract shows it's the latter, which is why the confirmed defect is filed as a bug rather than a UI nuance.

---

## Test Data Strategy

`global-setup.ts` runs `yarn db:seed:dev` once before the suite starts (deterministic copy of `data/database-seed.json`, not the random-data generator), so every run starts from the same known users. Credentials live in `e2e/.env` (`E2E_USERNAME`/`E2E_PASSWORD`), committed intentionally — public seeded demo values, consistent with this repo's own convention.

Every test signs in through the real UI rather than a cached session: `authMachine.ts` always boots as `unauthorized` on a fresh page load, and the only transition to `authorized` is actually submitting the login form — nothing rehydrates from an existing `connect.sid` cookie on mount, so a cached-session shortcut (tried, reverted) doesn't work for this app.

Case data (`invalid-amount-cases.json`, `recipient.json`, `happy-path.json`) lives as plain JSON in `e2e/data/`, imported directly wherever needed. Cross-test contamination is avoided by giving each created transaction a unique, timestamped note (matched by that text, not feed position or run order) rather than assuming a pristine database per test — the database itself is reset once per suite run, not per test.

---

## Reliability and Flake Prevention

- **Waits** — assertions wait on rendered state (`expect(...).toBeVisible()`) rather than fixed timeouts, relying on Playwright's auto-waiting. The amount field formats based on real keystrokes (`react-number-format`), so `fillAmount()` uses `pressSequentially`, not `fill`.
- **Environment setup** — the database is reset to a known seeded state once per suite run, before any tests start.
- **Shared state** — each test uses unique, timestamped data (e.g. transaction notes), so tests don't depend on run order or leftover data from previous runs.
