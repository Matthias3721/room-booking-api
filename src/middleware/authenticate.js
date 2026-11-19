const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../errors/AppError");

function authenticate(jwtSecret) {
    return (req, res, next) => {
        const header = req.get("Authorization");

        if (!header || !header.startsWith("Bearer ")) {
            return next(new UnauthorizedError());
        }

        const token = header.slice("Bearer ".length).trim();

        if (!token) {
            return next(new UnauthorizedError());
        }

        try {
            const payload = jwt.verify(token, jwtSecret, {
                algorithms: ["HS256"]
            });

            const id = Number(payload.sub);

            if (!Number.isInteger(id) || id <= 0 || !payload.role) {
                return next(new UnauthorizedError("Invalid token"));
            }

            req.user = {
                id,
                role: payload.role
            };

            next();
        } catch (err) {
            const message = err.name === "TokenExpiredError"
                ? "Token expired"
                : "Invalid token";

            next(new UnauthorizedError(message));
        }
    };
}

module.exports = authenticate;
