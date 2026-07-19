import { type Locator, type Page } from "@playwright/test";
import { NavigationComponent } from "../components/navigation.component";

/**
 * Wraps the transaction feed (TransactionNavTabs.tsx + TransactionInfiniteList.tsx / TransactionItem.tsx).
 * Used to confirm a sent payment actually appears after completing a transaction, and as the
 * entry point into the new-transaction flow via the shared nav.
 * No assertions here — this page object is dumb; tests own all expect() calls.
 */
export class FeedPage {
  readonly page: Page;
  readonly navigation: NavigationComponent;

  readonly transactionList: Locator;
  readonly personalTab: Locator;
  readonly publicTab: Locator;
  readonly contactsTab: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navigation = new NavigationComponent(page);

    this.transactionList = page.getByTestId("transaction-list");
    this.personalTab = page.getByTestId("nav-personal-tab");
    this.publicTab = page.getByTestId("nav-public-tab");
    this.contactsTab = page.getByTestId("nav-contacts-tab");
  }

  /** "Mine" tab is the reliable place to look for a transaction the current user just sent. */
  async goToMine(): Promise<void> {
    await this.personalTab.click();
  }

  /** transaction-item-{id} is keyed by a dynamic id, so items are matched by their description text. */
  transactionItemByDescription(description: string): Locator {
    return this.transactionList.getByTestId(/^transaction-item-/).filter({ hasText: description });
  }
}
