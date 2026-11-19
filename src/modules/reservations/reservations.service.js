const {
    ValidationError,
    NotFoundError,
    ConflictError,
    ForbiddenError
} = require("../../errors/AppError");
const { noopEventBus } = require("../../events/eventBus");

const ALLOWED_TRANSITIONS = {
    CONFIRMED: ["CANCELLED"],
    CANCELLED: []
};

function createReservationsService({
    reservationsRepository,
    roomsRepository,
    runInTransaction,
    eventBus = noopEventBus,
    now = () => new Date()
}) {
    function assertCanAccessReservation(reservation, currentUser) {
        if (
            currentUser.role !== "ADMIN" &&
            reservation.userId !== currentUser.id
        ) {
            // 404 intentionally hides the existence of another user's reservation.
            throw new NotFoundError("Reservation");
        }
    }

    async function listReservations(filters, currentUser) {
        const effectiveFilters = { ...filters };

        if (currentUser.role === "ADMIN") {
            return reservationsRepository.list(effectiveFilters);
        }

        if (effectiveFilters.userId !== undefined) {
            throw new ForbiddenError(
                "USER cannot filter reservations by userId"
            );
        }

        effectiveFilters.userId = currentUser.id;
        return reservationsRepository.list(effectiveFilters);
    }

    async function getReservationById(id, currentUser) {
        const reservation = await reservationsRepository.findById(id);

        if (!reservation) {
            throw new NotFoundError("Reservation");
        }

        assertCanAccessReservation(reservation, currentUser);
        return reservation;
    }

    function validateBusinessRules(input, room, current) {
        if (input.participants > room.capacity) {
            throw new ConflictError(
                "Room capacity exceeded",
                "ROOM_CAPACITY_EXCEEDED"
            );
        }

        const start = new Date(input.startTime).getTime();
        const end = new Date(input.endTime).getTime();

        if (end <= start) {
            throw new ValidationError([
                {
                    location: "body",
                    field: "endTime",
                    message: "endTime must be later than startTime"
                }
            ]);
        }

        if (start < current.getTime()) {
            throw new ValidationError([
                {
                    location: "body",
                    field: "startTime",
                    message: "startTime cannot be in the past"
                }
            ]);
        }

        const duration = end - start;
        const minDuration = 15 * 60 * 1000;
        const maxDuration = 8 * 60 * 60 * 1000;

        if (duration < minDuration || duration > maxDuration) {
            throw new ValidationError([
                {
                    location: "body",
                    field: "endTime",
                    message: "Reservation must last between 15 minutes and 8 hours"
                }
            ]);
        }
    }

    async function createUsingRepositories(
        input,
        currentUser,
        effectiveRoomsRepository,
        effectiveReservationsRepository,
        lockRoom
    ) {
        const room = lockRoom
            ? await effectiveRoomsRepository.lockById(input.roomId)
            : await effectiveRoomsRepository.findById(input.roomId);

        if (!room) throw new NotFoundError("Room");

        const current = now();
        validateBusinessRules(input, room, current);

        const overlapping =
            await effectiveReservationsRepository.findOverlappingConfirmed(
                input.roomId,
                input.startTime,
                input.endTime
            );

        if (overlapping) {
            throw new ConflictError(
                "Room is already booked in this time range",
                "ROOM_ALREADY_BOOKED"
            );
        }

        const created = await effectiveReservationsRepository.create({
            ...input,
            userId: currentUser.id,
            status: "CONFIRMED",
            createdAt: current,
            cancelledAt: null
        });

        return effectiveReservationsRepository.findById(created.id);
    }

    async function createReservation(input, currentUser) {
        let created;

        if (runInTransaction) {
            created = await runInTransaction(async tx =>
                createUsingRepositories(
                    input,
                    currentUser,
                    tx.roomsRepository,
                    tx.reservationsRepository,
                    true
                )
            );
        } else {
            created = await createUsingRepositories(
                input,
                currentUser,
                roomsRepository,
                reservationsRepository,
                false
            );
        }

        // This line is reached only after the transaction has committed.
        eventBus.publish("reservation.created", {
            reservationId: created.id,
            roomId: created.roomId,
            userId: created.userId,
            startTime: new Date(created.startTime).toISOString(),
            endTime: new Date(created.endTime).toISOString()
        });

        return created;
    }

    async function cancelUsingRepository(id, currentUser, effectiveReservationsRepository) {
        const reservation = await effectiveReservationsRepository.findById(id);

        if (!reservation) {
            throw new NotFoundError("Reservation");
        }

        assertCanAccessReservation(reservation, currentUser);

        if (reservation.status === "CANCELLED") {
            return { reservation, changed: false };
        }

        const start = new Date(reservation.startTime).getTime();

        if (start <= now().getTime()) {
            throw new ConflictError(
                "Reservation has already started",
                "RESERVATION_ALREADY_STARTED"
            );
        }

        const allowed = ALLOWED_TRANSITIONS[reservation.status] ?? [];

        if (!allowed.includes("CANCELLED")) {
            throw new ConflictError(
                "Reservation cannot be cancelled",
                "INVALID_STATUS_TRANSITION"
            );
        }

        const cancelledAt = now();
        await effectiveReservationsRepository.update(id, {
            status: "CANCELLED",
            cancelledAt
        });

        return {
            reservation: await effectiveReservationsRepository.findById(id),
            changed: true
        };
    }

    async function cancelReservation(id, currentUser) {
        let result;

        if (runInTransaction) {
            result = await runInTransaction(async tx =>
                cancelUsingRepository(id, currentUser, tx.reservationsRepository)
            );
        } else {
            result = await cancelUsingRepository(
                id,
                currentUser,
                reservationsRepository
            );
        }

        if (result.changed) {
            // Published only after successful commit; repeated cancel is idempotent.
            eventBus.publish("reservation.cancelled", {
                reservationId: result.reservation.id,
                roomId: result.reservation.roomId,
                userId: result.reservation.userId,
                cancelledBy: currentUser.id
            });
        }

        return result.reservation;
    }

    return {
        listReservations,
        getReservationById,
        createReservation,
        cancelReservation
    };
}

module.exports = {
    createReservationsService
};
