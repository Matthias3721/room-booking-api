const SORT_COLUMNS = {
    startTime: "r.start_time",
    createdAt: "r.created_at",
    participants: "r.participants"
};

function toReservation(row) {
    if (!row) return null;

    return {
        id: row.id,
        roomId: row.room_id,
        userId: row.user_id,
        participants: row.participants,
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status,
        cancelledAt: row.cancelled_at,
        createdAt: row.created_at,
        ...(row.user_email !== undefined
            ? {
                user: {
                    id: row.user_id,
                    email: row.user_email
                }
            }
            : {}),
        ...(row.room_name !== undefined
            ? {
                room: {
                    id: row.room_id,
                    name: row.room_name,
                    building: {
                        id: row.building_id,
                        name: row.building_name
                    }
                }
            }
            : {})
    };
}

function applyReservationFilters(query, filters) {
    if (filters.roomId) query.where("r.room_id", filters.roomId);
    if (filters.buildingId) query.where("rm.building_id", filters.buildingId);
    if (filters.userId) query.where("r.user_id", filters.userId);
    if (filters.status) query.where("r.status", filters.status);
    if (filters.from) query.where("r.end_time", ">", filters.from);
    if (filters.to) query.where("r.start_time", "<", filters.to);
}

function detailsQuery(db) {
    return db("reservations as r")
        .join("rooms as rm", "rm.id", "r.room_id")
        .join("buildings as b", "b.id", "rm.building_id")
        .join("users as u", "u.id", "r.user_id");
}

function selectDetails(query) {
    return query.select(
        "r.*",
        "u.email as user_email",
        "rm.name as room_name",
        "rm.building_id",
        "b.name as building_name"
    );
}

function createReservationsRepository(db) {
    async function findAll() {
        const rows = await selectDetails(detailsQuery(db))
            .orderBy("r.id", "asc");
        return rows.map(toReservation);
    }

    async function findById(id) {
        const row = await selectDetails(detailsQuery(db))
            .where("r.id", id)
            .first();
        return toReservation(row);
    }

    async function create(data) {
        const [row] = await db("reservations")
            .insert({
                room_id: data.roomId,
                user_id: data.userId,
                participants: data.participants,
                start_time: data.startTime,
                end_time: data.endTime,
                status: data.status,
                cancelled_at: data.cancelledAt,
                created_at: data.createdAt
            })
            .returning("*");

        return toReservation(row);
    }

    async function list(filters = {}) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const sort = filters.sort ?? "startTime";
        const desc = sort.startsWith("-");
        const sortKey = desc ? sort.slice(1) : sort;
        const sortColumn = SORT_COLUMNS[sortKey];

        const base = detailsQuery(db);
        applyReservationFilters(base, filters);

        const rowsQuery = selectDetails(base.clone())
            .orderBy(sortColumn, desc ? "desc" : "asc")
            .orderBy("r.id", "asc")
            .limit(limit)
            .offset((page - 1) * limit);

        const countQuery = base.clone()
            .clearSelect()
            .clearOrder()
            .countDistinct({ count: "r.id" })
            .first();

        const [rows, countRow] = await Promise.all([
            rowsQuery,
            countQuery
        ]);

        return {
            items: rows.map(toReservation),
            total: Number(countRow.count)
        };
    }

    async function findOverlappingConfirmed(roomId, startTime, endTime) {
        return toReservation(
            await db("reservations")
                .where({
                    room_id: roomId,
                    status: "CONFIRMED"
                })
                .andWhere("start_time", "<", endTime)
                .andWhere("end_time", ">", startTime)
                .first()
        );
    }

    async function update(id, changes) {
        const dbChanges = {};
        if (changes.status !== undefined) dbChanges.status = changes.status;
        if (changes.cancelledAt !== undefined) dbChanges.cancelled_at = changes.cancelledAt;

        const [row] = await db("reservations")
            .where({ id })
            .update(dbChanges)
            .returning("*");

        return toReservation(row);
    }

    return {
        findAll,
        findById,
        create,
        list,
        findOverlappingConfirmed,
        update
    };
}

module.exports = {
    createReservationsRepository
};
