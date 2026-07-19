# RWA-142 · Send money to a contact

**Type:** Story  **Epic:** Transactions  **Priority:** High  **Story Points:** 5
**Components:** Web App, Transactions API  **Labels:** payments, p2p-transfer

## Story

**As a** logged-in user with a linked bank account
**I want** to send money to another user with an amount and a note
**So that** I can pay people back and the payment shows up in our transaction history and notifications.

## Description

From the home screen, a user starts a new transaction, searches for a contact, enters a payment amount and an optional note, and confirms with **Pay**. The transaction is created as a _payment_, the sender's and receiver's balances reflect the transfer, the receiver gets a notification, and the transaction appears in the relevant activity feeds (Mine, Friends, and — if public — Everyone). This story covers the **Pay** path only; "Request money" is tracked separately (RWA-143).

## Preconditions

- User is authenticated.
- User has at least one bank account linked (onboarding complete).
- At least one other user exists to receive the payment.

## Acceptance Criteria

### AC1 — Happy path: send a payment

```gherkin
Given I am logged in and have a linked bank account
And I am on the home screen
When I click "New"
And I search for and select a contact
And I enter a valid amount of "$25.00"
And I enter the note "Lunch yesterday"
And I click "Pay"
Then I see a confirmation screen for the completed payment
And the transaction appears at the top of my "Mine" feed
And the note "Lunch yesterday" and amount "$25.00" are displayed on the transaction
```

### AC2 — Receiver is notified and sees the transaction

```gherkin
Given I have sent a payment of "$25.00" to another user
When the receiver logs in
Then the receiver has a new notification for the received payment
And the transaction appears in the receiver's "Mine" feed
And the amount is shown as a credit (incoming) for the receiver
```

### AC3 — Amount validation

```gherkin
Given I am on the payment amount step
When I enter "0", a negative value, or leave the amount empty
Then the "Pay" button is disabled
And I cannot proceed until a valid positive amount is entered
```

### AC4 — Contact is required

```gherkin
Given I have started a new transaction
When I have not selected a contact
Then I cannot reach the amount/note step
```

### AC5 — Note is optional

```gherkin
Given I have selected a contact and entered a valid amount
When I leave the note field empty
And I click "Pay"
Then the payment completes successfully with no note
```

### AC6 — Feed privacy

```gherkin
Given a payment between two users has completed
When a third, unrelated user views the "Everyone" (public) feed
Then they see the transaction without the exact amount exposed per privacy rules
And the payment is not shown in the third user's "Mine" or "Friends" feed
```

## Out of scope

- Requesting money (RWA-143)
- Splitting a payment across multiple users
- Editing or canceling a completed payment

## Definition of Done

- [ ] Code merged and deployed to staging
- [ ] AC1–AC6 verified
- [ ] Automated coverage added (UI happy path + API contract for `POST /transactions`)
- [ ] No regression in transaction feeds or notifications
- [ ] Accessibility: amount/note inputs and Pay button are keyboard-navigable and labeled


## QA Annotations

### AC1 — Happy Path: Send a Payment

**Risk / Priority:** High — Core money movement workflow; prioritize.

**Test Type:** Automated UI, API, Contract

**Data Dependencies:**
- Authenticated sender
- Linked bank account
- Valid recipient
- Known starting account balance

**Observations:**
- The expected contents of the confirmation screen are not fully defined.
- Verify the `POST /transactions` request and response at the API layer rather than relying only on the UI.
- Stable test IDs are needed for the contact search result, amount input, note input, **Pay** button, confirmation state, and transaction row.

---

### AC2 — Receiver Is Notified and Sees the Transaction

**Risk / Priority:** High — Verifies transaction data across two users, balances, feeds, and notifications.

**Test Type:** Manual, Automated UI, API

**Data Dependencies:**
- Completed payment
- Receiver account
- Known receiver starting balance

**Observations:**
- The expected notification contents are not defined.
- Verify the receiver's balance and transaction record at the API layer rather than relying only on the UI.
- Stable test IDs are needed for the notification and incoming transaction row.

---

### AC3 — Amount Validation

**Risk / Priority:** High — Incorrect validation could allow invalid money movement; prioritize negative coverage.

**Test Type:** Automated UI, API

**Data Dependencies:**
- Authenticated sender
- Linked bank account
- Selected recipient

**Observations:**
- The phrase **"valid positive amount"** does not define the complete range of valid values.
- Verify the same validation rules at the API layer so they cannot be bypassed through direct requests.
- Stable test IDs are needed for the amount input and **Pay** button.

---

### AC4 — Contact Is Required

**Risk / Priority:** Medium — Prevents transactions from being created without a recipient.

**Test Type:** Automated UI

**Data Dependencies:**
- Authenticated sender
- Linked bank account
- No contact selected

**Observations:**
- The acceptance criterion is objective and testable as written.
- Stable test IDs are needed for the contact search results and the control used to continue to the amount step.

---

### AC5 — Note Is Optional

**Risk / Priority:** Low — Optional field behavior.

**Test Type:** Automated UI, API

**Data Dependencies:**
- Authenticated sender
- Selected recipient
- Valid payment amount
- Empty note

**Observations:**
- Verify at the API layer that the transaction is created without a note.
- Stable test IDs are needed for the note input and completed transaction row.

---

### AC6 — Feed Privacy

**Risk / Priority:** High — Privacy and unintended data exposure; prioritize.

**Test Type:** Manual, Automated UI, API

**Data Dependencies:**
- Completed public payment
- Sender and receiver
- Unrelated third user

**Observations:**
- The public visibility setup and referenced privacy rules are not defined.
- Verify at the API layer that the exact amount is not returned to an unrelated user rather than only confirming the UI hides it.
- Stable test IDs are needed for the feed tabs and transaction entries.
