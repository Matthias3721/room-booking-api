function createRoomsRepository(buildingsRepository) {
    const rooms = [
        { id: 1, buildingId: 1, name: "101", capacity: 30 },
        { id: 2, buildingId: 1, name: "102", capacity: 15 },
        { id: 3, buildingId: 1, name: "201", capacity: 50 },
        { id: 4, buildingId: 2, name: "101", capacity: 20 },
        { id: 5, buildingId: 2, name: "Audytorium", capacity: 120 }
    ];

    let nextId = 6;

    async function withBuilding(room) {
        if (!room) return null;
        const building = await buildingsRepository.findById(room.buildingId);
        return {
            ...room,
            building: building
                ? { id: building.id, name: building.name }
                : undefined
        };
    }

    async function findAll() {
        return rooms.map(room => ({ ...room }));
    }

    async function findById(id) {
        return withBuilding(rooms.find(r => r.id === id) ?? null);
    }

    async function lockById(id) {
        return rooms.find(r => r.id === id) ?? null;
    }

    async function listByBuildingId(buildingId) {
        return rooms.filter(r => r.buildingId === buildingId);
    }

    async function create(data) {
        const room = { id: nextId++, ...data };
        rooms.push(room);
        return room;
    }

    async function update(id, changes) {
        const room = rooms.find(r => r.id === id);
        if (!room) return null;
        Object.assign(room, changes);
        return room;
    }

    async function remove(id) {
        const index = rooms.findIndex(r => r.id === id);
        if (index < 0) return false;
        rooms.splice(index, 1);
        return true;
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
