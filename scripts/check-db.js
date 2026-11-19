const db = require("../src/db/knex");

(async () => {
    try {
        const result = await db.raw(
            "select current_database() as database, version() as version"
        );

        console.log("Database:", result.rows[0].database);
        console.log("PostgreSQL:", result.rows[0].version);
    } finally {
        await db.destroy();
    }
})().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
