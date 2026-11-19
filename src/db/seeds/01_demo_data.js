const bcrypt = require("bcryptjs");

exports.seed = async function seed(knex) {
    await knex.raw(
        "TRUNCATE audit_log, reservations, rooms, buildings, users RESTART IDENTITY CASCADE"
    );

    const rounds = 10;
    const [adminHash, janHash, annaHash] = await Promise.all([
        bcrypt.hash("admin-password-123", rounds),
        bcrypt.hash("user-password-123", rounds),
        bcrypt.hash("anna-password-123", rounds)
    ]);

    await knex("users").insert([
        {
            email: "admin@example.com",
            password_hash: adminHash,
            role: "ADMIN"
        },
        {
            email: "jan@example.com",
            password_hash: janHash,
            role: "USER"
        },
        {
            email: "anna@example.com",
            password_hash: annaHash,
            role: "USER"
        }
    ]);

    await knex("buildings").insert([
        {
            name: "Budynek A",
            address: "ul. Warszawska 24, Krakow"
        },
        {
            name: "Budynek B",
            address: "ul. Dluga 10, Krakow"
        }
    ]);

    await knex("rooms").insert([
        { building_id: 1, name: "101", capacity: 30 },
        { building_id: 1, name: "102", capacity: 15 },
        { building_id: 1, name: "201", capacity: 50 },
        { building_id: 2, name: "101", capacity: 20 },
        { building_id: 2, name: "Audytorium", capacity: 120 }
    ]);

    await knex("reservations").insert([
        { room_id: 1, user_id: 2, participants: 10, start_time: "2026-10-20T10:00:00.000Z", end_time: "2026-10-20T12:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-10-19T08:00:00.000Z" },
        { room_id: 1, user_id: 3, participants: 8, start_time: "2026-12-01T10:00:00.000Z", end_time: "2026-12-01T11:00:00.000Z", status: "CANCELLED", cancelled_at: "2026-11-01T10:00:00.000Z", created_at: "2026-10-25T09:00:00.000Z" },
        { room_id: 1, user_id: 2, participants: 12, start_time: "2026-12-01T10:00:00.000Z", end_time: "2026-12-01T11:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-10-26T09:00:00.000Z" },
        { room_id: 2, user_id: 3, participants: 6, start_time: "2026-12-01T11:00:00.000Z", end_time: "2026-12-01T12:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-10-26T10:00:00.000Z" },
        { room_id: 3, user_id: 2, participants: 20, start_time: "2026-12-02T09:00:00.000Z", end_time: "2026-12-02T10:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-10-27T08:00:00.000Z" },
        { room_id: 1, user_id: 3, participants: 5, start_time: "2026-12-03T09:00:00.000Z", end_time: "2026-12-03T10:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-10-28T08:00:00.000Z" },
        { room_id: 2, user_id: 2, participants: 6, start_time: "2026-12-03T10:00:00.000Z", end_time: "2026-12-03T11:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-10-29T08:00:00.000Z" },
        { room_id: 3, user_id: 3, participants: 7, start_time: "2026-12-03T11:00:00.000Z", end_time: "2026-12-03T12:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-10-30T08:00:00.000Z" },
        { room_id: 4, user_id: 2, participants: 8, start_time: "2026-12-03T12:00:00.000Z", end_time: "2026-12-03T13:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-10-31T08:00:00.000Z" },
        { room_id: 5, user_id: 3, participants: 50, start_time: "2026-12-04T08:00:00.000Z", end_time: "2026-12-04T09:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-01T08:00:00.000Z" },
        { room_id: 1, user_id: 2, participants: 9, start_time: "2026-12-05T09:00:00.000Z", end_time: "2026-12-05T10:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T08:00:00.000Z" },
        { room_id: 2, user_id: 3, participants: 5, start_time: "2026-12-05T10:00:00.000Z", end_time: "2026-12-05T11:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T08:10:00.000Z" },
        { room_id: 3, user_id: 2, participants: 15, start_time: "2026-12-06T09:00:00.000Z", end_time: "2026-12-06T10:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T08:20:00.000Z" },
        { room_id: 4, user_id: 3, participants: 10, start_time: "2026-12-06T10:00:00.000Z", end_time: "2026-12-06T11:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T08:30:00.000Z" },
        { room_id: 5, user_id: 2, participants: 60, start_time: "2026-12-07T09:00:00.000Z", end_time: "2026-12-07T10:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T08:40:00.000Z" },
        { room_id: 1, user_id: 3, participants: 5, start_time: "2026-12-08T09:00:00.000Z", end_time: "2026-12-08T10:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T08:50:00.000Z" },
        { room_id: 2, user_id: 2, participants: 7, start_time: "2026-12-08T10:00:00.000Z", end_time: "2026-12-08T11:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T09:00:00.000Z" },
        { room_id: 3, user_id: 3, participants: 18, start_time: "2026-12-09T09:00:00.000Z", end_time: "2026-12-09T10:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T09:10:00.000Z" },
        { room_id: 4, user_id: 2, participants: 12, start_time: "2026-12-09T10:00:00.000Z", end_time: "2026-12-09T11:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T09:20:00.000Z" },
        { room_id: 5, user_id: 3, participants: 70, start_time: "2026-12-10T09:00:00.000Z", end_time: "2026-12-10T10:00:00.000Z", status: "CONFIRMED", cancelled_at: null, created_at: "2026-11-02T09:30:00.000Z" }
    ]);
};
