const db = require("../src/db/knex");

const baseUrl = "http://localhost:3000";
const roomId = 5;
const startTime = "2027-02-10T10:00:00.000Z";
const endTime = "2027-02-10T11:00:00.000Z";

const body = {
    roomId,
    participants: 5,
    startTime,
    endTime
};

async function login() {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: "jan@example.com",
            password: "user-password-123"
        })
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
    }

    return (await response.json()).accessToken;
}

async function cleanup() {
    await db("reservations")
        .where({ room_id: roomId })
        .andWhere("start_time", startTime)
        .andWhere("end_time", endTime)
        .del();
}

async function sendOne(index, token) {
    const response = await fetch(`${baseUrl}/api/reservations`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-Request-Id": `race-${index + 1}`
        },
        body: JSON.stringify(body)
    });

    let json = null;
    try { json = await response.json(); } catch {}

    return {
        index: index + 1,
        status: response.status,
        code: json?.error?.code ?? null
    };
}

async function countConfirmed() {
    const { count } = await db("reservations")
        .where({ room_id: roomId, status: "CONFIRMED" })
        .andWhere("start_time", "<", endTime)
        .andWhere("end_time", ">", startTime)
        .count({ count: "*" })
        .first();

    return Number(count);
}

(async () => {
    try {
        await cleanup();
        const token = await login();

        console.log(
            `Sending 10 parallel authenticated requests for room ${roomId}, ${startTime} - ${endTime}`
        );

        const results = await Promise.all(
            Array.from({ length: 10 }, (_, i) => sendOne(i, token))
        );

        for (const result of results) {
            console.log(
                `#${result.index}: ${result.status}` +
                (result.code ? ` (${result.code})` : "")
            );
        }

        const confirmed = await countConfirmed();
        console.log(`CONFIRMED overlapping reservations in DB: ${confirmed}`);
        console.log(
            `Summary: 201=${results.filter(r => r.status === 201).length}, ` +
            `409=${results.filter(r => r.status === 409).length}`
        );
    } finally {
        await db.destroy();
    }
})().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
