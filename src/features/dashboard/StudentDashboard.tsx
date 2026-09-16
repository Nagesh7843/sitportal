import React, { useState, useEffect } from 'react';
import { UserProfile, ViewMode, NoticeItem, AcademicCalendarItem, StudentRecord } from '@/types';
import { apiService } from '@/services/api';
import { StudentSelfServicePanel } from '@/features/student/StudentSelfServicePanel';

interface StudentDashboardProps {
  currentProfile: UserProfile | null;
  onNavigate: (view: ViewMode) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentProfile, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'self-service'>('overview');
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [activeCalendar, setActiveCalendar] = useState<AcademicCalendarItem | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentRecord | null>(null);
  const [academicData, setAcademicData] = useState<any>(null);
  const [placementDrives, setPlacementDrives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const noticesRes = await apiService.fetchNotices().catch(() => []);
      setNotices(noticesRes);

      const calRes = await apiService.fetchActiveCalendar().catch(() => null);
      if (calRes) setActiveCalendar(calRes);

      const placementRes = await apiService.fetchPlacementSummary().catch(() => null);
      if (placementRes?.drives) setPlacementDrives(placementRes.drives);

      const studentsRes = await apiService.fetchStudents().catch(() => []);
      if (currentProfile?.email && studentsRes.length > 0) {
        const match = studentsRes.find(
          (s: any) => s.email?.toLowerCase() === currentProfile.email.toLowerCase()
        );
        if (match) {
          setStudentInfo(match);
          const prn = match.prn || match.rollNo;
          if (prn) {
            const acad = await apiService.getStudentAcademicData(prn).catch(() => null);
            if (acad) setAcademicData(acad);
          }
        }
      }
    } catch (err) {
      console.warn('Student dashboard load warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentProfile]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#00337c] via-[#024099] to-[#0052cc] rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">school</span>
              <span>Student Dashboard • B.Tech CSE</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {currentProfile?.name || 'Student'}!
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Access your department notices, academic calendar events, course documents, and central Q&A.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('questions')}
              className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 bg-white text-[#00337c] hover:bg-blue-50 font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">forum</span>
              <span>Central Q&A</span>
            </button>
            <button
              onClick={() => onNavigate('curriculum')}
              className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors inline-flex items-center gap-2 border border-white/20 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              <span>Syllabus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-[#d6d9e0] shadow-xs overflow-x-auto custom-scrollbar touch-scroll max-w-full">
        <button
          onClick={() => setActiveTab('overview')}
          className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview' ? 'bg-[#00337c] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">dashboard</span>
          <span>Dashboard Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('self-service')}
          className={`shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'self-service' ? 'bg-[#00337c] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">badge</span>
          <span>PRN Identity & Self-Service</span>
        </button>
      </div>

      {activeTab === 'self-service' ? (
        <StudentSelfServicePanel student={studentInfo} onRefresh={loadData} />
      ) : (
        <>
          {/* Quick Stat Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#d6d9e0] p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase">Roll No / USN</span>
                <span className="material-symbols-outlined text-blue-600">badge</span>
              </div>
              <p className="text-lg font-bold text-gray-900 font-mono">
                {studentInfo?.rollNo || currentProfile?.rollNo || currentProfile?.email?.split('@')[0]?.toUpperCase() || 'N/A'}
              </p>
              <span className="text-[11px] text-gray-500">
                {studentInfo?.prn || currentProfile?.prn ? `PRN: ${studentInfo?.prn || currentProfile?.prn}` : 'CSE Department Student'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#d6d9e0] p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase">Academic Attendance</span>
                <span className="material-symbols-outlined text-emerald-600">check_circle</span>
              </div>
              <p className="text-lg font-bold text-emerald-700">
                {studentInfo?.attendance !== undefined && studentInfo?.attendance !== null 
                  ? `${studentInfo.attendance}%` 
                  : (currentProfile?.attendance !== undefined && currentProfile?.attendance !== null ? `${currentProfile.attendance}%` : 'N/A')}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">
                {Number(studentInfo?.attendance || currentProfile?.attendance || 0) >= 75 ? 'Eligible for examinations' : 'Session Attendance Status'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#d6d9e0] p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase">Cumulative CGPA</span>
                <span className="material-symbols-outlined text-indigo-600">grade</span>
              </div>
              <p className="text-lg font-bold text-indigo-900">
                {academicData?.cgpa 
                  ? `${academicData.cgpa} / 10.0` 
                  : (studentInfo?.cgpa || studentInfo?.gpa || currentProfile?.cgpa || currentProfile?.gpa 
                      ? `${studentInfo?.cgpa || studentInfo?.gpa || currentProfile?.cgpa || currentProfile?.gpa} / 10.0` 
                      : 'N/A')}
              </p>
              <span className="text-[11px] text-indigo-600 font-medium">
                {Number(academicData?.cgpa || studentInfo?.cgpa || studentInfo?.gpa || currentProfile?.cgpa || currentProfile?.gpa || 0) >= 7.5
                  ? 'First Class with Distinction'
                  : 'Placement Status'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#d6d9e0] p-4 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-semibold uppercase">Academic Division</span>
                <span className="material-symbols-outlined text-amber-600">calendar_today</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {studentInfo?.academicYear || currentProfile?.academicYear ? `${studentInfo?.academicYear || currentProfile?.academicYear} Year` : 'CSE'}
              </p>
              <span className="text-[11px] text-gray-500">
                {studentInfo?.division || currentProfile?.division || 'Div A'} • Batch {studentInfo?.batchGroup || currentProfile?.batchGroup || 'A1'}
              </span>
            </div>
          </div>

          {/* Main Content Grid: Notices & Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notices Section (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00337c]">campaign</span>
                  <h2 className="text-lg font-bold text-gray-900">Latest Department Notices</h2>
                </div>
                <button
                  onClick={() => onNavigate('notices')}
                  className="text-xs font-semibold text-[#00337c] hover:underline"
                >
                  Browse All ({notices.length}) →
                </button>
              </div>

              <div className="max-h-[580px] lg:max-h-[620px] overflow-y-auto custom-scrollbar space-y-2.5 p-2 bg-[#f8fafc] rounded-xl border border-[#c6c5d4]/40 shadow-inner">
                {notices.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-xs font-semibold">
                    No notices published yet.
                  </div>
                ) : (
                  notices.map((notice) => (
                    <div
                      key={notice.id}
                      className="bg-white rounded-lg border border-[#c6c5d4] p-3 shadow-2xs hover:shadow-xs transition-all space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5 w-full">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.1 text-[8px] font-bold rounded uppercase tracking-wider ${
                                notice.priority === 'URGENT' ? 'bg-red-100 text-red-700 border border-red-200' :
                                notice.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {notice.category || 'Academic'}
                              </span>
                              {!notice.readBy?.includes(currentProfile?.email || '') && (
                                <span className="bg-[#ba1a1a] text-white font-bold text-[8px] uppercase px-1 py-0.1 rounded">
                                  New
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-[#767683] font-semibold">{notice.publishedAt}</span>
                          </div>
                          <h3
                            onClick={() => onNavigate('notices')}
                            className="font-bold text-[#071e27] text-[12px] sm:text-[13px] hover:text-[#000666] transition-colors leading-snug cursor-pointer"
                          >
                            {notice.title}
                          </h3>
                          <p className="text-[10px] text-[#454652] leading-normal line-clamp-1">
                            {notice.content}
                          </p>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-[#c6c5d4]/40 flex items-center justify-between text-[9px] text-[#454652]">
                        <span>Issued by: <strong>{notice.authorName}</strong> ({notice.authorRole})</span>
                        <button
                          onClick={() => onNavigate('notices')}
                          className="font-bold text-[#000666] hover:underline flex items-center gap-0.5"
                        >
                          <span>View Notice</span>
                          <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar: Upcoming Events & Quick Links */}
            <div className="space-y-6">
              {/* Calendar Widget */}
              <div className="bg-white rounded-2xl border border-[#d6d9e0] p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00337c]">event_upcoming</span>
                    <h3 className="font-bold text-gray-900 text-sm">Academic Events & Exams</h3>
                  </div>
                  <button
                    onClick={() => onNavigate('academic-calendar')}
                    className="text-[11px] font-semibold text-[#00337c] hover:underline"
                  >
                    Full Calendar →
                  </button>
                </div>

                {activeCalendar?.events && activeCalendar.events.length > 0 ? (
                  <div className="space-y-3">
                    {activeCalendar.events.slice(0, 4).map((evt) => (
                      <div key={evt.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#00337c]">
                          <span>{evt.startDate}</span>
                          <span className="px-1.5 py-0.5 bg-blue-100 rounded text-[10px] uppercase font-semibold">{evt.eventType}</span>
                        </div>
                        <p className="font-semibold text-gray-900 text-xs mt-1">{evt.title}</p>
                        {evt.location && (
                          <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {evt.location}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No upcoming events scheduled.</p>
                )}
              </div>

              {/* Placement Drives & Eligibility Status Widget */}
              <div className="bg-white rounded-2xl border border-[#d6d9e0] p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-700">work</span>
                    <h3 className="font-bold text-gray-900 text-sm">Placement Drives</h3>
                  </div>
                  <button
                    onClick={() => onNavigate('public-landing')}
                    className="text-[11px] font-semibold text-indigo-700 hover:underline"
                  >
                    View Hub →
                  </button>
                </div>

                {placementDrives && placementDrives.length > 0 ? (
                  <div className="space-y-3">
                    {placementDrives.slice(0, 3).map((drive: any) => {
                      const cgpa = Number(academicData?.cgpa ?? studentInfo?.gpa ?? 0);
                      const isDiploma = academicData?.qualificationPath === 'DIPLOMA';
                      const tenth = Number(academicData?.tenthPercentage ?? 0);
                      const twelfth = Number(academicData?.twelfthPercentage ?? 0);
                      const diploma = Number(academicData?.diplomaPercentage ?? 0);

                      // Basic client-side check matching 6.0 CGPA and 60% standard
                      const isEligible = cgpa >= 6.0 && tenth >= 60 && (isDiploma ? diploma >= 60 : twelfth >= 60);

                      return (
                        <div key={drive.id} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs text-slate-900 leading-snug">{drive.companyName}</h4>
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                              {drive.packageLpa || 'Competitive'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{drive.role}</p>
                          <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              <span className="material-symbols-outlined text-[12px]">
                                {isEligible ? 'check_circle' : 'info'}
                              </span>
                              {isEligible ? 'Eligible to Apply' : 'Review Criteria'}
                            </span>
                            <button
                              onClick={() => onNavigate('public-landing')}
                              className="text-[10px] font-bold text-indigo-600 hover:underline"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">No active drives announced yet.</p>
                )}
              </div>

              {/* Q&A Help Prompt */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200/80 p-5">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <span className="material-symbols-outlined">live_help</span>
                  Got Questions for Faculty?
                </div>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                  Use the Central Question System to post your doubts about syllabus, exam dates, or department activities.
                </p>
                <button
                  onClick={() => onNavigate('questions')}
                  className="mt-3 w-full py-2 bg-[#00337c] text-white hover:bg-blue-900 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">help_center</span>
                  Open Central Q&A Forum
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
