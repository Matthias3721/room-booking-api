function createReservationsRepository(roomsRepository, usersRepository, seedReservations = null) {
    const defaultReservations = [
        {
            id: 1,
            roomId: 1,
            userId: 2,
            participants: 10,
            startTime: "2026-10-20T10:00:00.000Z",
            endTime: "2026-10-20T12:00:00.000Z",
            status: "CONFIRMED",
            createdAt: new Date("2026-10-19T08:00:00.000Z"),
            cancelledAt: null
        },
        {
            id: 2,
            roomId: 1,
            userId: 3,
            participants: 8,
            startTime: "2026-12-01T10:00:00.000Z",
            endTime: "2026-12-01T11:00:00.000Z",
            status: "CANCELLED",
            createdAt: new Date("2026-10-25T09:00:00.000Z"),
            cancelledAt: new Date("2026-11-01T10:00:00.000Z")
        },
        {
            id: 3,
            roomId: 1,
            userId: 2,
            participants: 12,
            startTime: "2026-12-01T10:00:00.000Z",
            endTime: "2026-12-01T11:00:00.000Z",
            status: "CONFIRMED",
            createdAt: new Date("2026-10-26T09:00:00.000Z"),
            cancelledAt: null
        }
    ];

    const reservations = (seedReservations ?? defaultReservations).map(r => ({ ...r }));
    let nextId = Math.max(0, ...reservations.map(r => r.id ?? 0)) + 1;


    async function enrich(reservation) {
        if (!reservation) return null;
        const [room, user] = await Promise.all([
            roomsRepository.findById(reservation.roomId),
            usersRepository.findById(reservation.userId)
        ]);

        return {
            ...reservation,
            room,
            user: user ? { id: user.id, email: user.email } : undefined
        };
    }

    async function findAll() {
        return Promise.all(reservations.map(enrich));
    }

    async function findById(id) {
        return enrich(reservations.find(r => r.id === id) ?? null);
    }

    async function create(data) {
        const reservation = { id: nextId++, ...data };
        reservations.push(reservation);
        return reservation;
    }

    async function list(filters = {}) {
        let items = reservations.filter(r => {
            if (filters.roomId && r.roomId !== filters.roomId) return false;
            if (filters.userId && r.userId !== filters.userId) return false;
            if (filters.status && r.status !== filters.status) return false;
            if (filters.from && !(new Date(r.endTime) > new Date(filters.from))) return false;
            if (filters.to && !(new Date(r.startTime) < new Date(filters.to))) return false;
            return true;
        });

        if (filters.buildingId) {
            const checks = await Promise.all(items.map(async r => {
                const room = await roomsRepository.findById(r.roomId);
                return room?.buildingId === filters.buildingId;
            }));
            items = items.filter((_, index) => checks[index]);
        }

        const sort = filters.sort ?? "startTime";
        const desc = sort.startsWith("-");
        const key = desc ? sort.slice(1) : sort;
        const field = {
            startTime: "startTime",
            createdAt: "createdAt",
            participants: "participants"
        }[key];

        items.sort((a, b) => {
            const av = field === "participants" ? a[field] : new Date(a[field]).getTime();
            const bv = field === "participants" ? b[field] : new Date(b[field]).getTime();
            if (av === bv) return a.id - b.id;
            return desc ? bv - av : av - bv;
        });

        const total = items.length;
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        items = items.slice((page - 1) * limit, page * limit);

        return {
            items: await Promise.all(items.map(enrich)),
            total
        };
    }

    async function findOverlappingConfirmed(roomId, startTime, endTime) {
        const start = new Date(startTime).getTime();
        const end = new Date(endTime).getTime();
        return reservations.find(r =>
            r.roomId === roomId &&
            r.status === "CONFIRMED" &&
            start < new Date(r.endTime).getTime() &&
            new Date(r.startTime).getTime() < end
        ) ?? null;
    }

    async function update(id, changes) {
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) return null;
        Object.assign(reservation, changes);
        return reservation;
    }

    return {
        findAll,
        findById,
        create,
        list,
        findOverlappingConfirmed,
        update
    };
}

module.exports = {
    createReservationsRepository
};
