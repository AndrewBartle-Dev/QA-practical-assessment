import { type Locator, type Page } from "@playwright/test";
import { NavigationComponent } from "../components/navigation.component";

/**
 * Wraps the new-transaction journey: TransactionCreateContainer.tsx drives
 * TransactionCreateStepOne (contact) -> StepTwo (amount/note) -> StepThree (confirmation)
 * as one xstate flow with no route change between steps. The top nav persists across
 * this route too, so it's composed here via NavigationComponent — the actual entry point
 * into this flow (clicking "New Transaction") is normally driven from FeedPage.navigation,
 * since that's where a user starts.
 *
 * NOTE (see 03-technical-criteria.md): TransactionCreateStepThree's confirmation
 * message has no data-test attribute in the source. Proposed addition:
 * data-test="transaction-create-confirmation" on the Typography wrapping
 * "Paid $X for Y". Until that exists, confirmationText falls back to a text locator.
 *
 * No assertions here — this page object is dumb; tests own all expect() calls.
 */
export class NewTransactionPage {
  readonly page: Page;
  readonly navigation: NavigationComponent;

  readonly contactSearchInput: Locator;
  readonly usersList: Locator;

  readonly amountInput: Locator;
  readonly descriptionInput: Locator;
  readonly payButton: Locator;
  readonly requestButton: Locator;

  readonly confirmationText: Locator;
  readonly returnToTransactionsButton: Locator;
  readonly createAnotherButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigation = new NavigationComponent(page);

    this.contactSearchInput = page.getByTestId("user-list-search-input");
    this.usersList = page.getByTestId("users-list");

    // TransactionCreateStepTwo.tsx passes data-test directly to MUI's <TextField>, which puts
    // it on the wrapper <div>, not the actual <input> — hence the nested .locator("input").
    // Same root cause as LoginPage's username/password fields (see 03-technical-criteria.md).
    this.amountInput = page.getByTestId("transaction-create-amount-input").locator("input");
    this.descriptionInput = page
      .getByTestId("transaction-create-description-input")
      .locator("input");
    this.payButton = page.getByTestId("transaction-create-submit-payment");
    this.requestButton = page.getByTestId("transaction-create-submit-request");

    this.confirmationText = page.getByText(/Paid \$|Requested \$/);
    this.returnToTransactionsButton = page.getByTestId("new-transaction-return-to-transactions");
    this.createAnotherButton = page.getByTestId("new-transaction-create-another-transaction");
  }

  /** user-list-item-{id} is keyed by a dynamic id, so contacts are matched by visible name, not id. */
  contactRowByName(fullName: string): Locator {
    return this.usersList.getByTestId(/^user-list-item-/).filter({ hasText: fullName });
  }

  async searchContact(query: string): Promise<void> {
    await this.contactSearchInput.fill(query);
  }

  async selectContact(fullName: string): Promise<void> {
    await this.searchContact(fullName);
    await this.contactRowByName(fullName).click();
  }

  /**
   * The amount field is wrapped in react-number-format, which formats based on
   * actual keystrokes rather than a single value assignment — pressSequentially
   * (not fill) avoids flake here.
   */
  async fillAmount(amount: string): Promise<void> {
    await this.amountInput.click();
    await this.amountInput.pressSequentially(amount);
  }

  async fillDescription(note: string): Promise<void> {
    await this.descriptionInput.fill(note);
  }

  async pay(): Promise<void> {
    await this.payButton.click();
  }

  async request(): Promise<void> {
    await this.requestButton.click();
  }
}
