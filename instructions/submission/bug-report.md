# BUG: [RWA-142 · AC3] Amount validation accepts zero and negative values

**Severity:** Critical
**Priority:** P1
**Affected story / AC:** RWA-142 · AC3
**Environment:** local — commit `6c87ced3`, Chromium 149.0.7827.55 (Playwright 1.61.1, Chrome for Testing), Node ^22.0.0

## Steps to reproduce

1. Sign in as a seeded user with a linked bank account (`Heath93`).
2. Select **New Transaction** and choose a valid receiver (`Arvilla_Hegmann`).
3. Enter `0` as the amount and any note.
4. Observe the **Pay** button, then repeat with `-25` as the amount.

## Expected result

Per AC3: "When I enter '0', a negative value, or leave the amount empty, then the 'Pay' button is disabled and I cannot proceed until a valid positive amount is entered." The **Pay** button should be disabled for both `0` and `-25`.

## Actual result

The **Pay** button is **enabled** for both `0` and `-25`. Only an empty amount correctly disables it.

## Evidence

- Screenshots: `e2e/screenshots/send-money-validation/ac3-zero-amount/`, `e2e/screenshots/send-money-validation/ac3-negative-amount/`
- Failing tests: `AC3: rejects amount - zero amount`, `AC3: rejects amount - negative amount` (`e2e/tests/send-money-validation.spec.ts`)

## Impact / notes

This is a payments app — an incorrectly-handled amount is a money-movement integrity issue, not a cosmetic one. A `0` amount creates a no-op transaction that still clutters the ledger and the receiver's notifications. A negative amount is the more serious case: nothing in the stack stops it from reaching the API, since the gap isn't UI-only.

Likely root cause: `src/components/TransactionCreateStepTwo.tsx:34-39` — the yup schema only has `amount: number().required(...)`, with no `.positive()`/`.moreThan(0)` check, and the `NumberFormat` input at line 63 sets `allowNegative={true}`. `backend/validators.ts:85` — `body("amount").isNumeric().trim().toInt()` — has the same gap server-side, so a direct API call (bypassing the UI entirely) would also be accepted. This test stopped short of actually submitting a negative-amount payment (to avoid writing bad data into the seeded DB), so whether a submitted negative amount corrupts balance calculations downstream is a reasonable follow-up check, not yet confirmed — but the missing check exists at both layers, which is what pushes this to Critical/P1 rather than a UI-only fix.

---

# BUG: [RWA-142 · AC5] Payment cannot be submitted without a note

**Severity:** Medium
**Priority:** P3
**Affected story / AC:** RWA-142 · AC5
**Environment:** local — commit `6c87ced3`, Chromium 149.0.7827.55 (Playwright 1.61.1, Chrome for Testing), Node ^22.0.0

## Steps to reproduce

1. Sign in as a seeded user with a linked bank account (`Heath93`).
2. Select **New Transaction** and choose a valid receiver (`Arvilla_Hegmann`).
3. Enter a valid amount (e.g. `25`).
4. Leave the note field empty.
5. Observe the **Pay** button.

## Expected result

Per AC5: "Given I have selected a contact and entered a valid amount, when I leave the note field empty and I click 'Pay', then the payment completes successfully with no note." The **Pay** button should be enabled with no note entered.

## Actual result

The **Pay** button stays **disabled** with an empty note — the payment cannot be submitted at all.

## Evidence

- Screenshot: `e2e/screenshots/send-money-validation/ac5-empty-note/`
- Failing test: `AC5: allows Pay with an empty note` (`e2e/tests/send-money-validation.spec.ts`)

## Impact / notes

No money-integrity risk here — this fully blocks a documented, legitimate use case (sending a payment with no note) rather than corrupting data, so it doesn't carry the same severity as the amount defect above.

Root cause: `src/components/TransactionCreateStepTwo.tsx:36` — `description: string().required("Please enter a note")` in the yup schema. Since **Pay** is disabled whenever `!isValid`, an empty note alone blocks submission. Notably, `backend/validators.ts:84` — `body("description").isString().trim()` — has no required/non-empty check, so the backend already matches AC5's expected behavior; this is a frontend-only fix (loosen the schema to `description: string()`).

---

# BUG: [RWA-142 · Definition of Done — Accessibility] Contact list is not keyboard accessible

**Severity:** High
**Priority:** P2
**Affected story / AC:** RWA-142 · Definition of Done ("Accessibility: amount/note inputs and Pay button are keyboard-navigable and labeled"). Not tied to a numbered AC — none of AC1–AC6 mention keyboard access — but the DoD's accessibility intent clearly extends to the contact-selection step, since it's part of the same required journey.
**Environment:** local — commit `6c87ced3`, Chromium 149.0.7827.55 (Playwright 1.61.1, Chrome for Testing), Node ^22.0.0

## Steps to reproduce

1. Using only the keyboard, sign in (Tab + Enter).
2. Navigate to **New Transaction** using the keyboard.
3. Type a search query into the contact search field, then try to Tab to a result row and press Enter to select it.

Found manually while executing **TC-142-06 · Complete the Payment Flow Using Only the Keyboard** (`instructions/submission/02-manual-test-script.md`) — fails at step 4.

## Expected result

Per TC-142-06, step 4: "The contact search and result are keyboard accessible."

## Actual result

Search results cannot be reached at all via Tab, and there is no key handler to select one — the flow is a dead end without a mouse. This blocks the entire payment journey for a keyboard-only or assistive-tech user, not just this one step.

## Evidence

Reproduced manually via TC-142-06; no automated test or screenshot exists for this yet (not part of the current automated scope — see `03-technical-criteria.md`).

## Impact / notes

This is a payments app; a user who can't complete a core money-movement journey without a mouse is a meaningful accessibility gap, not a cosmetic one — hence High/P2 rather than Low, even though it's not a money-integrity issue like BUG-142-01.

Root cause: `src/components/UserListItem.tsx:14` — each result renders as a plain MUI `ListItem` with only an `onClick` handler:

```tsx
<ListItem data-test={`user-list-item-${user.id}`} onClick={() => setReceiver(user)}>
```

`ListItem` alone renders a plain `<li>` — no `tabIndex`, no keyboard event handling, and nothing in the tab order. Suggested fix: swap to MUI's `ListItemButton` (gives real button semantics — focusable and Enter/Space-activatable for free), or at minimum add `tabIndex={0}` and an `onKeyDown` handler for Enter/Space alongside the existing `onClick`.

---

# BUG: [RWA-142 · Manual/Visual] Top nav "New" button and notifications overlap at narrow viewports

**Severity:** Medium
**Priority:** P3
**Affected story / AC:** RWA-142 · not tied to a numbered AC — found reviewing at a smaller viewport per TC-142-07. The defective component (`NavBar.tsx`) is shared/global, rendered on every page, not specific to one AC.
**Environment:** local — commit `6c87ced3`, Chromium 149.0.7827.55 (Playwright 1.61.1, Chrome for Testing), Node ^22.0.0

## Steps to reproduce

1. Sign in.
2. Narrow the browser window to roughly phone width — below MUI's `xs` breakpoint (600px).
3. Observe the top nav bar: hamburger icon, logo, **New** button, notification bell.

## Expected result

Per TC-142-07's smaller-viewport check (`02-manual-test-script.md`): important information and controls remain readable and are not clipped or overlapped at a smaller supported viewport.

## Actual result

The **New** button and the notification bell/badge overlap once the window narrows below ~600px — nothing wraps, shrinks, or collapses to make room.

## Evidence

Reproduced manually while reviewing at a narrow viewport per TC-142-07; no automated test or committed screenshot for this (not part of the current automated scope).

## Impact / notes

Root cause: the `Toolbar` in `NavBar.tsx` is a flex row with no `flexWrap`. Its only responsive handling (`useMediaQuery(theme.breakpoints.only("xs"))`, line 124) swaps the full logo for a smaller icon logo at the `xs` breakpoint — it does nothing for the **New** button or the notification icon, which have no responsive handling at all. Once combined width exceeds the toolbar's, they collide instead of wrapping or collapsing. Suggested fix: collapse **New** to icon-only at the `xs` breakpoint (same pattern already used for the logo), or add `flexWrap: "wrap"` to the toolbar.
