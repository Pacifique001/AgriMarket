import api from "./api";

/**
 * AdminAuditService
 * Fetches system audit logs (admin only).
 */
export const adminAuditService = {
  async getLogs(offset: number = 0, limit: number = 50) {
    const response = await api.get("/admin/audit-logs", {
      params: { offset, limit },
    });
    return response.data;
  },

  async getLogById(logId: number) {
    const response = await api.get(`/admin/audit-logs/${logId}`);
    return response.data;
  },
};
