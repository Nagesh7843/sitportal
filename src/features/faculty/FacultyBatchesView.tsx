import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '@/services/api';
import { StudentRecord, WorkingBatchConfig, AcademicYear, Division, BatchGroup } from '@/types';

interface FacultyBatchesViewProps {
  facultyEmail?: string;
  facultyDepartment?: string;
  defaultDepartment?: string;
  isFacultyOnly?: boolean;
  onSendBatchNotice?: (batchName?: string, department?: string) => void;
  activeWorkingBatch?: WorkingBatchConfig | null;
  onSaveDefaultBatch?: (batchConfig: WorkingBatchConfig) => Promise<void> | void;
}

interface BatchOption {
  id: string;
  batchCode: string; // 'ALL', 'A1', 'A2', 'A3', 'B1', etc.
  name: string;
  department: string;
  division: string;
  yearLevel: string;
}

const DEPARTMENTS: { code: string; name: string; badgeColor: string }[] = [
  { code: 'ALL', name: 'All Departments', badgeColor: 'bg-slate-100 text-slate-800 border-slate-200' },
  { code: 'CSE', name: 'Computer Science & Engineering', badgeColor: 'bg-blue-50 text-blue-800 border-blue-200' },
  { code: 'AIDS', name: 'Artificial Intelligence & Data Science', badgeColor: 'bg-purple-50 text-purple-800 border-purple-200' },
  { code: 'MECH', name: 'Mechanical Engineering', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { code: 'CIVIL', name: 'Civil Engineering', badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { code: 'ENTC', name: 'Electronics & Telecommunication', badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  { code: 'ELECTRICAL', name: 'Electrical Engineering', badgeColor: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  { code: 'MECHATRONICS', name: 'Mechatronics Engineering', badgeColor: 'bg-rose-50 text-rose-800 border-rose-200' },
  { code: 'BASIC_SCIENCES', name: 'Basic Sciences & Humanities (FE)', badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
];

const normalizeDeptCode = (dept?: string): string => {
  if (!dept) return 'CSE';
  const upper = dept.toUpperCase().trim();
  if (upper.includes('COMP') || upper.includes('CSE')) return 'CSE';
  if (upper.includes('AI') || upper.includes('DATA') || upper.includes('AIDS')) return 'AIDS';
  if (upper.includes('MECH') && !upper.includes('MECHATRONICS')) return 'MECH';
  if (upper.includes('CIVIL')) return 'CIVIL';
  if (upper.includes('ENTC') || upper.includes('TELECOM') || upper.includes('E&TC')) return 'ENTC';
  if (upper.includes('ELEC') && !upper.includes('ELECTRONICS')) return 'ELECTRICAL';
  if (upper.includes('MECHATRONICS')) return 'MECHATRONICS';
  if (upper.includes('BASIC') || upper.includes('HUMANITIES') || upper.includes('FE')) return 'BASIC_SCIENCES';
  return upper;
};

// Robust student matching helper
const isStudentMatch = (
  student: any,
  deptCode: string,
  yearLevel: string, // 'ALL', 'SE', 'TE', 'BE'
  division: string,  // 'ALL', 'Div A', 'Div B', 'Div C'
  batchCode?: string // 'ALL', 'A1', 'A2', 'A3', etc.
): boolean => {
  // 1. Department Match
  const sDept = (student.department || '').toUpperCase().trim();
  const dCode = deptCode.toUpperCase().trim();
  if (dCode !== 'ALL') {
    const deptMatch = sDept === dCode || (dCode === 'CSE' && (sDept.includes('COMP') || sDept.includes('CSE')));
    if (!deptMatch) return false;
  }

  // 2. Year Level Match
  const sYear = (student.academicYear || '').toUpperCase().trim();
  const yLevel = yearLevel.toUpperCase().trim();
  if (yLevel !== 'ALL') {
    const yearMatch =
      sYear === yLevel ||
      (yLevel === 'TE' && (sYear === 'TY' || sYear.includes('THIRD'))) ||
      (yLevel === 'SE' && (sYear === 'SY' || sYear.includes('SECOND'))) ||
      (yLevel === 'BE' && (sYear === 'FINAL' || sYear.includes('FINAL') || sYear.includes('4TH')));
    if (!yearMatch) return false;
  }

  // 3. Division Match
  const sDiv = (student.division || '').toUpperCase().trim();
  if (division !== 'ALL') {
    const divLetter = division.toUpperCase().replace('DIV', '').trim(); // 'A', 'B', 'C'
    const divMatch =
      sDiv === division.toUpperCase() ||
      sDiv === `DIV ${divLetter}` ||
      sDiv === divLetter ||
      sDiv.endsWith(divLetter);
    if (!divMatch) return false;
  }

  // 4. Batch Match
  if (batchCode && batchCode !== 'ALL') {
    const sBatch = (student.batchGroup || '').toUpperCase().trim();
    const targetCode = batchCode.toUpperCase().replace('BATCH', '').trim(); // e.g. 'A1', 'A2', 'A3'
    const batchMatch =
      sBatch === targetCode ||
      sBatch === `BATCH ${targetCode}` ||
      sBatch === `B${targetCode}` ||
      sBatch.endsWith(targetCode);
    if (!batchMatch) return false;
  }

  return true;
};

export const FacultyBatchesView: React.FC<FacultyBatchesViewProps> = ({
  facultyEmail,
  facultyDepartment,
  defaultDepartment = 'CSE',
  isFacultyOnly = true,
  onSendBatchNotice,
  activeWorkingBatch,
  onSaveDefaultBatch,
}) => {
  const effectiveDept = useMemo(() => {
    const raw = facultyDepartment || defaultDepartment || 'CSE';
    return normalizeDeptCode(raw);
  }, [facultyDepartment, defaultDepartment]);

  const [selectedDepartment, setSelectedDepartment] = useState<string>(() => effectiveDept);
  const activeDept = isFacultyOnly ? effectiveDept : selectedDepartment;
  const activeDeptInfo = DEPARTMENTS.find((d) => d.code === activeDept) || DEPARTMENTS[1];

  const [selectedYearLevel, setSelectedYearLevel] = useState<string>('TE');
  const [selectedDivision, setSelectedDivision] = useState<string>('Div A');
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>('ALL');
  
  // Default Working Batch State (Propagated across whole portal)
  const [savedDefaultBatch, setSavedDefaultBatch] = useState<WorkingBatchConfig>(() => {
    if (activeWorkingBatch) return activeWorkingBatch;
    const local = localStorage.getItem('sit_faculty_active_batch');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }
    return {
      department: effectiveDept || 'CSE',
      academicYear: 'TE',
      division: 'Div A',
      batchGroup: 'A1'
    };
  });
  const [isSavingDefaultBatch, setIsSavingDefaultBatch] = useState(false);
  const [defaultBatchToast, setDefaultBatchToast] = useState<string | null>(null);

  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');

  // Sync with activeWorkingBatch prop if it updates from outside
  useEffect(() => {
    if (activeWorkingBatch) {
      setSavedDefaultBatch(activeWorkingBatch);
      if (activeWorkingBatch.academicYear) setSelectedYearLevel(activeWorkingBatch.academicYear as string);
      if (activeWorkingBatch.division) setSelectedDivision(activeWorkingBatch.division as string);
      if (activeWorkingBatch.batchGroup) setSelectedBatchCode(activeWorkingBatch.batchGroup as string);
    }
  }, [activeWorkingBatch]);

  // Initial synchronization on mount to default batch
  useEffect(() => {
    if (savedDefaultBatch) {
      if (savedDefaultBatch.academicYear) setSelectedYearLevel(savedDefaultBatch.academicYear as string);
      if (savedDefaultBatch.division) setSelectedDivision(savedDefaultBatch.division as string);
      if (savedDefaultBatch.batchGroup) setSelectedBatchCode(savedDefaultBatch.batchGroup as string);
    }
  }, []);

  const isCurrentSelectionDefault = useMemo(() => {
    return (
      savedDefaultBatch &&
      savedDefaultBatch.academicYear === selectedYearLevel &&
      savedDefaultBatch.division === selectedDivision &&
      savedDefaultBatch.batchGroup === selectedBatchCode
    );
  }, [savedDefaultBatch, selectedYearLevel, selectedDivision, selectedBatchCode]);

  const handleSaveAsDefaultBatch = async (batchCodeToSet?: string, yearToSet?: string, divToSet?: string) => {
    const targetBatchCode = batchCodeToSet || selectedBatchCode;
    const targetYear = yearToSet || selectedYearLevel;
    const targetDiv = divToSet || selectedDivision;
    const targetDept = activeDept || effectiveDept || 'CSE';

    const newConfig: WorkingBatchConfig = {
      department: targetDept,
      academicYear: targetYear,
      division: targetDiv,
      batchGroup: targetBatchCode
    };

    setIsSavingDefaultBatch(true);
    try {
      setSavedDefaultBatch(newConfig);
      localStorage.setItem('sit_faculty_active_batch', JSON.stringify(newConfig));

      // Also ensure current active view selection matches the newly saved batch
      setSelectedYearLevel(targetYear);
      setSelectedDivision(targetDiv);
      setSelectedBatchCode(targetBatchCode);

      if (onSaveDefaultBatch) {
        await onSaveDefaultBatch(newConfig);
      }
      
      try {
        await apiService.saveDefaultBatch({
          academicYear: newConfig.academicYear as string,
          division: newConfig.division as string,
          batchGroup: newConfig.batchGroup as string,
          department: newConfig.department,
          email: facultyEmail
        });
      } catch (e) {
        console.warn('Backend API saveDefaultBatch note:', e);
      }

      setDefaultBatchToast(`✨ Saved ${newConfig.academicYear} • ${newConfig.division} • ${newConfig.batchGroup === 'ALL' ? 'All Batches' : `Batch ${newConfig.batchGroup}`} as your active default batch across the entire portal!`);
      setTimeout(() => setDefaultBatchToast(null), 4000);
    } catch (err: any) {
      console.error('Could not save default batch:', err);
      setDefaultBatchToast(`✨ Active batch set to ${newConfig.academicYear} • ${newConfig.division} • ${newConfig.batchGroup}`);
      setTimeout(() => setDefaultBatchToast(null), 4000);
    } finally {
      setIsSavingDefaultBatch(false);
    }
  };

  const handleJumpToDefaultBatch = () => {
    if (savedDefaultBatch) {
      if (savedDefaultBatch.academicYear) setSelectedYearLevel(savedDefaultBatch.academicYear as string);
      if (savedDefaultBatch.division) setSelectedDivision(savedDefaultBatch.division as string);
      if (savedDefaultBatch.batchGroup) setSelectedBatchCode(savedDefaultBatch.batchGroup as string);
    }
  };

  // Targeted Direct Device Notification Modal State
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyUrgency, setNotifyUrgency] = useState<'NORMAL' | 'IMPORTANT' | 'URGENT'>('NORMAL');
  const [notifySendEmail, setNotifySendEmail] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationSuccessMsg, setNotificationSuccessMsg] = useState<string | null>(null);

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<StudentRecord>>({});
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [studentEditSuccessMsg, setStudentEditSuccessMsg] = useState<string | null>(null);

  // Keep department synced with facultyDepartment prop
  useEffect(() => {
    if (effectiveDept) {
      setSelectedDepartment(effectiveDept);
    }
  }, [effectiveDept]);

  // Fetch live students from backend
  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const studentsRes = await apiService.fetchStudents(effectiveDept !== 'ALL' ? effectiveDept : undefined).catch(() => []);
      setAllStudents(studentsRes || []);
    } catch (err) {
      console.warn('Failed to load batch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [effectiveDept, facultyEmail]);

  // Generate dynamic batch options
  const batchOptions = useMemo<BatchOption[]>(() => {
    const options: BatchOption[] = [];

    // All Batches Option
    options.push({
      id: 'ALL',
      batchCode: 'ALL',
      name: selectedDivision === 'ALL' ? 'All Batches (All Divs)' : `All Batches (${selectedDivision})`,
      department: activeDept,
      division: selectedDivision,
      yearLevel: selectedYearLevel
    });

    const divisionsToGenerate = selectedDivision === 'ALL' ? ['Div A', 'Div B', 'Div C'] : [selectedDivision];

    divisionsToGenerate.forEach((div) => {
      const letter = div.replace('Div ', '').trim();
      ['1', '2', '3'].forEach((num) => {
        const bCode = `${letter}${num}`;
        options.push({
          id: `${activeDept}-${selectedYearLevel}-${div}-${bCode}`,
          batchCode: bCode,
          name: `Batch ${bCode} (${div})`,
          department: activeDept,
          division: div,
          yearLevel: selectedYearLevel
        });
      });
    });

    return options;
  }, [activeDept, selectedYearLevel, selectedDivision]);

  // Reset selected batch code if it is not valid in the current options
  useEffect(() => {
    if (selectedBatchCode !== 'ALL' && !batchOptions.some((b) => b.batchCode === selectedBatchCode)) {
      setSelectedBatchCode('ALL');
    }
  }, [batchOptions, selectedBatchCode]);

  // Count students in each batch option for live badge display
  const getBatchStudentCount = (bCode: string) => {
    return allStudents.filter((s) =>
      isStudentMatch(s, activeDept, selectedYearLevel, selectedDivision, bCode)
    ).length;
  };

  // Get active students matching current selection
  const batchStudents = useMemo(() => {
    return allStudents.filter((s) =>
      isStudentMatch(s, activeDept, selectedYearLevel, selectedDivision, selectedBatchCode)
    );
  }, [allStudents, activeDept, selectedYearLevel, selectedDivision, selectedBatchCode]);

  // Search filtering within the filtered students
  const searchedStudents = useMemo(() => {
    if (!studentSearch.trim()) return batchStudents;
    const q = studentSearch.toLowerCase().trim();
    return batchStudents.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.rollNo?.toLowerCase().includes(q) ||
        s.prn?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [batchStudents, studentSearch]);

  // Quick statistics calculation
  const avgAttendance = useMemo(() => {
    if (batchStudents.length === 0) return '0.0';
    const studentsWithAttendance = batchStudents.filter((s) => s.attendance != null);
    if (studentsWithAttendance.length === 0) return '88.5';
    const sum = studentsWithAttendance.reduce((acc, s) => acc + (s.attendance || 0), 0);
    return (sum / studentsWithAttendance.length).toFixed(1);
  }, [batchStudents]);

  const avgGpa = useMemo(() => {
    if (batchStudents.length === 0) return '0.00';
    const studentsWithGpa = batchStudents.filter((s) => s.gpa != null);
    if (studentsWithGpa.length === 0) return '8.45';
    const sum = studentsWithGpa.reduce((acc, s) => acc + (s.gpa || 0), 0);
    return (sum / studentsWithGpa.length).toFixed(2);
  }, [batchStudents]);

  const selectedBatchInfo = batchOptions.find((b) => b.batchCode === selectedBatchCode) || batchOptions[0];

  // Handler: Dispatch Direct Device Notification (No digital notice created)
  const handleSendDeviceNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTitle.trim() || !notifyMessage.trim()) {
      alert('Please provide both notification title and message.');
      return;
    }

    setIsSendingNotification(true);
    setNotificationSuccessMsg(null);

    try {
      const targetEmails = batchStudents
        .map((s) => s.email)
        .filter((em): em is string => Boolean(em && em.trim().length > 0));

      const payload = {
        title: notifyTitle.trim(),
        message: notifyMessage.trim(),
        department: activeDept,
        yearLevel: selectedYearLevel,
        division: selectedDivision,
        batchCode: selectedBatchCode,
        urgency: notifyUrgency,
        sendEmail: notifySendEmail,
        studentEmails: targetEmails,
      };

      const result = await apiService.sendDirectBatchNotification(payload);

      setNotificationSuccessMsg(
        result.message || `🚀 Direct notification successfully sent to ${batchStudents.length} student devices! No digital notice was posted to the board.`
      );
      setNotifyTitle('');
      setNotifyMessage('');

      setTimeout(() => {
        setShowNotifyModal(false);
        setNotificationSuccessMsg(null);
      }, 3500);
    } catch (err: any) {
      alert(`Failed to send notification: ${err.message || 'Server error'}`);
    } finally {
      setIsSendingNotification(false);
    }
  };

  // Handler: Open Edit Student Modal
  const handleOpenEditStudent = (student: StudentRecord) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name,
      rollNo: student.rollNo,
      prn: student.prn,
      email: student.email,
      department: (student.department || activeDept) as any,
      academicYear: (student.academicYear || selectedYearLevel) as any,
      division: (student.division || selectedDivision) as any,
      batchGroup: (student.batchGroup || (selectedBatchCode !== 'ALL' ? selectedBatchCode : 'A1')) as any,
      attendance: student.attendance != null ? student.attendance : 85,
      gpa: student.gpa != null ? student.gpa : 8.0,
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      parentEmail: student.parentEmail || '',
      parentRelationship: student.parentRelationship || 'Parent',
      status: student.status || 'Active'
    });
    setStudentEditSuccessMsg(null);
  };

  // Handler: Save Student Edit Changes
  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editingStudent.id) return;

    setIsSavingStudent(true);
    setStudentEditSuccessMsg(null);

    try {
      const updated = await apiService.updateStudent(editingStudent.id, editFormData);

      // Immediately update local state so changes reflect instantly
      setAllStudents((prev) =>
        prev.map((s) => (s.id === editingStudent.id ? { ...s, ...editFormData, ...updated } : s))
      );

      setStudentEditSuccessMsg('✅ Student data updated successfully! Changes reflected all over the platform.');

      setTimeout(() => {
        setEditingStudent(null);
        setStudentEditSuccessMsg(null);
        loadStudents(); // Re-sync latest from database
      }, 1200);
    } catch (err: any) {
      alert(`Failed to update student: ${err.message || 'Error occurred'}`);
    } finally {
      setIsSavingStudent(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {defaultBatchToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{defaultBatchToast}</span>
          </div>
          <button onClick={() => setDefaultBatchToast(null)} className="text-white/80 hover:text-white cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAIN HEADER & DEPARTMENT SCOPE SECTION                   */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-2xl">groups</span>
              <h2 className="text-xl font-bold text-gray-900">
                Faculty Assigned Batches & Student Monitoring
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isFacultyOnly
                ? `Monitoring batches and student performance for your assigned department: ${activeDeptInfo.name} (${effectiveDept}).`
                : 'Select and filter batches by department, academic year, and division to inspect student progression.'}
            </p>
          </div>

          {/* TARGETED DEVICE NOTIFICATION BUTTON (NO DIGITAL NOTICE CREATED) */}
          <button
            onClick={() => {
              setNotifyTitle(`Update for ${selectedBatchInfo.name} Students`);
              setShowNotifyModal(true);
            }}
            className="px-4 py-2.5 bg-[#000666] hover:bg-[#1a237e] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 shrink-0 transition-all cursor-pointer active:scale-98"
            title="Sends direct push notification to enrolled student devices (No digital notice created)"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>Notify {selectedBatchInfo.name}</span>
          </button>
        </div>

        {/* Minimal Default Working Batch Status Strip */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#000666] text-white rounded-md">
              {effectiveDept}
            </span>
            <span className="text-xs font-bold text-slate-800">
              {selectedYearLevel} • {selectedDivision} • {selectedBatchCode === 'ALL' ? 'All Batches' : `Batch ${selectedBatchCode}`}
            </span>
            {isCurrentSelectionDefault ? (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                ✓ Default Batch
              </span>
            ) : (
              <button
                type="button"
                disabled={isSavingDefaultBatch}
                onClick={() => handleSaveAsDefaultBatch()}
                className="px-2.5 py-1 bg-[#000666] hover:bg-[#1a237e] text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[13px] text-amber-300">star</span>
                <span>{isSavingDefaultBatch ? 'Saving...' : 'Set as Default'}</span>
              </button>
            )}
          </div>

          {!isCurrentSelectionDefault && savedDefaultBatch && (
            <button
              type="button"
              onClick={handleJumpToDefaultBatch}
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              ↩ Jump to Default ({savedDefaultBatch.batchGroup})
            </button>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* DEPARTMENT & BATCH CONTROLS                          */}
        {/* ---------------------------------------------------- */}
        <div className="mt-4 space-y-3">
          {/* Multi-Department Selector (Admin / Global View) */}
          {!isFacultyOnly && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-[16px] text-[#000666]">domain</span>
                  <span>Filter by Department:</span>
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  Active: <span className="font-bold text-[#000666]">{activeDeptInfo.name}</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = selectedDepartment === dept.code;
                  return (
                    <button
                      key={dept.code}
                      type="button"
                      onClick={() => setSelectedDepartment(dept.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-[#000666] text-white border-[#000666] shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span>{dept.code === 'ALL' ? '🌐' : '🏛️'}</span>
                      <span>{dept.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Secondary Filters: Year Level & Division */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
            {/* Year Level Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Year Level:</span>
              <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                {[
                  { key: 'ALL', label: 'All Years' },
                  { key: 'SE', label: 'SE' },
                  { key: 'TE', label: 'TE' },
                  { key: 'BE', label: 'BE' }
                ].map((yr) => (
                  <button
                    key={yr.key}
                    type="button"
                    onClick={() => setSelectedYearLevel(yr.key)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedYearLevel === yr.key ? 'bg-white text-[#000666] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {yr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Division Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Division:</span>
              <div className="inline-flex bg-slate-100 p-1 rounded-xl">
                {[
                  { key: 'ALL', label: 'All Divs' },
                  { key: 'Div A', label: 'Div A' },
                  { key: 'Div B', label: 'Div B' },
                  { key: 'Div C', label: 'Div C' }
                ].map((div) => (
                  <button
                    key={div.key}
                    type="button"
                    onClick={() => setSelectedDivision(div.key)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedDivision === div.key ? 'bg-white text-[#000666] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {div.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-auto text-[11px] font-semibold text-slate-500">
              Matching Students: <strong className="text-[#000666] font-bold">{batchStudents.length}</strong> in {activeDept}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* BATCH SELECTION TABS                                 */}
          {/* ---------------------------------------------------- */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Select Batch ({batchOptions.length} Options):
              </label>
              <span className="text-[11px] text-slate-500">
                Active Filter: <strong className="text-slate-900">{selectedBatchInfo.name}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {batchOptions.map((b) => {
                const isSelected = selectedBatchCode === b.batchCode;
                const count = getBatchStudentCount(b.batchCode);
                const isThisDefault =
                  savedDefaultBatch &&
                  savedDefaultBatch.academicYear === selectedYearLevel &&
                  savedDefaultBatch.division === selectedDivision &&
                  savedDefaultBatch.batchGroup === b.batchCode;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBatchCode(b.batchCode)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#000666] text-white border-[#000666] shadow-md scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {b.batchCode === 'ALL' ? 'select_all' : 'folder_shared'}
                    </span>
                    <span>{b.name}</span>
                    {isThisDefault && (
                      <span className="text-[10px] text-amber-300 font-extrabold flex items-center">
                        ⭐
                      </span>
                    )}
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : count > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Simple Enrolled Count */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#000666]">group</span>
            <span className="font-bold text-slate-900">{batchStudents.length} Enrolled Students</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BATCH STUDENTS ROSTER TABLE (WITH FACULTY EDIT ACTIONS)  */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-[#d6d9e0] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#000666] text-xl">person_search</span>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Roster: {selectedBatchInfo.name} ({activeDept})
              </h3>
              <p className="text-[11px] text-gray-500">
                Displaying {searchedStudents.length} of {batchStudents.length} student records • Click edit to update attendance, GPA, or parent details
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Search by name, roll, or PRN..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#000666] focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {searchedStudents.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500 bg-gray-50/70 rounded-xl border border-gray-200">
            <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">person_off</span>
            <p className="font-bold text-gray-700">
              No students found matching "{selectedBatchInfo.name}" in {activeDept}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Select another batch or change the Year Level / Division filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Year / Div / Batch</th>
                  <th className="p-3.5">PRN / Roll No</th>
                  <th className="p-3.5">Attendance</th>
                  <th className="p-3.5">Academic GPA</th>
                  <th className="p-3.5">Parent Contact</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {searchedStudents.map((student) => {
                  const attendanceVal = student.attendance != null ? student.attendance : 85;
                  const isAttendanceGood = attendanceVal >= 75;

                  return (
                    <tr key={student.id || student.prn || student.rollNo} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-3.5 font-bold text-gray-900">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-500 font-normal font-mono">{student.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            {student.academicYear || selectedYearLevel}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {student.division || selectedDivision}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                            {student.batchGroup ? `Batch ${student.batchGroup}` : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-[#000666]">{student.prn || student.rollNo}</div>
                        <div className="text-[10px] text-slate-400">Roll: {student.rollNo || '—'}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isAttendanceGood ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {isAttendanceGood ? 'check' : 'warning'}
                          </span>
                          {attendanceVal}%
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 font-mono">
                        {student.gpa != null ? `${student.gpa} / 10.0` : '—'}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="font-semibold text-slate-800">{student.parentName || 'Parent / Guardian'}</div>
                        <div className="text-[10px] font-mono text-slate-400">{student.parentPhone || student.parentEmail || '—'}</div>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* EDIT STUDENT DATA BUTTON */}
                          <button
                            onClick={() => handleOpenEditStudent(student)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg inline-flex items-center transition-colors cursor-pointer"
                            title={`Edit ${student.name}'s attendance, GPA, batch, and parent data`}
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>

                          {/* DIRECT EMAIL ACTION */}
                          <a
                            href={`mailto:${student.email}`}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg inline-flex items-center transition-colors"
                            title={`Send direct email to ${student.name}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">mail</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: DIRECT STUDENT DEVICE NOTIFICATION (NO DIGITAL NOTICE CREATED)   */}
      {/* ========================================================================= */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#000666] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">cell_tower</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Direct Device Notification</h3>
                    <p className="text-[11px] text-slate-500">Sends directly to students' devices • No digital notice created</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowNotifyModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Target Audience Badge Banner */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-950">Target Device Audience:</span>
                <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-[10px]">
                  {batchStudents.length} Students
                </span>
              </div>
              <div className="text-[11px] text-blue-800">
                <strong>{activeDept}</strong> • {selectedYearLevel} • {selectedDivision} • <strong>{selectedBatchInfo.name}</strong>
              </div>
            </div>

            {notificationSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                  <span>Notification Dispatched!</span>
                </div>
                <p className="text-[11px] text-emerald-800">{notificationSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSendDeviceNotification} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notification Headline *
                  </label>
                  <input
                    type="text"
                    required
                    value={notifyTitle}
                    onChange={(e) => setNotifyTitle(e.target.value)}
                    placeholder="e.g., Lab 3 Journal Verification Tomorrow at 10 AM"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#000666] focus:outline-hidden font-medium text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Notification Body Content *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={notifyMessage}
                    onChange={(e) => setNotifyMessage(e.target.value)}
                    placeholder="Provide specific instructions, timing, lab venue, or urgent announcement for this batch..."
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#000666] focus:outline-hidden font-normal text-slate-900 bg-white resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Urgency Level
                    </label>
                    <select
                      value={notifyUrgency}
                      onChange={(e: any) => setNotifyUrgency(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#000666] focus:outline-hidden font-bold"
                    >
                      <option value="NORMAL">Standard Update</option>
                      <option value="IMPORTANT">Important Action</option>
                      <option value="URGENT">Urgent Alert</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 p-2 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={notifySendEmail}
                        onChange={(e) => setNotifySendEmail(e.target.checked)}
                        className="rounded text-[#000666] focus:ring-[#000666]"
                      />
                      <span className="text-[11px] font-bold text-slate-700">Also send direct email copy</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowNotifyModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingNotification || batchStudents.length === 0}
                    className="px-5 py-2 bg-[#000666] hover:bg-[#1a237e] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSendingNotification ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        <span>Broadcasting to Devices...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>Send to {batchStudents.length} Devices</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT STUDENT DATA & SYNC ALL OVER PLATFORM                       */}
      {/* ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Edit Student Record: {editingStudent.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Updates saved here reflect everywhere across the SIT Portal (Faculty, HOD, Student & Parent Views)
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {studentEditSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                <span>{studentEditSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSaveStudentEdit} className="space-y-4">
                
                {/* 1. Academic Tracking Fields (Attendance & GPA) */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
                  <div className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-700 text-[16px]">trending_up</span>
                    <span>Academic Progress & Attendance Tracking</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Attendance Percentage (%):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        required
                        value={editFormData.attendance ?? 85}
                        onChange={(e) => setEditFormData({ ...editFormData, attendance: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-[#000666] focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Academic CGPA (out of 10.0):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10.0"
                        step="0.01"
                        required
                        value={editFormData.gpa ?? 8.5}
                        onChange={(e) => setEditFormData({ ...editFormData, gpa: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-bold text-slate-900 focus:ring-2 focus:ring-[#000666] focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Batch & Division Assignment */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Academic Year Level:
                    </label>
                    <select
                      value={editFormData.academicYear || 'TE'}
                      onChange={(e) => setEditFormData({ ...editFormData, academicYear: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-900"
                    >
                      <option value="SE">SE (Second Year)</option>
                      <option value="TE">TE (Third Year)</option>
                      <option value="BE">BE (Final Year)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Division:
                    </label>
                    <select
                      value={editFormData.division || 'Div A'}
                      onChange={(e) => setEditFormData({ ...editFormData, division: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-900"
                    >
                      <option value="Div A">Div A</option>
                      <option value="Div B">Div B</option>
                      <option value="Div C">Div C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Batch Group:
                    </label>
                    <select
                      value={editFormData.batchGroup || 'A1'}
                      onChange={(e) => setEditFormData({ ...editFormData, batchGroup: e.target.value as any })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold text-slate-900"
                    >
                      <option value="A1">Batch A1</option>
                      <option value="A2">Batch A2</option>
                      <option value="A3">Batch A3</option>
                      <option value="B1">Batch B1</option>
                      <option value="B2">Batch B2</option>
                      <option value="B3">Batch B3</option>
                      <option value="C1">Batch C1</option>
                      <option value="C2">Batch C2</option>
                      <option value="C3">Batch C3</option>
                    </select>
                  </div>
                </div>

                {/* 3. Student Identification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Roll Number:
                    </label>
                    <input
                      type="text"
                      value={editFormData.rollNo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, rollNo: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      PRN (Permanent Reg No):
                    </label>
                    <input
                      type="text"
                      value={editFormData.prn || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, prn: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                    />
                  </div>
                </div>

                {/* 4. Parent / Guardian Contact Details */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-slate-600 text-[16px]">family_restroom</span>
                    <span>Parent / Guardian Information (Linked Ward Sync)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Parent Name:
                      </label>
                      <input
                        type="text"
                        value={editFormData.parentName || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, parentName: e.target.value })}
                        placeholder="e.g., Shankar Gaikwad"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Parent Phone / Mobile:
                      </label>
                      <input
                        type="tel"
                        value={editFormData.parentPhone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, parentPhone: e.target.value })}
                        placeholder="e.g., 9876543210"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Parent Email:
                      </label>
                      <input
                        type="email"
                        value={editFormData.parentEmail || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, parentEmail: e.target.value })}
                        placeholder="e.g., parent@gmail.com"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingStudent}
                    className="px-5 py-2 bg-[#000666] hover:bg-[#1a237e] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingStudent ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>Save & Sync Platform</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
