function createBuildingsRepository() {
    const buildings = [
        { id: 1, name: "Budynek A", address: "ul. Warszawska 24, Krakow", createdAt: new Date("2026-10-01T08:00:00.000Z") },
        { id: 2, name: "Budynek B", address: "ul. Dluga 10, Krakow", createdAt: new Date("2026-10-01T08:00:00.000Z") }
    ];

    let nextId = 3;

    async function findAll() {
        return buildings.map(building => ({ ...building, roomsCount: 0 }));
    }

    async function findById(id) {
        return buildings.find(b => b.id === id) ?? null;
    }

    async function create(data) {
        const building = { id: nextId++, ...data, createdAt: new Date() };
        buildings.push(building);
        return building;
    }

    async function update(id, changes) {
        const building = buildings.find(b => b.id === id);
        if (!building) return null;
        Object.assign(building, changes);
        return building;
    }

    async function remove(id) {
        const index = buildings.findIndex(b => b.id === id);
        if (index < 0) return false;
        buildings.splice(index, 1);
        return true;
    }

    return { findAll, findById, create, update, remove };
}

module.exports = { createBuildingsRepository };
