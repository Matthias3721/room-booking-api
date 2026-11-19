const { z } = require("zod");

const idParams = z.object({
    id: z.coerce.number().int().positive()
});

const createRoomBody = z.object({
    buildingId: z.number().int().positive(),
    name: z.string().trim().min(1).max(100),
    capacity: z.number().int().positive()
}).strict();

const updateRoomBody = z.object({
    buildingId: z.number().int().positive().optional(),
    name: z.string().trim().min(1).max(100).optional(),
    capacity: z.number().int().positive().optional()
}).strict().refine(
    value => Object.keys(value).length > 0,
    { message: "At least one field is required" }
);

module.exports = {
    idParams,
    createRoomBody,
    updateRoomBody
};
