function toBuilding(row) {
    if (!row) return null;

    return {
        id: row.id,
        name: row.name,
        address: row.address,
        createdAt: row.created_at,
        ...(row.rooms_count !== undefined
            ? { roomsCount: Number(row.rooms_count) }
            : {})
    };
}

function createBuildingsRepository(db) {
    async function findAll() {
        const rows = await db("buildings as b")
            .leftJoin("rooms as r", "r.building_id", "b.id")
            .groupBy("b.id")
            .select(
                "b.id",
                "b.name",
                "b.address",
                "b.created_at"
            )
            .count({ rooms_count: "r.id" })
            .orderBy("b.id", "asc");

        return rows.map(toBuilding);
    }

    async function findById(id) {
        return toBuilding(
            await db("buildings").where({ id }).first()
        );
    }

    async function create(data) {
        const [row] = await db("buildings")
            .insert({ name: data.name, address: data.address })
            .returning("*");

        return toBuilding(row);
    }

    async function update(id, changes) {
        const [row] = await db("buildings")
            .where({ id })
            .update(changes)
            .returning("*");

        return toBuilding(row);
    }

    async function remove(id) {
        return (await db("buildings").where({ id }).del()) > 0;
    }

    return {
        findAll,
        findById,
        create,
        update,
        remove
    };
}

module.exports = {
    createBuildingsRepository
};
