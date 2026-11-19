function toBuildingSummary(building) {
    if (!building) return undefined;

    return {
        id: building.id,
        name: building.name
    };
}

function toRoomResponse(room) {
    return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        ...(room.building
            ? { building: toBuildingSummary(room.building) }
            : {}),
        ...(room.buildingId !== undefined && !room.building
            ? { buildingId: room.buildingId }
            : {})
    };
}

module.exports = {
    toRoomResponse
};
