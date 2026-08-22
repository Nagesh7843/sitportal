import React, { useState, useEffect } from 'react';
import { StudentRecord, ViewMode, AcademicYear, Division, BatchGroup } from '@/types';

interface StudentsDirectoryViewProps {
  students: StudentRecord[];
  onAddStudent?: () => void;
  onNavigate: (view: ViewMode, emailContext?: string) => void;
  onAddStudentsBulk?: (students: StudentRecord[]) => void;
  onDeleteStudent?: (id: string | number) => void;
  onUpdateStudent?: (id: string | number, student: Partial<StudentRecord>) => void;
}

export const StudentsDirectoryView: React.FC<StudentsDirectoryViewProps> = ({
  students,
  onAddStudent,
  onNavigate,
  onAddStudentsBulk,
  onDeleteStudent,
  onUpdateStudent
}) => {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<AcademicYear | 'ALL'>('ALL');
  const [divisionFilter, setDivisionFilter] = useState<Division | 'ALL'>('ALL');
  const [batchGroupFilter, setBatchGroupFilter] = useState<BatchGroup | 'ALL'>('ALL');
  
  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    rollNo: string;
    prn: string;
    email: string;
    academicYear: AcademicYear;
    division: Division;
    batchGroup: BatchGroup;
    gpa: string;
    attendance: string;
    cohortBatch: string;
    status: 'Active' | 'Inactive';
    parentName: string;
    parentEmail: string;
    parentPhone: string;
    parentRelationship: string;
  }>({
    name: '',
    rollNo: '',
    prn: '',
    email: '',
    academicYear: 'SE',
    division: 'Div A',
    batchGroup: 'A1',
    gpa: '3.5',
    attendance: '90',
    cohortBatch: '2024-2028',
    status: 'Active',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentRelationship: 'Father'
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (divisionFilter === 'Div A' && batchGroupFilter !== 'ALL' && !batchGroupFilter.startsWith('A')) setBatchGroupFilter('ALL');
    if (divisionFilter === 'Div B' && batchGroupFilter !== 'ALL' && !batchGroupFilter.startsWith('B')) setBatchGroupFilter('ALL');
    if (divisionFilter === 'Div C' && batchGroupFilter !== 'ALL' && !batchGroupFilter.startsWith('C')) setBatchGroupFilter('ALL');
  }, [divisionFilter, batchGroupFilter]);

  const handleOpenEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setEditForm({
      name: student.name || '',
      rollNo: student.rollNo || '',
      prn: student.prn || '',
      email: student.email || '',
      academicYear: student.academicYear || 'SE',
      division: student.division || 'Div A',
      batchGroup: student.batchGroup || 'A1',
      gpa: (student.gpa !== undefined && student.gpa !== null ? student.gpa : 8.5).toString(),
      attendance: (student.attendance !== undefined && student.attendance !== null ? student.attendance : 90).toString(),
      cohortBatch: student.cohortBatch || '2024-2028',
      status: student.status || 'Active',
      parentName: student.parentName || '',
      parentEmail: student.parentEmail || '',
      parentPhone: student.parentPhone || '',
      parentRelationship: student.parentRelationship || 'Father'
    });
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
      parentRelationship: editForm.parentRelationship.trim()
    };

    onUpdateStudent(studentId, updatedData);
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
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.parentName && s.parentName.toLowerCase().includes(search.toLowerCase())) ||
      (s.parentEmail && s.parentEmail.toLowerCase().includes(search.toLowerCase()));

    const yrStr = (s.academicYear || '') as string;
    const matchesYear =
      yearFilter === 'ALL' ||
      yrStr === yearFilter ||
      (yearFilter === 'FE' && (yrStr === 'FY' || yrStr === 'First Year')) ||
      (yearFilter === 'SE' && (yrStr === 'SY' || yrStr === 'Second Year')) ||
      (yearFilter === 'TE' && (yrStr === 'TY' || yrStr === 'Third Year')) ||
      (yearFilter === 'BE' && (yrStr === 'BY' || yrStr === 'B.Tech' || yrStr === 'Final Year'));

    const matchesDiv =
      divisionFilter === 'ALL' ||
      s.division === divisionFilter ||
      (s.division && s.division.toLowerCase().replace(/\s+/g, '') === divisionFilter.toLowerCase().replace(/\s+/g, ''));

    const matchesBatchGroup =
      batchGroupFilter === 'ALL' ||
      s.batchGroup === batchGroupFilter ||
      (s.batchGroup && s.batchGroup.toLowerCase().includes(batchGroupFilter.toLowerCase()));

    return matchesSearch && matchesYear && matchesDiv && matchesBatchGroup;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#000666] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#759efd]">school</span>
            Student & Parent Roster Directory
          </h1>
          <p className="text-[#cfe6f2] text-[13px] mt-1">
            Academic Years (FE, SE, TE, BE) • Parent/Guardian Login Records • PRN & Academic Performance
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {onAddStudent && (
            <button
              onClick={onAddStudent}
              className="bg-white text-[#000666] font-bold px-4 py-2.5 rounded-xl text-[13px] hover:bg-[#cfe6f2] transition-colors shadow-xs flex items-center gap-2"
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
                className="bg-[#000666] border-2 border-white text-white font-bold px-4 py-2 rounded-xl text-[13px] hover:bg-white hover:text-[#000666] transition-colors shadow-xs flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload CSV</span>
              </button>
            </>
          )}
          <button
            onClick={() => onNavigate('bulk-email')}
            className="bg-[#759efd] text-[#00337c] font-bold px-4 py-2.5 rounded-xl text-[13px] hover:bg-[#b0c6ff] transition-colors shadow-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>Send Notice</span>
          </button>
        </div>
      </div>

      {/* Advanced Academic Hierarchy Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#c6c5d4] shadow-xs flex flex-col lg:flex-row justify-between items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student, roll no, email, or parent name/email..."
          className="w-full lg:w-80 bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-3.5 py-2 text-[13px] focus:ring-2 focus:ring-[#000666] outline-none"
        />

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#454652] uppercase">Year:</span>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value as any)}
              className="bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-[12px] text-[#071e27] font-semibold"
            >
              <option value="ALL">All Years</option>
              <option value="FE">First Year (FE)</option>
              <option value="SE">Second Year (SE)</option>
              <option value="TE">Third Year (TE)</option>
              <option value="BE">Final Year (BE)</option>
            </select>
          </div>

          {/* Division Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#454652] uppercase">Division:</span>
            <select
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value as any)}
              className="bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-[12px] text-[#071e27] font-semibold"
            >
              <option value="ALL">All Divisions</option>
              <option value="Div A">Div A</option>
              <option value="Div B">Div B</option>
              <option value="Div C">Div C</option>
            </select>
          </div>

          {/* Batch Group Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#454652] uppercase">Batch:</span>
            <select
              value={batchGroupFilter}
              onChange={(e) => setBatchGroupFilter(e.target.value as any)}
              className="bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-[12px] text-[#071e27] font-semibold"
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
        </div>
      </div>

      {/* Roster Table Container */}
      <div className="bg-white rounded-2xl border border-[#c6c5d4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto custom-scrollbar shadow-inner">
          <table className="w-full text-left text-[11px] relative">
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
                      </div>
                    </div>
                  </td>

                  {/* Academic Division */}
                  <td className="py-2 px-3">
                    <div className="space-y-0.5">
                      <span className="bg-[#d9e2ff] text-[#00429c] text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block">
                        {st.academicYear || 'SE'}
                      </span>
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

                  {/* Academic Metrics */}
                  <td className="py-2 px-3">
                    <div className="text-[10px] space-y-0.5">
                      <p className="font-mono text-[#071e27]">PRN: {st.prn || 'N/A'}</p>
                      <p>
                        CGPA: <strong className={st.gpa >= 7.5 ? 'text-emerald-700' : 'text-orange-700'}>{st.gpa} / 10.0</strong>
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
