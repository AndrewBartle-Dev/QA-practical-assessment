import { test, expect, type Page } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { NewTransactionPage } from "../pages/new-transaction.page";
import { createStepCapture } from "../fixtures/screenshot";
import { TEST_USER } from "../fixtures/test-data";
import invalidAmountCases from "../data/invalid-amount-cases.json";
import recipient from "../data/recipient.json";

/** Every test signs in through the real UI — see 03-technical-criteria.md for why. */
async function loginAsTestUser(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USER.username, TEST_USER.password);
  await page.waitForURL("/");
}

/**
 * AC3 — Amount validation: "0", negative, or empty must disable Pay.
 * Zero/negative are expected to FAIL (confirmed defect — see bug-report.md).
 * Empty is expected to PASS.
 */
for (const data of invalidAmountCases) {
  test(`AC3: rejects amount - ${data.label}`, async ({ page }) => {
    const step = createStepCapture(`send-money-validation/ac3-${data.label.replace(/\s+/g, "-")}`);
    const newTransactionPage = new NewTransactionPage(page);

    await loginAsTestUser(page);
    await step(page, "signed-in");

    await page.goto("/transaction/new");
    await step(page, "new-transaction-form");

    await newTransactionPage.selectContact(recipient.fullName);
    await step(page, "contact-selected");

    await newTransactionPage.fillAmount(data.value);
    await newTransactionPage.fillDescription("AC3 validation test");

    // Screenshot taken in finally, after the assert settles, so it reflects the
    // real button state rather than a stale pre-validation frame.
    try {
      await expect(newTransactionPage.payButton).toBeDisabled();
    } finally {
      await step(page, "amount-entered");
    }
  });
}

/**
 * AC4 — Contact is required: verified correct against createTransactionMachine.ts —
 * stepOne only transitions to stepTwo via SET_USERS, which only fires from selecting
 * a contact. Expected to PASS; this is a regression test, not a defect.
 */
test("AC4: blocks reaching the amount step without a contact", async ({ page }) => {
  const step = createStepCapture("send-money-validation/ac4-no-contact-selected");
  const newTransactionPage = new NewTransactionPage(page);

  await loginAsTestUser(page);
  await page.goto("/transaction/new");
  await step(page, "new-transaction-form");

  await expect(newTransactionPage.contactSearchInput).toBeVisible();
  await expect(newTransactionPage.amountInput).not.toBeVisible();
  await step(page, "still-on-contact-step");
});

/** AC5 — Note is optional: expected to FAIL (confirmed defect — see bug-report.md). */
test("AC5: allows Pay with an empty note", async ({ page }) => {
  const step = createStepCapture("send-money-validation/ac5-empty-note");
  const newTransactionPage = new NewTransactionPage(page);

  await loginAsTestUser(page);
  await page.goto("/transaction/new");

  await newTransactionPage.selectContact(recipient.fullName);
  await step(page, "contact-selected");

  await newTransactionPage.fillAmount("25");
  // Note left deliberately empty.

  // Screenshot taken in finally, after the assert settles (see AC3 above).
  try {
    await expect(newTransactionPage.payButton).toBeEnabled();
  } finally {
    await step(page, "amount-entered-no-note");
  }
});
