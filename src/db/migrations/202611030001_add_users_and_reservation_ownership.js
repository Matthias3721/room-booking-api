const bcrypt = require("bcryptjs");

exports.up = async function up(knex) {
    await knex.schema.createTable("users", table => {
        table.increments("id").primary();
        table.string("email", 254).notNullable();
        table.string("password_hash", 100).notNullable();
        table.string("role", 20).notNullable().defaultTo("USER");
        table
            .timestamp("created_at", { useTz: true })
            .notNullable()
            .defaultTo(knex.fn.now());

        table.unique(["email"], "users_email_unique");
    });

    await knex.raw(`
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('USER', 'ADMIN'))
    `);

    await knex.schema.alterTable("reservations", table => {
        table.integer("user_id");
    });

    const existingCountRow = await knex("reservations")
        .count({ count: "*" })
        .first();

    if (Number(existingCountRow.count) > 0) {
        const passwordHash = await bcrypt.hash(
            `legacy-${Date.now()}-not-for-login`,
            10
        );

        const [legacyUser] = await knex("users")
            .insert({
                email: "legacy-migration@example.invalid",
                password_hash: passwordHash,
                role: "USER"
            })
            .returning(["id"]);

        await knex("reservations").update({
            user_id: legacyUser.id
        });
    }

    await knex.raw(`
        ALTER TABLE reservations
        ALTER COLUMN user_id SET NOT NULL
    `);

    await knex.schema.alterTable("reservations", table => {
        table
            .foreign("user_id", "reservations_user_id_foreign")
            .references("id")
            .inTable("users")
            .onDelete("RESTRICT");
        table.index(["user_id"], "reservations_user_id_idx");
        table.dropColumn("reserved_by");
    });
};

exports.down = async function down(knex) {
    await knex.schema.alterTable("reservations", table => {
        table.string("reserved_by", 100);
    });

    await knex.raw(`
        UPDATE reservations r
        SET reserved_by = u.email
        FROM users u
        WHERE u.id = r.user_id
    `);

    await knex.raw(`
        ALTER TABLE reservations
        ALTER COLUMN reserved_by SET NOT NULL
    `);

    await knex.schema.alterTable("reservations", table => {
        table.dropIndex(["user_id"], "reservations_user_id_idx");
        table.dropForeign("user_id", "reservations_user_id_foreign");
        table.dropColumn("user_id");
    });

    await knex.schema.dropTableIfExists("users");
};
