import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { request as playwrightRequest } from "@playwright/test";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const AUTH_STATE_PATH = path.resolve(__dirname, ".auth", "user-state.json");
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

/**
 * Runs once before the whole suite starts:
 *  1. Resets the local dev database to the seeded fixture data (yarn db:seed:dev),
 *     so every run starts from the same known state.
 *  2. Authenticates once via POST /login (backend/auth.ts) and caches the
 *     resulting session storageState to disk, so individual tests
 *     (see fixtures/auth.fixture.ts) don't each need their own login call.
 */
async function globalSetup(): Promise<void> {
  const projectRoot = path.resolve(__dirname, "..");
  execSync("yarn db:seed:dev", { stdio: "inherit", cwd: projectRoot });

  const username = process.env.E2E_USERNAME ?? "";
  const password = process.env.E2E_PASSWORD ?? "";
  if (!username || !password) {
    throw new Error("E2E_USERNAME / E2E_PASSWORD are not set — check e2e/.env.");
  }

  const apiContext = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
  const response = await apiContext.post("/login", { data: { username, password } });

  if (!response.ok()) {
    throw new Error(
      `Global setup login failed for "${username}" (${response.status()}). ` +
        "Is the app running (yarn dev)?"
    );
  }

  const storageState = await apiContext.storageState();
  await apiContext.dispose();

  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });
  fs.writeFileSync(AUTH_STATE_PATH, JSON.stringify(storageState));
}

export default globalSetup;
