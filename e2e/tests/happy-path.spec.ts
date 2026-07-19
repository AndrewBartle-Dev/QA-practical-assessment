import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { FeedPage } from "../pages/feed.page";
import { NewTransactionPage } from "../pages/new-transaction.page";
import { createStepCapture } from "../fixtures/screenshot";
import { TEST_USER } from "../fixtures/test-data";
import recipient from "../data/recipient.json";
import happyPathData from "../data/happy-path.json";

/**
 * recipient.json is a real seeded user (data/database-seed.json), different
 * from TEST_USER. TransactionCreateStepOne lists all users (GET /users), not
 * just existing contacts, so any other seeded user works as a valid recipient.
 */
const RECIPIENT_FULL_NAME = recipient.fullName;
const PAYMENT_AMOUNT = happyPathData.amount;
// The timestamp suffix is a runtime computation, not data — it has to run fresh
// each time so the transaction created by this run is uniquely identifiable in
// the feed, regardless of what previous runs left behind.
const PAYMENT_NOTE = `${happyPathData.notePrefix} ${Date.now()}`;

/**
 * Deliberately does NOT use the authenticatedPage fixture — this is the one
 * test that must exercise the real UI login, since it's the RWA-118 -> RWA-142
 * journey end to end: sign in, start a transaction, select a contact, enter an
 * amount and note, pay, and confirm it succeeded (confirmation + feed).
 */
test("logs in, sends a payment, and sees it confirmed in the feed", async ({ page }) => {
  const step = createStepCapture("happy-path");

  const loginPage = new LoginPage(page);
  const feedPage = new FeedPage(page);
  const newTransactionPage = new NewTransactionPage(page);

  await test.step("Sign in", async () => {
    await loginPage.goto();
    await step(page, "signin-page");

    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForURL("/");
    await step(page, "after-login-feed");
  });

  await test.step("Start a new transaction", async () => {
    await feedPage.navigation.openNewTransaction();
    await expect(newTransactionPage.contactSearchInput).toBeVisible();
    await step(page, "new-transaction-contact-step");
  });

  await test.step("Select a contact", async () => {
    await newTransactionPage.selectContact(RECIPIENT_FULL_NAME);
    await expect(newTransactionPage.amountInput).toBeVisible();
    await step(page, "contact-selected-amount-step");
  });

  await test.step("Enter amount and note", async () => {
    await newTransactionPage.fillAmount(PAYMENT_AMOUNT);
    await newTransactionPage.fillDescription(PAYMENT_NOTE);
    await step(page, "amount-and-note-entered");
  });

  await test.step("Pay", async () => {
    await newTransactionPage.pay();
    await expect(newTransactionPage.confirmationText).toBeVisible();
    await step(page, "payment-confirmation");
  });

  await test.step("Return to feed and verify the payment appears", async () => {
    await newTransactionPage.returnToTransactionsButton.click();
    await feedPage.goToMine();

    const sentTransaction = feedPage.transactionItemByDescription(PAYMENT_NOTE);
    await expect(sentTransaction).toBeVisible();
    await step(page, "payment-visible-in-feed");
  });
});
