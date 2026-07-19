# RWA-142 · Story Feedback

## Ambiguities & Gaps

The overall payment flow is clear, but several business rules referenced by the Story, Description, and Acceptance Criteria should be clarified before implementation.

### Payment Amount Rules *(AC1, AC3)*

AC1 uses **$25.00** as an example of a valid amount, while AC3 defines invalid values as `0`, negative, or empty and requires a **valid positive amount**.

The story does not define:

- Minimum payment amount
- Maximum payment amount
- Allowed decimal precision
- Whether an amount greater than the sender's available balance is valid

---

### Funding Source *(Story, Description, Preconditions)*

The Story and Preconditions require a linked bank account, while the Description states that both users' balances reflect the transfer.

It is unclear whether payments are funded directly from the linked bank account or from an application balance.

---

### Balance Updates *(Description, AC1, AC2)*

The Description states that the sender's and receiver's balances reflect the transfer, but neither AC1 nor AC2 verifies those balance updates.

If balance changes are part of the expected behavior, they should also be included in the acceptance criteria.

---

### Duplicate Payment Protection *(AC1)*

AC1 defines the successful payment flow but does not specify how duplicate submissions should be handled.

For example:

- Double-clicking **Pay**
- Clicking **Pay** multiple times while the transaction is processing
- Retrying after a timeout

Since this is a payment workflow, expected behavior should be defined.

---

### Public Transaction Visibility *(Description, AC6)*

The Description states that a transaction appears in the **Everyone** feed **"if public,"** but the story never explains:

- How a payment becomes public
- Whether public is the default
- Whether the user chooses the visibility during payment

Without this information, the setup required for AC6 is unclear.

---

### Privacy Rules *(AC6)*

AC6 states that unrelated users should see the transaction:

> "without the exact amount exposed per privacy rules."

The privacy rules referenced here are never defined, making it unclear exactly what information should be visible in the public feed.

---

### Receiver Notification *(Description, AC2)*

The Description states that the receiver gets a notification, and AC2 verifies that a new notification exists.

The story does not define what information the notification should contain or how it should identify the completed payment.

---

### Recipient Eligibility *(Story, Preconditions, AC1)*

The Story says payments are sent to **another user**, but it does not explicitly define whether users should be prevented from sending payments to themselves.

---

## Untestable or Weak Acceptance Criteria

### AC1 — Happy Path *(Weak)*

#### Why it's weak

The acceptance criterion requires the user to see a **"confirmation screen for the completed payment,"** but it does not define what information must be displayed. Different implementations could satisfy this requirement while presenting different levels of detail.

#### Suggested rewrite

```text
Then I see a payment confirmation displaying:
- Recipient name
- Payment amount ($25.00)
- Note (Lunch yesterday)
- Payment status (Completed)
```

---

### AC2 — Receiver is Notified *(Weak)*

#### Why it's weak

The acceptance criterion verifies that the receiver has a new notification, but it does not define what makes that notification correct. It also omits verification of the receiver's updated balance, even though the Story Description states that balances reflect the transfer.

#### Suggested rewrite

```text
Then the receiver has a new notification identifying the sender and the completed payment
And the transaction appears in the receiver's Mine feed
And the amount is displayed as an incoming credit of $25.00
And the receiver's balance has increased by $25.00
```

---

### AC3 — Amount Validation *(Weak)*

#### Why it's weak

The acceptance criterion clearly defines the expected behavior for `0`, negative, and empty values. However, it refers to a **"valid positive amount"** without defining what constitutes a valid amount beyond being greater than zero.

#### Suggested rewrite

```text
Then the Pay button is disabled until the entered amount meets the application's defined payment validation rules (minimum amount, maximum amount, available funds, and supported precision).
```

---

### AC6 — Feed Privacy *(Untestable)*

#### Why it's untestable

The acceptance criterion requires the transaction to be shown:

> "without the exact amount exposed per privacy rules"

Those privacy rules are never defined anywhere in the story.

Without knowing which fields should or should not be visible, QA cannot objectively determine whether the acceptance criterion passes or fails.

#### Suggested rewrite

```text
Given a completed payment whose visibility is Public
When an unrelated user views the Everyone feed
Then the transaction displays only the fields permitted by the application's public privacy rules
And the exact payment amount is not displayed
And the transaction does not appear in the user's Mine or Friends feeds
```

---

## Missing Scenarios

The story does not address several scenarios that would improve confidence in the payment flow.

- Payment amount exceeds available balance *(AC3)*
- Duplicate payment submission *(AC1)*
- Transaction request fails or times out *(Description, Definition of Done)*
- Sender's balance decreases correctly *(Description)*
- Receiver's balance increases correctly *(Description)*
- Self-payment attempt *(Story, AC1)*
- No matching contact found *(AC1)*
- Transaction marked as private (not visible in Everyone feed) *(Description, AC6)*
- Keyboard-only completion of the payment flow *(Definition of Done)*

---

## Questions for Product / Design / Engineering

### Payment Rules *(AC1, AC3)*

1. What are the minimum and maximum supported payment amounts?
2. Should payments greater than the sender's available balance be allowed?

### Funding & Balances *(Story, Description)*

3. Is the payment funded directly from the linked bank account or an application balance?
4. Should AC1 and AC2 explicitly verify the sender's and receiver's updated balances?

### Transaction Processing *(AC1)*

5. How should duplicate payment submissions be prevented?
6. What should happen if `POST /transactions` fails or times out?

### Privacy *(Description, AC6)*

7. How is a payment marked as public?
8. Which transaction details should be visible in the **Everyone** feed?

### Notifications *(Description, AC2)*

9. What information should the receiver's notification contain?

### Recipient Rules *(Story, AC1)*

10. Should users be allowed to send payments to themselves?

---

## Recommendation

The story is close to being ready for development, but a few business rules should be clarified first.

The primary payment flow is well defined, and most acceptance criteria are objective and testable. However, several behaviors referenced by the Story Description—such as balance updates, payment visibility, notification details, duplicate submission handling, and the complete rules for valid payment amounts—should be clarified before implementation. Addressing these items will reduce implementation assumptions and provide a more complete foundation for manual and automated testing.