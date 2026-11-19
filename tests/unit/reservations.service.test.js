const { createReservationsService } = require("../../src/modules/reservations/reservations.service");
const { createReservationsRepository } = require("../../src/modules/reservations/reservations.repository.memory");
const { createRoomsRepository } = require("../../src/modules/rooms/rooms.repository.memory");
const { createBuildingsRepository } = require("../../src/modules/buildings/buildings.repository.memory");
const { createUsersRepository } = require("../../src/modules/users/users.repository.memory");

const NOW = new Date("2026-11-01T12:00:00.000Z");
const owner = { id: 1, role: "USER" };
const otherUser = { id: 2, role: "USER" };
const admin = { id: 99, role: "ADMIN" };

function reservation(overrides = {}) {
    return {
        id: 1,
        roomId: 1,
        userId: owner.id,
        participants: 5,
        startTime: "2026-12-01T10:00:00.000Z",
        endTime: "2026-12-01T12:00:00.000Z",
        status: "CONFIRMED",
        createdAt: new Date("2026-10-01T08:00:00.000Z"),
        cancelledAt: null,
        ...overrides
    };
}

function setup({ reservations = [], now = () => new Date(NOW) } = {}) {
    const buildingsRepository = createBuildingsRepository();
    const roomsRepository = createRoomsRepository(buildingsRepository);
    const usersRepository = createUsersRepository([
        { id: 1, email: "owner@example.com", passwordHash: "x", role: "USER", createdAt: NOW },
        { id: 2, email: "other@example.com", passwordHash: "x", role: "USER", createdAt: NOW },
        { id: 99, email: "admin@example.com", passwordHash: "x", role: "ADMIN", createdAt: NOW }
    ]);
    const reservationsRepository = createReservationsRepository(
        roomsRepository,
        usersRepository,
        reservations
    );
    const eventBus = { publish: jest.fn(), subscribe: jest.fn() };
    const service = createReservationsService({
        reservationsRepository,
        roomsRepository,
        eventBus,
        now
    });
    return { service, eventBus, reservationsRepository };
}

function input(overrides = {}) {
    return {
        roomId: 1,
        participants: 5,
        startTime: "2026-12-01T12:00:00.000Z",
        endTime: "2026-12-01T13:00:00.000Z",
        ...overrides
    };
}

describe("reservations service - overlapping", () => {
    test("rejects partial overlap", async () => {
        const { service } = setup({ reservations: [reservation()] });
        await expect(service.createReservation(input({
            startTime: "2026-12-01T11:00:00.000Z",
            endTime: "2026-12-01T13:00:00.000Z"
        }), owner)).rejects.toMatchObject({ code: "ROOM_ALREADY_BOOKED" });
    });

    test("rejects containing interval", async () => {
        const { service } = setup({ reservations: [reservation()] });
        await expect(service.createReservation(input({
            startTime: "2026-12-01T09:00:00.000Z",
            endTime: "2026-12-01T13:00:00.000Z"
        }), owner)).rejects.toMatchObject({ code: "ROOM_ALREADY_BOOKED" });
    });

    test("allows touching intervals", async () => {
        const { service } = setup({ reservations: [reservation()] });
        await expect(service.createReservation(input({
            startTime: "2026-12-01T12:00:00.000Z",
            endTime: "2026-12-01T13:00:00.000Z"
        }), owner)).resolves.toMatchObject({ status: "CONFIRMED" });
    });

    test("allows the same time in another room", async () => {
        const { service } = setup({ reservations: [reservation()] });
        await expect(service.createReservation(input({
            roomId: 2,
            startTime: "2026-12-01T10:00:00.000Z",
            endTime: "2026-12-01T12:00:00.000Z"
        }), owner)).resolves.toMatchObject({ roomId: 2, status: "CONFIRMED" });
    });

    test("CANCELLED reservation does not block interval", async () => {
        const { service } = setup({
            reservations: [reservation({ status: "CANCELLED", cancelledAt: NOW })]
        });
        await expect(service.createReservation(input({
            startTime: "2026-12-01T10:30:00.000Z",
            endTime: "2026-12-01T11:30:00.000Z"
        }), owner)).resolves.toMatchObject({ status: "CONFIRMED" });
    });
});

describe("reservations service - capacity and duration", () => {
    test("allows participants equal to capacity", async () => {
        const { service } = setup();
        await expect(service.createReservation(input({ participants: 30 }), owner))
            .resolves.toMatchObject({ participants: 30 });
    });

    test("rejects capacity + 1", async () => {
        const { service } = setup();
        await expect(service.createReservation(input({ participants: 31 }), owner))
            .rejects.toMatchObject({ code: "ROOM_CAPACITY_EXCEEDED" });
    });

    test.each([
        ["exactly 15 minutes", "2026-12-02T10:00:00.000Z", "2026-12-02T10:15:00.000Z"],
        ["exactly 8 hours", "2026-12-02T10:00:00.000Z", "2026-12-02T18:00:00.000Z"]
    ])("allows %s", async (_label, startTime, endTime) => {
        const { service } = setup();
        await expect(service.createReservation(input({ startTime, endTime }), owner))
            .resolves.toMatchObject({ status: "CONFIRMED" });
    });

    test.each([
        ["14 minutes", "2026-12-02T10:00:00.000Z", "2026-12-02T10:14:00.000Z"],
        ["8 hours 1 minute", "2026-12-02T10:00:00.000Z", "2026-12-02T18:01:00.000Z"]
    ])("rejects %s", async (_label, startTime, endTime) => {
        const { service } = setup();
        await expect(service.createReservation(input({ startTime, endTime }), owner))
            .rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    });
});

describe("reservations service - cancellation and ownership", () => {
    test("rejects cancellation after reservation started", async () => {
        const { service } = setup({ reservations: [reservation({
            startTime: "2026-11-01T11:00:00.000Z",
            endTime: "2026-11-01T13:00:00.000Z"
        })] });
        await expect(service.cancelReservation(1, owner))
            .rejects.toMatchObject({ code: "RESERVATION_ALREADY_STARTED" });
    });

    test("double cancellation is idempotent and keeps cancelledAt", async () => {
        const firstCancelAt = new Date("2026-11-01T12:01:00.000Z");
        const secondCallAt = new Date("2026-11-01T12:06:00.000Z");
        const times = [new Date(NOW), firstCancelAt, secondCallAt];
        let call = 0;
        const { service, eventBus } = setup({
            reservations: [reservation()],
            now: () => new Date(times[Math.min(call++, times.length - 1)])
        });

        const first = await service.cancelReservation(1, owner);
        const second = await service.cancelReservation(1, owner);

        expect(first.cancelledAt.toISOString()).toBe(firstCancelAt.toISOString());
        expect(second.cancelledAt.toISOString()).toBe(firstCancelAt.toISOString());
        expect(eventBus.publish).toHaveBeenCalledTimes(1);
        expect(eventBus.publish).toHaveBeenCalledWith(
            "reservation.cancelled",
            expect.objectContaining({ reservationId: 1, userId: owner.id })
        );
    });

    test("foreign USER cannot cancel another user's reservation", async () => {
        const { service } = setup({ reservations: [reservation()] });
        await expect(service.cancelReservation(1, otherUser))
            .rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    test("ADMIN can access another user's reservation", async () => {
        const { service } = setup({ reservations: [reservation()] });
        await expect(service.getReservationById(1, admin))
            .resolves.toMatchObject({ id: 1, userId: owner.id });
    });

    test("ADMIN can cancel another user's reservation", async () => {
        const { service } = setup({ reservations: [reservation()] });
        await expect(service.cancelReservation(1, admin))
            .resolves.toMatchObject({ status: "CANCELLED" });
    });
});

describe("reservations service - events", () => {
    test("publishes reservation.created after successful create", async () => {
        const { service, eventBus } = setup();
        const created = await service.createReservation(input(), owner);
        expect(eventBus.publish).toHaveBeenCalledWith(
            "reservation.created",
            expect.objectContaining({
                reservationId: created.id,
                roomId: 1,
                userId: owner.id
            })
        );
    });

    test("does not publish event when create fails", async () => {
        const { service, eventBus } = setup({ reservations: [reservation()] });
        await expect(service.createReservation(input({
            startTime: "2026-12-01T11:00:00.000Z",
            endTime: "2026-12-01T13:00:00.000Z"
        }), owner)).rejects.toMatchObject({ code: "ROOM_ALREADY_BOOKED" });
        expect(eventBus.publish).not.toHaveBeenCalled();
    });
});
