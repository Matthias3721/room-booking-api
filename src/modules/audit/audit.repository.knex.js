function toAuditLog(row) {
    if (!row) return null;
    return {
        id: row.id,
        eventType: row.event_type,
        payload: row.payload,
        createdAt: row.created_at
    };
}

function createAuditLogRepository(db) {
    async function create({ eventType, payload, createdAt }) {
        const [row] = await db("audit_log")
            .insert({
                event_type: eventType,
                payload: JSON.stringify(payload),
                created_at: createdAt
            })
            .returning("*");
        return toAuditLog(row);
    }

    async function list({ page = 1, limit = 20, eventType } = {}) {
        const base = db("audit_log");
        if (eventType) base.where({ event_type: eventType });

        const rowsQuery = base.clone()
            .select("*")
            .orderBy("created_at", "desc")
            .orderBy("id", "desc")
            .limit(limit)
            .offset((page - 1) * limit);

        const countQuery = base.clone()
            .clearSelect()
            .clearOrder()
            .count({ count: "*" })
            .first();

        const [rows, countRow] = await Promise.all([rowsQuery, countQuery]);
        return {
            items: rows.map(toAuditLog),
            total: Number(countRow.count)
        };
    }

    return { create, list };
}

module.exports = { createAuditLogRepository };
