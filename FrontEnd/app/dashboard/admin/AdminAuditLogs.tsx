"use client";

import { useState } from "react";
import { useAdminAuditLogs } from "@/hooks/useAdminAuditLogs";

export default function AdminAuditLogs() {
  const [action, setAction] = useState("");

  const { data: logs, isLoading } = useAdminAuditLogs(
    action ? { action } : undefined
  );

  if (isLoading) return <p>Loading audit logs...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Audit Logs</h1>

      {/* FILTER */}
      <div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All actions</option>
          <option value="USER_LOGIN">User Login</option>
          <option value="USER_LOGOUT">User Logout</option>
          <option value="TRANSACTION_CREATED">Transaction Created</option>
          <option value="TRANSACTION_COMPLETED">Transaction Completed</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Time</th>
              <th className="p-2">User</th>
              <th className="p-2">Role</th>
              <th className="p-2">Action</th>
              <th className="p-2">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-2">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="p-2 text-center">
                  {log.user_id ?? "System"}
                </td>
                <td className="p-2 text-center">
                  {log.user_role ?? "-"}
                </td>
                <td className="p-2 font-medium">{log.action}</td>
                <td className="p-2 text-center">
                  {log.ip_address ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
