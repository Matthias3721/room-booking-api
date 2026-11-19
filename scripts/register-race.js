const baseUrl = "http://localhost:3000";
const email = `race-${Date.now()}@example.com`;
const password = "parallel-password-123";

async function registerOne(index) {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Request-Id": `register-race-${index + 1}`
        },
        body: JSON.stringify({ email, password })
    });

    let json = null;
    try { json = await response.json(); } catch {}

    return {
        index: index + 1,
        status: response.status,
        code: json?.error?.code ?? null
    };
}

(async () => {
    console.log(`Registering the same email 10 times in parallel: ${email}`);

    const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) => registerOne(i))
    );

    for (const result of results) {
        console.log(
            `#${result.index}: ${result.status}` +
            (result.code ? ` (${result.code})` : "")
        );
    }

    console.log(
        `Summary: 201=${results.filter(r => r.status === 201).length}, ` +
        `409=${results.filter(r => r.status === 409).length}, ` +
        `500=${results.filter(r => r.status === 500).length}`
    );
})().catch(err => {
    console.error(err);
    process.exitCode = 1;
});
