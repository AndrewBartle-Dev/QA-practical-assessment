# RWA-142 · Manual Test Script

## Test Classifications

- **Happy Path:** Verifies the primary user journey using valid inputs and expected system behavior.
- **Negative Path:** Verifies that the application prevents invalid actions or handles failure conditions correctly.
- **Validation:** Verifies field-level or form-level input rules.
- **Edge Case:** Verifies behavior under an unusual but realistic condition that may expose defects.
- **Accessibility:** Verifies that the workflow can be understood and completed by users with different access needs.
- **Usability / Visual Review:** Verifies clarity, presentation, and user confidence through human judgment.

## Automation Candidate Definitions

- **Yes:** The test is repeatable, has objective pass/fail criteria, and provides value when executed frequently.
- **Partial:** Objective checks can be automated, but human evaluation is still needed for aspects such as usability, focus visibility, readability, or presentation quality.
- **No:** Manual execution provides substantially more value than automation because the result primarily depends on human judgment.

---

## Test Environment and Data Setup

- Start the application using the repository instructions.
- Reset or seed the database before tests that modify balances or transaction history.
- Use two different seeded users:
  - **Sender:** User with a linked bank account
  - **Receiver:** Different valid user
- Record known starting balances when balance verification is required.
- Unless otherwise specified:
  - **Amount:** `$25.00`
  - **Note:** `Dinner reimbursement`

> Tests that create transactions should use a freshly seeded state or isolated users so previous tests do not affect the results.

---

## TC-142-01 · Send a Valid Payment

**Classification:** Happy Path  
**Priority:** High  
**Automation Candidate:** Yes — this is the primary end-to-end regression journey and should run frequently.

### Preconditions and Required Test Data

- Database is in a known seeded state.
- Sender and receiver are different users.
- Sender has a linked bank account.
- Sender credentials are valid.
- Amount: `$25.00`
- Note: `Dinner reimbursement`

### Steps and Expected Results

| Step | Action | Expected Result |
|---:|---|---|
| 1 | Open the application. | The sign-in page is displayed. |
| 2 | Sign in as the sender. | Sign-in succeeds and the transaction feed is displayed. |
| 3 | Select **New Transaction**. | The contact-selection screen is displayed. |
| 4 | Search for and select the receiver. | The receiver is selected and the payment form is displayed. |
| 5 | Enter `$25.00` as the amount. | The amount is accepted and displayed correctly. |
| 6 | Enter `Dinner reimbursement` as the note. | The note is accepted and displayed correctly. |
| 7 | Select **Pay**. | The payment is submitted and a success confirmation is displayed. |
| 8 | Navigate to the sender’s **Mine** feed. | The transaction appears with the correct receiver, amount, and note. |
| 9 | Sign out and sign in as the receiver. | Sign-in succeeds as the receiver. |
| 10 | Review the receiver’s transaction feed and notifications. | The received payment is visible and the receiver is notified. |

### Overall Expected Result

The payment is created once and is associated with the correct sender, receiver, amount, and note.

---

## TC-142-02 · Reject an Invalid Payment Amount

**Classification:** Negative Path / Validation  
**Priority:** High  
**Automation Candidate:** Yes — the rules are objective and should be protected against regression at both the UI and API layers.

### Preconditions and Required Test Data

- Sender is authenticated.
- Sender has a linked bank account.
- A valid receiver has been selected.
- Test each amount separately:
  - Empty value
  - `0`
  - `-25.00`

### Steps and Expected Results

| Step | Action | Expected Result |
|---:|---|---|
| 1 | Navigate to **New Transaction** and select the receiver. | The payment form is displayed. |
| 2 | Leave the amount empty. | The **Pay** button remains disabled and the payment cannot be submitted. |
| 3 | Enter `0` as the amount. | The amount is rejected and the **Pay** button remains disabled. |
| 4 | Enter `-25.00` as the amount. | The amount is rejected and the **Pay** button remains disabled. |
| 5 | Review the sender’s transaction feed. | No transaction has been created for any invalid value. |

### Overall Expected Result

Empty, zero, and negative amounts cannot be submitted, and no transaction is created.

---

## TC-142-03 · Require a Contact Before Entering Payment Details

**Classification:** Negative Path / Validation  
**Priority:** Medium  
**Automation Candidate:** Yes — this is an objective navigation and form-state rule that is inexpensive to automate.

### Preconditions and Required Test Data

- Sender is authenticated.
- Sender has a linked bank account.
- No receiver has been selected.

### Steps and Expected Results

| Step | Action | Expected Result |
|---:|---|---|
| 1 | Select **New Transaction**. | The contact-selection screen is displayed. |
| 2 | Do not select a contact. | No recipient is associated with the transaction. |
| 3 | Attempt to continue to the payment form. | The user cannot continue without selecting a contact. |
| 4 | Verify that the payment cannot be submitted. | No transaction is created without a receiver. |

### Overall Expected Result

The user must select a valid contact before entering or submitting payment details.

---

## TC-142-04 · Send a Payment Without an Optional Note

**Classification:** Validation  
**Priority:** Medium  
**Automation Candidate:** Yes — this protects the documented optional-field behavior and can be verified reliably.

### Preconditions and Required Test Data

- Database is in a known seeded state.
- Sender is authenticated.
- Sender has a linked bank account.
- A valid receiver has been selected.
- Amount: `$25.00`
- Note: Empty

### Steps and Expected Results

| Step | Action | Expected Result |
|---:|---|---|
| 1 | Enter `$25.00` as the amount. | The amount is accepted. |
| 2 | Leave the note field empty. | The form remains valid because the note is optional. |
| 3 | Select **Pay**. | The transaction is submitted successfully. |
| 4 | Review the confirmation and transaction feed. | The transaction appears without displaying `null`, `undefined`, or incorrect placeholder text. |

### Overall Expected Result

A valid payment can be completed without a note.

---

## TC-142-05 · Prevent Duplicate Payment Submission

**Classification:** Edge Case  
**Priority:** High  
**Automation Candidate:** Yes — automate by delaying or monitoring the transaction request and attempting repeated submission.

### Preconditions and Required Test Data

- Database is in a known seeded state.
- Sender is authenticated.
- Sender has a linked bank account.
- A valid receiver has been selected.
- Record the sender’s starting balance.
- Amount: `$25.00`
- Note: `Duplicate submission test`

### Steps and Expected Results

| Step | Action | Expected Result |
|---:|---|---|
| 1 | Enter the valid amount and note. | The payment form is valid and the **Pay** button is enabled. |
| 2 | Select **Pay** twice in rapid succession. | Only one submission is accepted. |
| 3 | Review the confirmation. | One successful transaction is confirmed. |
| 4 | Review the sender’s transaction feed. | Only one matching transaction appears. |
| 5 | Review the sender’s updated balance. | The balance reflects one `$25.00` payment, not two. |

### Overall Expected Result

Repeated interaction with the **Pay** button creates only one transaction and affects the balance only once.

---

## TC-142-06 · Complete the Payment Flow Using Only the Keyboard

**Classification:** Accessibility  
**Priority:** Medium  
**Automation Candidate:** Partial — automated checks can verify keyboard operation and focus movement, but manual execution is needed to evaluate focus visibility, logical navigation order, and overall usability.

### Preconditions and Required Test Data

- Sender begins on the sign-in page.
- Sender has a linked bank account.
- A valid receiver exists.
- Amount: `$25.00`
- Note: `Keyboard accessibility test`
- Do not use a mouse or touch input.

### Steps and Expected Results

| Step | Action | Expected Result |
|---:|---|---|
| 1 | Use `Tab` to navigate through the sign-in controls. | Focus moves logically and the focused control is visually identifiable. |
| 2 | Enter valid credentials and submit using the keyboard. | Sign-in succeeds without mouse input. |
| 3 | Navigate to **New Transaction** using the keyboard. | The control is reachable and can be activated using the keyboard. |
| 4 | Search for and select the receiver using only the keyboard. | The contact search and result are keyboard accessible. |
| 5 | Enter the amount and note. | The fields are reached in a logical order and accept input. |
| 6 | Navigate to and activate **Pay**. | The button is visibly focused and can be activated from the keyboard. |
| 7 | Review the confirmation screen. | Focus is not lost or trapped, and the result is understandable. |

### Overall Expected Result

The payment journey can be completed using only the keyboard with logical focus order, visible focus indicators, and no keyboard traps.

---

## TC-142-07 · Review Payment Confirmation Clarity

**Classification:** Usability / Visual Review  
**Priority:** Medium  
**Automation Candidate:** Partial — automation can verify that confirmation elements and transaction data are present, but manual review is needed to judge readability, visual hierarchy, and whether the user clearly understands that the payment succeeded.

### Preconditions and Required Test Data

- Sender is authenticated.
- Sender has a linked bank account.
- A valid receiver has been selected.
- Amount: `$25.00`
- Note: `Confirmation review`

### Steps and Expected Results

| Step | Action | Expected Result |
|---:|---|---|
| 1 | Complete a valid payment. | The confirmation screen is displayed. |
| 2 | Review the confirmation without referring to the previous screen. | It is immediately clear that the payment succeeded. |
| 3 | Review the recipient, amount, and note. | Important transaction details are readable and unambiguous. |
| 4 | Review the available next action. | The user can clearly identify how to return to the feed or continue. |
| 5 | Repeat the review at a smaller supported viewport. | Important information remains readable and is not clipped or overlapped. |

### Overall Expected Result

The confirmation clearly communicates success and presents the important payment details in a readable, understandable layout.