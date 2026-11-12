"use client";

import { useState } from "react";
import { useAdminAuditLogs } from "@/hooks/useAdminAuditLogs";
import { ShieldCheck, Filter, Clock, User, Activity, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminAuditLogs() {
  const [action, setAction] = useState("");

  const { data: logs, isLoading } = useAdminAuditLogs(
    action ? { action } : undefined
  );

  return (
    <div className="card p-6 bg-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-green-700" size={20} />
          <div>
            <h3 className="font-bold text-slate-900 text-lg">System Security & Audit Trail</h3>
            <p className="text-xs text-slate-500">Live immutable logs of platform transactions and authentication events.</p>
          </div>
        </div>

        {/* Action Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="input-field text-xs py-2 w-48 font-medium"
          >
            <option value="">All system actions</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="USER_LOGOUT">User Logout</option>
            <option value="TRANSACTION_CREATED">Transaction Created</option>
            <option value="TRANSACTION_COMPLETED">Transaction Completed</option>
            <option value="LISTING_CREATED">Listing Created</option>
            <option value="INTEREST_EXPRESSED">Interest Expressed</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      {isLoading ? (
        <div className="py-12 flex justify-center items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin text-green-700" size={24} />
          <span className="text-sm font-medium">Loading audit trail...</span>
        </div>
      ) : !logs || logs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <Activity size={32} className="mx-auto text-slate-300" />
          <p className="text-sm font-medium">No audit events found for this filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Timestamp</th>
                <th className="px-4 py-3">Actor / User ID</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action Event</th>
                <th className="px-4 py-3 rounded-r-lg text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {log.user_id ? `User #${log.user_id}` : "System Kernel"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      log.user_role === "admin" ? "bg-purple-100 text-purple-700" :
                      log.user_role === "farmer" ? "bg-green-100 text-green-700" :
                      log.user_role === "buyer" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {log.user_role || "Anonymous"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-400">
                    {log.ip_address || "127.0.0.1"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
