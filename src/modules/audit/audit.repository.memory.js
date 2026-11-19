function createAuditLogRepository(seed = []) {
    const items = seed.map(item => ({ ...item }));
    let nextId = Math.max(0, ...items.map(item => item.id ?? 0)) + 1;

    async function create({ eventType, payload, createdAt }) {
        const row = { id: nextId++, eventType, payload, createdAt: new Date(createdAt) };
        items.push(row);
        return { ...row };
    }

    async function list({ page = 1, limit = 20, eventType } = {}) {
        const filtered = items
            .filter(item => !eventType || item.eventType === eventType)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return {
            total: filtered.length,
            items: filtered.slice((page - 1) * limit, page * limit).map(item => ({ ...item }))
        };
    }

    return { create, list };
}

module.exports = { createAuditLogRepository };
