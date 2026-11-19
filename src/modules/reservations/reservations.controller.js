const {
    toReservationResponse
} = require("./reservations.mapper");

function createReservationsController(reservationsService) {
    return {
        async list(req, res) {
            const filters = req.validated.query;
            const result = await reservationsService.listReservations(
                filters,
                req.user
            );

            const totalPages = result.total === 0
                ? 0
                : Math.ceil(result.total / filters.limit);

            res.json({
                data: result.items.map(toReservationResponse),
                meta: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    totalPages
                }
            });
        },

        async getById(req, res) {
            const reservation = await reservationsService.getReservationById(
                req.validated.params.id,
                req.user
            );
            res.json(toReservationResponse(reservation));
        },

        async create(req, res) {
            const reservation = await reservationsService.createReservation(
                req.validated.body,
                req.user
            );

            res.status(201)
                .location(`/api/reservations/${reservation.id}`)
                .json(toReservationResponse(reservation));
        },

        async cancel(req, res) {
            const reservation = await reservationsService.cancelReservation(
                req.validated.params.id,
                req.user
            );
            res.json(toReservationResponse(reservation));
        }
    };
}

module.exports = {
    createReservationsController
};
