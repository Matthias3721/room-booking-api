function createAuditService({ auditLogRepository }) {
    async function listAuditLog(filters) {
        return auditLogRepository.list(filters);
    }
    return { listAuditLog };
}
module.exports = { createAuditService };
