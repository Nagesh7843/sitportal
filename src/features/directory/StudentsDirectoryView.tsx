import React, { useState, useEffect } from 'react';
import { StudentRecord, ViewMode, AcademicYear, Division, BatchGroup } from '@/types';

interface StudentsDirectoryViewProps {
  students: StudentRecord[];
  onAddStudent?: () => void;
  onNavigate: (view: ViewMode) => void;
  onAddStudentsBulk?: (students: StudentRecord[]) => void;
  onDeleteStudent?: (id: string | number) => void;
}

export const StudentsDirectoryView: React.FC<StudentsDirectoryViewProps> = ({
  students,
  onAddStudent,
  onNavigate,
  onAddStudentsBulk,
  onDeleteStudent
}) => {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<AcademicYear | 'ALL'>('ALL');
  const [divisionFilter, setDivisionFilter] = useState<Division | 'ALL'>('ALL');
  const [batchGroupFilter, setBatchGroupFilter] = useState<BatchGroup | 'ALL'>('ALL');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (divisionFilter === 'Div A' && batchGroupFilter !== 'ALL' && !batchGroupFilter.startsWith('A')) setBatchGroupFilter('ALL');
    if (divisionFilter === 'Div B' && batchGroupFilter !== 'ALL' && !batchGroupFilter.startsWith('B')) setBatchGroupFilter('ALL');
    if (divisionFilter === 'Div C' && batchGroupFilter !== 'ALL' && !batchGroupFilter.startsWith('C')) setBatchGroupFilter('ALL');
  }, [divisionFilter, batchGroupFilter]);

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
            status: 'Active'
          });
        }
      }
      
      if (records.length > 0) {
        onAddStudentsBulk(records);
      }
      
      // Reset input
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
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesYear = yearFilter === 'ALL' || s.academicYear === yearFilter;
    const matchesDiv = divisionFilter === 'ALL' || s.division === divisionFilter;
    const matchesBatchGroup = batchGroupFilter === 'ALL' || s.batchGroup === batchGroupFilter;
    return matchesSearch && matchesYear && matchesDiv && matchesBatchGroup;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#000666] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#759efd]">school</span>
            Student Directory & Academic Roster
          </h1>
          <p className="text-[#cfe6f2] text-[13px] mt-1">
            Academic Years (FE, SE, TE, BE) • Divisions & Batch Groups • PRN & GPA Tracking
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
          placeholder="Search by student name, roll no, or email..."
          className="w-full lg:w-72 bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-3.5 py-2 text-[13px] focus:ring-2 focus:ring-[#000666] outline-none"
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

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-[#c6c5d4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#e6f6ff] text-[#454652] font-semibold border-b border-[#c6c5d4]">
              <tr>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Division & Batch</th>
                <th className="py-3 px-4">PRN</th>
                <th className="py-3 px-4">SGPA</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c5d4]/40">
              {filtered.map((st) => (
                <tr key={st.id} className="hover:bg-[#f3faff] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#071e27] flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${st.avatarBg || 'bg-[#d9e2ff] text-[#00429c]'} flex items-center justify-center font-bold text-[12px]`}>
                      {st.initials || st.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="leading-tight">{st.name}</p>
                      <p className="text-[11px] font-normal text-[#454652]">{st.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#454652] font-mono font-semibold">{st.rollNo}</td>
                  <td className="py-3 px-4">
                    <span className="bg-[#d9e2ff] text-[#00429c] text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {st.academicYear || 'SE'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#071e27]">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#f3faff] text-[#000666] text-[11px] font-bold px-2 py-0.5 rounded border border-[#c6c5d4]">
                        {st.division || 'Div A'}
                      </span>
                      <span className="bg-[#e6f6ff] text-[#2b5bb5] text-[11px] font-bold px-2 py-0.5 rounded border border-[#c6c5d4]">
                        {st.batchGroup || 'B1'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#071e27]">{st.prn}</td>
                  <td className="py-3 px-4">
                    <span className={`font-bold ${st.gpa >= 3.5 ? 'text-emerald-600' : 'text-orange-600'}`}>
                      {st.gpa} / 4.0
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right flex justify-end items-center gap-4">
                    <button
                      onClick={() => onNavigate('bulk-email')}
                      className="text-[#000666] font-bold text-[12px] hover:underline"
                    >
                      Send Notice
                    </button>
                    {onDeleteStudent && (
                      <button
                        onClick={() => onDeleteStudent(st.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete Student"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-[#454652]">
                    No student records match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
