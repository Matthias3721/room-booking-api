const { NotFoundError } = require("../../errors/AppError");

function createRoomsService({
    roomsRepository,
    buildingsRepository
}) {
    async function getAllRooms() {
        return roomsRepository.findAll();
    }

    async function getRoomById(id) {
        const room = await roomsRepository.findById(id);
        if (!room) throw new NotFoundError("Room");
        return room;
    }

    async function ensureBuilding(buildingId) {
        const building = await buildingsRepository.findById(buildingId);
        if (!building) throw new NotFoundError("Building");
    }

    async function createRoom(input) {
        await ensureBuilding(input.buildingId);
        const created = await roomsRepository.create(input);
        return roomsRepository.findById(created.id);
    }

    async function updateRoom(id, input) {
        const room = await roomsRepository.findById(id);
        if (!room) throw new NotFoundError("Room");

        if (input.buildingId !== undefined) {
            await ensureBuilding(input.buildingId);
        }

        await roomsRepository.update(id, input);
        return roomsRepository.findById(id);
    }

    async function deleteRoom(id) {
        const room = await roomsRepository.findById(id);
        if (!room) throw new NotFoundError("Room");
        await roomsRepository.remove(id);
    }

    return {
        getAllRooms,
        getRoomById,
        createRoom,
        updateRoom,
        deleteRoom
    };
}

module.exports = { createRoomsService };
