const request = require("supertest");
const bcrypt = require("bcryptjs");

const { ensureTestDatabase } = require("../helpers/testDb");
const db = require("../../src/db/knex");
const { createRepositoryBundle } = require("../../src/db/repositories");
const { createApp } = require("../../src/app");

const bundle = createRepositoryBundle(db);
const app = createApp({
    ...bundle,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: "15m"
});

async function registerAndLogin(email) {
    const register = await request(app)
        .post("/api/auth/register")
        .send({ email, password: "password-123" })
        .expect(201);

    const login = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "password-123" })
        .expect(200);

    return {
        token: login.body.accessToken,
        user: register.body
    };
}

async function createAdminAndLogin(email = "admin@example.com") {
    const password = "admin-password-123";
    await db("users").insert({
        email,
        password_hash: await bcrypt.hash(password, 4),
        role: "ADMIN"
    });
    const login = await request(app)
        .post("/api/auth/login")
        .send({ email, password })
        .expect(200);
    return login.body.accessToken;
}

async function createRoom(capacity = 30) {
    const [building] = await db("buildings")
        .insert({ name: "Test Building", address: "Test Street 1" })
        .returning("*");
    const [room] = await db("rooms")
        .insert({ building_id: building.id, name: "101", capacity })
        .returning("*");
    return { building, room };
}

function auth(token) {
    return { Authorization: `Bearer ${token}` };
}

beforeAll(async () => {
    await ensureTestDatabase();
    await db.migrate.latest();
});

beforeEach(async () => {
    await db.raw(
        "TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE"
    );
});

afterAll(async () => {
    await db.destroy();
});

test("registration + login + GET /api/auth/me", async () => {
    const { token, user } = await registerAndLogin("jan@example.com");
    const me = await request(app)
        .get("/api/auth/me")
        .set(auth(token))
        .expect(200);

    expect(me.body).toMatchObject({
        id: user.id,
        email: "jan@example.com",
        role: "USER"
    });
});

test("POST /api/reservations returns 201, Location and persists row", async () => {
    const { token } = await registerAndLogin("jan@example.com");
    const { room } = await createRoom();

    const res = await request(app)
        .post("/api/reservations")
        .set(auth(token))
        .send({
            roomId: room.id,
            participants: 5,
            startTime: "2030-12-20T10:00:00.000Z",
            endTime: "2030-12-20T11:00:00.000Z"
        })
        .expect(201);

    expect(res.headers.location).toBe(`/api/reservations/${res.body.id}`);
    const row = await db("reservations").where({ id: res.body.id }).first();
    expect(row).toBeTruthy();
    expect(row.room_id).toBe(room.id);
});

test("400 contains details for invalid body", async () => {
    const { token } = await registerAndLogin("jan@example.com");
    const { room } = await createRoom();

    const res = await request(app)
        .post("/api/reservations")
        .set(auth(token))
        .send({
            roomId: room.id,
            participants: 0,
            startTime: "2030-12-20T10:00:00.000Z",
            endTime: "2030-12-20T11:00:00.000Z"
        })
        .expect(400);

    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ location: "body", field: "participants" })
        ])
    );
});

test("401 without token", async () => {
    const res = await request(app).get("/api/reservations").expect(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
});

test("403 when USER tries to create room", async () => {
    const { token } = await registerAndLogin("jan@example.com");
    const res = await request(app)
        .post("/api/rooms")
        .set(auth(token))
        .send({ buildingId: 1, name: "Forbidden", capacity: 10 })
        .expect(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
});

test("404 when USER fetches another user's reservation", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const other = await registerAndLogin("other@example.com");
    const { room } = await createRoom();

    const created = await request(app)
        .post("/api/reservations")
        .set(auth(owner.token))
        .send({
            roomId: room.id,
            participants: 4,
            startTime: "2030-12-21T10:00:00.000Z",
            endTime: "2030-12-21T11:00:00.000Z"
        })
        .expect(201);

    const res = await request(app)
        .get(`/api/reservations/${created.body.id}`)
        .set(auth(other.token))
        .expect(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
});

test("409 ROOM_ALREADY_BOOKED for overlapping reservation", async () => {
    const { token } = await registerAndLogin("jan@example.com");
    const { room } = await createRoom();

    await request(app)
        .post("/api/reservations")
        .set(auth(token))
        .send({
            roomId: room.id,
            participants: 4,
            startTime: "2030-12-22T10:00:00.000Z",
            endTime: "2030-12-22T11:00:00.000Z"
        })
        .expect(201);

    const res = await request(app)
        .post("/api/reservations")
        .set(auth(token))
        .send({
            roomId: room.id,
            participants: 4,
            startTime: "2030-12-22T10:30:00.000Z",
            endTime: "2030-12-22T11:30:00.000Z"
        })
        .expect(409);

    expect(res.body.error.code).toBe("ROOM_ALREADY_BOOKED");
});

test("pagination returns meta.total and limited data", async () => {
    const { token } = await registerAndLogin("jan@example.com");
    const { room } = await createRoom();
    const ranges = [
        ["2030-12-23T10:00:00.000Z", "2030-12-23T11:00:00.000Z"],
        ["2030-12-23T12:00:00.000Z", "2030-12-23T13:00:00.000Z"],
        ["2030-12-23T14:00:00.000Z", "2030-12-23T15:00:00.000Z"]
    ];

    for (const [startTime, endTime] of ranges) {
        await request(app)
            .post("/api/reservations")
            .set(auth(token))
            .send({ roomId: room.id, participants: 4, startTime, endTime })
            .expect(201);
    }

    const res = await request(app)
        .get("/api/reservations?page=1&limit=2")
        .set(auth(token))
        .expect(200);

    expect(res.body.meta.total).toBe(3);
    expect(res.body.data).toHaveLength(2);
});

test("ADMIN can authenticate for admin-only API", async () => {
    const token = await createAdminAndLogin();
    const res = await request(app)
        .get("/api/admin/audit-log")
        .set(auth(token))
        .expect(200);
    expect(res.body).toHaveProperty("meta.total", 0);
});
