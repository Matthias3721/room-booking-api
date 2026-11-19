exports.up = async function up(knex) {
    await knex.schema.createTable("audit_log", table => {
        table.bigIncrements("id").primary();
        table.string("event_type", 100).notNullable();
        table.jsonb("payload").notNullable();
        table.timestamp("created_at", { useTz: true }).notNullable();
        table.index(["event_type"], "audit_log_event_type_idx");
        table.index(["created_at"], "audit_log_created_at_idx");
    });
};

exports.down = async function down(knex) {
    await knex.schema.dropTableIfExists("audit_log");
};
