import type { Page } from "@playwright/test";
import path from "node:path";

/**
 * Returns a step(page, label) function that saves numbered screenshots into
 * e2e/screenshots/<subfolder>/01-label.png, 02-label.png, etc.
 *
 * Call createStepCapture() fresh inside each test (not at module scope) so the
 * counter doesn't leak across tests. Give each test its own subfolder — e.g.
 * "send-money-validation/zero-amount" — so parallel tests never collide on
 * the same file.
 *
 * This is the required per-step evidence trail (see main README section 5).
 * Playwright's own screenshot: "on" config setting is a separate, generic
 * end-of-test capture — not a substitute for these named, ordered ones.
 */
export function createStepCapture(subfolder: string) {
  let counter = 0;

  return async function step(page: Page, label: string): Promise<void> {
    counter += 1;
    const fileName = `${String(counter).padStart(2, "0")}-${label}.png`;
    await page.screenshot({
      path: path.join(__dirname, "..", "screenshots", subfolder, fileName),
    });
  };
}
