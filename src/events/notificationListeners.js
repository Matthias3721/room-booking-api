function registerNotificationListeners(eventBus, usersRepository, logger = console) {
    eventBus.subscribe("reservation.cancelled", async event => {
        const { userId, cancelledBy, reservationId } = event.payload;
        if (userId === cancelledBy) return;

        const [owner, actor] = await Promise.all([
            usersRepository.findById(userId),
            usersRepository.findById(cancelledBy)
        ]);

        if (!owner || actor?.role !== "ADMIN") return;

        logger.log(
            `[notification] to: ${owner.email} reservation ${reservationId} was cancelled by ADMIN`
        );
    });
}

module.exports = { registerNotificationListeners };
