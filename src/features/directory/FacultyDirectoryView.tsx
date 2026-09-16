import React, { useState, useEffect } from 'react';
import { FacultyMember, UserProfile, UserRole, ViewMode } from '@/types';

interface FacultyDirectoryProps {
  facultyList: FacultyMember[];
  onToggleFacultyStatus?: (id: string) => void;
  onDeleteFaculty?: (id: string | number) => void;
  onNavigate: (view: ViewMode) => void;
  onAddFaculty?: () => void;
  onAddFacultyBulk?: (faculty: FacultyMember[]) => void;
  onContactFaculty?: (faculty: FacultyMember) => void;
  currentProfile?: UserProfile | null;
  userRole?: UserRole | string;
}

export const FacultyDirectoryView: React.FC<FacultyDirectoryProps> = ({
  facultyList,
  onToggleFacultyStatus,
  onDeleteFaculty,
  onNavigate,
  onAddFaculty,
  onAddFacultyBulk,
  onContactFaculty,
  currentProfile,
  userRole
}) => {
  const isStudentOrParent = userRole === 'student' || userRole === 'parent';
  const assignedDept = (currentProfile?.department || 'CSE').toUpperCase();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState(() => isStudentOrParent ? assignedDept : 'ALL');
  const [rankFilter, setRankFilter] = useState('ALL');

  useEffect(() => {
    if (isStudentOrParent) {
      setDeptFilter(assignedDept);
      setRankFilter('ALL');
    }
  }, [isStudentOrParent, assignedDept]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onAddFacultyBulk) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        alert('File appears empty or missing data rows.');
        return;
      }
      
      const records: FacultyMember[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(s => s.trim());
        if (row.length >= 3 && row[0] && row[1]) {
          records.push({
            name: row[0],
            email: row[1],
            department: row[2] || 'CSE',
            specialization: row[3] || 'General',
            rank: row[4] || 'Assistant Professor',
            designation: row[4] || 'Assistant Professor',
            qualification: row[5] || '',
            teachingExperience: row[6] || '',
            industrialExperience: row[7] || '',
            status: 'ON CAMPUS'
          });
        }
      }
      
      if (records.length > 0) {
        onAddFacultyBulk(records);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filtered = facultyList.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesRank = rankFilter === 'ALL' || f.rank.includes(rankFilter);
    const fDept = (f.department || 'CSE').toUpperCase();
    const matchesDept = isStudentOrParent
      ? fDept === assignedDept || (assignedDept === 'CSE' && (fDept.includes('COMP') || fDept.includes('CSE')))
      : (deptFilter === 'ALL' || fDept === deptFilter.toUpperCase());
    return matchesSearch && matchesRank && matchesDept;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-[#000666] text-white p-4 sm:p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-[24px] font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-[24px] sm:text-[28px] text-[#759efd]">groups</span>
            <span>{isStudentOrParent ? `${assignedDept} Faculty Directory` : 'Department Faculty Directory'}</span>
          </h1>
          <p className="text-[#cfe6f2] text-xs sm:text-[13px] mt-1">
            {isStudentOrParent
              ? `Faculty members & academic advisors of ${assignedDept} Department`
              : 'Professors, Assistant Professors & Department Coordinators'}
          </p>
        </div>

        {!isStudentOrParent && (
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3 items-center w-full md:w-auto">
            {onAddFaculty && (
              <button
                onClick={onAddFaculty}
                className="flex-1 sm:flex-none justify-center bg-white text-[#000666] font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] hover:bg-[#cfe6f2] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Add Faculty</span>
              </button>
            )}
            {onAddFacultyBulk && (
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
              onClick={() => onNavigate('faculty-email')}
              className="flex-1 sm:flex-none justify-center bg-[#759efd] text-[#00337c] font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] hover:bg-[#b0c6ff] transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>Contact All</span>
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#c6c5d4] shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${isStudentOrParent ? assignedDept : ''} faculty by name or domain specialization...`}
          className="w-full sm:w-80 bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-3.5 py-2 text-xs sm:text-[13px] focus:ring-2 focus:ring-[#000666] outline-none"
        />

        {isStudentOrParent ? (
          /* Minimal Department Scope Badge for Student and Parent */
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-[#000666] text-white rounded-md">
              {assignedDept}
            </span>
            <span className="text-xs font-bold text-[#000666]">
              {filtered.length} Faculty Members Available
            </span>
          </div>
        ) : (
          /* Admin / Universal Multi-Department Filters */
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex-1 sm:flex-none">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-xs text-[#071e27] font-bold outline-none focus:ring-2 focus:ring-[#000666]"
              >
                <option value="ALL">All Depts</option>
                <option value="CSE">CSE</option>
                <option value="AIDS">AIDS</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
                <option value="ENTC">ENTC</option>
                <option value="ELECTRICAL">ELECTRICAL</option>
                <option value="MECHATRONICS">MECHATRONICS</option>
                <option value="BASIC_SCIENCES">BASIC SCIENCES</option>
              </select>
            </div>

            <div className="flex-1 sm:flex-none">
              <select
                value={rankFilter}
                onChange={(e) => setRankFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-2.5 py-1.5 text-xs text-[#071e27] font-semibold focus:ring-2 focus:ring-[#000666] outline-none"
              >
                <option value="ALL">All Ranks</option>
                <option value="HOD">Head of Department</option>
                <option value="Asst.">Assistant Professors</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filtered.map((fac) => {
          return (
            <div
              key={fac.id}
              className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs hover:border-[#000666] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-extrabold text-[10px] rounded uppercase border border-blue-200">
                        {fac.department || 'CSE'}
                      </span>
                    </div>
                    <h3 className="font-bold text-[18px] text-[#071e27]">{fac.name}</h3>
                    <p className="text-[12px] text-[#2b5bb5] font-semibold">
                      {fac.designation || fac.rank}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 bg-[#f3faff] p-3 rounded-xl text-[12px] border border-[#dbf1fe] mb-4">
                  <p>
                    <strong className="text-[#454652]">Qualification:</strong> {fac.qualification || '—'}
                  </p>
                  <p>
                    <strong className="text-[#454652]">Specialization:</strong> {fac.specialization}
                  </p>
                  <p>
                    <strong className="text-[#454652]">Teaching Exp:</strong> {fac.teachingExperience || '—'}
                  </p>
                  <p>
                    <strong className="text-[#454652]">Industrial Exp:</strong> {fac.industrialExperience || '—'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {onContactFaculty ? (
                  <button
                    type="button"
                    onClick={() => onContactFaculty(fac)}
                    className="flex-1 py-2.5 bg-[#000666] text-white rounded-xl text-center font-bold text-[12px] hover:bg-[#1a237e] transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    <span>Contact Faculty</span>
                  </button>
                ) : (
                  <a
                    href={`mailto:${fac.email}`}
                    className="flex-1 py-2.5 bg-[#000666] text-white rounded-xl text-center font-bold text-[12px] hover:bg-[#1a237e] transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    <span>Contact Faculty</span>
                  </a>
                )}
                {onDeleteFaculty && (
                  <button
                    onClick={() => onDeleteFaculty(fac.id)}
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 hover:bg-red-100 transition-colors"
                    title="Delete Faculty"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
