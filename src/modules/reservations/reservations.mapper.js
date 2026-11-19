function toBuildingSummary(building) {
    return {
        id: building.id,
        name: building.name
    };
}

function toRoomSummary(room) {
    return {
        id: room.id,
        name: room.name,
        building: toBuildingSummary(room.building)
    };
}

function toUserSummary(user, userId) {
    return user
        ? { id: user.id, email: user.email }
        : { id: userId };
}

function toReservationResponse(reservation) {
    return {
        id: reservation.id,
        ...(reservation.room
            ? { room: toRoomSummary(reservation.room) }
            : { roomId: reservation.roomId }),
        user: toUserSummary(reservation.user, reservation.userId),
        participants: reservation.participants,
        startTime: new Date(reservation.startTime).toISOString(),
        endTime: new Date(reservation.endTime).toISOString(),
        status: reservation.status,
        createdAt: new Date(reservation.createdAt).toISOString(),
        cancelledAt: reservation.cancelledAt
            ? new Date(reservation.cancelledAt).toISOString()
            : null
    };
}

module.exports = {
    toReservationResponse
};
