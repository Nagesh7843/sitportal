import React, { useState, useEffect } from 'react';
import { StudentRecord, ViewMode, AcademicYear, Division, BatchGroup, WorkingBatchConfig, UserProfile, UserRole } from '@/types';
import { apiService } from '@/services/api';

interface StudentsDirectoryViewProps {
  students: StudentRecord[];
  onAddStudent?: () => void;
  onNavigate: (view: ViewMode, emailContext?: string) => void;
  onAddStudentsBulk?: (students: StudentRecord[]) => void;
  onDeleteStudent?: (id: string | number) => void;
  onUpdateStudent?: (id: string | number, student: Partial<StudentRecord>) => void;
  activeWorkingBatch?: WorkingBatchConfig | null;
  userRole?: UserRole | string;
  currentProfile?: UserProfile | null;
}

export const StudentsDirectoryView: React.FC<StudentsDirectoryViewProps> = ({
  students,
  onAddStudent,
  onNavigate,
  onAddStudentsBulk,
  onDeleteStudent,
  onUpdateStudent,
  activeWorkingBatch,
  userRole,
  currentProfile
}) => {
  const isFaculty = userRole === 'faculty';

  // Initialize filters based on userRole and activeWorkingBatch
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>(() => {
    if (isFaculty) {
      return activeWorkingBatch?.department || currentProfile?.department || 'CSE';
    }
    return 'ALL';
  });
  const [yearFilter, setYearFilter] = useState<AcademicYear | 'ALL'>(() => {
    if (isFaculty) {
      return (activeWorkingBatch?.academicYear as AcademicYear) || 'SE';
    }
    return 'ALL';
  });
  const [divisionFilter, setDivisionFilter] = useState<Division | 'ALL'>(() => {
    if (isFaculty) {
      return (activeWorkingBatch?.division as Division) || 'Div A';
    }
    return 'ALL';
  });
  const [batchGroupFilter, setBatchGroupFilter] = useState<BatchGroup | 'ALL'>(() => {
    if (isFaculty) {
      return (activeWorkingBatch?.batchGroup as BatchGroup) || 'A1';
    }
    return 'ALL';
  });

  // Automatically lock/update filters for faculty when activeWorkingBatch or currentProfile changes
  useEffect(() => {
    if (isFaculty && activeWorkingBatch) {
      if (activeWorkingBatch.department) setDeptFilter(activeWorkingBatch.department);
      if (activeWorkingBatch.academicYear) setYearFilter(activeWorkingBatch.academicYear as AcademicYear);
      if (activeWorkingBatch.division) setDivisionFilter(activeWorkingBatch.division as Division);
      if (activeWorkingBatch.batchGroup) setBatchGroupFilter(activeWorkingBatch.batchGroup as BatchGroup);
    }
  }, [isFaculty, activeWorkingBatch]);
  
  // Export CSV Loading State
  const [isExporting, setIsExporting] = useState(false);

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    rollNo: string;
    prn: string;
    email: string;
    department: string;
    academicYear: AcademicYear;
    division: Division;
    batchGroup: BatchGroup;
    gpa: string;
    attendance: string;
    cohortBatch: string;
    status: 'Active' | 'Inactive';
    qualificationPath: '12TH' | 'DIPLOMA';
    tenthPercentage: string;
    twelfthPercentage: string;
    diplomaPercentage: string;
    parentName: string;
    parentEmail: string;
    parentPhone: string;
    parentRelationship: string;
    addressLine1: string;
    addressLine2: string;
    villageCity: string;
    taluka: string;
    district: string;
    state: string;
    pinCode: string;
    country: string;
  }>({
    name: '',
    rollNo: '',
    prn: '',
    email: '',
    department: 'CSE',
    academicYear: 'SE',
    division: 'Div A',
    batchGroup: 'A1',
    gpa: '3.5',
    attendance: '90',
    cohortBatch: '2024-2028',
    status: 'Active',
    qualificationPath: '12TH',
    tenthPercentage: '80',
    twelfthPercentage: '75',
    diplomaPercentage: '80',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentRelationship: 'Father',
    addressLine1: '',
    addressLine2: '',
    villageCity: '',
    taluka: '',
    district: '',
    state: 'Maharashtra',
    pinCode: '',
    country: 'India'
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (divisionFilter === 'Div A' && batchGroupFilter !== 'ALL' && !batchGroupFilter.startsWith('A')) setBatchGroupFilter('ALL');
    if (divisionFilter === 'Div B' && batchGroupFilter !== 'ALL' && !batchGroupFilter.startsWith('B')) setBatchGroupFilter('ALL');
    if (divisionFilter === 'Div C' && batchGroupFilter !== 'ALL' && !batchGroupFilter.startsWith('C')) setBatchGroupFilter('ALL');
  }, [divisionFilter, batchGroupFilter]);

  const handleOpenEdit = async (student: StudentRecord) => {
    setEditingStudent(student);
    const prnKey = student.prn || student.rollNo;
    
    // Set base form data
    setEditForm({
      name: student.name || '',
      rollNo: student.rollNo || '',
      prn: student.prn || '',
      email: student.email || '',
      department: student.department || 'CSE',
      academicYear: student.academicYear || 'SE',
      division: student.division || 'Div A',
      batchGroup: student.batchGroup || 'A1',
      gpa: (student.gpa !== undefined && student.gpa !== null ? student.gpa : 8.5).toString(),
      attendance: (student.attendance !== undefined && student.attendance !== null ? student.attendance : 90).toString(),
      cohortBatch: student.cohortBatch || '2024-2028',
      status: student.status || 'Active',
      qualificationPath: '12TH',
      tenthPercentage: '80',
      twelfthPercentage: '75',
      diplomaPercentage: '80',
      parentName: student.parentName || '',
      parentEmail: student.parentEmail || '',
      parentPhone: student.parentPhone || '',
      parentRelationship: student.parentRelationship || 'Father',
      addressLine1: student.addressLine1 || '',
      addressLine2: student.addressLine2 || '',
      villageCity: student.villageCity || '',
      taluka: student.taluka || '',
      district: student.district || '',
      state: student.state || 'Maharashtra',
      pinCode: student.pinCode || '',
      country: student.country || 'India'
    });

    if (prnKey) {
      try {
        const acad = await apiService.getStudentAcademicData(prnKey);
        if (acad) {
          setEditForm(prev => ({
            ...prev,
            qualificationPath: acad.qualificationPath || '12TH',
            tenthPercentage: (acad.tenthPercentage ?? 80).toString(),
            twelfthPercentage: (acad.twelfthPercentage ?? 75).toString(),
            diplomaPercentage: (acad.diplomaPercentage ?? 80).toString(),
            gpa: (acad.cgpa ?? prev.gpa).toString(),
          }));
        }
      } catch (err) {
        console.warn('Could not load academic data for student edit:', err);
      }
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !onUpdateStudent) return;

    const studentId = editingStudent.id ?? editingStudent.rollNo;

    const updatedData: Partial<StudentRecord> = {
      name: editForm.name.trim(),
      rollNo: editForm.rollNo.trim(),
      prn: editForm.prn.trim(),
      email: editForm.email.trim(),
      department: editForm.department,
      academicYear: editForm.academicYear,
      division: editForm.division,
      batchGroup: editForm.batchGroup,
      cohortBatch: editForm.cohortBatch.trim(),
      gpa: Math.min(10.0, Math.max(0, parseFloat(editForm.gpa) || 0)),
      attendance: Math.min(100, Math.max(0, parseFloat(editForm.attendance) || 0)),
      status: editForm.status,
      parentName: editForm.parentName.trim(),
      parentEmail: editForm.parentEmail.trim().toLowerCase(),
      parentPhone: editForm.parentPhone.trim(),
      parentRelationship: editForm.parentRelationship.trim(),
      addressLine1: editForm.addressLine1.trim(),
      addressLine2: editForm.addressLine2.trim() || undefined,
      villageCity: editForm.villageCity.trim(),
      taluka: editForm.taluka.trim(),
      district: editForm.district.trim(),
      state: editForm.state.trim() || 'Maharashtra',
      pinCode: editForm.pinCode.trim(),
      country: editForm.country.trim() || 'India'
    };

    onUpdateStudent(studentId, updatedData);

    const prnKey = editForm.prn.trim() || editForm.rollNo.trim();
    if (prnKey) {
      apiService.saveStudentAcademicData(prnKey, {
        prn: prnKey,
        qualificationPath: editForm.qualificationPath,
        tenthPercentage: parseFloat(editForm.tenthPercentage) || 0,
        twelfthPercentage: editForm.qualificationPath === '12TH' ? parseFloat(editForm.twelfthPercentage) || 0 : 0,
        diplomaPercentage: editForm.qualificationPath === 'DIPLOMA' ? parseFloat(editForm.diplomaPercentage) || 0 : 0,
        cgpa: parseFloat(editForm.gpa) || 8.0,
        activeBacklogs: 0,
        totalBacklogs: 0
      }).catch(err => console.warn('Failed saving academic data in edit:', err));
    }

    setEditingStudent(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddStudentsBulk) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        alert('File appears empty or missing data rows.');
        return;
      }
      
      const records: StudentRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(s => s.trim());
        if (row.length >= 2 && row[0] && row[1]) {
          records.push({
            name: row[0],
            rollNo: row[1],
            email: row[2] || `${row[1].toLowerCase()}@student.sitcoe.org`,
            academicYear: (row[3] as AcademicYear) || 'SE',
            division: (row[4] as Division) || 'Div A',
            batchGroup: (row[5] as BatchGroup) || 'A1',
            prn: row[7] || '',
            gpa: parseFloat(row[8]) || 3.5,
            cohortBatch: row[6] || '2024-2028',
            avatarBg: 'bg-[#d9e2ff] text-[#00429c]',
            initials: row[0].split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
            parentName: row[9] || '',
            parentEmail: row[10] || '',
            parentPhone: row[11] || '',
            parentRelationship: row[12] || 'Parent/Guardian',
            status: 'Active'
          });
        }
      }
      
      if (records.length > 0) {
        onAddStudentsBulk(records);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filtered = students.filter((s) => {
    // 1. Search Query
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.rollNo && s.rollNo.toLowerCase().includes(q)) ||
      (s.prn && s.prn.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.parentName && s.parentName.toLowerCase().includes(q)) ||
      (s.parentEmail && s.parentEmail.toLowerCase().includes(q));

    // 2. Department
    const sDept = (s.department || 'CSE').toUpperCase().trim();
    const dFilter = deptFilter.toUpperCase().trim();
    let matchesDept = true;
    if (dFilter !== 'ALL') {
      matchesDept = sDept === dFilter || (dFilter === 'CSE' && (sDept.includes('COMP') || sDept.includes('CSE')));
    }

    // 3. Year Level (Strict match: SE should only match SE/SY, TE should only match TE/TY, etc.)
    const sYear = (s.academicYear || '').toUpperCase().trim();
    const yFilter = (yearFilter || 'ALL').toUpperCase().trim();
    let matchesYear = true;
    if (yFilter !== 'ALL') {
      if (yFilter === 'FE') {
        matchesYear = sYear === 'FE' || sYear === 'FY' || sYear.includes('FIRST');
      } else if (yFilter === 'SE') {
        matchesYear = sYear === 'SE' || sYear === 'SY' || sYear.includes('SECOND');
      } else if (yFilter === 'TE') {
        matchesYear = sYear === 'TE' || sYear === 'TY' || sYear.includes('THIRD');
      } else if (yFilter === 'BE') {
        matchesYear = sYear === 'BE' || sYear === 'BY' || sYear === 'FINAL' || sYear.includes('FINAL');
      } else {
        matchesYear = sYear === yFilter;
      }
    }

    // 4. Division (Strict match: Div A should only match Div A)
    const sDiv = (s.division || '').toUpperCase().replace(/\s+/g, '');
    const divFilterClean = (divisionFilter || 'ALL').toUpperCase().replace(/\s+/g, '');
    let matchesDiv = true;
    if (divFilterClean !== 'ALL') {
      matchesDiv = sDiv === divFilterClean || sDiv === divFilterClean.replace('DIV', '');
    }

    const sBatch = (s.batchGroup || '').toUpperCase().replace('BATCH', '').trim();
    const bFilterClean = (batchGroupFilter || 'ALL').toUpperCase().replace('BATCH', '').trim();
    let matchesBatchGroup = true;
    if (bFilterClean !== 'ALL') {
      matchesBatchGroup = sBatch === bFilterClean;
    }

    return matchesSearch && matchesDept && matchesYear && matchesDiv && matchesBatchGroup;
  });

  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      if (!filtered || filtered.length === 0) {
        alert('No students found matching the current search/filters to download.');
        setIsExporting(false);
        return;
      }

      const escapeCsvCell = (val: any): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };

      const headers = [
        'Roll No',
        'Student Name',
        'PRN',
        'Email',
        'Department',
        'Academic Year',
        'Division',
        'Batch Group',
        'Cohort Batch',
        'Status',
        'GPA',
        'Attendance (%)',
        'Parent Name',
        'Parent Relationship',
        'Parent Email',
        'Parent Phone',
        'Address Line 1',
        'City / Village',
        'Taluka',
        'District',
        'State',
        'PIN Code'
      ];

      const rows = filtered.map((s) => [
        s.rollNo ?? '',
        s.name ?? '',
        s.prn ?? '',
        s.email ?? '',
        s.department ?? 'CSE',
        s.academicYear ?? '',
        s.division ?? '',
        s.batchGroup ?? '',
        s.cohortBatch ?? '',
        s.status ?? 'Active',
        s.gpa ?? '',
        s.attendance ?? '',
        s.parentName ?? '',
        s.parentRelationship ?? '',
        s.parentEmail ?? '',
        s.parentPhone ?? '',
        s.addressLine1 ?? '',
        s.villageCity ?? '',
        s.taluka ?? '',
        s.district ?? '',
        s.state ?? '',
        s.pinCode ?? ''
      ]);

      const csvContent = [
        headers.map(escapeCsvCell).join(','),
        ...rows.map((row) => row.map(escapeCsvCell).join(','))
      ].join('\r\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const filename = `students_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download CSV error:', err);
      alert('Failed to generate students CSV export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#000666] text-white p-4 sm:p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-[24px] font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] sm:text-[28px] text-[#759efd]">school</span>
            <span>Student & Parent Roster Directory</span>
          </h1>
          <p className="text-[#cfe6f2] text-xs sm:text-[13px] mt-1">
            Academic Years (FE, SE, TE, BE) • Parent/Guardian Login Records • PRN & Academic Performance
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 items-center w-full md:w-auto">
          {onAddStudent && (
            <button
              onClick={onAddStudent}
              className="flex-1 sm:flex-none justify-center bg-white text-[#000666] font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] hover:bg-[#cfe6f2] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Add Student</span>
            </button>
          )}
          {onAddStudentsBulk && (
            <>
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 sm:flex-none justify-center bg-[#000666] border-2 border-white text-white font-bold px-3.5 py-2 rounded-xl text-xs sm:text-[13px] hover:bg-white hover:text-[#000666] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload CSV</span>
              </button>
            </>
          )}
          <button
            onClick={() => onNavigate('bulk-email')}
            className="flex-1 sm:flex-none justify-center bg-[#759efd] text-[#00337c] font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] hover:bg-[#b0c6ff] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>Send Notice</span>
          </button>
        </div>
      </div>

      {/* Directory Filter / Scope Control Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#c6c5d4] shadow-xs flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 sm:gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student, roll no, email, or parent name/email..."
          className="w-full lg:w-80 bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-3.5 py-2 text-xs sm:text-[13px] focus:ring-2 focus:ring-[#000666] outline-none"
        />

        {isFaculty ? (
          /* Faculty Scoped View: Minimal Batch Indicator & Switcher */
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2">
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#000666] text-white rounded-md">
                {deptFilter || 'CSE'}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {yearFilter} • {divisionFilter} • {batchGroupFilter === 'ALL' ? 'All Batches' : batchGroupFilter}
              </span>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {filtered.length} Students
              </span>
            </div>

            {/* Division Batch Quick Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['A1', 'A2', 'A3', 'ALL'].map((bCode) => {
                const isSel = batchGroupFilter === bCode;
                return (
                  <button
                    key={bCode}
                    type="button"
                    onClick={() => setBatchGroupFilter(bCode as any)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isSel ? 'bg-[#000666] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {bCode === 'ALL' ? 'All' : bCode}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={isExporting}
              title={`Download CSV (${filtered.length} students)`}
              className="px-3 py-1.5 bg-[#000666] hover:bg-[#002171] disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span className={`material-symbols-outlined text-[15px] ${isExporting ? 'animate-spin' : ''}`}>
                {isExporting ? 'progress_activity' : 'download'}
              </span>
              <span>{isExporting ? 'Exporting...' : 'Download CSV'}</span>
            </button>
          </div>
        ) : (
          /* Global Directory View Filters (Admin & Staff) */
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
            <div>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-xs text-[#071e27] font-bold focus:ring-2 focus:ring-[#000666] outline-none"
              >
                <option value="ALL">All Depts</option>
                <option value="CSE">CSE</option>
                <option value="AIDS">AIDS</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
                <option value="ENTC">ENTC</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="MECHATRONICS">MECHATRONICS</option>
              </select>
            </div>

            <div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value as AcademicYear | 'ALL')}
                className="w-full sm:w-auto bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-xs text-[#071e27] font-bold focus:ring-2 focus:ring-[#000666] outline-none"
              >
                <option value="ALL">All Years</option>
                <option value="FE">First Year (FE)</option>
                <option value="SE">Second Year (SE)</option>
                <option value="TE">Third Year (TE)</option>
                <option value="BE">Final Year (BE)</option>
              </select>
            </div>

            <div>
              <select
                value={divisionFilter}
                onChange={(e) => {
                  setDivisionFilter(e.target.value as Division | 'ALL');
                  setBatchGroupFilter('ALL');
                }}
                className="w-full sm:w-auto bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-xs text-[#071e27] font-bold focus:ring-2 focus:ring-[#000666] outline-none"
              >
                <option value="ALL">All Divs</option>
                <option value="Div A">Div A</option>
                <option value="Div B">Div B</option>
                <option value="Div C">Div C</option>
              </select>
            </div>

            <div>
              <select
                value={batchGroupFilter}
                onChange={(e) => setBatchGroupFilter(e.target.value as BatchGroup | 'ALL')}
                className="w-full sm:w-auto bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-xs text-[#071e27] font-bold focus:ring-2 focus:ring-[#000666] outline-none"
              >
                <option value="ALL">All Batches</option>
                {(divisionFilter === 'ALL' || divisionFilter === 'Div A') && (
                  <optgroup label="Div A Batches">
                    <option value="A1">Batch A1</option>
                    <option value="A2">Batch A2</option>
                    <option value="A3">Batch A3</option>
                  </optgroup>
                )}
                {(divisionFilter === 'ALL' || divisionFilter === 'Div B') && (
                  <optgroup label="Div B Batches">
                    <option value="B1">Batch B1</option>
                    <option value="B2">Batch B2</option>
                    <option value="B3">Batch B3</option>
                  </optgroup>
                )}
                {(divisionFilter === 'ALL' || divisionFilter === 'Div C') && (
                  <optgroup label="Div C Batches">
                    <option value="C1">Batch C1</option>
                    <option value="C2">Batch C2</option>
                    <option value="C3">Batch C3</option>
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting}
                title={`Download CSV (${filtered.length} students)`}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-[#000666] hover:bg-[#002171] disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span className={`material-symbols-outlined text-[16px] ${isExporting ? 'animate-spin' : ''}`}>
                  {isExporting ? 'progress_activity' : 'download'}
                </span>
                <span>{isExporting ? 'Exporting...' : 'Download CSV'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Roster Table Container */}
      <div className="bg-white rounded-2xl border border-[#c6c5d4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto custom-scrollbar touch-scroll shadow-inner">
          <table className="w-full text-left text-[11px] relative min-w-[720px]">
            <thead className="bg-[#e6f6ff] text-[#000666] font-bold border-b border-[#c6c5d4] sticky top-0 z-10 shadow-xs">
              <tr>
                <th className="py-2.5 px-3">Student Name & Roll</th>
                <th className="py-2.5 px-3">Academic Division</th>
                <th className="py-2.5 px-3">PRN / GPA / Att.</th>
                <th className="py-2.5 px-3">Parent / Guardian</th>
                <th className="py-2.5 px-3">Parent Login & Contact</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c5d4]/40 bg-white">
              {filtered.map((st) => (
                <tr key={st.id} className="hover:bg-[#f3faff] transition-colors">
                  {/* Student Info */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${st.avatarBg || 'bg-[#d9e2ff] text-[#00429c]'} flex items-center justify-center font-bold text-[11px] shrink-0`}>
                        {st.initials || st.name.slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-bold text-[#071e27] leading-tight text-[11px]">{st.name}</p>
                        <p className="text-[10px] font-mono text-[#454652]">{st.rollNo} • <span className="font-sans">{st.email}</span></p>
                        {st.villageCity && st.district && (
                          <p className="text-[9px] text-emerald-800 flex items-center gap-0.5 mt-0.5 font-medium">
                            <span className="material-symbols-outlined text-[11px]">home_pin</span>
                            <span>{st.villageCity}, {st.district} ({st.pinCode || ''})</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Academic Division & Department */}
                  <td className="py-2 px-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-900 font-extrabold text-[9px] rounded uppercase border border-blue-200">
                          {st.department || 'CSE'}
                        </span>
                        <span className="bg-[#d9e2ff] text-[#00429c] text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block">
                          {st.academicYear || 'SE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="bg-[#f3faff] text-[#000666] text-[9px] font-bold px-1 py-0.2 rounded border border-[#c6c5d4]">
                          {st.division || 'Div A'}
                        </span>
                        <span className="bg-[#e6f6ff] text-[#2b5bb5] text-[9px] font-bold px-1 py-0.2 rounded border border-[#c6c5d4]">
                          {st.batchGroup || 'A1'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Academic Metrics & Dual-Path Invariant */}
                  <td className="py-2 px-3">
                    <div className="text-[10px] space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[#071e27] font-bold">PRN: {st.prn || st.rollNo || 'N/A'}</span>
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {st.prn?.includes('243') || st.prn?.includes('DSE') ? 'Diploma (DSE)' : '12th Regular'}
                        </span>
                      </div>
                      <p>
                        CGPA: <strong className={st.gpa >= 7.5 ? 'text-emerald-700 font-bold' : 'text-orange-700 font-bold'}>{st.gpa} / 10.0</strong>
                      </p>
                      <p className="text-gray-500">
                        Att: <strong className="text-gray-800">{st.attendance ?? 90}%</strong>
                      </p>
                    </div>
                  </td>

                  {/* Parent / Guardian Name */}
                  <td className="py-2 px-3">
                    {st.parentName ? (
                      <div>
                        <p className="font-bold text-[#071e27] leading-tight text-[11px]">{st.parentName}</p>
                        <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-1 py-0.2 rounded">
                          {st.parentRelationship || 'Parent/Guardian'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">Not Assigned</span>
                    )}
                  </td>

                  {/* Parent Login Email & Phone */}
                  <td className="py-2 px-3">
                    {st.parentEmail ? (
                      <div className="text-[10px] space-y-0.5">
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px] text-blue-600">mail</span>
                          {st.parentEmail}
                        </p>
                        {st.parentPhone && (
                          <p className="text-gray-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] text-gray-400">call</span>
                            {st.parentPhone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No parent login linked</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-3 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      {onUpdateStudent && (
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="px-2 py-0.5 bg-[#f0f4ff] text-[#00337c] hover:bg-[#d9e2ff] font-bold text-[10px] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Edit Student & Parent Credentials"
                        >
                          <span className="material-symbols-outlined text-[13px]">edit</span>
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate('bulk-email', st.email)}
                        className="px-1.5 py-0.5 bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium text-[10px] rounded-lg border border-gray-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title={`Send targeted email notice to ${st.name}`}
                      >
                        <span className="material-symbols-outlined text-[12px]">send</span>
                      </button>
                      {onDeleteStudent && (
                        <button
                          onClick={() => onDeleteStudent(st.id!)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete Student"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-[#454652] text-xs">
                    No student records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student & Parent Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#000666]">manage_accounts</span>
                Edit Student & Parent / Guardian Profile
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Section 1: Student Information */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                <h4 className="text-xs font-bold text-[#000666] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Student Academic & Login Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Roll Number *</label>
                    <input
                      type="text"
                      required
                      value={editForm.rollNo}
                      onChange={(e) => setEditForm({ ...editForm, rollNo: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Student Email *</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">PRN (Permanent Reg No)</label>
                    <input
                      type="text"
                      value={editForm.prn}
                      onChange={(e) => setEditForm({ ...editForm, prn: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Institutional Department</label>
                    <select
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-[#000666] outline-none"
                    >
                      <option value="CSE">CSE - Computer Science & Engineering</option>
                      <option value="AIDS">AIDS - Artificial Intelligence & Data Science</option>
                      <option value="MECH">MECH - Mechanical Engineering</option>
                      <option value="CIVIL">CIVIL - Civil Engineering</option>
                      <option value="ENTC">ENTC - Electronics & Telecommunication</option>
                      <option value="ELECTRICAL">ELECTRICAL - Electrical Engineering</option>
                      <option value="MECHATRONICS">MECHATRONICS - Mechatronics Engineering</option>
                      <option value="BASIC_SCIENCES">BASIC_SCIENCES - Basic Sciences & Humanities</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Academic Year</label>
                    <select
                      value={editForm.academicYear}
                      onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value as AcademicYear })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    >
                      <option value="FE">First Year (FE)</option>
                      <option value="SE">Second Year (SE)</option>
                      <option value="TE">Third Year (TE)</option>
                      <option value="BE">Final Year (BE)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase">Division</label>
                      <select
                        value={editForm.division}
                        onChange={(e) => setEditForm({ ...editForm, division: e.target.value as Division })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                      >
                        <option value="Div A">Div A</option>
                        <option value="Div B">Div B</option>
                        <option value="Div C">Div C</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase">Batch</label>
                      <select
                        value={editForm.batchGroup}
                        onChange={(e) => setEditForm({ ...editForm, batchGroup: e.target.value as BatchGroup })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                      >
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="A3">A3</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="B3">B3</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                        <option value="C3">C3</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase">CGPA / SGPA (out of 10.0)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        value={editForm.gpa}
                        onChange={(e) => setEditForm({ ...editForm, gpa: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase">Attendance %</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={editForm.attendance}
                        onChange={(e) => setEditForm({ ...editForm, attendance: e.target.value })}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                  </div>

                  {/* Dual Qualification Path & Academic Eligibility Details */}
                  <div className="bg-slate-50 p-3.5 rounded-xl space-y-2.5 border border-slate-200">
                    <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-indigo-700">school</span>
                      Admission Qualification Path (Placement Eligibility Engine)
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Entry Path</label>
                        <select
                          value={editForm.qualificationPath}
                          onChange={(e) => setEditForm({ ...editForm, qualificationPath: e.target.value as '12TH' | 'DIPLOMA' })}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold bg-white text-indigo-900"
                        >
                          <option value="12TH">12th Standard Regular (HSC)</option>
                          <option value="DIPLOMA">Diploma Lateral Entry (DSE)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">10th (SSC) %</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={editForm.tenthPercentage}
                          onChange={(e) => setEditForm({ ...editForm, tenthPercentage: e.target.value })}
                          className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white"
                        />
                      </div>

                      {editForm.qualificationPath === '12TH' ? (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">12th (HSC) %</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={editForm.twelfthPercentage}
                            onChange={(e) => setEditForm({ ...editForm, twelfthPercentage: e.target.value })}
                            className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-white"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-amber-800 uppercase mb-0.5">Diploma Aggregate %</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={editForm.diplomaPercentage}
                            onChange={(e) => setEditForm({ ...editForm, diplomaPercentage: e.target.value })}
                            className="w-full border border-amber-300 bg-amber-50 rounded-lg p-2 text-xs font-bold text-amber-950"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Student Account Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'Active' | 'Inactive' })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Parent / Guardian Details & Login Credential */}
              <div className="bg-blue-50/50 p-4 rounded-xl space-y-3 border border-blue-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-blue-700">family_restroom</span>
                    Parent / Guardian Details & Portal Login
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Parent / Guardian Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Patil"
                      value={editForm.parentName}
                      onChange={(e) => setEditForm({ ...editForm, parentName: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-blue-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Parent Portal Login Email</label>
                    <input
                      type="email"
                      placeholder="e.g. ramesh.patil@parent.sitcoe.org"
                      value={editForm.parentEmail}
                      onChange={(e) => setEditForm({ ...editForm, parentEmail: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-blue-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                    <p className="text-[10px] text-blue-700 mt-1">Parent will use this email to sign in to the Parent Dashboard.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Parent Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      value={editForm.parentPhone}
                      onChange={(e) => setEditForm({ ...editForm, parentPhone: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-blue-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Relationship to Student</label>
                    <select
                      value={editForm.parentRelationship}
                      onChange={(e) => setEditForm({ ...editForm, parentRelationship: e.target.value })}
                      className="w-full mt-1 px-3 py-2 border border-blue-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Permanent Home Address (Staff & Administrative Access) */}
              <div className="bg-emerald-50/50 p-4 rounded-xl space-y-3 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-700">home_pin</span>
                    Permanent / Home Address (Confidential Staff View)
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Faculty / Admin Only
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Address Line 1 (Flat, House no., Building, Street) *</label>
                    <input
                      type="text"
                      value={editForm.addressLine1}
                      onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })}
                      placeholder="e.g. 102, Shanti Niwas, Station Road"
                      className="w-full mt-1 px-3 py-2 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Address Line 2 (Area, Colony, Sector, Landmark - Optional)</label>
                    <input
                      type="text"
                      value={editForm.addressLine2}
                      onChange={(e) => setEditForm({ ...editForm, addressLine2: e.target.value })}
                      placeholder="e.g. Near Ganpati Temple"
                      className="w-full mt-1 px-3 py-2 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Village / City *</label>
                    <input
                      type="text"
                      value={editForm.villageCity}
                      onChange={(e) => setEditForm({ ...editForm, villageCity: e.target.value })}
                      placeholder="e.g. Yadrav / Ichalkaranji"
                      className="w-full mt-1 px-3 py-2 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Taluka *</label>
                    <input
                      type="text"
                      value={editForm.taluka}
                      onChange={(e) => setEditForm({ ...editForm, taluka: e.target.value })}
                      placeholder="e.g. Shirol"
                      className="w-full mt-1 px-3 py-2 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">District *</label>
                    <input
                      type="text"
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      placeholder="e.g. Kolhapur"
                      className="w-full mt-1 px-3 py-2 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">State *</label>
                    <input
                      type="text"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      className="w-full mt-1 px-3 py-2 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">PIN Code (6 digits) *</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editForm.pinCode}
                      onChange={(e) => setEditForm({ ...editForm, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="416115"
                      className="w-full mt-1 px-3 py-2 border border-emerald-200 bg-white rounded-lg text-xs font-mono font-bold text-emerald-950 focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Country *</label>
                    <input
                      type="text"
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                      placeholder="India"
                      className="w-full mt-1 px-3 py-2 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-2 focus:ring-[#000666] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#000666] hover:bg-blue-900 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
