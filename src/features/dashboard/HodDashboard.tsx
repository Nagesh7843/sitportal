import React from 'react';
import { FacultyMember, NoticeItem, StudentRecord, UserProfile, ViewMode } from '@/types';
import { Shield, Award, Users, Megaphone, FileText, Mail, ChevronRight, Activity, Bell } from 'lucide-react';

interface HodDashboardProps {
  currentProfile: UserProfile | null;
  facultyList: FacultyMember[];
  notices: NoticeItem[];
  studentsList: StudentRecord[];
  onNavigate: (view: ViewMode) => void;
  onOpenPublishNotice: () => void;
}

export const HodDashboard: React.FC<HodDashboardProps> = ({
  currentProfile,
  facultyList,
  notices,
  studentsList,
  onNavigate,
  onOpenPublishNotice
}) => {
  const onCampusCount = facultyList.filter(f => f.status === 'ON CAMPUS').length;
  const inLabCount = facultyList.filter(f => f.status === 'IN LAB').length;
  const inMeetingCount = facultyList.filter(f => f.status === 'IN MEETING').length;

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* HOD Executive Header */}
      <section className="bg-gradient-to-r from-[#000666] via-[#1a237e] to-[#002171] text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-200 font-semibold text-xs border border-white/20">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Department Leadership & Monitoring Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome, {currentProfile?.name || 'Dr. A. S. Poornima'} (HOD CSE)
            </h1>
            <p className="text-cyan-100 text-xs sm:text-sm max-w-xl">
              Computer Science & Engineering Department • Siddaganga Institute of Technology
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenPublishNotice}
              className="px-4 py-2.5 bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg hover:bg-amber-300 transition-all text-xs flex items-center gap-2"
            >
              <Megaphone className="w-4 h-4" />
              Publish HOD Circular
            </button>
            <button
              onClick={() => onNavigate('bulk-email')}
              className="px-4 py-2.5 bg-white/10 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-xs flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Department Email
            </button>
          </div>
        </div>
      </section>

      {/* Key Department Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Faculty Roster</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{facultyList.length || 42}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span className="text-emerald-600 font-bold">{onCampusCount || 28} On Campus</span>
            <span>•</span>
            <span>{inLabCount || 8} In Lab</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enrolled Students</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{studentsList.length || 1240}</p>
          <p className="text-xs text-slate-500 mt-2">B.Tech Batches (2022 - 2026)</p>
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
        
        {/* Left 2 Cols: Live Faculty Presence Matrix */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Department Faculty Presence Matrix
              </h3>
              <p className="text-xs text-slate-500">Live campus check-in and availability status</p>
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

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                  fac.status === 'ON CAMPUS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  fac.status === 'IN LAB' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                  fac.status === 'IN MEETING' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {fac.status}
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
    </div>
  );
};
