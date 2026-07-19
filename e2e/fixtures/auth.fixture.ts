import { test as base, expect, request as playwrightRequest, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { TEST_USER } from "./test-data";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";
const AUTH_STATE_PATH = path.resolve(__dirname, "..", ".auth", "user-state.json");

type AuthFixtures = {
  /**
   * A page already signed in as TEST_USER. Backed by the storageState cached
   * once in global-setup.ts (POST /login via backend/auth.ts — a cookie
   * session, not a JWT, so there's no expiry to check; the cache is just
   * "does the state file exist"). Falls back to a fresh API login — and
   * re-caches it — if the file is missing, e.g. when running a single spec
   * directly without the suite's global setup.
   *
   * Use this for tests that don't care how the session was created
   * (send-money validation, no-bank-account, etc.). Tests that verify
   * sign-in behavior itself (auth.spec.ts) should drive LoginPage directly.
   */
  authenticatedPage: Page;
};

async function authenticateFresh() {
  if (!TEST_USER.username || !TEST_USER.password) {
    throw new Error(
      "E2E_USERNAME / E2E_PASSWORD are not set — check e2e/.env is present and loaded."
    );
  }

  const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
  const response = await apiContext.post("/login", {
    data: { username: TEST_USER.username, password: TEST_USER.password },
  });

  if (!response.ok()) {
    throw new Error(
      `API login failed for "${TEST_USER.username}" (${response.status()}). ` +
        "Is the app running (yarn dev) and the DB seeded (yarn db:seed:dev)?"
    );
  }

  const storageState = await apiContext.storageState();
  await apiContext.dispose();
  return storageState;
}

async function getStorageState() {
  try {
    const raw = fs.readFileSync(AUTH_STATE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    const storageState = await authenticateFresh();
    fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
    fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(storageState));
    return storageState;
  }
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const storageState = await getStorageState();
    const context = await browser.newContext({ storageState });
    const page = await context.newPage();

    await use(page);
    await context.close();
  },
});

export { expect };
