import React, { useState } from 'react';
import { EmailLog, ViewMode, AcademicYear, Division, BatchGroup, FacultyMember } from '@/types';

interface BulkEmailPanelProps {
  emailLogs: EmailLog[];
  facultyList?: FacultyMember[];
  onSendBroadcast: (newLog: any) => void;
  onNavigate: (view: ViewMode, emailContext?: string) => void;
  defaultTargetRole?: 'STUDENT' | 'FACULTY';
  prefilledEmail?: string;
}

export const BulkEmailPanel: React.FC<BulkEmailPanelProps> = ({
  emailLogs,
  facultyList = [],
  onSendBroadcast,
  onNavigate,
  defaultTargetRole = 'STUDENT',
  prefilledEmail = ''
}) => {
  const [targetRole, setTargetRole] = useState<'STUDENT' | 'FACULTY'>(defaultTargetRole);
  const [priority, setPriority] = useState<'URGENT' | 'NORMAL'>('NORMAL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleForLater, setScheduleForLater] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [requestReceipts, setRequestReceipts] = useState(true);
  const [attachments, setAttachments] = useState<{ name: string; size: string }[]>([]);

  // Targeted Audience Filters (Students) - Step by step selection
  const [selectedYears, setSelectedYears] = useState<AcademicYear[]>([]);
  const [selectedDivs, setSelectedDivs] = useState<Division[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<BatchGroup[]>([]);

  // Targeted Audience Filters (Faculty)
  const [selectedFacultyIds, setSelectedFacultyIds] = useState<string[]>([]);

  // Sending Simulation State
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [showAiDraftModal, setShowAiDraftModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const toggleYear = (y: AcademicYear) => {
    setSelectedYears((prev) => {
      const next = prev.includes(y) ? prev.filter((i) => i !== y) : [...prev, y];
      if (next.length === 0) {
        setSelectedDivs([]);
        setSelectedBatches([]);
      }
      return next;
    });
  };

  const toggleDiv = (d: Division) => {
    setSelectedDivs((prev) => {
      const next = prev.includes(d) ? prev.filter((i) => i !== d) : [...prev, d];
      if (next.length === 0) {
        setSelectedBatches([]);
      }
      return next;
    });
  };

  const toggleBatch = (b: BatchGroup) => {
    setSelectedBatches((prev) => (prev.includes(b) ? prev.filter((i) => i !== b) : [...prev, b]));
  };

  const toggleFaculty = (id: string) => {
    setSelectedFacultyIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const applyTemplate = (templateType: 'EXAM' | 'LAB' | 'EVENT' | 'EMERGENCY') => {
    if (templateType === 'EXAM') {
      setSubject('Urgent: End-Semester Examination Schedule & Guidelines');
      setMessage(
        `Dear Students,\n\nThe official timetable for End-Semester Examinations is published. Please report 15 minutes before the start time in Hall 3 & Hall 4 with your official hall ticket and identity badge.\n\nBest regards,\nAcademic Coordinator\nCSE Department`
      );
    } else if (templateType === 'LAB') {
      setSubject('NOTICE: Computing Laboratory Maintenance & Hardware Upgrades');
      setMessage(
        `Dear Students & Staff,\n\nPlease note that Lab will undergo hardware maintenance and GPU workstation updates from Friday 18:00 hrs to Saturday 08:00 hrs.\n\nSystems Administrator`
      );
    } else if (templateType === 'EVENT') {
      setSubject('ANNOUNCEMENT: Department Technical Symposium "Hack-SIT 2024"');
      setMessage(
        `Dear CSE Students,\n\nRegistrations are officially open for Hack-SIT 2024! Form your teams of 3-4 members and register before the submission deadline.\n\nEvent Advisory Committee`
      );
    } else if (templateType === 'EMERGENCY') {
      setPriority('URGENT');
      setSubject('[URGENT] Campus Administrative Alert');
      setMessage(
        `ATTENTION ALL STUDENTS AND FACULTY:\n\nUrgent notice. All classes and laboratory sessions stand suspended for today. Monitor official channels for further updates.`
      );
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleAddAttachment = () => {
    if (newFileName.trim()) {
      setAttachments([...attachments, { name: newFileName.trim(), size: '2.4 MB' }]);
      setNewFileName('');
      setShowAttachModal(false);
    }
  };

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) {
      alert('Please fill out both Subject and Message content before sending.');
      return;
    }

    if (scheduleForLater && !scheduledTime) {
      alert('Please select a valid date and time for scheduling.');
      return;
    }

    setIsSending(true);
    setSendProgress(10);

    const interval = setInterval(() => {
      setSendProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const count = targetRole === 'STUDENT'
              ? (prefilledEmail ? 1 : selectedYears.length * 60 + selectedDivs.length * 40)
              : selectedFacultyIds.length; // Use exact manual count

            let groupName = '';
            if (prefilledEmail) {
              groupName = `Individual Student: ${prefilledEmail}`;
            } else if (targetRole === 'STUDENT') {
              groupName = `Students (${selectedYears.join(', ')})`;
            } else {
              groupName = `Faculty (Manual Selection: ${selectedFacultyIds.length} members)`;
            }

            const payload: any = {
              targetRole: targetRole,
              subject: subject,
              content: message,
              priority: priority,
              scheduledAt: scheduleForLater ? scheduledTime : null,
              filters: {
                studentEmails: prefilledEmail ? [prefilledEmail] : [],
                academicYears: targetRole === 'STUDENT' ? selectedYears : [],
                divisions: targetRole === 'STUDENT' ? selectedDivs : [],
                batches: targetRole === 'STUDENT' ? selectedBatches : [],
                facultyIds: targetRole === 'FACULTY' ? selectedFacultyIds : []
              }
            };

            onSendBroadcast(payload);
            setIsSending(false);
            setSendProgress(0);
            setSubject('');
            setMessage('');
            alert(`Email process completed for ${count} recipients!`);
          }, 300);
          return 100;
        }
        return prev + 22;
      });
    }, 250);
  };

  const generateAiDraft = async () => {
    if (!aiTopic.trim()) return;
    setIsGeneratingAi(true);

    const activeKey = (
      ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
      localStorage.getItem('sit_gemini_api_key') ||
      ''
    ).trim();

    if (activeKey) {
      try {
        localStorage.setItem('sit_gemini_api_key', activeKey);

        const promptText = `You are an official email drafter for the Computer Science & Engineering (CSE) Department at Sharad Institute of Technology (SIT). Write an official email announcement based on the following topic.\n\nTopic: "${aiTopic.trim()}"\nTarget Audience: ${targetRole}\n\nIMPORTANT: Return ONLY a raw JSON object matching this exact format with no backticks or markdown:\n{\n  "subject": "Professional and concise subject line",\n  "message": "Full professional email body with formal greeting and signature from CSE Department"\n}`;

        // Try gemini-1.5-flash first, fallback to gemini-2.0-flash
        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        if (!response.ok) {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
          });
        }

        const data = await response.json();

        if (!response.ok || data.error) {
          const errMsg = data?.error?.message || `HTTP ${response.status} Error`;
          alert(`Gemini API Error: ${errMsg}\n\nPlease check your API key (get a free key at https://aistudio.google.com/app/apikey).`);
          setIsGeneratingAi(false);
          return;
        }

        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let parsed: any = null;
        try {
          parsed = JSON.parse(cleanedJson);
        } catch (pErr) {
          // If response isn't JSON, use raw text directly
          setSubject(`Department Announcement: ${aiTopic}`);
          setMessage(rawText);
          setIsGeneratingAi(false);
          setShowAiDraftModal(false);
          setAiTopic('');
          return;
        }

        if (parsed && (parsed.subject || parsed.message)) {
          setSubject(parsed.subject || `Department Announcement: ${aiTopic}`);
          setMessage(parsed.message || rawText);
          setIsGeneratingAi(false);
          setShowAiDraftModal(false);
          setAiTopic('');
          return;
        }
      } catch (err: any) {
        console.error('Gemini API call error:', err);
        alert(`Failed to connect to Gemini API: ${err.message || 'Network Error'}`);
        setIsGeneratingAi(false);
        return;
      }
    }

    setTimeout(() => {
      if (aiTopic.toLowerCase().includes('exam') || aiTopic.toLowerCase().includes('schedule')) {
        setSubject('Urgent: B.Tech CSE End-Semester Examination Schedule & Guidelines');
        setMessage(
          `Dear Students,\n\nThe official timetable for the B.Tech CSE End-Semester Examinations is now published. Please carry official hall tickets and student ID cards to all examination halls.\n\nReporting time is 30 minutes prior to exam commencement.\n\nBest regards,\nDepartment Head & Academic Coordinator\nCSE Department`
        );
      } else if (aiTopic.toLowerCase().includes('lab') || aiTopic.toLowerCase().includes('maintenance')) {
        setSubject('Notice: Temporary Laboratory Maintenance & System Downtime');
        setMessage(
          `Dear Faculty & Students,\n\nPlease be advised that CS Labs 2 and 4 will undergo scheduled hardware maintenance and network upgrades.\n\nDowntime Schedule: Friday 18:00 hrs to Saturday 06:00 hrs.\n\nSystems Administrator`
        );
      } else {
        setSubject(`Department Announcement: ${aiTopic}`);
        setMessage(
          `Dear Department Community,\n\nWe are pleased to communicate an important update regarding ${aiTopic}.\n\nPlease review the attached documentation for detailed timelines and instructions.\n\nWarm regards,\nCSE Department`
        );
      }
      setIsGeneratingAi(false);
      setShowAiDraftModal(false);
      setAiTopic('');
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#000666] text-white p-6 rounded-2xl shadow-lg gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#759efd]">mail</span>
            <h1 className="text-[24px] font-extrabold tracking-tight">
              {targetRole === 'STUDENT' ? 'Student Email' : 'Faculty Email'}
            </h1>
          </div>
          <p className="text-[#cfe6f2] text-[13px] mt-1">
            {targetRole === 'STUDENT'
              ? 'Send announcements by Academic Year, Division, and Batch Group.'
              : 'Send official communications securely to the entire department faculty and staff.'}
          </p>
        </div>

        <button
          onClick={() => setShowAiDraftModal(true)}
          className="bg-[#759efd] text-[#00337c] font-bold px-4 py-2.5 rounded-xl text-[13px] hover:bg-[#b0c6ff] transition-all flex items-center gap-2 shadow-xs shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          <span>AI Draft Helper</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Composer Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-[#c6c5d4] pb-4">
            <h2 className="font-bold text-[18px] text-[#071e27]">Compose Email</h2>
          </div>

          {/* Quick Pre-built Templates */}
          <div>
            <label className="block text-[12px] font-bold text-[#454652] uppercase tracking-wider mb-1.5">
              Quick Email Templates
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyTemplate('EXAM')}
                className="px-3 py-1.5 bg-[#e6f6ff] text-[#000666] text-[12px] font-bold rounded-lg border border-[#c6c5d4] hover:bg-[#cfe6f2] transition-colors"
              >
                Exam Schedule Alert
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('LAB')}
                className="px-3 py-1.5 bg-[#e6f6ff] text-[#000666] text-[12px] font-bold rounded-lg border border-[#c6c5d4] hover:bg-[#cfe6f2] transition-colors"
              >
                Lab Downtime Notice
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('EVENT')}
                className="px-3 py-1.5 bg-[#e6f6ff] text-[#000666] text-[12px] font-bold rounded-lg border border-[#c6c5d4] hover:bg-[#cfe6f2] transition-colors"
              >
                Hackathon Announcement
              </button>
              <button
                type="button"
                onClick={() => applyTemplate('EMERGENCY')}
                className="px-3 py-1.5 bg-[#ffdad6] text-[#ba1a1a] text-[12px] font-bold rounded-lg border border-[#ffb4ab] hover:bg-[#ffb4ab]/40 transition-colors"
              >
                Urgent Notice
              </button>
            </div>
          </div>

          {/* Targeted Audience Selector Panel */}
          <div className="bg-[#e6f6ff] p-4 rounded-xl border border-[#dbf1fe] space-y-3">
            <h4 className="text-[12px] font-bold text-[#000666] uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[16px]">groups</span>
              Target Audience: {targetRole === 'STUDENT' ? 'Students' : 'All Faculty'}
            </h4>

            {/* Student Filters */}
            {targetRole === 'STUDENT' && (
              <>
              {prefilledEmail ? (
                <div className="bg-white p-3 rounded-lg border border-[#c6c5d4] flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#000666]">person</span>
                  <div>
                    <p className="text-[11px] text-[#767683] font-bold uppercase">Sending to Individual Student</p>
                    <p className="text-[14px] font-bold text-[#454652]">{prefilledEmail}</p>
                  </div>
                </div>
              ) : (
              <div className="space-y-4 pt-2">
                {/* Step 1: Academic Year Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#000666] text-white text-[11px] font-bold flex items-center justify-center">1</span>
                    <p className="text-[12px] font-bold text-[#454652]">Step 1: Select Academic Years</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pl-7">
                    {(['FE', 'SE', 'TE', 'BE'] as AcademicYear[]).map((y) => (
                      <button
                        type="button"
                        key={y}
                        onClick={() => toggleYear(y)}
                        className={`px-3 py-1 rounded-lg text-[12px] font-bold border transition-colors ${selectedYears.includes(y)
                          ? 'bg-[#000666] text-white border-[#000666]'
                          : 'bg-white text-[#454652] border-[#c6c5d4]'
                          }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Division Selection */}
                {selectedYears.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#2b5bb5] text-white text-[11px] font-bold flex items-center justify-center">2</span>
                      <p className="text-[12px] font-bold text-[#454652]">Step 2: Select Divisions</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-7">
                      {(['Div A', 'Div B', 'Div C'] as Division[]).map((d) => (
                        <button
                          type="button"
                          key={d}
                          onClick={() => toggleDiv(d)}
                          className={`px-3 py-1 rounded-lg text-[12px] font-bold border transition-colors ${selectedDivs.includes(d)
                            ? 'bg-[#2b5bb5] text-white border-[#2b5bb5]'
                            : 'bg-white text-[#454652] border-[#c6c5d4]'
                            }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#767683] italic pl-7">Select an academic year above to see division options.</p>
                )}

                {/* Step 3: Batch Selection */}
                {selectedDivs.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#003909] text-[#a3f69c] text-[11px] font-bold flex items-center justify-center">3</span>
                      <p className="text-[12px] font-bold text-[#454652]">Step 3: Select Batches (Optional)</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-7">
                      {(['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'] as BatchGroup[])
                        .filter(b => {
                          if (selectedDivs.includes('Div A') && b.startsWith('A')) return true;
                          if (selectedDivs.includes('Div B') && b.startsWith('B')) return true;
                          if (selectedDivs.includes('Div C') && b.startsWith('C')) return true;
                          return false;
                        })
                        .map((b) => (
                          <button
                            type="button"
                            key={b}
                            onClick={() => toggleBatch(b)}
                            className={`px-3 py-1 rounded-lg text-[12px] font-bold border transition-colors ${selectedBatches.includes(b)
                              ? 'bg-[#003909] text-[#a3f69c] border-[#003909]'
                              : 'bg-white text-[#454652] border-[#c6c5d4]'
                              }`}
                          >
                            Batch {b}
                          </button>
                        ))}
                    </div>
                  </div>
                ) : selectedYears.length > 0 ? (
                  <p className="text-[11px] text-[#767683] italic pl-7">Select at least one division above to see batch options.</p>
                ) : null}
              </div>
              )}
              </>
            )}

            {/* Faculty Manual Selection */}
            {targetRole === 'FACULTY' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-[#454652] mb-1">Select Faculty Members Manually:</p>
                  <div className="text-[10px] font-bold text-[#000666] cursor-pointer hover:underline" onClick={() => setSelectedFacultyIds(facultyList.map(f => String(f.id)))}>
                    Select All
                  </div>
                  <div className="text-[10px] font-bold text-red-600 cursor-pointer hover:underline ml-2" onClick={() => setSelectedFacultyIds([])}>
                    Clear All
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-1">
                  {facultyList.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center p-4">No faculty records found.</div>
                  ) : (
                    facultyList.map((fac) => (
                      <label key={fac.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-[#000666] focus:ring-[#000666]"
                          checked={selectedFacultyIds.includes(String(fac.id))}
                          onChange={() => toggleFaculty(String(fac.id))}
                        />
                        <div className="flex-1 flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{fac.name}</p>
                            <p className="text-[10px] text-slate-500">{fac.designation || fac.rank || 'Faculty'} • {fac.specialization}</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{fac.email}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subject Line & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-[12px] font-bold text-[#454652] uppercase tracking-wider mb-1.5">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. B.Tech CSE Semester Examination Timetable 2024"
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl px-4 py-2.5 text-[13px] text-[#071e27] font-semibold focus:outline-none focus:ring-2 focus:ring-[#000666]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase tracking-wider mb-1.5">
                Priority Tag
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('NORMAL')}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${priority === 'NORMAL'
                    ? 'bg-[#d9e2ff] text-[#00429c] ring-2 ring-[#2b5bb5]'
                    : 'bg-[#f3faff] text-[#454652] border border-[#c6c5d4]'
                    }`}
                >
                  NORMAL
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('URGENT')}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${priority === 'URGENT'
                    ? 'bg-[#ffdad6] text-[#ba1a1a] ring-2 ring-[#ba1a1a]'
                    : 'bg-[#f3faff] text-[#454652] border border-[#c6c5d4]'
                    }`}
                >
                  URGENT
                </button>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-[12px] font-bold text-[#454652] uppercase tracking-wider mb-1.5">
              Message Content
            </label>
            <div className="border border-[#c6c5d4] rounded-xl overflow-hidden bg-[#f3faff]">
              <textarea
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your email content here..."
                className="w-full p-4 bg-white text-[13px] text-[#071e27] focus:outline-none resize-none"
              ></textarea>
            </div>
          </div>

          {/* Attached Documents */}
          <div>
            <label className="block text-[12px] font-bold text-[#454652] uppercase tracking-wider mb-2">
              Attached Documents ({attachments.length})
            </label>
            <div className="flex flex-wrap gap-2.5 items-center">
              {attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="bg-[#e6f6ff] text-[#000666] px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[#c6c5d4] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#2b5bb5]">attach_file</span>
                  <span>{att.name} ({att.size})</span>
                  <button
                    onClick={() => handleRemoveAttachment(idx)}
                    className="text-[#767683] hover:text-[#ba1a1a]"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setShowAttachModal(true)}
                className="px-3 py-1.5 rounded-lg border border-dashed border-[#000666] text-[#000666] text-[12px] font-bold hover:bg-[#e6f6ff] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Attach Files</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-[#c6c5d4]">
            <div className="flex flex-wrap gap-4 text-[13px] text-[#071e27] font-medium">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleForLater}
                    onChange={(e) => setScheduleForLater(e.target.checked)}
                    className="w-4 h-4 rounded text-[#000666]"
                  />
                  <span>Schedule for later</span>
                </label>

                {scheduleForLater && (
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="border border-[#c6c5d4] rounded-lg p-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#000666]"
                  />
                )}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requestReceipts}
                  onChange={(e) => setRequestReceipts(e.target.checked)}
                  className="w-4 h-4 rounded text-[#000666]"
                />
                <span>Request read receipts</span>
              </label>
            </div>

            <button
              onClick={handleSend}
              disabled={isSending}
              className="w-full sm:w-auto px-8 py-3 bg-[#000666] text-white font-bold text-[14px] rounded-xl hover:bg-[#1a237e] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>{isSending ? 'SENDING...' : 'SEND EMAIL'}</span>
            </button>
          </div>

          {/* Sending Progress Bar */}
          {isSending && (
            <div className="bg-[#e6f6ff] p-4 rounded-xl border border-[#759efd] animate-in fade-in duration-150">
              <div className="flex justify-between text-[12px] font-bold text-[#000666] mb-1.5">
                <span>Transmitting Encrypted Payload to SMTP Server...</span>
                <span>{sendProgress}%</span>
              </div>
              <div className="w-full bg-[#c6c5d4] rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#000666] h-3 rounded-full transition-all duration-200"
                  style={{ width: `${sendProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-bold text-[18px] text-[#071e27]">Recent Transmission Audit Logs</h2>
            <p className="text-[12px] text-[#454652]">History of sent emails</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#e6f6ff] text-[#454652] font-semibold border-b border-[#c6c5d4]">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Target Recipients</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c5d4]/40">
              {emailLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-[#f3faff] transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-bold text-[#071e27]">{log.subject}</td>
                  <td className="py-3 px-4 text-[#454652]">{log.recipientGroup}</td>
                  <td className="py-3 px-4 font-semibold text-[#071e27]">{log.recipientCount || 240}</td>
                  <td className="py-3 px-4 text-[#454652]">{log.sentAt}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${log.priority === 'URGENT'
                        ? 'bg-[#ffdad6] text-[#ba1a1a]'
                        : 'bg-[#d9e2ff] text-[#00429c]'
                        }`}
                    >
                      {log.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {log.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold text-[11px] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                        FAILED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAiDraftModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#c6c5d4]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#759efd]">auto_awesome</span>
                <h3 className="font-bold text-[18px] text-[#071e27]">AI Announcement Assistant</h3>
              </div>
              <button onClick={() => setShowAiDraftModal(false)} className="text-[#767683]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
                Announcement Topic / Key Points
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Schedule for Mid-Term Exams starting next Monday..."
                className="w-full border border-[#c6c5d4] rounded-xl p-3 text-[13px] outline-none focus:ring-2 focus:ring-[#000666]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') generateAiDraft();
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAiDraftModal(false)}
                className="px-4 py-2 border rounded-lg text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={generateAiDraft}
                className="px-5 py-2 bg-[#000666] text-white rounded-lg text-[13px] font-bold"
              >
                {isGeneratingAi ? 'Drafting...' : 'Generate Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAttachModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#c6c5d4]">
            <h3 className="font-bold text-[18px] text-[#071e27] mb-3">Attach Document</h3>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setNewFileName(e.target.files[0].name);
                }
              }}
              className="w-full border rounded-xl p-3 text-[13px] mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#000666] file:text-white hover:file:bg-[#000666]/90 cursor-pointer"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAttachModal(false)}
                className="px-4 py-2 border rounded-lg text-[13px]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAttachment}
                className="px-4 py-2 bg-[#000666] text-white rounded-lg text-[13px] font-bold"
              >
                Add File
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#c6c5d4]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#d9e2ff] text-[#00429c] px-2 py-0.5 rounded-full">
                  Transmission Log #{selectedLog.id}
                </span>
                <h3 className="font-bold text-[18px] text-[#071e27] mt-1">{selectedLog.subject}</h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-[#767683]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 text-[13px] bg-[#e6f6ff] p-4 rounded-xl mb-4">
              <p><strong>Recipients:</strong> {selectedLog.recipientGroup}</p>
              <p><strong>Total Delivered:</strong> {selectedLog.recipientCount || 240}</p>
              <p><strong>Timestamp:</strong> {selectedLog.sentAt}</p>
              <p><strong>Open Rate:</strong> {selectedLog.openRate || '88.4%'}</p>
              {selectedLog.recipientEmails && (
                <div className="pt-2 border-t border-[#c6c5d4] mt-2">
                  <p className="font-bold mb-1">Raw Recipient Emails:</p>
                  <p className="text-[11px] font-mono break-words">{selectedLog.recipientEmails}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border rounded-xl text-[13px] whitespace-pre-wrap max-h-48 overflow-y-auto mb-4">
              {selectedLog.content || 'No body preview stored.'}
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[#000666] text-white rounded-lg text-[13px] font-bold"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
