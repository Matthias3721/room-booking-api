const { z } = require("zod");

try {
    process.loadEnvFile();
} catch {
    // .env is optional when variables are supplied externally.
}

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"])
        .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.url(),
    JWT_SECRET: z.string()
        .min(32, "JWT_SECRET must have at least 32 characters"),
    JWT_EXPIRES_IN: z.string().min(1).default("15m"),
    REPOSITORY_MODE: z.enum(["knex", "memory"]).default("knex")
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("Invalid environment configuration:");

    for (const issue of result.error.issues) {
        console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }

    process.exit(1);
}

module.exports = Object.freeze(result.data);
