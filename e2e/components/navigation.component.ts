import { type Locator, type Page } from "@playwright/test";

/**
 * Wraps NavBar.tsx — the persistent top nav rendered on every authenticated
 * route (feed, new-transaction, etc.), so it's composed into page objects
 * rather than duplicated on each one.
 * No assertions here — dumb component; tests own all expect() calls.
 */
export class NavigationComponent {
  readonly page: Page;

  readonly sidenavToggle: Locator;
  readonly newTransactionButton: Locator;
  readonly notificationsLink: Locator;
  readonly notificationsCount: Locator;

  constructor(page: Page) {
    this.page = page;

    this.sidenavToggle = page.getByTestId("sidenav-toggle");
    this.newTransactionButton = page.getByTestId("nav-top-new-transaction");
    this.notificationsLink = page.getByTestId("nav-top-notifications-link");
    this.notificationsCount = page.getByTestId("nav-top-notifications-count");
  }

  async openNewTransaction(): Promise<void> {
    await this.newTransactionButton.click();
  }

  async openNotifications(): Promise<void> {
    await this.notificationsLink.click();
  }

  async toggleSidenav(): Promise<void> {
    await this.sidenavToggle.click();
  }
}
