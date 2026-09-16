import React, { useState } from 'react';
import { FacultyMember, NoticeItem, StudentRecord, UserProfile, ViewMode, WorkingBatchConfig } from '@/types';
import { Shield, Award, Users, Megaphone, FileText, Mail, ChevronRight, Activity, Bell, FolderCheck, CheckCircle2, History, Sparkles } from 'lucide-react';
import { FacultyBatchesView } from '@/features/faculty/FacultyBatchesView';
import { ChangeRequestApprovalDesk } from '@/features/admin/ChangeRequestApprovalDesk';
import { SystemAuditTrailView } from '@/features/admin/SystemAuditTrailView';
import { PlacementEligibilityHubTab } from '@/features/placement';

interface HodDashboardProps {
  currentProfile: UserProfile | null;
  facultyList: FacultyMember[];
  notices: NoticeItem[];
  studentsList: StudentRecord[];
  onNavigate: (view: ViewMode) => void;
  onOpenPublishNotice: () => void;
  activeWorkingBatch?: WorkingBatchConfig | null;
  onSaveDefaultBatch?: (batchConfig: WorkingBatchConfig) => Promise<void> | void;
}

export const HodDashboard: React.FC<HodDashboardProps> = ({
  currentProfile,
  facultyList,
  notices,
  studentsList,
  onNavigate,
  onOpenPublishNotice,
  activeWorkingBatch,
  onSaveDefaultBatch
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'change-requests' | 'placement' | 'audit'>('overview');
  const userDept = currentProfile?.department || 'CSE';
  const scopedFaculty = facultyList.filter(f => !f.department || f.department.toUpperCase() === userDept.toUpperCase());
  const scopedStudents = studentsList.filter(s => !s.department || s.department.toUpperCase() === userDept.toUpperCase());
  const scopedNotices = notices;

  return (
    <div className="space-y-6 font-sans text-slate-800">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto custom-scrollbar touch-scroll max-w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'overview' ? 'bg-[#000666] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>HOD Leadership Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'batches' ? 'bg-[#000666] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderCheck className="w-3.5 h-3.5" />
          <span>Batch & Lab Supervision</span>
        </button>
        <button
          onClick={() => setActiveTab('change-requests')}
          className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'change-requests' ? 'bg-[#000666] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Change Verification Desk</span>
        </button>
        <button
          onClick={() => setActiveTab('placement')}
          className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'placement' ? 'bg-[#000666] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Placement Eligibility</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'audit' ? 'bg-[#000666] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Activity Audit</span>
        </button>
      </div>

      {activeTab === 'batches' && (
        <FacultyBatchesView
          facultyEmail={currentProfile?.email}
          facultyDepartment={userDept}
          isFacultyOnly={true}
          onSendBatchNotice={() => onNavigate('notices')}
          activeWorkingBatch={activeWorkingBatch}
          onSaveDefaultBatch={onSaveDefaultBatch}
        />
      )}
      {activeTab === 'change-requests' && <ChangeRequestApprovalDesk />}
      {activeTab === 'placement' && <PlacementEligibilityHubTab onNavigateNotice={() => onNavigate('notices')} />}
      {activeTab === 'audit' && <SystemAuditTrailView />}

      {activeTab === 'overview' && (
        <>
      
      {/* Minimal HOD Executive Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#000666]" />
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Welcome, {currentProfile?.name || 'Dr. A. S. Poornima'}
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-[#000666] text-[10px] font-bold rounded-md border border-blue-200">
              HOD {userDept}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {userDept === 'CSE' ? 'Computer Science & Engineering' : userDept} Department • Sharad Institute of Technology
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenPublishNotice}
            className="px-3.5 py-2 bg-[#000666] hover:bg-[#002171] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Publish Circular</span>
          </button>
          <button
            onClick={() => onNavigate('bulk-email')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Dept Email</span>
          </button>
        </div>
      </div>

      {/* Key Department Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty Roster</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{scopedFaculty.length}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span className="text-indigo-600 font-bold">{scopedFaculty.length} Academic Faculty</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Students</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{scopedStudents.length}</p>
          <p className="text-xs text-slate-500 mt-2">B.Tech Batches ({userDept})</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notices Published</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{notices.length}</p>
          <p className="text-xs text-amber-600 font-medium mt-2">
            {notices.filter(n => n.priority === 'URGENT').length} Urgent Circulars
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dept Attendance</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">88.4%</p>
          <p className="text-xs text-slate-500 mt-2">Above 85% VTU threshold</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Faculty Directory Overview */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Department Faculty Directory
              </h3>
              <p className="text-xs text-slate-500">Faculty members, designations, and specializations</p>
            </div>
            <button
              onClick={() => onNavigate('faculty')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              Full Roster <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {facultyList.slice(0, 5).map((fac) => (
              <div key={fac.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-xs">
                    {fac.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{fac.name}</h4>
                    <p className="text-[11px] text-slate-500">{fac.rank || fac.designation || 'Faculty Member'} • {fac.specialization}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {fac.department || 'CSE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: HOD Executive Actions & Recent Notices */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Latest Department Notices
            </h3>
            <p className="text-xs text-slate-500">Official circulars active on notice board</p>
          </div>

          <div className="space-y-3">
            {[...notices].sort((a, b) => {
              const idA = typeof a.id === 'number' ? a.id : parseInt(String(a.id || 0), 10) || 0;
              const idB = typeof b.id === 'number' ? b.id : parseInt(String(b.id || 0), 10) || 0;
              return idB - idA;
            }).slice(0, 4).map((notice) => (
              <div key={notice.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    notice.priority === 'URGENT' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {notice.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">{notice.publishedAt}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 truncate">{notice.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">{notice.content}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('notices')}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors text-center block"
          >
            Manage All Notices
          </button>
        </div>

      </div>
        </>
      )}
    </div>
  );
};
