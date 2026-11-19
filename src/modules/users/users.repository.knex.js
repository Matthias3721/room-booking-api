function toUser(row) {
    if (!row) return null;

    return {
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        createdAt: row.created_at
    };
}

function createUsersRepository(db) {
    async function findById(id) {
        return toUser(
            await db("users")
                .where({ id })
                .first()
        );
    }

    async function findByEmail(email) {
        return toUser(
            await db("users")
                .where({ email })
                .first()
        );
    }

    async function create({ email, passwordHash, role }) {
        const [row] = await db("users")
            .insert({
                email,
                password_hash: passwordHash,
                role
            })
            .returning("*");

        return toUser(row);
    }

    return {
        findById,
        findByEmail,
        create
    };
}

module.exports = {
    createUsersRepository
};
