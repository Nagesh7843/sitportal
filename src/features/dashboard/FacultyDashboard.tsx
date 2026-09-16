import React, { useState } from 'react';
import { ViewMode, UploadAsset, StudentRecord, DepartmentEvent, UserProfile, UserRole, WorkingBatchConfig } from '@/types';
import { FacultyBatchesView } from '@/features/faculty/FacultyBatchesView';

interface FacultyDashboardProps {
  onNavigate: (view: ViewMode, emailContext?: string) => void;
  uploads: UploadAsset[];
  students: StudentRecord[];
  events: DepartmentEvent[];
  onOpenAssignmentModal: () => void;
  onOpenNoticeModal: () => void;
  onOpenMaterialModal: () => void;
  currentProfile?: UserProfile | null;
  userRole?: UserRole;
  activeWorkingBatch?: WorkingBatchConfig | null;
  onSaveDefaultBatch?: (batchConfig: WorkingBatchConfig) => Promise<void> | void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  onNavigate,
  uploads,
  students,
  events,
  onOpenAssignmentModal,
  onOpenNoticeModal,
  onOpenMaterialModal,
  currentProfile,
  userRole,
  activeWorkingBatch,
  onSaveDefaultBatch
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'batches'>('overview');

  return (
    <div className="space-y-6">
      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#d6d9e0] shadow-xs overflow-x-auto custom-scrollbar touch-scroll max-w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview' ? 'bg-[#000666] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">dashboard</span>
          <span>Faculty Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'batches' ? 'bg-[#000666] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">groups</span>
          <span>My Assigned Batches & Student Monitoring</span>
        </button>
      </div>

      {activeTab === 'batches' ? (
        <FacultyBatchesView
          facultyEmail={currentProfile?.email}
          facultyDepartment={currentProfile?.department || 'CSE'}
          isFacultyOnly={true}
          onSendBatchNotice={(batchName) => {
            onNavigate('notices');
          }}
          activeWorkingBatch={activeWorkingBatch}
          onSaveDefaultBatch={onSaveDefaultBatch}
        />
      ) : (
        <>
          {/* Active Working Batch Minimal Strip */}
          <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-[11px] font-extrabold px-2 py-0.5 bg-[#000666] text-white rounded-lg shrink-0">
                {currentProfile?.department || 'CSE'}
              </span>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="text-xs font-bold text-slate-500">Working Batch:</span>
                <span className="text-xs font-extrabold text-slate-900">
                  {activeWorkingBatch ? `${activeWorkingBatch.academicYear} • ${activeWorkingBatch.division} • ${activeWorkingBatch.batchGroup === 'ALL' ? 'All' : activeWorkingBatch.batchGroup}` : 'TE • Div A • A1'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Monitored" />
              </div>
            </div>

            <button
              onClick={() => setActiveTab('batches')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#000666]">groups</span>
              <span>Monitor Batch</span>
            </button>
          </div>

          {/* Full-width Content Creation & Recent Uploads Center */}
          <div className="flex flex-col gap-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload Assignment Action Card */}
            <div
              onClick={onOpenAssignmentModal}
              className="bg-[#000666] text-white p-6 rounded-xl shadow-md flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-transform"
            >
              <span className="material-symbols-outlined text-[36px] mb-4 group-hover:rotate-12 transition-transform text-[#bdc2ff]">
                upload_file
              </span>
              <div>
                <h3 className="font-bold text-[16px]">Upload Assignment</h3>
                <p className="text-[#bdc2ff] text-[11px] mt-1">Set deadlines & auto-grading rules</p>
              </div>
            </div>

            {/* Add Notice Action Card */}
            <div
              onClick={onOpenNoticeModal}
              className="bg-[#759efd] text-[#00337c] p-6 rounded-xl shadow-md flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-transform"
            >
              <span className="material-symbols-outlined text-[36px] mb-4 group-hover:scale-110 transition-transform text-[#001945]">
                campaign
              </span>
              <div>
                <h3 className="font-bold text-[16px]">Add Notice</h3>
                <p className="text-[#00337c]/80 text-[11px] mt-1">Push to student mobile apps</p>
              </div>
            </div>

            {/* Study Material Action Card */}
            <div
              onClick={onOpenMaterialModal}
              className="bg-[#003909] text-[#a3f69c] p-6 rounded-xl shadow-md flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-transform"
            >
              <span className="material-symbols-outlined text-[36px] mb-4 group-hover:-translate-y-1 transition-transform text-[#a3f69c]">
                menu_book
              </span>
              <div>
                <h3 className="font-bold text-[16px]">Study Material</h3>
                <p className="text-[#a3f69c]/80 text-[11px] mt-1">PDFs, Videos & Repo Links</p>
              </div>
            </div>
          </div>

          {/* Recent Uploads Table Card */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-[#c6c5d4] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[18px] text-[#071e27]">Recent Uploads</h2>
              <button
                onClick={() => onNavigate('curriculum')}
                className="text-[#000666] font-semibold text-[13px] flex items-center gap-1 hover:underline"
              >
                <span>View Archive</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-[#c6c5d4] text-[#454652] font-semibold bg-[#e6f6ff]">
                  <tr>
                    <th className="py-2.5 px-3">Asset Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c5d4]/40">
                  {uploads.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#f3faff] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#071e27]">{asset.title}</td>
                      <td className="py-3 px-3 text-[#454652]">{asset.category}</td>
                      <td className="py-3 px-3 text-[#454652]">{asset.uploadedAt}</td>
                      <td className="py-3 px-3">
                        {asset.status === 'Published' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-orange-600 font-bold text-[11px] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                            Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="p-1 hover:bg-[#cfe6f2] rounded text-[#454652] hover:text-[#000666]">
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
};
