import { useQuery } from "@tanstack/react-query";
import { adminAuditService } from "@/services/adminAudit";
import { useUser } from "@/hooks/useUser";

export function useAuditLogs(
  offset: number = 0,
  limit: number = 50
) {
  const { isAdmin } = useUser();

  return useQuery({
    queryKey: ["admin-audit-logs", offset, limit],
    queryFn: () => adminAuditService.getLogs(offset, limit),
    enabled: isAdmin,              // 🔐 HARD ADMIN GATE
    staleTime: 30 * 1000,           // 30s cache
    refetchInterval: 60 * 1000,     // auto-refresh (admin monitoring)
  });
}
