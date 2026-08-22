import React, { useState, useEffect } from 'react';
import { NoticeItem } from '@/types/notice';
import { StudentRecord } from '@/types';
import { EmailLog } from '@/types/communication';
import { apiService } from '@/services/api';

interface AnalyticsViewProps {
  notices: NoticeItem[];
  students: StudentRecord[];
  emails: EmailLog[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ notices, students, emails }) => {
  const [dbOverview, setDbOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const loadSystemAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getSystemOverview();
      setDbOverview(data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Failed to load system overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSystemAnalytics();
  }, [notices.length, students.length]);

  // Fallback / Live Database Values
  const totalPublishedNotices = dbOverview?.totalPublishedNotices ?? notices.length;
  const activeStudentsCount = dbOverview?.activeStudentsCount ?? students.length;
  const avgReadRate = dbOverview?.avgReadRate ?? '0.0';
  const fcmDeliveries = dbOverview?.fcmPushDeliveries ?? emails.length;
  const categoryCounts = dbOverview?.categoryCounts ?? {
    exam: notices.filter(n => n.category === 'Exam').length,
    academic: notices.filter(n => n.category === 'Academic').length,
    events: notices.filter(n => n.category === 'Event').length,
    urgent: notices.filter(n => n.category === 'Emergency' || n.priority === 'URGENT').length,
    placement: notices.filter(n => n.category === 'Placement').length,
    administrative: notices.filter(n => n.category === 'Administrative').length,
  };

  const cohortBreakdown = dbOverview?.cohortBreakdown ?? [
    { year: 'TE', label: 'Third Year (TE CSE)', students: students.filter(s => s.academicYear === 'TE' || s.cohortBatch === 'TE').length, rate: '0.0', readsCount: 0 },
    { year: 'SE', label: 'Second Year (SE CSE)', students: students.filter(s => s.academicYear === 'SE' || s.cohortBatch === 'SE').length, rate: '0.0', readsCount: 0 },
    { year: 'BE', label: 'Final Year (BE CSE)', students: students.filter(s => s.academicYear === 'BE' || s.cohortBatch === 'BE').length, rate: '0.0', readsCount: 0 },
    { year: 'FE', label: 'First Year (FE CSE)', students: students.filter(s => s.academicYear === 'FE' || s.cohortBatch === 'FE').length, rate: '0.0', readsCount: 0 },
  ];

  const recentActivities = dbOverview?.recentActivities || [];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-[#000666] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#759efd]">analytics</span>
            Communication & System Analytics
          </h1>
          <p className="text-[#cfe6f2] text-[13px] mt-1">
            Real-time PostgreSQL tracking records, delivery audits, student read rates, and category statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSystemAnalytics}
            disabled={isLoading}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="Refresh database records"
          >
            <span className={`material-symbols-outlined text-[16px] ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isLoading ? 'Syncing...' : 'Sync DB'}</span>
          </button>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl border border-white/20">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[12px] font-bold text-white">Live PostgreSQL Sync</span>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#c6c5d4] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold text-[#454652] uppercase tracking-wider">Total Published Notices</span>
            <span className="material-symbols-outlined text-[#000666] text-[20px]">campaign</span>
          </div>
          <p className="text-[28px] font-extrabold text-[#000666]">{totalPublishedNotices}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Live Database Sync {lastRefreshed && `• ${lastRefreshed}`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c6c5d4] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold text-[#454652] uppercase tracking-wider">FCM & Push Deliveries</span>
            <span className="material-symbols-outlined text-amber-600 text-[20px]">bolt</span>
          </div>
          <p className="text-[28px] font-extrabold text-[#071e27]">{fcmDeliveries}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">notifications_active</span>
            {dbOverview?.activePushSubscriptions || 0} Subscribed Devices
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c6c5d4] shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-bold text-[#454652] uppercase tracking-wider">Active Students Enrolled</span>
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">groups</span>
          </div>
          <p className="text-[28px] font-extrabold text-emerald-700">{activeStudentsCount}</p>
          <p className="text-[11px] text-[#454652] font-medium mt-1">Total active directory</p>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Read Receipts by Academic Year */}
        <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-4">
          <h3 className="font-bold text-[18px] text-[#071e27] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000666]">group_work</span>
            Notice Read Rates by Academic Year
          </h3>
          <div className="space-y-3">
            {cohortBreakdown.map((yr: any) => {
              const count = yr.students || 0;
              const reads = yr.readsCount || 0;
              const rateVal = parseFloat(yr.rate || '0');
              const colorBg = yr.year === 'TE' ? 'bg-[#000666]' : yr.year === 'SE' ? 'bg-[#2b5bb5]' : yr.year === 'BE' ? 'bg-[#005312]' : 'bg-[#7a4b00]';
              const textClass = yr.year === 'TE' ? 'text-[#000666]' : yr.year === 'SE' ? 'text-[#2b5bb5]' : yr.year === 'BE' ? 'text-[#005312]' : 'text-[#7a4b00]';

              return (
                <div key={yr.year} className="p-3 bg-gray-50/70 rounded-xl border border-gray-100 space-y-1.5">
                  <div className="flex justify-between text-[12px] font-bold">
                    <span className={textClass}>{yr.label} — {yr.rate}%</span>
                    <span className="text-[#454652] font-medium">{reads} / {count} Students</span>
                  </div>
                  <div className="w-full bg-[#e6f6ff] h-3 rounded-full overflow-hidden">
                    <div className={`${colorBg} h-3 rounded-full transition-all duration-500`} style={{ width: `${Math.max(2, Math.min(100, rateVal))}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-4">
          <h3 className="font-bold text-[18px] text-[#071e27] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000666]">category</span>
            Notices Published by Category
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-[#e6f6ff] rounded-xl border border-[#dbf1fe]">
              <span className="text-[11px] font-bold text-[#454652] uppercase">Examination</span>
              <p className="text-[22px] font-extrabold text-[#000666]">{categoryCounts.exam || 0} Notices</p>
              <p className="text-[11px] text-[#454652]">Timetables & Hall Tickets</p>
            </div>

            <div className="p-4 bg-[#e6f6ff] rounded-xl border border-[#dbf1fe]">
              <span className="text-[11px] font-bold text-[#454652] uppercase">Academic</span>
              <p className="text-[22px] font-extrabold text-[#2b5bb5]">{categoryCounts.academic || 0} Notices</p>
              <p className="text-[11px] text-[#454652]">Syllabus & Coursework</p>
            </div>

            <div className="p-4 bg-[#e6f6ff] rounded-xl border border-[#dbf1fe]">
              <span className="text-[11px] font-bold text-[#454652] uppercase">Department Events</span>
              <p className="text-[22px] font-extrabold text-emerald-700">{categoryCounts.events || 0} Notices</p>
              <p className="text-[11px] text-[#454652]">Hackathons & Workshops</p>
            </div>

            <div className="p-4 bg-[#ffdad6]/40 rounded-xl border border-[#ffb4ab]">
              <span className="text-[11px] font-bold text-[#93000a] uppercase">Urgent Notices</span>
              <p className="text-[22px] font-extrabold text-[#ba1a1a]">{categoryCounts.urgent || 0} Notices</p>
              <p className="text-[11px] text-[#93000a]">Instant Priority Overrides</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity & System Audit Log Table - Compact Scrollable Window */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-[#071e27] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666]">history</span>
              Live System Activity & Notification Audit Trail
            </h3>
            <p className="text-xs text-gray-500">Real-time database track records from PostgreSQL</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs flex items-center gap-1.5 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Live Audit Stream ({recentActivities.length} Records)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#c6c5d4] max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
          <table className="w-full text-left text-[11px] relative">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px] sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="p-2.5 px-3">Type</th>
                <th className="p-2.5 px-3">Event / Operation</th>
                <th className="p-2.5 px-3">Details</th>
                <th className="p-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {recentActivities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-gray-500 text-xs">
                    No activity logs recorded yet in database.
                  </td>
                </tr>
              ) : (
                recentActivities.map((act: any) => (
                  <tr key={act.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-2.5 px-3 font-bold text-[#000666] flex items-center gap-1.5 whitespace-nowrap">
                      <span className="material-symbols-outlined text-[15px] text-indigo-600">
                        {act.icon || 'info'}
                      </span>
                      {act.type || 'SYSTEM'}
                    </td>
                    <td className="p-2.5 px-3 font-bold text-gray-900 text-[11px]">{act.title}</td>
                    <td className="p-2.5 px-3 text-gray-600 text-[11px]">{act.subtitle}</td>
                    <td className="p-2.5 px-3 text-gray-400 font-mono text-[10px] whitespace-nowrap">
                      {act.timeAgo || 'Just now'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
