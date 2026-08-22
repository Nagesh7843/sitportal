import React, { useState, useMemo } from 'react';
import { ViewMode, FacultyMember, ActivityLog, StudentRecord, NoticeItem, EmailLog, NoticeCategory, NoticePriority } from '@/types';
import { ActivityLogModal } from '@/components/modals';

interface AdminDashboardProps {
  onNavigate: (view: ViewMode) => void;
  facultyList: FacultyMember[];
  onToggleFacultyStatus: (id: string) => void;
  activities: ActivityLog[];
  students: StudentRecord[];
  notices?: NoticeItem[];
  emailLogs?: EmailLog[];
  onOpenQuickNoticeModal: () => void;
  noticesCount?: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  facultyList,
  onToggleFacultyStatus,
  activities,
  students,
  notices = [],
  emailLogs = [],
  onOpenQuickNoticeModal,
}) => {
  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'notices' | 'emails' | 'faculty'>('notices');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedNoticeForModal, setSelectedNoticeForModal] = useState<NoticeItem | null>(null);

  // Filtered master circulars / notifications list
  const filteredNotices = useMemo(() => {
    return notices.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.authorRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
      const matchesPrio = priorityFilter === 'ALL' || item.priority === priorityFilter;

      return matchesSearch && matchesCat && matchesPrio;
    });
  }, [notices, searchQuery, categoryFilter, priorityFilter]);

  // Total individual emails transferred calculation
  const totalEmailsTransferred = useMemo(() => {
    return emailLogs.reduce((acc, curr) => acc + (curr.recipientCount || 1), 0);
  }, [emailLogs]);

  // Sender Breakdown Statistics
  const senderStats = useMemo(() => {
    const counts: Record<string, { name: string; role: string; count: number }> = {};
    notices.forEach(n => {
      const key = `${n.authorName} (${n.authorRole})`;
      if (!counts[key]) {
        counts[key] = { name: n.authorName, role: n.authorRole, count: 0 };
      }
      counts[key].count += 1;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [notices]);

  // Helper to format Target Audience nicely
  const formatAudience = (notice: NoticeItem) => {
    const target = notice.targetAudience;
    if (!target) return 'All Department';

    const parts: string[] = [];
    if (target.academicYear && target.academicYear.length > 0) {
      parts.push(`Years: ${target.academicYear.join(', ')}`);
    }
    if (target.division && target.division.length > 0) {
      parts.push(`Divs: ${target.division.join(', ')}`);
    }
    if (target.role && target.role.length > 0) {
      parts.push(`Role: ${target.role.join(', ')}`);
    }
    if (target.studentEmails && target.studentEmails.length > 0) {
      parts.push(`Direct (${target.studentEmails.length} students)`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'Entire Department';
  };

  return (
    <div className="space-y-6 font-sans text-[#071e27]">
      {/* Executive Welcome & Control Header Banner */}
      <div className="bg-gradient-to-r from-[#000666] via-[#1a237e] to-[#2b5bb5] p-6 rounded-2xl text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-wider uppercase text-sky-200 backdrop-blur-md">
            <span className="material-symbols-outlined text-[16px] text-amber-300">admin_panel_settings</span>
            Executive Administrative Control Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Administration Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 opacity-90 max-w-2xl leading-relaxed">
            Centralized institutional command center for monitoring student records, faculty status, broadcast email logs, and real-time circular dispatches across the CSE Department.
          </p>
        </div>

        {/* Action Controls */}
        <div className="z-10 flex flex-wrap gap-2.5 shrink-0">
          <button
            onClick={onOpenQuickNoticeModal}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Publish Notice</span>
          </button>

          <button
            onClick={() => onNavigate('bulk-email')}
            className="px-4 py-2.5 bg-white text-[#000666] hover:bg-sky-50 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>Launch Email Broadcast</span>
          </button>
        </div>

        {/* Ambient Decorative Icon */}
        <span className="material-symbols-outlined text-[200px] absolute -right-10 -bottom-16 opacity-10 pointer-events-none">
          shield_person
        </span>
      </div>

      {/* Quick Stats Executive Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Stat 1: Total Students */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#c6c5d4] flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-[#1a237e]/10 rounded-xl text-[#000666] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Roster
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-[11px] font-bold text-[#454652] uppercase tracking-wider">Total Students</h3>
            <p className="text-[30px] font-extrabold text-[#071e27] leading-none mt-1">{students.length}</p>
            <p className="text-[11px] text-[#767683] mt-1">Enrolled student records</p>
          </div>
        </div>

        {/* Stat 2: Active Faculty */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#c6c5d4] flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-[#759efd]/20 rounded-xl text-[#2b5bb5] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">groups</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Department
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-[11px] font-bold text-[#454652] uppercase tracking-wider">Active Faculty</h3>
            <p className="text-[30px] font-extrabold text-[#071e27] leading-none mt-1">{facultyList.length}</p>
            <p className="text-[11px] text-[#767683] mt-1">Faculty directory roster</p>
          </div>
        </div>

        {/* Stat 3: Total Circulars & Notices Dispatched */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#c6c5d4] flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-[#a3f69c]/30 rounded-xl text-[#002204] group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">campaign</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              Live Feed
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-[11px] font-bold text-[#454652] uppercase tracking-wider">Circulars Dispatched</h3>
            <p className="text-[30px] font-extrabold text-[#071e27] leading-none mt-1">{notices.length}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">check_circle</span>
              Sender Integrated
            </p>
          </div>
        </div>

        {/* Stat 4: Real-time Emails Transferred */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#c6c5d4] flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-100 rounded-xl text-purple-900 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">mark_email_read</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
              Live Transfers
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-[11px] font-bold text-[#454652] uppercase tracking-wider">Emails Transferred</h3>
            <p className="text-[30px] font-extrabold text-[#071e27] leading-none mt-1">{totalEmailsTransferred}</p>
            <p className="text-[11px] text-[#767683] mt-1">Delivered across {emailLogs.length} broadcasts</p>
          </div>
        </div>

        {/* Stat 5: System Audit Logs */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#c6c5d4] flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-900 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Real-time
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-[11px] font-bold text-[#454652] uppercase tracking-wider">System Activity Logs</h3>
            <p className="text-[30px] font-extrabold text-[#071e27] leading-none mt-1">{activities.length}</p>
            <p className="text-[11px] text-[#767683] mt-1">Real-time system events</p>
          </div>
        </div>
      </div>

      {/* Main Administrative Control Section: Tabbed Master Integrated Ledger */}
      <div className="bg-white rounded-2xl border border-[#c6c5d4] shadow-xs p-6 space-y-5">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c6c5d4] pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000666] text-[24px]">receipt_long</span>
            <div>
              <h2 className="font-extrabold text-lg text-[#071e27]">Integrated Notification & Communication Ledger</h2>
              <p className="text-xs text-[#454652]">Real-time sender records, recipient targets, and circular transmission details</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#f3faff] p-1 rounded-xl border border-[#c6c5d4] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('notices')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'notices'
                  ? 'bg-[#000666] text-white shadow-xs'
                  : 'text-[#454652] hover:text-[#071e27]'
              }`}
            >
              Master Circulars ({notices.length})
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'emails'
                  ? 'bg-[#000666] text-white shadow-xs'
                  : 'text-[#454652] hover:text-[#071e27]'
              }`}
            >
              Email Logs ({emailLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('faculty')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'faculty'
                  ? 'bg-[#000666] text-white shadow-xs'
                  : 'text-[#454652] hover:text-[#071e27]'
              }`}
            >
              Sender Directory ({senderStats.length})
            </button>
          </div>
        </div>

        {/* TAB 1: MASTER NOTIFICATIONS & CIRCULARS (WITH SENDER INTEGRATED DATA) */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            {/* Search & Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#f3faff] p-3 rounded-xl border border-[#c6c5d4]">
              {/* Search Field */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#454652] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by circular title, sender name, or role..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#c6c5d4] rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-white border border-[#c6c5d4] rounded-lg px-2.5 py-2 text-xs font-bold text-[#071e27] outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Academic">Academic</option>
                  <option value="Exam">Exam</option>
                  <option value="Event">Event</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Placement">Placement</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-white border border-[#c6c5d4] rounded-lg px-2.5 py-2 text-xs font-bold text-[#071e27] outline-none"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="URGENT">Urgent Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="NORMAL">Normal Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Notifications Master Table - Compact Scrollable Window */}
            <div className="overflow-x-auto rounded-xl border border-[#c6c5d4] max-h-[320px] overflow-y-auto custom-scrollbar shadow-inner">
              <table className="w-full text-left text-[11px] relative">
                <thead className="bg-[#e6f6ff] text-[#000666] font-bold border-b border-[#c6c5d4] sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="px-3 py-2">Notice Title & Content</th>
                    <th className="px-3 py-2">Sender (Integrated Author)</th>
                    <th className="px-3 py-2">Target Audience</th>
                    <th className="px-3 py-2">Category & Priority</th>
                    <th className="px-3 py-2">Dispatched Date</th>
                    <th className="px-3 py-2 text-center">Views / Read</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c5d4]/40 bg-white">
                  {filteredNotices.length > 0 ? (
                    filteredNotices.map((notice) => {
                      const priorityColor = {
                        URGENT: 'bg-red-100 text-red-800 border-red-300 font-extrabold animate-pulse',
                        HIGH: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
                        NORMAL: 'bg-blue-100 text-blue-800 border-blue-300',
                        LOW: 'bg-slate-100 text-slate-700 border-slate-300',
                      }[notice.priority || 'NORMAL'];

                      return (
                        <tr key={notice.id} className="hover:bg-[#f3faff] transition-colors">
                          {/* Title & Preview */}
                          <td className="px-3 py-2 font-semibold max-w-[220px]">
                            <p className="text-[11px] font-bold text-[#071e27] line-clamp-1">{notice.title}</p>
                            <p className="text-[10px] text-[#454652] line-clamp-1 opacity-80 mt-0.5">{notice.content}</p>
                          </td>

                          {/* Sender Integrated Data */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-[#1a237e] text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                                {notice.authorName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-[#071e27] text-[11px]">{notice.authorName}</p>
                                <span className="inline-block px-1 py-0.1 bg-[#e6f6ff] text-[#000666] font-bold rounded text-[8px] uppercase">
                                  {notice.authorRole}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Audience Target */}
                          <td className="px-3 py-2 text-[#454652] whitespace-nowrap">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200 text-[10px] font-semibold">
                              {formatAudience(notice)}
                            </span>
                          </td>

                          {/* Category & Priority */}
                          <td className="px-3 py-2 whitespace-nowrap space-x-1">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[9px]">
                              {notice.category}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border text-[9px] uppercase ${priorityColor}`}>
                              {notice.priority}
                            </span>
                          </td>

                          {/* Dispatched Date */}
                          <td className="px-3 py-2 text-[#454652] whitespace-nowrap font-medium text-[10px]">
                            {notice.publishedAt || 'Recent'}
                          </td>

                          {/* Read Receipts */}
                          <td className="px-3 py-2 text-center whitespace-nowrap">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                              👁️ {notice.viewsCount || 0} ({notice.readBy?.length || 0})
                            </span>
                          </td>

                          {/* View Action */}
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedNoticeForModal(notice)}
                              className="px-2 py-0.5 bg-[#000666] hover:bg-[#1a237e] text-white font-bold rounded-lg transition-colors text-[10px] cursor-pointer"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-[#454652] text-xs">
                        No matching circulars or notifications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BULK EMAIL TRANSMISSION LOGS */}
        {activeTab === 'emails' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-[#c6c5d4] max-h-[320px] overflow-y-auto custom-scrollbar shadow-inner">
              <table className="w-full text-left text-[11px] relative">
                <thead className="bg-[#e6f6ff] text-[#000666] font-bold border-b border-[#c6c5d4] sticky top-0 z-10 shadow-xs">
                  <tr>
                    <th className="px-3 py-2">Subject</th>
                    <th className="px-3 py-2">Recipient Group</th>
                    <th className="px-3 py-2">Recipients Count</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Timestamp</th>
                    <th className="px-3 py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c5d4]/40 bg-white">
                  {emailLogs.length > 0 ? (
                    emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#f3faff] transition-colors">
                        <td className="px-3 py-2 font-bold text-[#071e27] text-[11px]">{log.subject}</td>
                        <td className="px-3 py-2 text-[#454652]">
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 font-bold text-[9px]">
                            {log.recipientGroup}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-[#071e27]">{log.recipientCount} Users</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            log.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {log.priority}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#454652]">{log.sentAt}</td>
                        <td className="px-3 py-2 text-right">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[9px]">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#454652]">
                        No email broadcast logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SENDER DIRECTORY & DISPATCH BREAKDOWN */}
        {activeTab === 'faculty' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {senderStats.map((sender, idx) => (
              <div key={idx} className="bg-[#f3faff] p-4 rounded-xl border border-[#c6c5d4] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#000666] text-white flex items-center justify-center font-extrabold text-sm">
                    {sender.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#071e27]">{sender.name}</p>
                    <span className="text-[10px] font-semibold text-[#454652] uppercase bg-white px-1.5 py-0.5 rounded border border-[#c6c5d4]">
                      {sender.role}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-black text-[#000666]">{sender.count}</span>
                  <p className="text-[10px] text-[#767683] font-medium">Dispatches</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asymmetric Section: Faculty Availability Roster & Live Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
        {/* Faculty Availability Management */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl shadow-xs border border-[#c6c5d4]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-lg text-[#071e27]">Faculty Status & Roster Controls</h3>
              <p className="text-xs text-[#454652]">Live campus availability and departmental rank tracking</p>
            </div>
            <button
              onClick={() => onNavigate('faculty')}
              className="text-[#000666] font-bold text-xs flex items-center gap-1 hover:underline"
            >
              <span>Manage Roster</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#c6c5d4]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#e6f6ff] text-[#000666] font-bold border-b border-[#c6c5d4]">
                <tr>
                  <th className="px-4 py-3">Faculty Member</th>
                  <th className="px-4 py-3">Specialization</th>
                  <th className="px-4 py-3">Rank / Role</th>
                  <th className="px-4 py-3 text-right">Status Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c6c5d4]/40 bg-white">
                {facultyList.map((fac) => {
                  const statusColors = {
                    'ON CAMPUS': 'bg-[#a3f69c]/50 text-[#002204] border-emerald-300',
                    'IN MEETING': 'bg-[#d5ecf8] text-[#071e27] border-slate-300',
                    'IN LAB': 'bg-[#d9e2ff] text-[#00429c] border-blue-300',
                    'OFF CAMPUS': 'bg-[#ffdad6] text-[#93000a] border-red-300',
                  }[fac.status];

                  return (
                    <tr key={fac.id} className="hover:bg-[#f3faff] transition-colors">
                      <td className="px-4 py-3 font-bold text-[#071e27]">{fac.name}</td>
                      <td className="px-4 py-3 text-[#454652]">{fac.specialization}</td>
                      <td className="px-4 py-3 text-[#071e27]">{fac.rank}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onToggleFacultyStatus(String(fac.id))}
                          title="Click to toggle faculty presence status"
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-transform active:scale-95 cursor-pointer ${statusColors}`}
                        >
                          {fac.status}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time System Audit Log Stream */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-xs border border-[#c6c5d4] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#071e27]">Real-Time Audit Log</h3>
                <p className="text-xs text-[#454652]">System events and security tracking</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full">
                Live Audit
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[320px] custom-scrollbar pr-1">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex gap-3 p-2.5 bg-[#f3faff] hover:bg-[#e6f6ff] rounded-xl transition-colors border-l-3 border-[#000666]"
                >
                  <div className={`w-8 h-8 rounded-full ${act.colorBg} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-[18px] ${act.colorIcon}`}>
                      {act.icon}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs text-[#071e27] font-bold truncate leading-tight">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-[#454652] opacity-90 mt-0.5">{act.subtitle}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="py-10 text-center text-xs text-[#454652]">No audit operations logged.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowActivityLogModal(true)}
            className="mt-4 text-[#000666] font-bold text-xs hover:underline w-full text-center py-2.5 bg-[#e6f6ff] hover:bg-[#dbf1fe] rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>View Full Audit History</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Audit Log Modal */}
      {showActivityLogModal && (
        <ActivityLogModal
          isOpen={showActivityLogModal}
          onClose={() => setShowActivityLogModal(false)}
          activities={activities}
        />
      )}

      {/* Detailed Notice View Modal Dialog */}
      {selectedNoticeForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#c6c5d4] max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-[#c6c5d4] pb-3">
              <div>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200">
                  {selectedNoticeForModal.category}
                </span>
                <h3 className="text-lg font-bold text-[#071e27] mt-1">{selectedNoticeForModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedNoticeForModal(null)}
                className="text-gray-400 hover:text-gray-700 rounded-lg p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#f3faff] p-3 rounded-xl border border-[#c6c5d4] text-xs space-y-1">
              <p><strong>Dispatched By:</strong> {selectedNoticeForModal.authorName} ({selectedNoticeForModal.authorRole})</p>
              <p><strong>Target Audience:</strong> {formatAudience(selectedNoticeForModal)}</p>
              <p><strong>Published Date:</strong> {selectedNoticeForModal.publishedAt}</p>
              <p><strong>Priority Level:</strong> {selectedNoticeForModal.priority}</p>
            </div>

            <div className="py-2 text-xs text-[#071e27] leading-relaxed whitespace-pre-wrap">
              {selectedNoticeForModal.content}
            </div>

            <div className="pt-3 border-t border-[#c6c5d4] flex justify-end">
              <button
                onClick={() => setSelectedNoticeForModal(null)}
                className="px-4 py-2 bg-[#000666] text-white font-bold rounded-xl text-xs"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
