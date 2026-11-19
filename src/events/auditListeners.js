function registerAuditListeners(eventBus, auditLogRepository) {
    const save = async event => {
        await auditLogRepository.create({
            eventType: event.name,
            payload: event.payload,
            createdAt: event.occurredAt
        });
    };

    eventBus.subscribe("reservation.created", save);
    eventBus.subscribe("reservation.cancelled", save);
}

module.exports = { registerAuditListeners };
