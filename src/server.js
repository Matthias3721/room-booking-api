const bcrypt = require("bcryptjs");

const config = require("./config");
const { createApp } = require("./app");
const { createEventBus } = require("./events/eventBus");
const { registerAuditListeners } = require("./events/auditListeners");
const { registerNotificationListeners } = require("./events/notificationListeners");

let db = null;
let bundle;

if (config.REPOSITORY_MODE === "memory") {
    const {
        createBuildingsRepository
    } = require("./modules/buildings/buildings.repository.memory");
    const {
        createRoomsRepository
    } = require("./modules/rooms/rooms.repository.memory");
    const {
        createReservationsRepository
    } = require("./modules/reservations/reservations.repository.memory");
    const {
        createUsersRepository
    } = require("./modules/users/users.repository.memory");
    const {
        createAuditLogRepository
    } = require("./modules/audit/audit.repository.memory");

    const usersRepository = createUsersRepository([
        {
            id: 1,
            email: "admin@example.com",
            passwordHash: bcrypt.hashSync("admin-password-123", 10),
            role: "ADMIN",
            createdAt: new Date("2026-11-01T08:00:00.000Z")
        },
        {
            id: 2,
            email: "jan@example.com",
            passwordHash: bcrypt.hashSync("user-password-123", 10),
            role: "USER",
            createdAt: new Date("2026-11-01T08:00:00.000Z")
        },
        {
            id: 3,
            email: "anna@example.com",
            passwordHash: bcrypt.hashSync("anna-password-123", 10),
            role: "USER",
            createdAt: new Date("2026-11-01T08:00:00.000Z")
        }
    ]);

    const buildingsRepository = createBuildingsRepository();
    const roomsRepository = createRoomsRepository(buildingsRepository);
    const reservationsRepository = createReservationsRepository(
        roomsRepository,
        usersRepository
    );
    const auditLogRepository = createAuditLogRepository();

    bundle = {
        usersRepository,
        buildingsRepository,
        roomsRepository,
        reservationsRepository,
        auditLogRepository
    };
} else {
    db = require("./db/knex");
    const { createRepositoryBundle } = require("./db/repositories");
    bundle = createRepositoryBundle(db);
}

const eventBus = createEventBus();
registerAuditListeners(eventBus, bundle.auditLogRepository);
registerNotificationListeners(eventBus, bundle.usersRepository);

const app = createApp({
    ...bundle,
    eventBus,
    jwtSecret: config.JWT_SECRET,
    jwtExpiresIn: config.JWT_EXPIRES_IN
});

const server = app.listen(config.PORT, () => {
    console.log(
        `Server running on http://localhost:${config.PORT} (${config.REPOSITORY_MODE})`
    );
});

let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${signal} received`);

    server.close(async error => {
        if (error) {
            console.error("[shutdown] server.close failed", error);
            process.exitCode = 1;
        }

        try {
            if (db) await db.destroy();
            console.log("[shutdown] database pool closed");
        } catch (dbError) {
            console.error("[shutdown] database close failed", dbError);
            process.exitCode = 1;
        }

        console.log("[shutdown] complete");
        process.exit();
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
