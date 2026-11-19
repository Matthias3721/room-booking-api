const { Client } = require("pg");

async function ensureTestDatabase() {
    const testUrl = new URL(process.env.TEST_DATABASE_URL);
    const dbName = testUrl.pathname.replace(/^\//, "");
    if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
        throw new Error("Unsafe test database name");
    }

    const admin = new Client({ connectionString: process.env.TEST_DATABASE_ADMIN_URL });
    await admin.connect();
    try {
        const result = await admin.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName]
        );
        if (result.rowCount === 0) {
            await admin.query(`CREATE DATABASE "${dbName}"`);
        }
    } finally {
        await admin.end();
    }
}

module.exports = { ensureTestDatabase };
