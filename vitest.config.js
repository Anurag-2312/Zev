import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { config } from "dotenv";

const root = path.dirname(fileURLToPath(import.meta.url));

// These are integration tests: they run against whatever DATABASE_URL points
// at. Point it at a development database, never production.
config({ path: path.join(root, ".env") });

export default defineConfig({
  resolve: {
    alias: { "@": root },
  },
  test: {
    environment: "node",
    // Every test file shares one database, so running them in parallel would
    // let them delete each other's fixtures.
    fileParallelism: false,
  },
});
