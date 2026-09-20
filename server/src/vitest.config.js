import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.js"],
    env: {
      NODE_ENV: "test",
      CLIENT_URL: "http://localhost:5173",
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/youtube_clone",
      JWT_ACCESS_SECRET: "test_access_secret_test_access_secret_123456",
      JWT_REFRESH_SECRET: "test_refresh_secret_test_refresh_secret_12345",
    },
  },
});
