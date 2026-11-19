const { toUserResponse } = require("./auth.mapper");

function createAuthController(authService) {
    return {
        async register(req, res) {
            const user = await authService.register(
                req.validated.body
            );

            res
                .status(201)
                .location(`/api/users/${user.id}`)
                .json(toUserResponse(user));
        },

        async login(req, res) {
            const result = await authService.login(
                req.validated.body
            );

            res.json(result);
        },

        async me(req, res) {
            const user = await authService.getCurrentUser(
                req.user
            );

            res.json(toUserResponse(user));
        }
    };
}

module.exports = {
    createAuthController
};
