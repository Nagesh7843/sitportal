import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, UserRole, AcademicCalendarItem, CalendarEventItem } from '@/types';
import { apiService } from '@/services/api';

import { NoticeItem } from '@/types';

interface AcademicCalendarViewProps {
  currentProfile: UserProfile | null;
  userRole: UserRole;
  notices?: NoticeItem[];
}

export const AcademicCalendarView: React.FC<AcademicCalendarViewProps> = ({
  userRole,
  notices = [],
}) => {
  const [calendars, setCalendars] = useState<AcademicCalendarItem[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<AcademicCalendarItem | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'STUDENT' | 'PARENT' | 'FACULTY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddCalModal, setShowAddCalModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showDocIngestionModal, setShowDocIngestionModal] = useState(false);
  const [schedulerReport, setSchedulerReport] = useState<any>(null);
  const [isTriggeringScheduler, setIsTriggeringScheduler] = useState(false);

  // New Calendar Form
  const [calTitle, setCalTitle] = useState('');
  const [calYear, setCalYear] = useState('2025-2026');
  const [calSemType, setCalSemType] = useState('EVEN');
  const [calStartDate, setCalStartDate] = useState('');
  const [calEndDate, setCalEndDate] = useState('');
  const [calIsActive, setCalIsActive] = useState(false);

  // Document Ingestion State
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('Academic Calendar 2025-2026 (Even Semester)');
  const [docYear, setDocYear] = useState('2025-2026');
  const [docSemType, setDocSemType] = useState('EVEN');
  const [docRawText, setDocRawText] = useState('');
  const [ingestionTab, setIngestionTab] = useState<'file' | 'text'>('file');
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New Event Form
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('EXAM');
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventAudience, setEventAudience] = useState<'ALL' | 'STUDENT' | 'PARENT' | 'FACULTY'>('ALL');
  const [eventLocation, setEventLocation] = useState('');
  const [isNoticePlanned, setIsNoticePlanned] = useState(true);
  const [daysBeforeNotice, setDaysBeforeNotice] = useState(7);

  const canManage = ['admin', 'hod', 'faculty'].includes(userRole);
  const isStudentOrParent = userRole === 'student' || userRole === 'parent' || userRole === 'public';

  // Event Completion + 5 Days Retention Rule Helper
  const isEventActiveForStudentParent = (dateStr: string) => {
    if (!dateStr) return true;
    try {
      let dateObj: Date | null = null;
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-').map(Number);
        if (parts.length === 3) dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/').map(Number);
        if (parts.length === 3) dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
      }

      if (!dateObj || isNaN(dateObj.getTime())) return true;

      // Expiry Date = Completion Date + 5 Days
      const expiryDate = new Date(dateObj);
      expiryDate.setDate(expiryDate.getDate() + 5);
      expiryDate.setHours(23, 59, 59, 999);

      const today = new Date();
      return today <= expiryDate;
    } catch (e) {
      return true;
    }
  };

  const sampleCalendarText = `1 | 01/07/2026 | Commencement of Academic year - Odd Sem. 2026-27 (S.Y., T.Y, B.Tech)
2 | 25/07/2026 | 01st Syllabus completion report (S.Y., T.Y., and B.Tech.)
3 | 25/07/2026 | Display of 01st Defaulter List (T.Y., B.Tech)
4 | 05/08/2026 | Parents Meet
5 | 05/08/2026 | ECE, 05: Mtrx, 06: Electrical, 06: Civil 07: A&R, 07: Mechanical, 08: CSE, 08: AI&DS
6 | 12/08/2026 | 02nd Syllabus completion report (S.Y., T.Y., and B.Tech.)
7 | 12/08/2026 | Display of 02nd Defaulter List (S.Y., T.Y., and B.Tech.)
8 | 15/08/2026 | Independence Day
9 | 29/08/2026 | Mega Project Phase II Progress Presentation (75% completion of Project)
10 | 01/09/2026 | 03rd Syllabus completion report (S.Y., T.Y., and B.Tech.)
11 | 01/09/2026 | Display of 03rd Defaulter List (S.Y., T.Y., and B.Tech.)
12 | 05/09/2026 | Teachers day
13 | 07/09/2026-12/09/2026 | Mid Semester Examination (S.Y, T.Y, B.Tech)
14 | 14/09/2026-16/09/2026 | Last dates of assessment
15 | 14/09/2026 | Ganesh Chaturthi
16 | 15/09/2026 | Engineers’ day
17 | 21/09/2026 | Paper Submission of B.Tech students (Draft Copy) to respective guide for correction/modification for Conference/Journal
18 | 23/09/2026-26/09/2026 | First Internal academic Monitoring/ audit
19 | 25/09/2026 | 04th Syllabus completion report (S.Y., T.Y., and B.Tech.)
20 | 25/09/2026 | Display of 04th Defaulter List (S.Y., T.Y., and B.Tech.)
21 | 30/09/2026 | Final Project Draft report submission (B.Tech)
22 | 02/10/2026 | Mahatma Gandhi Jayanti
23 | 03/10/2026 | IMPETUS 2026
24 | 14/10/2026 | 05th Syllabus completion report (S.Y., T.Y., and B.Tech.)
25 | 09/10/2026 | Display of 05th Defaulter List (S.Y., T.Y., and B.Tech.)
26 | 21/10/2026 | B.Tech Project presentation Phase 4
27 | 28/10/2026 | Mega Project Phase I report submission (100% completion of Project)
28 | 31/10/2026 | Paper submission in conference /Journal Paper from B.Tech
29 | 02/11/2026 | 06th Syllabus completion report (S.Y., T.Y., and B.Tech.)
30 | 03/11/2026 | Display of 06th Defaulter List (S.Y., T.Y., and B.Tech.)
31 | 05/11/2026 | End of Classes (S.Y., T.Y., and B.Tech)
32 | 06/11/2026-15/11/2026 | Preparatory Leave for T.Y and B.Tech Students
33 | 08/11/2026-15/11/2026 | Diwali Vacation
34 | 16/11/2026-30/11/2026 | End semester Examination (S.Y., T.Y., and B.Tech)
35 | 01/12/2026-03/12/2026 | Last dates of Assessment
36 | 01/12/2026-05/12/2026 | Practical/Oral Examination (S.Y., T.Y., and B.Tech.)
37 | 07/12/2026-11/12/2026 | Faculty Development Program Industrial Training
38 | 10/12/2026 | Commencement of Academic year - Odd Sem. 2026-27 (S.Y., T.Y.)
39 | 10/12/2026 | Commencement of B. Tech.-Internship (Sem. VIII)
40 | 16/12/2026-19/12/2026 | Second Internal academic Monitoring/ audit
41 | 24/12/2026 | 01st Syllabus completion report (S.Y., T.Y.)
42 | 24/12/2026 | Display of 01st Defaulter List (S.Y., T.Y.)
43 | 14/01/2027 | 02nd Syllabus completion report (S.Y., T.Y.)
44 | 14/01/2027 | Display of 02nd Defaulter List (S.Y., T.Y.)
45 | 20/01/2027-23/01/2027 | Parents Meet
46 | 20/01/2027 | ECE
47 | 20/01/2027 | Mtrx
48 | 21/01/2027 | Electrical
49 | 21/01/2027 | Civil
50 | 22/01/2027 | A&R
51 | 22/01/2027 | Mechanical
52 | 23/01/2027 | CSE
53 | 23/01/2027 | AI&DS
54 | 30/01/2027 | 03rd Syllabus completion report (S.Y., T.Y.)
55 | 30/01/2027 | Display of 03rd Defaulter List (S.Y., T.Y.)
56 | 04/02/2027-07/02/2027 | Annual Sports and Gathering
57 | 08/02/2027-13/02/2027 | CA1 Presentation of B.Tech Internship
58 | 11/02/2027-17/02/2027 | Mid Semester Examination (S.Y., T.Y.)
59 | 19/02/2027 | Shiv Jayanti
60 | 24/02/2027-27/02/2027 | First Internal academic Monitoring/Audit
61 | 02/03/2027 | 04th Syllabus completion report (S.Y., T.Y.)
62 | 02/03/2027 | Display of 04th Defaulter List (S.Y., T.Y.)
63 | 02/03/2027 | INNOVATION 2K27
64 | 19/03/2027 | 05th Syllabus completion report (S.Y., T.Y.)
65 | 19/03/2027 | Display of 05th Defaulter List (S.Y., T.Y.)
66 | 06/04/2027 | 06th Syllabus completion report (S.Y., T.Y.)
67 | 04/04/2027 | Display of 06th Defaulter List (S.Y., T.Y.)
68 | 07/04/2027 | Gudhipadwa
69 | 08/04/2027 | End of Classes (S.Y., T.Y)
70 | 09/04/2027-14/04/2027 | Preparatory leave for S.Y., T.Y
71 | 14/04/2027 | Dr. Babasaheb Ambedkar Jayanti
72 | 15/04/2027-28/04/2027 | End Semester Examination of T.Y.
73 | 29/04/2027-05/05/2027 | Practical/Oral Examination of S.Y., T.Y
74 | 01/05/2027 | Maharashtra Day
75 | 29/04/2027-05/05/2027 | Practical/Oral Examination of S.Y., T.Y
76 | 03/05/2027 | Last date of assessment
77 | 04/05/2027-08/05/2027 | CA2 Presentation and Submission of B.Tech (Internship)
78 | 08/05/2027 | Tentative date of declaration of S.Y., T.Y result
79 | 12/05/2027-15/05/2027 | Summer Re-exam form filling
80 | 12/05/2027 | Practical/Oral Examination of B.Tech (Internship)
81 | 18/05/2027-22/05/2027 | B.Tech End Semester Examination (Self Learning Courses)
82 | 19/05/2027-26/05/2027 | S.Y., T.Y Summer Re-examinations 2027
83 | 26/05/2027-29/05/2027 | Second Internal academic Monitoring/Audit
84 | 01/06/2027 | Tentative date of declaration of S.Y., T.Y Summer Re-examinations 2027 result
85 | 10/05/2027-30/06/2027 | Soft skill and Aptitude Skill Training for T.Y Students
86 | 10/05/2027-30/06/2027 | One Month Field Training for S.Y Students
87 | 15/06/2027-30/06/2027 | S.Y., T.Y Summer Remedial Exam 2027
88 | 09/06/2027-12/06/2027 | External Academic audit Year 2026-27
89 | 01/07/2027 | Commencement of Academic Year 2027-28`;

  const loadCalendars = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.fetchAcademicCalendars().catch(() => []);
      setCalendars(data);
      if (data.length > 0) {
        const active = data.find((c) => c.isActive) || data[0];
        setSelectedCalendar(active);
      }
      if (canManage) {
        const status = await apiService.fetchSchedulerStatus().catch(() => null);
        setSchedulerStatus(status);
      }
    } catch (err) {
      console.warn('Calendar fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendars();
  }, []);

  const handleCreateCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calTitle || !calStartDate || !calEndDate) return;
    try {
      await apiService.createAcademicCalendar({
        title: calTitle,
        academicYear: calYear,
        semesterType: calSemType,
        startDate: calStartDate,
        endDate: calEndDate,
        isActive: calIsActive,
      });
      setShowAddCalModal(false);
      setCalTitle('');
      loadCalendars();
    } catch (err: any) {
      alert(err.message || 'Failed to create calendar');
    }
  };

  const handleDocIngestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsParsingDoc(true);
    try {
      if (ingestionTab === 'file') {
        if (!docFile) {
          alert('Please select a DOCX, PDF, or text file to upload.');
          setIsParsingDoc(false);
          return;
        }
        const saved = await apiService.uploadAcademicCalendarDoc(docFile, docTitle, docYear, docSemType);
        alert(`🎉 Academic Calendar "${saved.title}" successfully parsed from file with ${saved.events?.length || 0} milestone events! The background notice scheduler is now active.`);
      } else {
        if (!docRawText.trim()) {
          alert('Please paste academic calendar text.');
          setIsParsingDoc(false);
          return;
        }
        const saved = await apiService.parseAcademicCalendarText({
          text: docRawText,
          title: docTitle,
          academicYear: docYear,
          semesterType: docSemType,
        });
        alert(`🎉 Academic Calendar "${saved.title}" synchronized with ${saved.events?.length || 0} milestone events and connected to the notice scheduler!`);
      }

      setShowDocIngestionModal(false);
      setDocFile(null);
      setDocRawText('');
      loadCalendars();
    } catch (err: any) {
      alert(err.message || 'Failed to parse calendar document.');
    } finally {
      setIsParsingDoc(false);
    }
  };

  const handleActivateCalendar = async (id: number) => {
    try {
      await apiService.activateAcademicCalendar(id);
      loadCalendars();
    } catch (err: any) {
      alert(err.message || 'Failed to activate calendar');
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCalendar || !eventTitle || !eventStartDate) return;
    try {
      await apiService.addCalendarEvent(selectedCalendar.id, {
        title: eventTitle,
        eventType,
        startDate: eventStartDate,
        endDate: eventEndDate || undefined,
        description: eventDesc,
        targetAudience: eventAudience,
        location: eventLocation,
        isNoticePlanned,
        daysBeforeNotice: Number(daysBeforeNotice),
        noticeStatus: 'PENDING',
      });
      setShowAddEventModal(false);
      setEventTitle('');
      setEventDesc('');
      setEventLocation('');
      loadCalendars();
    } catch (err: any) {
      alert(err.message || 'Failed to add event');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Delete this calendar event?')) return;
    try {
      await apiService.deleteCalendarEvent(eventId);
      loadCalendars();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleRunSchedulerNow = async () => {
    setIsTriggeringScheduler(true);
    try {
      const report = await apiService.triggerSchedulerRun();
      setSchedulerReport(report);
      loadCalendars();
    } catch (err: any) {
      alert(err.message || 'Failed to execute scheduler job');
    } finally {
      setIsTriggeringScheduler(false);
    }
  };

  const eventTypes = ['ALL', 'EXAM', 'ASSIGNMENT', 'PROJECT_REVIEW', 'WORKSHOP', 'FEST', 'HOLIDAY', 'MEETING', 'RESULT', 'GENERAL'];

  const filteredEvents = (selectedCalendar?.events || []).filter((event) => {
    const matchesType = selectedTypeFilter === 'ALL' || event.eventType === selectedTypeFilter;
    const matchesAudience = audienceFilter === 'ALL' || event.targetAudience === audienceFilter || event.targetAudience === 'ALL';
    const matchesSearch =
      !searchQuery.trim() ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()));

    // Event Completion + 5 Days Retention Rule for Students & Parents
    const matchesRetention = !isStudentOrParent || isEventActiveForStudentParent(event.endDate || event.startDate);

    return matchesType && matchesAudience && matchesSearch && matchesRetention;
  });

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'EXAM':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ASSIGNMENT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'PROJECT_REVIEW':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'WORKSHOP':
      case 'FEST':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'HOLIDAY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MEETING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#000666] via-[#00337c] to-[#0d5c9c] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isStudentOrParent ? 'Academic Calendar' : 'Academic Calendar & Notice Scheduler'}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 font-medium leading-snug">
              Official semester schedules, academic milestones, and examination timetables.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canManage && (
              <>
                <button
                  onClick={() => setShowDocIngestionModal(true)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 active:scale-95"
                  title="Upload Word DOCX, PDF, or text file to parse academic calendar"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>Ingest via Docs / PDF</span>
                </button>

                <button
                  onClick={() => setShowAddCalModal(true)}
                  className="px-4 py-2.5 bg-white text-[#000666] hover:bg-blue-50 font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>New Semester</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scheduler Execution Report Alert */}
      {schedulerReport && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 text-xs text-emerald-900 flex items-start justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-800">
              <span className="material-symbols-outlined text-emerald-700">check_circle</span>
              Automatic Notice Scheduler Execution Report
            </div>
            <p>
              Scanned <strong>{schedulerReport.scannedEventsCount}</strong> events in{' '}
              <strong>{schedulerReport.activeCalendar}</strong>. Generated{' '}
              <strong>{schedulerReport.generatedCount}</strong> notices automatically.
            </p>
            {schedulerReport.generatedNotices?.length > 0 && (
              <ul className="list-disc list-inside mt-1 text-[11px] text-emerald-800">
                {schedulerReport.generatedNotices.map((n: string, i: number) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={() => setSchedulerReport(null)} className="text-emerald-700 hover:text-emerald-900">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Calendar Controls & Semester Switcher - Refined Toolbar */}
      <div className="bg-white rounded-2xl border border-[#c6c5d4] p-4 sm:p-5 shadow-xs space-y-3">
        {/* Row 1: Semester Dropdown, Active Status & Search Box */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-extrabold text-[#000666] uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Select Term:
            </label>
            <select
              value={selectedCalendar?.id || ''}
              onChange={(e) => {
                const found = calendars.find((c) => c.id === Number(e.target.value));
                if (found) setSelectedCalendar(found);
              }}
              className="px-3 py-1.5 border border-[#c6c5d4] rounded-xl text-xs font-bold text-[#071e27] focus:ring-2 focus:ring-[#000666] focus:outline-none bg-[#f8fafc] shadow-2xs cursor-pointer min-w-[240px] sm:min-w-[300px]"
            >
              {calendars.length === 0 && (
                <option value="">Academic Calendar 2026-2027 (Active Term)</option>
              )}
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.title} {cal.isActive ? '★ (ACTIVE)' : ''}
                </option>
              ))}
            </select>

            {selectedCalendar?.isActive ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Active Term Calendar
              </span>
            ) : (
              canManage && selectedCalendar && (
                <button
                  onClick={() => handleActivateCalendar(selectedCalendar.id)}
                  className="px-2.5 py-1 bg-blue-50 text-[#000666] border border-blue-200 hover:bg-blue-100 font-bold text-[11px] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">check</span>
                  Set Active Term
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Milestone Field */}
            <div className="relative flex-1 sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-2 text-gray-400 text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search milestone, exam, review..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#c6c5d4] rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#000666]"
              />
            </div>

            {canManage && selectedCalendar && (
              <button
                onClick={() => setShowAddEventModal(true)}
                className="px-3.5 py-1.5 bg-[#000666] text-white hover:bg-blue-900 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Event
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar pt-2.5 border-t border-gray-100">
          <span className="text-[11px] font-bold text-gray-500 mr-1 shrink-0 uppercase tracking-wider">Milestone Type:</span>
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedTypeFilter(type)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTypeFilter === type
                  ? 'bg-[#000666] text-white shadow-xs'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Events Timeline / Compact Scrollable Window Container */}
      <div className="bg-white rounded-2xl border border-[#c6c5d4] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <h3 className="font-extrabold text-sm text-[#071e27] flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#000666]">calendar_view_week</span>
            {isStudentOrParent ? 'Published Academic Circulars & Milestone Notices' : 'Academic Milestones & Scheduled Notices Feed'}
          </h3>
          {isStudentOrParent && (
            <span className="px-2.5 py-0.5 bg-blue-50 text-[#00429c] border border-blue-200 rounded-full font-bold text-[10px] flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">info</span>
              Notice Retained 5 Days Post-Event Completion
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 text-sm">
            <span className="material-symbols-outlined animate-spin text-3xl text-[#000666] mb-2">
              autorenew
            </span>
            <p>Loading academic calendar...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 space-y-2">
            <span className="material-symbols-outlined text-4xl text-gray-300">event_busy</span>
            <p className="font-bold text-gray-700 text-sm">No active academic notices match your filter.</p>
            {isStudentOrParent && (
              <p className="text-xs text-gray-400">Academic notices automatically expire 5 days after event completion.</p>
            )}
            {canManage && (
              <button
                onClick={() => setShowDocIngestionModal(true)}
                className="mt-2 px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600 shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">upload_file</span>
                Ingest Official Calendar Document
              </button>
            )}
          </div>
        ) : (
          <div className="max-h-[460px] overflow-y-auto custom-scrollbar p-2 bg-[#f8fafc] rounded-xl border border-[#c6c5d4]/40 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border border-[#d6d9e0] p-4 hover:shadow-md transition-shadow flex flex-col justify-between gap-3 relative"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide border ${getEventBadge(
                          event.eventType
                        )}`}
                      >
                        {event.eventType}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                        {event.startDate}
                        {event.endDate && event.endDate !== event.startDate ? ` to ${event.endDate}` : ''}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-900 leading-snug">{event.title}</h3>

                    {event.description && (
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{event.description}</p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {canManage && event.isNoticePlanned && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                            event.noticeStatus === 'GENERATED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {event.noticeStatus === 'GENERATED' ? 'notifications_active' : 'schedule'}
                          </span>
                          {event.noticeStatus === 'GENERATED' ? 'Notice Sent' : `${event.daysBeforeNotice || 7}d Pre-Notice`}
                        </span>
                      )}
                    </div>

                    {canManage && (
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        title="Delete event"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Ingest Academic Calendar via DOCX / PDF / Text */}
      {showDocIngestionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-[#000666]">
                <span className="material-symbols-outlined text-2xl text-amber-500">upload_file</span>
                <div>
                  <h3 className="text-lg font-bold text-[#071e27]">Ingest Academic Calendar from File</h3>
                  <p className="text-[11px] text-gray-500">Upload official Word (.docx) or PDF calendar document</p>
                </div>
              </div>
              <button
                onClick={() => setShowDocIngestionModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleDocIngestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="font-bold text-gray-700">Calendar Title *</label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="e.g. Academic Calendar 2025-2026 (Even Semester)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#000666] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={docYear}
                    onChange={(e) => setDocYear(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#000666] outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Semester Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ingestSemType"
                      checked={docSemType === 'EVEN'}
                      onChange={() => setDocSemType('EVEN')}
                    />
                    <span>Even Semester (Jan - June)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="ingestSemType"
                      checked={docSemType === 'ODD'}
                      onChange={() => setDocSemType('ODD')}
                    />
                    <span>Odd Semester (July - Dec)</span>
                  </label>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setIngestionTab('file')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    ingestionTab === 'file'
                      ? 'border-[#000666] text-[#000666]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">file_present</span>
                  Upload File (.docx / .pdf / .txt)
                </button>
                <button
                  type="button"
                  onClick={() => setIngestionTab('text')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    ingestionTab === 'text'
                      ? 'border-[#000666] text-[#000666]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_note</span>
                  Paste Text / Template
                </button>
              </div>

              {/* Tab 1: File Dropzone */}
              {ingestionTab === 'file' ? (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.pdf,.txt"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  {!docFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 hover:border-[#000666] bg-gray-50 hover:bg-blue-50/50 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-600 group-hover:text-[#000666] group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">description</span>
                      </div>
                      <div>
                        <p className="font-bold text-[#071e27] text-xs">
                          Click to select Word (.docx), PDF, or Text calendar file
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Automatic extraction of Unit Tests, In-Sem Exams, Submissions, PTM, and Practical dates.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-emerald-300 bg-emerald-50/80 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                          <span className="material-symbols-outlined">description</span>
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900 text-xs">{docFile.name}</p>
                          <p className="text-[11px] text-emerald-700">{(docFile.size / 1024).toFixed(1)} KB • Ready for document parsing</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDocFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-red-600 hover:text-red-800 text-xs font-bold"
                      >
                        Change File
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Tab 2: Text Ingestion */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700">Calendar Content Table / Text</label>
                    <button
                      type="button"
                      onClick={() => setDocRawText(sampleCalendarText)}
                      className="text-blue-700 hover:underline text-[11px] font-bold"
                    >
                      Fill Sample 2026 Even Sem Calendar
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={docRawText}
                    onChange={(e) => setDocRawText(e.target.value)}
                    placeholder={`Paste circular or table rows, for example:\n1 | 12/01/2026 | Commencement of Classes\n2 | 16/02/2026 | Unit Test - I\n3 | 23/03/2026 | In-Semester Exam`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#000666] outline-none text-xs font-mono"
                  />
                </div>
              )}

              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-[11px] text-blue-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  Automated Notice Scheduling Guarantee
                </div>
                <p>
                  Milestones parsed from this calendar will automatically receive scheduled pre-notice broadcasts (7 days for University Exams, 5 days for Mid-Terms, 4 days for Submissions, 3 days for PTM).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowDocIngestionModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isParsingDoc}
                  className="px-5 py-2 bg-[#000666] hover:bg-blue-900 text-white font-bold rounded-xl text-xs shadow-md transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isParsingDoc ? 'autorenew' : 'send'}
                  </span>
                  <span>{isParsingDoc ? 'Parsing Document...' : 'Ingest & Activate in Scheduler'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Manual Calendar */}
      {showAddCalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm">Create New Academic Calendar</h3>
              <button onClick={() => setShowAddCalModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCalendar} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Calendar Title *</label>
                <input
                  type="text"
                  required
                  value={calTitle}
                  onChange={(e) => setCalTitle(e.target.value)}
                  placeholder="e.g. Academic Calendar 2025-2026 (Even Semester)"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={calYear}
                    onChange={(e) => setCalYear(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Semester Type</label>
                  <select
                    value={calSemType}
                    onChange={(e) => setCalSemType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="EVEN">EVEN (Jan - June)</option>
                    <option value="ODD">ODD (July - Dec)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Semester Start *</label>
                  <input
                    type="date"
                    required
                    value={calStartDate}
                    onChange={(e) => setCalStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Semester End *</label>
                  <input
                    type="date"
                    required
                    value={calEndDate}
                    onChange={(e) => setCalEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="setActiveCheck"
                  checked={calIsActive}
                  onChange={(e) => setCalIsActive(e.target.checked)}
                  className="rounded text-[#000666]"
                />
                <label htmlFor="setActiveCheck" className="font-semibold text-gray-700">
                  Set as Active Semester Calendar
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddCalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#000666] text-white text-xs font-semibold rounded-xl hover:bg-blue-900"
                >
                  Create Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Event */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm">Add Event to Calendar</h3>
              <button onClick={() => setShowAddEventModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Unit Test - I (Continuous Internal Assessment)"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Event Category</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="EXAM">Examination</option>
                    <option value="ASSIGNMENT">Submission / Term Work</option>
                    <option value="PROJECT_REVIEW">Project Review</option>
                    <option value="WORKSHOP">Workshop / Seminar</option>
                    <option value="FEST">Techfest / Hackathon</option>
                    <option value="HOLIDAY">Holiday / Vacation</option>
                    <option value="MEETING">PTM / Meeting</option>
                    <option value="RESULT">Result Declaration</option>
                    <option value="GENERAL">General Academic</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Target Audience</label>
                  <select
                    value={eventAudience}
                    onChange={(e) => setEventAudience(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="ALL">All (Students, Parents, Faculty)</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="PARENT">Parents Only</option>
                    <option value="FACULTY">Faculty Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="Additional event details, syllabus units covered, etc."
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Location / Venue</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. CSE Dept Classrooms & Labs"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Notice Plan Sub-form */}
              <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoNoticeCheck"
                    checked={isNoticePlanned}
                    onChange={(e) => setIsNoticePlanned(e.target.checked)}
                    className="rounded text-[#000666] focus:ring-[#000666]"
                  />
                  <label htmlFor="autoNoticeCheck" className="text-xs font-bold text-blue-900">
                    Configure Automatic Notice Plan
                  </label>
                </div>

                {isNoticePlanned && (
                  <div className="pt-1 flex items-center gap-3 text-xs">
                    <span className="text-gray-700 font-medium">Trigger Notice:</span>
                    <select
                      value={daysBeforeNotice}
                      onChange={(e) => setDaysBeforeNotice(Number(e.target.value))}
                      className="px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-semibold bg-white"
                    >
                      <option value={10}>10 Days Prior</option>
                      <option value={7}>7 Days Prior</option>
                      <option value={5}>5 Days Prior</option>
                      <option value={3}>3 Days Prior</option>
                      <option value={1}>1 Day Prior</option>
                      <option value={0}>On the Day</option>
                    </select>
                    <span className="text-gray-500 text-[11px]">Auto-delivers to {eventAudience} audience</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#000666] text-white text-xs font-semibold rounded-xl hover:bg-blue-900 transition-colors shadow-xs"
                >
                  Add Event & Notice Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
