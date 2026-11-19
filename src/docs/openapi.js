const errorRef = { $ref: "#/components/schemas/ErrorResponse" };

const jsonResponse = (description, schema) => ({
    description,
    ...(schema
        ? {
            content: {
                "application/json": { schema }
            }
        }
        : {})
});

const errorResponse = description => jsonResponse(description, errorRef);

module.exports = {
    openapi: "3.0.3",
    info: {
        title: "Room Booking API",
        version: "5.0.0",
        description: "Zadanie 05 - testy, Docker Compose, eventy i CI"
    },
    servers: [{ url: "http://localhost:3000" }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
        schemas: {
            ErrorDetail: {
                type: "object",
                properties: {
                    location: { type: "string" },
                    field: { type: "string" },
                    message: { type: "string" }
                }
            },
            ErrorResponse: {
                type: "object",
                required: ["error"],
                properties: {
                    error: {
                        type: "object",
                        required: ["code", "message", "requestId"],
                        properties: {
                            code: { type: "string" },
                            message: { type: "string" },
                            details: {
                                type: "array",
                                items: { $ref: "#/components/schemas/ErrorDetail" }
                            },
                            requestId: { type: "string" }
                        }
                    }
                }
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    email: { type: "string", format: "email" },
                    role: { type: "string", enum: ["USER", "ADMIN"] },
                    createdAt: { type: "string", format: "date-time" }
                }
            },
            UserSummary: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    email: { type: "string", format: "email" }
                }
            },
            Building: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                    address: { type: "string" },
                    roomsCount: { type: "integer" },
                    createdAt: { type: "string", format: "date-time" }
                }
            },
            BuildingSummary: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    name: { type: "string" }
                }
            },
            Room: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                    capacity: { type: "integer" },
                    building: { $ref: "#/components/schemas/BuildingSummary" }
                }
            },
            Reservation: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    room: { $ref: "#/components/schemas/Room" },
                    user: { $ref: "#/components/schemas/UserSummary" },
                    participants: { type: "integer" },
                    startTime: { type: "string", format: "date-time" },
                    endTime: { type: "string", format: "date-time" },
                    status: { type: "string", enum: ["CONFIRMED", "CANCELLED"] },
                    createdAt: { type: "string", format: "date-time" },
                    cancelledAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true
                    }
                }
            },
            LoginResponse: {
                type: "object",
                properties: {
                    accessToken: { type: "string" },
                    tokenType: { type: "string", example: "Bearer" },
                    expiresIn: { type: "string", example: "15m" }
                }
            },
            PaginationMeta: {
                type: "object",
                properties: {
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    total: { type: "integer" },
                    totalPages: { type: "integer" }
                }
            }
        }
    },
    security: [{ bearerAuth: [] }],
    paths: {
        "/api/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register USER account",
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                additionalProperties: false,
                                properties: {
                                    email: { type: "string", format: "email" },
                                    password: { type: "string", minLength: 10, maxLength: 72 }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": jsonResponse("Created", { $ref: "#/components/schemas/User" }),
                    "400": errorResponse("Validation error"),
                    "409": errorResponse("Email already registered")
                }
            }
        },
        "/api/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Login and receive JWT",
                security: [],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                additionalProperties: false,
                                properties: {
                                    email: { type: "string", format: "email" },
                                    password: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": jsonResponse("Logged in", { $ref: "#/components/schemas/LoginResponse" }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Invalid credentials")
                }
            }
        },
        "/api/auth/me": {
            get: {
                tags: ["Auth"],
                summary: "Current user",
                responses: {
                    "200": jsonResponse("Current user", { $ref: "#/components/schemas/User" }),
                    "401": errorResponse("Missing, invalid or expired token"),
                    "404": errorResponse("User not found")
                }
            }
        },
        "/api/buildings": {
            get: {
                tags: ["Buildings"],
                summary: "List buildings",
                responses: {
                    "200": jsonResponse("Buildings", { type: "array", items: { $ref: "#/components/schemas/Building" } }),
                    "401": errorResponse("Authentication required")
                }
            },
            post: {
                tags: ["Buildings"],
                summary: "Create building (ADMIN)",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "address"],
                                additionalProperties: false,
                                properties: {
                                    name: { type: "string" },
                                    address: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "201": jsonResponse("Created", { $ref: "#/components/schemas/Building" }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "403": errorResponse("ADMIN role required"),
                    "409": errorResponse("Duplicate building name")
                }
            }
        },
        "/api/buildings/{id}": {
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
            get: {
                tags: ["Buildings"],
                summary: "Get building",
                responses: {
                    "200": jsonResponse("Building", { $ref: "#/components/schemas/Building" }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "404": errorResponse("Building not found")
                }
            },
            patch: {
                tags: ["Buildings"],
                summary: "Update building (ADMIN)",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object",
                        additionalProperties: false,
                        properties: { name: { type: "string" }, address: { type: "string" } }
                    } } }
                },
                responses: {
                    "200": jsonResponse("Updated", { $ref: "#/components/schemas/Building" }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "403": errorResponse("ADMIN role required"),
                    "404": errorResponse("Building not found"),
                    "409": errorResponse("Duplicate name")
                }
            },
            delete: {
                tags: ["Buildings"],
                summary: "Delete building (ADMIN)",
                responses: {
                    "204": { description: "Deleted" },
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "403": errorResponse("ADMIN role required"),
                    "404": errorResponse("Building not found"),
                    "409": errorResponse("Building is referenced")
                }
            }
        },
        "/api/buildings/{id}/rooms": {
            get: {
                tags: ["Buildings"],
                summary: "List rooms in building",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
                responses: {
                    "200": jsonResponse("Rooms", { type: "array", items: { $ref: "#/components/schemas/Room" } }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "404": errorResponse("Building not found")
                }
            }
        },
        "/api/rooms": {
            get: {
                tags: ["Rooms"],
                summary: "List rooms",
                responses: {
                    "200": jsonResponse("Rooms", { type: "array", items: { $ref: "#/components/schemas/Room" } }),
                    "401": errorResponse("Authentication required")
                }
            },
            post: {
                tags: ["Rooms"],
                summary: "Create room (ADMIN)",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object",
                        required: ["buildingId", "name", "capacity"],
                        additionalProperties: false,
                        properties: {
                            buildingId: { type: "integer", minimum: 1 },
                            name: { type: "string" },
                            capacity: { type: "integer", minimum: 1 }
                        }
                    } } }
                },
                responses: {
                    "201": jsonResponse("Created", { $ref: "#/components/schemas/Room" }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "403": errorResponse("ADMIN role required"),
                    "404": errorResponse("Building not found"),
                    "409": errorResponse("Duplicate room name")
                }
            }
        },
        "/api/rooms/{id}": {
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
            get: {
                tags: ["Rooms"],
                summary: "Get room",
                responses: {
                    "200": jsonResponse("Room", { $ref: "#/components/schemas/Room" }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "404": errorResponse("Room not found")
                }
            },
            patch: {
                tags: ["Rooms"],
                summary: "Update room (ADMIN)",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                            buildingId: { type: "integer", minimum: 1 },
                            name: { type: "string" },
                            capacity: { type: "integer", minimum: 1 }
                        }
                    } } }
                },
                responses: {
                    "200": jsonResponse("Updated", { $ref: "#/components/schemas/Room" }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "403": errorResponse("ADMIN role required"),
                    "404": errorResponse("Room/building not found"),
                    "409": errorResponse("Duplicate room name")
                }
            },
            delete: {
                tags: ["Rooms"],
                summary: "Delete room (ADMIN)",
                responses: {
                    "204": { description: "Deleted" },
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "403": errorResponse("ADMIN role required"),
                    "404": errorResponse("Room not found"),
                    "409": errorResponse("Room is referenced")
                }
            }
        },
        "/api/reservations": {
            get: {
                tags: ["Reservations"],
                summary: "List reservations (USER: own, ADMIN: all)",
                parameters: [
                    ["roomId", "integer"],
                    ["buildingId", "integer"],
                    ["userId", "integer"],
                    ["page", "integer"],
                    ["limit", "integer"]
                ].map(([name, type]) => ({ name, in: "query", required: false, schema: { type } })).concat([
                    { name: "status", in: "query", required: false, schema: { type: "string", enum: ["CONFIRMED", "CANCELLED"] } },
                    { name: "from", in: "query", required: false, schema: { type: "string", format: "date-time" } },
                    { name: "to", in: "query", required: false, schema: { type: "string", format: "date-time" } },
                    { name: "sort", in: "query", required: false, schema: { type: "string", enum: ["startTime", "-startTime", "createdAt", "-createdAt", "participants", "-participants"] } }
                ]),
                responses: {
                    "200": jsonResponse("Reservations", {
                        type: "object",
                        properties: {
                            data: { type: "array", items: { $ref: "#/components/schemas/Reservation" } },
                            meta: { $ref: "#/components/schemas/PaginationMeta" }
                        }
                    }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "403": errorResponse("USER attempted userId filter")
                }
            },
            post: {
                tags: ["Reservations"],
                summary: "Create reservation for current user",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object",
                        required: ["roomId", "participants", "startTime", "endTime"],
                        additionalProperties: false,
                        properties: {
                            roomId: { type: "integer", minimum: 1 },
                            participants: { type: "integer", minimum: 1 },
                            startTime: { type: "string", format: "date-time" },
                            endTime: { type: "string", format: "date-time" }
                        }
                    } } }
                },
                responses: {
                    "201": jsonResponse("Created", { $ref: "#/components/schemas/Reservation" }),
                    "400": errorResponse("Validation/business validation"),
                    "401": errorResponse("Authentication required"),
                    "404": errorResponse("Room not found"),
                    "409": errorResponse("Capacity or booking conflict")
                }
            }
        },
        "/api/reservations/{id}": {
            get: {
                tags: ["Reservations"],
                summary: "Get own reservation or any as ADMIN",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
                responses: {
                    "200": jsonResponse("Reservation", { $ref: "#/components/schemas/Reservation" }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "404": errorResponse("Not found or hidden from another USER")
                }
            }
        },
        "/api/reservations/{id}/cancel": {
            patch: {
                tags: ["Reservations"],
                summary: "Cancel own reservation or any as ADMIN",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
                responses: {
                    "200": jsonResponse("Cancelled", { $ref: "#/components/schemas/Reservation" }),
                    "400": errorResponse("Validation error"),
                    "401": errorResponse("Authentication required"),
                    "404": errorResponse("Not found or hidden from another USER"),
                    "409": errorResponse("Reservation already started")
                }
            }
        }
    }
};
