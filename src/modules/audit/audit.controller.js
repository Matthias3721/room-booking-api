function createAuditController(auditService) {
    return {
        async list(req, res) {
            const filters = req.validated.query;
            const result = await auditService.listAuditLog(filters);
            res.json({
                data: result.items,
                meta: {
                    page: filters.page,
                    limit: filters.limit,
                    total: result.total,
                    totalPages: result.total === 0 ? 0 : Math.ceil(result.total / filters.limit)
                }
            });
        }
    };
}
module.exports = { createAuditController };
