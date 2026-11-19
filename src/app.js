const express = require("express");
const swaggerUi = require("swagger-ui-express");

const requestLogger = require("./middleware/requestLogger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const authenticate = require("./middleware/authenticate");
const openapiDocument = require("./docs/openapi");
const { noopEventBus } = require("./events/eventBus");

const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthController } = require("./modules/auth/auth.controller");
const {
    createPublicAuthRouter,
    createProtectedAuthRouter
} = require("./modules/auth/auth.routes");

const { createBuildingsService } = require("./modules/buildings/buildings.service");
const { createBuildingsController } = require("./modules/buildings/buildings.controller");
const { createBuildingsRouter } = require("./modules/buildings/buildings.routes");

const { createRoomsService } = require("./modules/rooms/rooms.service");
const { createRoomsController } = require("./modules/rooms/rooms.controller");
const { createRoomsRouter } = require("./modules/rooms/rooms.routes");

const { createReservationsService } = require("./modules/reservations/reservations.service");
const { createReservationsController } = require("./modules/reservations/reservations.controller");
const { createReservationsRouter } = require("./modules/reservations/reservations.routes");

const { createAuditService } = require("./modules/audit/audit.service");
const { createAuditController } = require("./modules/audit/audit.controller");
const { createAuditRouter } = require("./modules/audit/audit.routes");

function createApp({
    usersRepository,
    buildingsRepository,
    roomsRepository,
    reservationsRepository,
    auditLogRepository,
    runInTransaction,
    eventBus = noopEventBus,
    jwtSecret,
    jwtExpiresIn
}) {
    const app = express();

    app.use(requestLogger);
    app.use(express.json());

    const authService = createAuthService({
        usersRepository,
        jwtSecret,
        jwtExpiresIn
    });
    const authController = createAuthController(authService);

    app.use(
        "/api/docs",
        swaggerUi.serve,
        swaggerUi.setup(openapiDocument)
    );

    app.use(
        "/api/auth",
        createPublicAuthRouter(authController)
    );

    app.use(
        "/api/auth",
        authenticate(jwtSecret),
        createProtectedAuthRouter(authController)
    );

    const buildingsService = createBuildingsService({
        buildingsRepository,
        roomsRepository
    });

    const roomsService = createRoomsService({
        roomsRepository,
        buildingsRepository
    });

    const reservationsService = createReservationsService({
        reservationsRepository,
        roomsRepository,
        runInTransaction,
        eventBus
    });

    const auditService = createAuditService({ auditLogRepository });

    app.use(
        "/api/buildings",
        authenticate(jwtSecret),
        createBuildingsRouter(
            createBuildingsController(buildingsService)
        )
    );

    app.use(
        "/api/rooms",
        authenticate(jwtSecret),
        createRoomsRouter(
            createRoomsController(roomsService)
        )
    );

    app.use(
        "/api/reservations",
        authenticate(jwtSecret),
        createReservationsRouter(
            createReservationsController(reservationsService)
        )
    );

    app.use(
        "/api/admin/audit-log",
        authenticate(jwtSecret),
        createAuditRouter(createAuditController(auditService))
    );

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = {
    createApp
};
