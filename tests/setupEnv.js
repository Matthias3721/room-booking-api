const path = require("path");

process.env.NODE_ENV = "test";

if (process.env.GITHUB_ACTIONS !== "true") {
    try {
        process.loadEnvFile(path.join(__dirname, "..", ".env"));
    } catch {
        // .env may be missing
    }

    const user = process.env.DB_USER ?? "room_booking";
    const password = process.env.DB_PASSWORD ?? "change-me-local-password";
    const dbName = process.env.DB_NAME ?? "room_booking";

    process.env.TEST_DATABASE_URL =
        `postgres://${user}:${password}@localhost:5432/${dbName}_test`;

    process.env.TEST_DATABASE_ADMIN_URL =
        `postgres://${user}:${password}@localhost:5432/postgres`;
}

process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/room_booking_test";

process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;

process.env.TEST_DATABASE_ADMIN_URL =
    process.env.TEST_DATABASE_ADMIN_URL ??
    "postgres://postgres:postgres@localhost:5432/postgres";

process.env.JWT_SECRET =
    process.env.JWT_SECRET ??
    "test-secret-test-secret-test-secret-123456";

process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "15m";
process.env.REPOSITORY_MODE = "knex";