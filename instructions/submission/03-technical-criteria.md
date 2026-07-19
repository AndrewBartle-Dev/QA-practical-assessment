# RWA-142 · Technical Criteria for Test Creation

## Tooling Choice

**Primary tool:** Playwright with TypeScript

Playwright is a good fit because it supports:

- Reliable browser automation with built-in waiting
- Network request inspection and direct API calls from the same test process
- Screenshots, traces, and HTML reporting
- Multiple isolated browser contexts (used here for storageState-based auth)
- Cross-browser execution if broader coverage is needed later

**Scope note:** the automated suite is UI-first, per the assignment's required deliverable (the login → send-money journey and its edge cases). It is not a separate coded API-test layer. The one place a raw API call is used in the test code itself is authentication setup — see *Test Data Strategy* below. The *API Endpoints and Contracts* section documents what's available at that layer and where it would add value, so the UI-vs-API judgment call is explicit even though a full API suite wasn't built in this pass.

---

## Selectors and Test IDs

Tests use the application's existing `data-test` attributes, verified directly against the component source rather than guessed. Two categories of gaps were found while building the suite; both are documented below with the exact fix.

### Verified Selectors In Use

| Flow | Element | Selector | Status |
|---|---|---|---|
| Sign-in | Username input | `signin-username` | Present, but on the `TextField` wrapper `<div>`, not the `<input>` — see *Selector Defects* below |
| Sign-in | Password input | `signin-password` | Same wrapper-div issue |
| Sign-in | Remember me | `signin-remember-me` | Verified |
| Sign-in | Submit button | `signin-submit` | Verified (MUI `Button` renders a real `<button>`) |
| Sign-in | Error banner | `signin-error` | Verified |
| Navigation | New transaction button | `nav-top-new-transaction` | Verified |
| Navigation | Notifications link / count | `nav-top-notifications-link` / `nav-top-notifications-count` | Verified, unused so far |
| New transaction — step 1 | Contact search input | `user-list-search-input` | Verified — correctly uses `inputProps`, lands on the real `<input>` |
| New transaction — step 1 | Contact list / row | `users-list` / `user-list-item-{userId}` | Verified — dynamic id, matched by visible name in tests, not by id |
| New transaction — step 2 | Amount input | `transaction-create-amount-input` | Present, wrapper-div issue |
| New transaction — step 2 | Note input | `transaction-create-description-input` | Present, wrapper-div issue (note: attribute is named "description", not "note") |
| New transaction — step 2 | Pay / Request buttons | `transaction-create-submit-payment` / `transaction-create-submit-request` | Verified |
| New transaction — step 3 | Return to feed / create another | `new-transaction-return-to-transactions` / `new-transaction-create-another-transaction` | Verified |
| New transaction — step 3 | Payment confirmation | *(none)* | **Missing entirely** — see below |
| New transaction — step 2 | Selected contact indicator | *(none)* | **Missing entirely** — see below |
| Feed | Feed list / tabs / row | `transaction-list`, `nav-personal-tab`, `nav-public-tab`, `nav-contacts-tab`, `transaction-item-{transactionId}` | Verified |

### Selector Defects Found During Implementation

**1. Missing entirely — propose adding:**

- `data-test="transaction-create-confirmation"` on the `Typography` in `TransactionCreateStepThree.tsx` that renders "Paid $X for Y". Currently there is no stable way to assert the confirmation screen; the test falls back to a text-pattern locator (`/Paid \$|Requested \$/`).
- `data-test="transaction-selected-contact"` on the receiver name `Typography` in `TransactionCreateStepTwo.tsx`. There is currently no way to confirm which contact was selected once past step one.

**2. Present, but on the wrong element** — `SignInForm.tsx` and `TransactionCreateStepTwo.tsx` both pass `data-test` directly to MUI's `<TextField>`, which places the attribute on the outer wrapper `<div>` rather than the actual `<input>`. `UserListSearchForm.tsx` shows the correct pattern already in this codebase — it sets the attribute via `inputProps={{ "data-test": "..." }}`, which lands on the real input.

Affected fields: `signin-username`, `signin-password` (`SignInForm.tsx`), `transaction-create-amount-input`, `transaction-create-description-input` (`TransactionCreateStepTwo.tsx`). The proposed fix is switching each to the `inputProps` pattern, matching `UserListSearchForm.tsx`. The test suite currently works around this with a nested `.locator("input")` rather than waiting on the app fix.

The same pattern (direct `data-test` on `TextField`, not yet exercised by any test) also exists in `BankAccountForm.tsx` (`bankaccount-bankName-input`, `bankaccount-routingNumber-input`, `bankaccount-accountNumber-input`) — flagged here since it's the same underlying defect class, in case that form gets automated later.

### Selector Guidelines

- Prefer `data-test` for interactive controls and important states; avoid CSS classes, nested DOM structure, position, or visible text alone.
- Where an id is dynamic (`user-list-item-{userId}`, `transaction-item-{transactionId}`), match on stable visible content (name, description) rather than assuming a known id, since the id isn't available until after the fact.

---

## API Endpoints and Contracts

Confirmed directly against `backend/*.ts`, not assumed. These are documented for the UI-vs-API judgment call the assignment asks for — not built as a separate automated API-test layer (see *Tooling Choice*).

### `POST /login` (`backend/auth.ts`)

```json
// request
{ "username": "Heath93", "password": "s3cret", "remember": false }
```
```json
// response
{ "user": { "id": "...", "username": "Heath93", "...": "..." } }
```

Session-cookie auth (`express-session` + `passport-local`, sets `connect.sid`) — not a JWT. This is the one endpoint the suite actually calls directly: `auth.fixture.ts` / `global-setup.ts` POST here to obtain a storageState and skip the UI login form for tests that aren't exercising sign-in itself. At the API layer you'd assert: success status, `user.username` matches, cookie is set; and for invalid credentials, a failure status with no session created.

### `POST /transactions` (`backend/transaction-routes.ts`)

```json
// request
{ "receiverId": "...", "description": "Dinner reimbursement", "amount": 25, "transactionType": "payment" }
```
```json
// response
{ "transaction": { "id": "...", "senderId": "...", "receiverId": "...", "amount": 25, "description": "...", "status": "..." } }
```

`validators.ts`'s `isTransactionPayloadValidator` only checks `body("amount").isNumeric()` — no positivity or non-zero check. This is the same amount-validation gap confirmed on the client (see `bug-report.md`), visible again at this layer: a request with `amount: -25` would very likely be accepted with a 200. That's the clearest example of "verify at the API layer, not just the UI" for this app — a UI-only check can't tell you whether the gap is a display/validation-timing issue or the backend genuinely has no floor, and this endpoint's contract shows it's the latter.

### `GET /users` (`backend/user-routes.ts`)

Powers the contact search/list on step one (confirmed in `src/machines/usersMachine.ts`). Returns `{ results: User[] }` scoped to the search query if one is provided. At the API layer you'd assert the expected user is present in `results`; nothing unusual otherwise.

### `GET /bankAccounts`, `POST /bankAccounts` (`backend/bankaccount-routes.ts`)

`GET /bankAccounts` returns `{ results: BankAccount[] }` for the authenticated user. Relevant to the no-linked-bank-account edge case: rather than inferring "no bank account" from the UI, this endpoint could confirm the precondition directly (empty `results` for a freshly signed-up user) before running the UI portion of that test.

### `GET /notifications` (`backend/notification-routes.ts`)

Returns `{ results: Notification[] }` (unread only). Relevant to AC2 (receiver is notified) — not in this pass's automated scope, but this is the endpoint you'd assert against rather than relying on the notification badge rendering correctly in the UI.

---

## UI Versus API Verification

| Behavior | UI verification | API verification |
|---|---|---|
| User can sign in | Yes | `POST /login` response + cookie |
| Invalid login error displayed | Yes | Failed status, no session |
| Contact can be selected | Yes | Correct `receiverId` submitted |
| Amount validation | Yes (Pay button state) | `POST /transactions` accepts/rejects the payload directly — this is where the real defect lives |
| Confirmation displayed | Yes | `transaction` object returned with matching amount/description |
| Transaction appears in feed | Yes | Exact transaction exists via `GET /transactions` |
| No linked bank account | Not currently blocked in the UI | `GET /bankAccounts` confirms the precondition |
| Receiver notification | Not in current scope | `GET /notifications` (documented, not automated this pass) |

---

## Test Data Strategy

### Seeded Baseline

`global-setup.ts` runs `yarn db:seed:dev` once before the suite starts, copying the committed `data/database-seed.json` into `data/database.json` — a deterministic copy, not the random-data `yarn db:seed` generator. Every run starts from the same known users. Credentials live in `e2e/.env` (`E2E_USERNAME`, `E2E_PASSWORD`), committed intentionally — these are public seeded demo values (password is `s3cret` for every seeded user, per the main README), consistent with this repo's own convention of committing `SEED_DEFAULT_USER_PASSWORD` in its root `.env`.

### Authenticated State Without Repeated Logins

`global-setup.ts` also authenticates once via `POST /login` and caches the resulting storageState to `e2e/.auth/` (gitignored — it's a live session artifact, not a credential). `auth.fixture.ts`'s `authenticatedPage` fixture reads that cache, falling back to a fresh login (and re-caching) only if the file is missing. Tests that need to exercise sign-in itself (`auth.spec.ts`) drive `LoginPage` directly instead of using this fixture — the happy-path test also always uses the real UI login, since that journey is the point of the assignment.

### Data-Driven Cases

Planned: `e2e/fixtures/test-data.ts` holding the parameterized case sets edge tests loop over — e.g. the invalid-amount set (`zero`, `negative`, `empty`) driving `send-money-validation.spec.ts` — plus the seeded users already in use (`TEST_USER`, the happy-path recipient), so both are defined once instead of being redeclared per spec file.

### Test Isolation

- Each created transaction uses a unique note containing a timestamp (e.g. `Happy path test payment 1737229200000`), so a test is located by that unique text rather than by feed position or run order.
- The "Mine" tab scopes feed assertions to the current sender rather than the full public feed.
- The no-linked-bank-account case uses a freshly signed-up user rather than depending on a specific seeded user staying accountless across runs.
- No test depends on another test's execution order or leftover data.

---

## Reliability and Flake Prevention

### Confirmed During Implementation

- **App startup order:** the suite assumes the app (`yarn dev`) is already running. Hit this directly — `global-setup.ts`'s login call failed with `ECONNREFUSED` when the backend hadn't finished starting yet. Today the mitigation is procedural (start the app, confirm both the frontend and the backend's own "Backend server running..." log line, then run the suite). A retry/readiness-check loop in `global-setup.ts` would harden this further if extended.
- **react-number-format keystrokes:** the amount field is wrapped in `react-number-format`, which formats based on real keystrokes. `fillAmount()` uses `pressSequentially`, not `fill`, to avoid inconsistent formatting.
- **Cached auth state:** using a cached storageState (see *Test Data Strategy*) instead of a fresh UI login per test reduces both run time and the surface area for auth-related flake.
- **Third-party avatar images:** every seeded user's avatar is a live URL from `api.dicebear.com`, not served locally. Nothing in the suite currently asserts on avatars, so this doesn't block today, but it's a live external dependency worth remembering before adding any visual assertions.

### Network Synchronization

Assertions wait on the expected rendered state (`expect(...).toBeVisible()`) rather than fixed timeouts, relying on Playwright's built-in auto-waiting/polling. A stronger form of this — explicitly awaiting the `POST /transactions` response alongside the Pay click — would couple the test more tightly to the network layer if flake is ever observed here.

### Loading and Disabled States

The Pay/Request buttons are disabled while the form is invalid (Formik `isValid`) — except for zero/negative amounts, which is the confirmed defect, not a test gap.

### Shared State

The database is reset once per suite run (`global-setup.ts`), not once per test — so tests stay independent through unique data (timestamped notes, fresh signups) rather than assuming a fully pristine database on every individual test.

### Feed Assertions

Transactions are matched by their unique description text, not by feed position. If the suite is extended to intercept the `POST /transactions` response directly, matching by the returned transaction id would be even more precise.

### Screenshots and Diagnostics

Named, ordered screenshots are captured at each meaningful step via `createStepCapture()` (`e2e/fixtures/screenshot.ts`), committed to `e2e/screenshots/`. Playwright's own `screenshot`/`trace` config settings are a separate, generic failure-capture safety net, not a substitute for these.

---

## Recommended Initial Automated Coverage

1. Happy-path login-to-payment journey — built and passing.
2. Sign-in edge cases: invalid credentials, empty username, short password.
3. Send-money validation (data-driven): zero, negative, and empty amount; no contact selected. Zero/negative are expected to fail against real behavior — that's the confirmed defect, kept red intentionally (see `bug-report.md`), not softened.
4. No-linked-bank-account edge case, using a freshly signed-up user.

**Deferred, would add with more time:** duplicate-submission (rapid double-click on Pay) and AC6's feed-privacy behavior (public feed hides exact amount) — both identified as valuable during story review, neither built in this pass given the time-box.
