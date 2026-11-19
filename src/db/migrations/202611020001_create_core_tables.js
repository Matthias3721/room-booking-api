exports.up = async function up(knex) {
    await knex.schema.createTable("buildings", table => {
        table.increments("id").primary();
        table.string("name", 120).notNullable();
        table.string("address", 255).notNullable();
        table
            .timestamp("created_at", { useTz: true })
            .notNullable()
            .defaultTo(knex.fn.now());

        table.unique(["name"], "buildings_name_unique");
    });

    await knex.schema.createTable("rooms", table => {
        table.increments("id").primary();
        table
            .integer("building_id")
            .notNullable()
            .references("id")
            .inTable("buildings")
            .onDelete("RESTRICT");
        table.string("name", 100).notNullable();
        table.integer("capacity").notNullable();
        table
            .timestamp("created_at", { useTz: true })
            .notNullable()
            .defaultTo(knex.fn.now());

        table.unique(
            ["building_id", "name"],
            "rooms_building_id_name_unique"
        );
        table.index(["building_id"], "rooms_building_id_idx");
    });

    await knex.raw(`
        ALTER TABLE rooms
        ADD CONSTRAINT rooms_capacity_positive_check
        CHECK (capacity > 0)
    `);

    await knex.schema.createTable("reservations", table => {
        table.increments("id").primary();
        table
            .integer("room_id")
            .notNullable()
            .references("id")
            .inTable("rooms")
            .onDelete("RESTRICT");
        table.string("reserved_by", 100).notNullable();
        table.integer("participants").notNullable();
        table.timestamp("start_time", { useTz: true }).notNullable();
        table.timestamp("end_time", { useTz: true }).notNullable();
        table
            .string("status", 20)
            .notNullable()
            .defaultTo("CONFIRMED");
        table.timestamp("cancelled_at", { useTz: true });
        table
            .timestamp("created_at", { useTz: true })
            .notNullable()
            .defaultTo(knex.fn.now());

        table.index(
            ["room_id", "status", "start_time", "end_time"],
            "reservations_collision_lookup_idx"
        );
    });

    await knex.raw(`
        ALTER TABLE reservations
        ADD CONSTRAINT reservations_time_order_check
        CHECK (end_time > start_time)
    `);

    await knex.raw(`
        ALTER TABLE reservations
        ADD CONSTRAINT reservations_status_check
        CHECK (status IN ('CONFIRMED', 'CANCELLED'))
    `);
};

exports.down = async function down(knex) {
    await knex.schema.dropTableIfExists("reservations");
    await knex.schema.dropTableIfExists("rooms");
    await knex.schema.dropTableIfExists("buildings");
};
