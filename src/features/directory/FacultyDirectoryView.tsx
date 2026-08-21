import React, { useState } from 'react';
import { FacultyMember, UserProfile, ViewMode } from '@/types';

interface FacultyDirectoryProps {
  facultyList: FacultyMember[];
  onToggleFacultyStatus?: (id: string) => void;
  onDeleteFaculty?: (id: string | number) => void;
  onNavigate: (view: ViewMode) => void;
  onAddFaculty?: () => void;
  onAddFacultyBulk?: (faculty: FacultyMember[]) => void;
  onContactFaculty?: (faculty: FacultyMember) => void;
  currentProfile?: UserProfile | null;
}

export const FacultyDirectoryView: React.FC<FacultyDirectoryProps> = ({
  facultyList,
  onToggleFacultyStatus,
  onDeleteFaculty,
  onNavigate,
  onAddFaculty,
  onAddFacultyBulk,
  onContactFaculty,
  currentProfile
}) => {
  const [search, setSearch] = useState('');
  const [rankFilter, setRankFilter] = useState('ALL');

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
            specialization: row[2] || 'General',
            rank: row[3] || 'Assistant Professor',
            designation: row[3] || 'Assistant Professor',
            qualification: row[4] || '',
            teachingExperience: row[5] || '',
            industrialExperience: row[6] || '',
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
    return matchesSearch && matchesRank;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#000666] text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#759efd]">groups</span>
            Department Faculty Directory
          </h1>
          <p className="text-[#cfe6f2] text-[13px] mt-1">
            Professors, Assistant Professors & Department Coordinators
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {onAddFaculty && (
            <button
              onClick={onAddFaculty}
              className="bg-white text-[#000666] font-bold px-4 py-2.5 rounded-xl text-[13px] hover:bg-[#cfe6f2] transition-colors shadow-xs flex items-center gap-2"
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
                className="bg-[#000666] border-2 border-white text-white font-bold px-4 py-2 rounded-xl text-[13px] hover:bg-white hover:text-[#000666] transition-colors shadow-xs flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload CSV</span>
              </button>
            </>
          )}
          <button
            onClick={() => onNavigate('faculty-email')}
            className="bg-[#759efd] text-[#00337c] font-bold px-4 py-2.5 rounded-xl text-[13px] hover:bg-[#b0c6ff] transition-colors shadow-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            <span>Contact All</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl border border-[#c6c5d4] shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by faculty name or domain specialization..."
          className="w-full sm:w-80 bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-3.5 py-2 text-[13px] focus:ring-2 focus:ring-[#000666] outline-none"
        />

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-[#454652] uppercase">Rank:</span>
          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            className="bg-[#f3faff] border border-[#c6c5d4] rounded-lg px-3 py-1.5 text-[13px] text-[#071e27] font-semibold"
          >
            <option value="ALL">All Ranks</option>
            <option value="HOD">Head of Department</option>
            <option value="Asst.">Assistant Professors</option>
          </select>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((fac) => {
          const statusColors = {
            'ON CAMPUS': 'bg-emerald-100 text-emerald-800 border-emerald-300',
            'IN MEETING': 'bg-slate-100 text-slate-800 border-slate-300',
            'IN LAB': 'bg-blue-100 text-blue-800 border-blue-300',
            'OFF CAMPUS': 'bg-red-100 text-red-800 border-red-300',
          }[fac.status];

          return (
            <div
              key={fac.id}
              className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs hover:border-[#000666] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[18px] text-[#071e27]">{fac.name}</h3>
                    <p className="text-[12px] text-[#2b5bb5] font-semibold">
                      {fac.designation || fac.rank}
                    </p>
                  </div>

                  {onToggleFacultyStatus ? (
                    <button
                      onClick={() => onToggleFacultyStatus(String(fac.id))}
                      title="Click to toggle status"
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-transform active:scale-95 ${statusColors}`}
                    >
                      {fac.status}
                    </button>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusColors}`}>
                      {fac.status}
                    </span>
                  )}
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
