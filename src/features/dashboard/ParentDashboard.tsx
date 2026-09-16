import React, { useState, useEffect } from 'react';
import { UserProfile, ViewMode, NoticeItem, AcademicCalendarItem } from '@/types';
import { apiService } from '@/services/api';

interface ParentDashboardProps {
  currentProfile: UserProfile | null;
  onNavigate: (view: ViewMode) => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ currentProfile, onNavigate }) => {
  const [parentData, setParentData] = useState<any>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [activeCalendar, setActiveCalendar] = useState<AcademicCalendarItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [rollNoInput, setRollNoInput] = useState('');
  const [relationshipInput, setRelationshipInput] = useState('Parent/Guardian');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const loadParentDashboardData = async () => {
    setIsLoading(true);
    try {
      const profileRes = await apiService.fetchParentProfile().catch(() => null);
      if (profileRes) {
        setParentData(profileRes);
      }
      const noticesRes = await apiService.fetchParentNotices().catch(() => []);
      setNotices(noticesRes);

      const calRes = await apiService.fetchActiveCalendar().catch(() => null);
      if (calRes) {
        setActiveCalendar(calRes);
      }
    } catch (err) {
      console.warn('Error loading parent dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParentDashboardData();
  }, []);

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    if (!rollNoInput.trim()) {
      setLinkError('Please enter a valid student Roll No or PRN.');
      return;
    }

    try {
      const res = await apiService.linkParentStudent({
        studentRollNo: rollNoInput.trim(),
        relationship: relationshipInput,
      });
      setLinkSuccess('Child linked successfully!');
      setShowLinkModal(false);
      setRollNoInput('');
      loadParentDashboardData();
    } catch (err: any) {
      setLinkError(err.message || 'Failed to link student. Please verify the Roll No.');
    }
  };

  const [selectedStudentPrn, setSelectedStudentPrn] = useState<string>('');

  const allWards: any[] = parentData?.linkedStudents && parentData.linkedStudents.length > 0
    ? parentData.linkedStudents
    : (parentData?.linkedStudent ? [parentData.linkedStudent] : []);

  const student = (selectedStudentPrn && allWards.find(s => s.prn === selectedStudentPrn || s.rollNo === selectedStudentPrn))
    || allWards[0]
    || parentData?.linkedStudent;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#00337c] to-[#0052cc] rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[16px]">family_restroom</span>
              Parent Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome, {currentProfile?.name || 'Parent'}
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Stay updated with your child's academic progress, official department notices, and semester schedules.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('questions')}
              className="px-4 py-2.5 bg-white text-[#00337c] hover:bg-blue-50 font-semibold text-sm rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">help_center</span>
              Central Q&A Forum
            </button>
            <button
              onClick={() => onNavigate('academic-calendar')}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-sm rounded-xl transition-colors inline-flex items-center gap-2 border border-white/20"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              Academic Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Multiple Children / Ward Switcher */}
      {allWards.length > 1 && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">diversity_1</span>
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Enrolled Children ({allWards.length} Wards)</h4>
              <p className="text-[11px] text-slate-500">Switch child profile to view respective academic progress</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allWards.map((w: any) => {
              const isSelected = (student?.prn && w.prn === student.prn) || (student?.rollNo && w.rollNo === student.rollNo);
              return (
                <button
                  key={w.prn || w.rollNo}
                  type="button"
                  onClick={() => setSelectedStudentPrn(w.prn || w.rollNo)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#00337c] text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">school</span>
                  <span>{w.name} ({w.department || 'CSE'})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Linked Student Card */}
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00337c] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Student Association</h2>
              <p className="text-xs text-gray-500">Academic profile of your linked child</p>
            </div>
          </div>

          {student ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl inline-flex items-center gap-1.5 shadow-2xs">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                <span>Verified Ward Link</span>
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowLinkModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#00337c] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_link</span>
              <span>Link Student Record</span>
            </button>
          )}
        </div>

        {student ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student Name</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{student.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Roll No / USN</span>
              <p className="font-bold text-[#00337c] text-sm mt-0.5">{student.rollNo}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Year & Division</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{student.academicYear || 'Year 3'} • Div {student.division || 'A'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Batch Group</span>
              <p className="font-bold text-gray-900 text-sm mt-0.5">{student.batchGroup || 'Batch 1'}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Attendance</span>
              <p className="font-bold text-emerald-800 text-sm mt-0.5">
                {student.attendance !== undefined && student.attendance !== null ? `${student.attendance}%` : 'Not Updated'}
              </p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-3.5 border border-indigo-100">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">CGPA</span>
              <p className="font-bold text-indigo-900 text-sm mt-0.5">
                {student.gpa !== undefined && student.gpa !== null && student.gpa > 0 ? `${student.gpa} / 10.0` : 'Not Updated'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 text-center">
            <span className="material-symbols-outlined text-amber-600 text-3xl">info</span>
            <h3 className="font-bold text-gray-800 text-sm mt-1">No Student Linked Yet</h3>
            <p className="text-xs text-gray-600 mt-1 max-w-md mx-auto">
              Please link your child's student roll number (e.g. 21CS001) to receive personalized attendance and cohort updates.
            </p>
            <button
              onClick={() => setShowLinkModal(true)}
              className="mt-3 px-4 py-2 bg-[#00337c] text-white font-semibold text-xs rounded-lg hover:bg-blue-900 transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
              Link Student Record Now
            </button>
          </div>
        )}
      </div>

      {/* Two Column Layout: Notices & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Notices Stream */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00337c]">campaign</span>
              <h2 className="text-lg font-bold text-gray-900">Student & Department Notices</h2>
            </div>
            <button
              onClick={() => onNavigate('notices')}
              className="text-xs font-semibold text-[#00337c] hover:underline"
            >
              View Full Notice Board →
            </button>
          </div>

          <div className="space-y-3">
            {notices.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No notices published at the moment.
              </div>
            ) : (
              notices.slice(0, 5).map((notice) => (
                <div
                  key={notice.id}
                  className="bg-white rounded-xl border border-[#d6d9e0] p-4.5 hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                          notice.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                          notice.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {notice.category || 'Academic'}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">{notice.publishedAt}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm hover:text-[#00337c] transition-colors">
                        {notice.title}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                        {notice.content}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Issued by: {notice.authorName} ({notice.authorRole})</span>
                    <span className="font-semibold text-[#00337c]">Official Notice</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 1 Col: Calendar Milestones & Q&A Callout */}
        <div className="space-y-6">
          {/* Active Calendar Widget */}
          <div className="bg-white rounded-2xl border border-[#d6d9e0] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00337c]">campaign</span>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Active Milestone Circulars</h3>
                  <p className="text-[10px] text-gray-500">Official posted notices & upcoming events</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('academic-calendar')}
                className="text-[11px] font-semibold text-[#00337c] hover:underline flex items-center gap-1"
              >
                <span>Full Roadmap</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            {(() => {
              const parseDate = (dStr?: string) => {
                if (!dStr) return null;
                const clean = dStr.trim();
                if (clean.includes('-')) {
                  const parts = clean.split('-').map(Number);
                  if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
                } else if (clean.includes('/')) {
                  const parts = clean.split('/').map(Number);
                  if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
                }
                const d = new Date(clean);
                return isNaN(d.getTime()) ? null : d;
              };

              const allEvents = activeCalendar?.events || [];
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              // Filter ONLY posted/active events (within pre-notice trigger window up to 5 days post-completion)
              const postedEvents = allEvents
                .filter((evt) => {
                  const start = parseDate(evt.startDate);
                  const end = parseDate(evt.endDate || evt.startDate);
                  if (!start || !end) return true;

                  const preNoticeDays = evt.daysBeforeNotice || 7;
                  const diffDaysStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const diffDaysEnd = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                  // 1. Must be posted/triggered (within pre-notice window or officially GENERATED)
                  const isPostedOrTriggered = evt.noticeStatus === 'GENERATED' || diffDaysStart <= preNoticeDays;

                  // 2. Auto-removed 5 days after event completion (diffDaysEnd < -5 means expired)
                  const isNotExpired = diffDaysEnd >= -5;

                  return isPostedOrTriggered && isNotExpired;
                })
                .sort((a, b) => {
                  const dateA = parseDate(a.startDate)?.getTime() || 0;
                  const dateB = parseDate(b.startDate)?.getTime() || 0;
                  return dateA - dateB;
                });

              if (postedEvents.length === 0) {
                return (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-center space-y-1.5">
                    <span className="material-symbols-outlined text-slate-400 text-2xl">notifications_paused</span>
                    <p className="text-xs font-bold text-slate-700">No active circulars currently posted</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-tight">
                      Academic milestone notices are automatically posted into this feed 5–7 days prior to each event and retained for 5 days after completion.
                    </p>
                    <button
                      onClick={() => onNavigate('academic-calendar')}
                      className="mt-2 text-xs font-bold text-[#00337c] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Explore Full Semester Schedule</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {postedEvents.slice(0, 6).map((evt) => {
                    const start = parseDate(evt.startDate);
                    const end = parseDate(evt.endDate || evt.startDate);

                    let tagline = 'Posted Notice';
                    let badgeColor = 'bg-blue-50 text-[#00337c] border-blue-200';

                    if (start && end) {
                      const diffDaysStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      const diffDaysEnd = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                      if (diffDaysStart > 1) {
                        tagline = `Event in ${diffDaysStart} days`;
                        badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';
                      } else if (diffDaysStart === 1) {
                        tagline = 'Starts Tomorrow';
                        badgeColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                      } else if (diffDaysStart === 0) {
                        tagline = 'Starts Today';
                        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                      } else if (diffDaysStart < 0 && diffDaysEnd >= 0) {
                        tagline = 'Ongoing Event';
                        badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
                      } else if (diffDaysEnd < 0 && diffDaysEnd >= -5) {
                        const daysLeft = 5 + diffDaysEnd + 1;
                        tagline = `Completed • Removes in ${daysLeft}d`;
                        badgeColor = 'bg-gray-100 text-gray-600 border-gray-200';
                      }
                    }

                    return (
                      <div key={evt.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100 hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-[#00337c]">{evt.startDate}{evt.endDate && evt.endDate !== evt.startDate ? ` - ${evt.endDate}` : ''}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${badgeColor} flex items-center gap-1`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                              {tagline}
                            </span>
                            <span className="px-1.5 py-0.5 bg-blue-100 rounded text-[10px] uppercase font-semibold text-blue-800">
                              {evt.eventType}
                            </span>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 text-xs mt-1.5 leading-snug">{evt.title}</p>
                        {evt.location && (
                          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {evt.location}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Central Q&A Callout */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200/80 p-5">
            <div className="flex items-center gap-2.5 text-[#00337c] font-bold text-sm">
              <span className="material-symbols-outlined">forum</span>
              Have Academic Queries?
            </div>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              Post questions on our Central Public Q&A board. Faculty members and department heads provide official responses.
            </p>
            <button
              onClick={() => onNavigate('questions')}
              className="mt-3 w-full py-2 bg-[#00337c] text-white hover:bg-blue-900 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">add_comment</span>
              Ask a Question to Department
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Link Student Record */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00337c]">link</span>
                Link Child's Student Record
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleLinkStudent} className="space-y-4">
              {linkError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                  {linkError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student Roll Number / PRN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 21CS001 or 1SI21CS045"
                  value={rollNoInput}
                  onChange={(e) => setRollNoInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00337c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Relationship to Student
                </label>
                <select
                  value={relationshipInput}
                  onChange={(e) => setRelationshipInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00337c] focus:outline-none"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Parent/Guardian">Parent/Guardian</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00337c] text-white text-xs font-semibold rounded-xl hover:bg-blue-900 transition-colors shadow-xs"
                >
                  Save & Link Child
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
