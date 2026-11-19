const { NotFoundError } = require("../../errors/AppError");

function createBuildingsService({
    buildingsRepository,
    roomsRepository
}) {
    async function getAllBuildings() {
        return buildingsRepository.findAll();
    }

    async function getBuildingById(id) {
        const building = await buildingsRepository.findById(id);
        if (!building) throw new NotFoundError("Building");
        return building;
    }

    async function createBuilding(input) {
        return buildingsRepository.create(input);
    }

    async function updateBuilding(id, input) {
        const building = await buildingsRepository.findById(id);
        if (!building) throw new NotFoundError("Building");
        return buildingsRepository.update(id, input);
    }

    async function deleteBuilding(id) {
        const building = await buildingsRepository.findById(id);
        if (!building) throw new NotFoundError("Building");
        await buildingsRepository.remove(id);
    }

    async function getBuildingRooms(id) {
        const building = await buildingsRepository.findById(id);
        if (!building) throw new NotFoundError("Building");
        return roomsRepository.listByBuildingId(id);
    }

    return {
        getAllBuildings,
        getBuildingById,
        createBuilding,
        updateBuilding,
        deleteBuilding,
        getBuildingRooms
    };
}

module.exports = { createBuildingsService };
