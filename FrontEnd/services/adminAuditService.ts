import api from "./api";

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_role: string | null;
  action: string;
  resource: string | null;
  resource_id: number | null;
  ip_address: string | null;
  created_at: string;
}

export const adminAuditService = {
  async getLogs(params?: {
    action?: string;
    user_id?: number;
    limit?: number;
  }) {
    const response = await api.get<AuditLog[]>(
      "/admin/audit-logs",
      { params }
    );
    return response.data;
  },
};
