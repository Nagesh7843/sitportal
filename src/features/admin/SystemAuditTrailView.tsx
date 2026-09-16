import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

export const SystemAuditTrailView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.fetchAuditLogs(selectedEntity || undefined).catch(() => []);
      setLogs(res);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [selectedEntity]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00337c]">history_toggle_off</span>
              <h2 className="text-xl font-bold text-gray-900">System Activity & Security Audit Trail</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Immutable log stream of administrative, eligibility evaluations, and verification actions.
            </p>
          </div>

          {/* Entity Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-600">Filter Event:</label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">All Entities & Actions</option>
              <option value="StudentChangeRequest">Student Change Requests</option>
              <option value="PlacementDrive">Placement Eligibility Runs</option>
              <option value="StudentEnrollment">Academic Transitions</option>
            </select>
          </div>
        </div>

        {/* Audit Stream Table */}
        <div className="mt-5 overflow-x-auto">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
              No audit records matching criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity Type</th>
                  <th className="p-3">Target ID</th>
                  <th className="p-3">Old Value</th>
                  <th className="p-3">New Value / Outcome</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80">
                    <td className="p-3 text-gray-400 font-mono text-[11px]">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recent'}
                    </td>
                    <td className="p-3 font-bold text-[#00337c]">{log.action}</td>
                    <td className="p-3 font-mono text-gray-700">{log.entityType}</td>
                    <td className="p-3 font-mono text-gray-500">#{log.entityId || '—'}</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate">{log.oldValue || '—'}</td>
                    <td className="p-3 font-semibold text-gray-900 max-w-xs truncate">{log.newValue || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
