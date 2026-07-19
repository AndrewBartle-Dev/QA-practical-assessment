import { type Locator, type Page } from "@playwright/test";

/**
 * Wraps SignInForm.tsx (route: /signin).
 * Selectors verified directly against src/components/SignInForm.tsx.
 * No assertions here — this page object is dumb; tests own all expect() calls.
 */
export class LoginPage {
  readonly page: Page;

  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    // SignInForm.tsx passes data-test directly to MUI's <TextField>, which puts it on the
    // wrapper <div>, not the actual <input> — hence the nested .locator("input").
    // (See 03-technical-criteria.md: proposed fix is inputProps={{ "data-test": ... }} in the app.)
    this.usernameInput = page.getByTestId("signin-username").locator("input");
    this.passwordInput = page.getByTestId("signin-password").locator("input");
    this.rememberMeCheckbox = page.getByTestId("signin-remember-me");
    this.submitButton = page.getByTestId("signin-submit");
    this.errorAlert = page.getByTestId("signin-error");
  }

  async goto(): Promise<void> {
    await this.page.goto("/signin");
  }

  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.submit();
  }
}
