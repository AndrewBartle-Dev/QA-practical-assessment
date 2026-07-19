import { execSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

/**
 * Runs once before the whole suite starts: resets the local dev database to
 * the seeded fixture data (yarn db:seed:dev), so every run starts from the
 * same known state. (No auth caching here — see 03-technical-criteria.md.)
 */
async function globalSetup(): Promise<void> {
  const projectRoot = path.resolve(__dirname, "..");
  execSync("yarn db:seed:dev", { stdio: "inherit", cwd: projectRoot });
}

export default globalSetup;
