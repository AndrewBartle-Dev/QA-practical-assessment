/**
 * The one piece of test data that can't just be a JSON file: credentials that
 * actually produce a successful login, sourced from e2e/.env (E2E_USERNAME /
 * E2E_PASSWORD), never hardcoded. Everything else (recipient, invalid login
 * cases, amount cases, etc.) is a plain JSON file under e2e/data/, imported
 * directly wherever it's used — see e2e/data/*.json.
 */
export const TEST_USER = {
  username: process.env.E2E_USERNAME ?? "",
  password: process.env.E2E_PASSWORD ?? "",
} as const;
