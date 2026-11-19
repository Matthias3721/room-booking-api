const {
    createBuildingsRepository
} = require("../modules/buildings/buildings.repository.knex");
const {
    createRoomsRepository
} = require("../modules/rooms/rooms.repository.knex");
const {
    createReservationsRepository
} = require("../modules/reservations/reservations.repository.knex");
const {
    createUsersRepository
} = require("../modules/users/users.repository.knex");
const {
    createAuditLogRepository
} = require("../modules/audit/audit.repository.knex");

function createRepositoryBundle(client, rootDb = client) {
    const bundle = {
        buildingsRepository: createBuildingsRepository(client),
        roomsRepository: createRoomsRepository(client),
        reservationsRepository: createReservationsRepository(client),
        usersRepository: createUsersRepository(client),
        auditLogRepository: createAuditLogRepository(client)
    };

    bundle.runInTransaction = async function runInTransaction(work) {
        return rootDb.transaction(async trx => {
            const txBundle = createRepositoryBundle(trx, rootDb);
            return work(txBundle);
        });
    };

    return bundle;
}

module.exports = {
    createRepositoryBundle
};
