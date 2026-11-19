function createUsersRepository(seed = []) {
    const users = seed.map(user => ({ ...user }));
    let nextId = Math.max(0, ...users.map(user => user.id)) + 1;

    async function findById(id) {
        return users.find(user => user.id === id) ?? null;
    }

    async function findByEmail(email) {
        return users.find(user => user.email === email) ?? null;
    }

    async function create({ email, passwordHash, role }) {
        const user = {
            id: nextId++,
            email,
            passwordHash,
            role,
            createdAt: new Date()
        };

        users.push(user);
        return user;
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
