function toRoom(row) {
    if (!row) return null;

    return {
        id: row.id,
        buildingId: row.building_id,
        name: row.name,
        capacity: row.capacity,
        createdAt: row.created_at,
        ...(row.building_name !== undefined
            ? {
                building: {
                    id: row.building_id,
                    name: row.building_name
                }
            }
            : {})
    };
}

function createRoomsRepository(db) {
    async function findAll() {
        const rows = await db("rooms")
            .select("*")
            .orderBy("id", "asc");

        return rows.map(toRoom);
    }

    async function findById(id) {
        const row = await db("rooms as r")
            .join("buildings as b", "b.id", "r.building_id")
            .where("r.id", id)
            .select(
                "r.id",
                "r.building_id",
                "r.name",
                "r.capacity",
                "r.created_at",
                "b.name as building_name"
            )
            .first();

        return toRoom(row);
    }

    async function lockById(id) {
        return toRoom(
            await db("rooms")
                .where({ id })
                .forUpdate()
                .first()
        );
    }

    async function listByBuildingId(buildingId) {
        const rows = await db("rooms")
            .where({ building_id: buildingId })
            .select("*")
            .orderBy("id", "asc");

        return rows.map(toRoom);
    }

    async function create(data) {
        const [row] = await db("rooms")
            .insert({
                building_id: data.buildingId,
                name: data.name,
                capacity: data.capacity
            })
            .returning("*");

        return toRoom(row);
    }

    async function update(id, changes) {
        const dbChanges = {};
        if (changes.buildingId !== undefined) dbChanges.building_id = changes.buildingId;
        if (changes.name !== undefined) dbChanges.name = changes.name;
        if (changes.capacity !== undefined) dbChanges.capacity = changes.capacity;

        const [row] = await db("rooms")
            .where({ id })
            .update(dbChanges)
            .returning("*");

        return toRoom(row);
    }

    async function remove(id) {
        return (await db("rooms").where({ id }).del()) > 0;
    }

    return {
        findAll,
        findById,
        lockById,
        listByBuildingId,
        create,
        update,
        remove
    };
}

module.exports = { createRoomsRepository };
