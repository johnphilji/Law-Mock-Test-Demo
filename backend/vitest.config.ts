import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Use Node.js environment (not jsdom) for server-side service tests.
    environment: "node",
    globals: true,
    // Timeout for each test (milliseconds).
    testTimeout: 10_000,
    // Collect coverage reports.
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/server/**/*.ts", "src/lib/**/*.ts"],
      exclude: [
        "src/lib/db/client.ts",  // Prisma singleton — tested via integration tests
        "src/**/*.d.ts",
        "src/types/**",
      ],
      thresholds: {
        // Minimum coverage required for critical services.
        // Lower for initial phase — raise as we add more tests.
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
    // Load .env.test for test environment variables.
    env: {
      APP_ENVIRONMENT: "development",
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/panther_law_prep?schema=public",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
