import { useQuery } from "@tanstack/react-query";
import { adminAuditService } from "@/services/adminAuditService";

interface Params {
  action?: string;
  user_id?: number;
}

export function useAdminAuditLogs(params?: Params) {
  return useQuery({
    queryKey: ["admin-audit-logs", params],
    queryFn: () => adminAuditService.getLogs(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
