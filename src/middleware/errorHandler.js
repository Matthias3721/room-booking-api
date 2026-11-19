const { AppError } = require("../errors/AppError");

function sendError(res, status, code, message, requestId, details) {
    return res.status(status).json({
        error: {
            code,
            message,
            ...(details ? { details } : {}),
            requestId
        }
    });
}

function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return sendError(
            res,
            err.statusCode,
            err.code,
            err.message,
            req.id,
            err.details
        );
    }

    if (err.type === "entity.parse.failed") {
        return sendError(
            res,
            400,
            "INVALID_JSON",
            "Request body is not valid JSON",
            req.id
        );
    }

    if (err.code === "23505") {
        if (err.constraint === "users_email_unique") {
            return sendError(
                res,
                409,
                "EMAIL_TAKEN",
                "Email already registered",
                req.id
            );
        }

        if (err.constraint === "rooms_building_id_name_unique") {
            return sendError(
                res,
                409,
                "ROOM_NAME_ALREADY_EXISTS",
                "Room with this name already exists in the building",
                req.id
            );
        }

        if (err.constraint === "buildings_name_unique") {
            return sendError(
                res,
                409,
                "BUILDING_NAME_ALREADY_EXISTS",
                "Building with this name already exists",
                req.id
            );
        }

        return sendError(
            res,
            409,
            "RESOURCE_CONFLICT",
            "Resource already exists",
            req.id
        );
    }

    if (err.code === "23P01") {
        return sendError(
            res,
            409,
            "ROOM_ALREADY_BOOKED",
            "Room is already booked in this time range",
            req.id
        );
    }

    if (err.code === "23503") {
        return sendError(
            res,
            409,
            "RESOURCE_IN_USE",
            "Resource is referenced by other data",
            req.id
        );
    }

    console.error(`[${req.id}]`, err);

    return sendError(
        res,
        500,
        "INTERNAL_ERROR",
        "Unexpected error",
        req.id
    );
}

module.exports = errorHandler;
