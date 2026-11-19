const { Router } = require("express");
const validate = require("../../middleware/validate");
const {
    registerBody,
    loginBody
} = require("./auth.schemas");

function createPublicAuthRouter(controller) {
    const router = Router();

    router.post(
        "/register",
        validate({ body: registerBody }),
        controller.register
    );

    router.post(
        "/login",
        validate({ body: loginBody }),
        controller.login
    );

    return router;
}

function createProtectedAuthRouter(controller) {
    const router = Router();

    router.get("/me", controller.me);

    return router;
}

module.exports = {
    createPublicAuthRouter,
    createProtectedAuthRouter
};
