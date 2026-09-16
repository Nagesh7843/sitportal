import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

export const ChangeRequestApprovalDesk: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verifierComments, setVerifierComments] = useState<Record<number, string>>({});

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await apiService.getStudentChangeRequests(undefined, filterStatus).catch(() => []);
      setRequests(res);
    } catch (err) {
      console.warn('Failed to load change requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const handleVerify = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    setActionMsg(null);
    try {
      const comment = verifierComments[id] || (status === 'APPROVED' ? 'Approved by verification desk.' : 'Rejected due to documentation mismatch.');
      await apiService.verifyStudentChangeRequest(id, {
        status,
        verifiedByUserId: 1,
        comments: comment
      });
      setActionMsg({
        type: 'success',
        text: `Request #${id} successfully ${status.toLowerCase()} and student record updated.`
      });
      await loadRequests();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Action failed.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00337c]">verified_user</span>
              <h2 className="text-xl font-bold text-gray-900">Student Self-Service Change Request Approval Desk</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Verify institution-controlled and student-submitted profile changes with cryptographic audit accountability.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-xl gap-1 self-start sm:self-auto">
            {['PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterStatus === st ? 'bg-white text-[#00337c] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {actionMsg && (
          <div className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            actionMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <span className="material-symbols-outlined text-[18px]">{actionMsg.type === 'success' ? 'check_circle' : 'error'}</span>
            {actionMsg.text}
          </div>
        )}

        {/* Requests Table */}
        <div className="mt-5 overflow-x-auto">
          {requests.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
              No {filterStatus.toLowerCase()} change requests found.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[10px] font-bold">
                  <th className="p-3">ID & PRN</th>
                  <th className="p-3">Target Field</th>
                  <th className="p-3">Original Value</th>
                  <th className="p-3">Requested Update</th>
                  <th className="p-3">Student Reason</th>
                  <th className="p-3">Verifier Comment & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/80">
                    <td className="p-3 font-mono">
                      <div className="font-bold text-gray-900">#{req.id}</div>
                      <div className="text-[11px] text-[#00337c] font-bold">{req.prn}</div>
                    </td>
                    <td className="p-3 font-semibold text-gray-900 capitalize">{req.fieldName}</td>
                    <td className="p-3 text-gray-500">{req.oldValue || '—'}</td>
                    <td className="p-3 font-bold font-mono text-emerald-700">{req.newValue}</td>
                    <td className="p-3 text-gray-600 max-w-xs">{req.reason || '—'}</td>
                    <td className="p-3">
                      {req.status === 'PENDING' ? (
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <input
                            type="text"
                            placeholder="Optional approval note..."
                            value={verifierComments[req.id] || ''}
                            onChange={(e) => setVerifierComments({ ...verifierComments, [req.id]: e.target.value })}
                            className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-[11px] text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleVerify(req.id, 'APPROVED')}
                              disabled={processingId === req.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerify(req.id, 'REJECTED')}
                              disabled={processingId === req.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {req.status}
                          </span>
                          {req.comments && <p className="text-[10px] text-gray-400 mt-1">{req.comments}</p>}
                        </div>
                      )}
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
