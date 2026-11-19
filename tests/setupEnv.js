process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5432/room_booking_test";
process.env.TEST_DATABASE_URL = process.env.DATABASE_URL;
process.env.TEST_DATABASE_ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL ??
    "postgres://postgres:postgres@localhost:5432/postgres";
process.env.JWT_SECRET = process.env.JWT_SECRET ??
    "test-secret-test-secret-test-secret-123456";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "15m";
process.env.REPOSITORY_MODE = "knex";
