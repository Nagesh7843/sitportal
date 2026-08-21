import React, { useState } from 'react';
import { ViewMode, UploadAsset, StudentRecord, DepartmentEvent } from '@/types';
import hodProfile from '@/assets/hod-profile.jpeg';

interface FacultyDashboardProps {
  onNavigate: (view: ViewMode, emailContext?: string) => void;
  uploads: UploadAsset[];
  students: StudentRecord[];
  events: DepartmentEvent[];
  onOpenAssignmentModal: () => void;
  onOpenNoticeModal: () => void;
  onOpenMaterialModal: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  onNavigate,
  uploads,
  students,
  events,
  onOpenAssignmentModal,
  onOpenNoticeModal,
  onOpenMaterialModal,
}) => {
  const [studentFilter, setStudentFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentFilter.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Grid: Profile & Content Creation Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Summary Card */}
        <div className="lg:col-span-4 bg-[#f3faff]/90 glass-card p-6 rounded-xl border border-[#c6c5d4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-bold text-[20px] text-[#000666]">Faculty Profile</h2>
              <span className="bg-[#d9e2ff] text-[#00429c] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                Active Status
              </span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-sm border border-[#c6c5d4] shrink-0">
                <img
                  src={hodProfile}
                  alt="Dr. S. S. Gurav"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#071e27]">CSE - CS402</h3>
                <p className="text-[#454652] text-[13px] font-medium">Distributed Systems & Cloud Computing</p>
              </div>
            </div>

            <div className="space-y-3 bg-[#e6f6ff] p-4 rounded-xl border border-[#dbf1fe] text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#454652]">Ongoing Research</span>
                <span className="font-bold text-[#071e27]">Edge AI Mesh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454652]">Student Mentors</span>
                <span className="font-bold text-[#071e27]">12 Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454652]">Next Lecture</span>
                <span className="font-bold text-[#2b5bb5]">2:00 PM (Hall 4)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('curriculum')}
            className="mt-6 w-full py-2.5 border-2 border-[#000666] text-[#000666] rounded-lg font-bold text-[13px] hover:bg-[#000666] hover:text-white transition-all shadow-xs"
          >
            View Full Curriculum
          </button>
        </div>

        {/* Content Creation Center */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Upload Assignment Action Card */}
            <div
              onClick={onOpenAssignmentModal}
              className="bg-[#000666] text-white p-6 rounded-xl shadow-md flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-transform"
            >
              <span className="material-symbols-outlined text-[36px] mb-4 group-hover:rotate-12 transition-transform text-[#bdc2ff]">
                upload_file
              </span>
              <div>
                <h3 className="font-bold text-[16px]">Upload Assignment</h3>
                <p className="text-[#bdc2ff] text-[11px] mt-1">Set deadlines & auto-grading rules</p>
              </div>
            </div>

            {/* Add Notice Action Card */}
            <div
              onClick={onOpenNoticeModal}
              className="bg-[#759efd] text-[#00337c] p-6 rounded-xl shadow-md flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-transform"
            >
              <span className="material-symbols-outlined text-[36px] mb-4 group-hover:scale-110 transition-transform text-[#001945]">
                campaign
              </span>
              <div>
                <h3 className="font-bold text-[16px]">Add Notice</h3>
                <p className="text-[#00337c]/80 text-[11px] mt-1">Push to student mobile apps</p>
              </div>
            </div>

            {/* Study Material Action Card */}
            <div
              onClick={onOpenMaterialModal}
              className="bg-[#003909] text-[#a3f69c] p-6 rounded-xl shadow-md flex flex-col justify-between cursor-pointer group hover:scale-[1.02] transition-transform"
            >
              <span className="material-symbols-outlined text-[36px] mb-4 group-hover:-translate-y-1 transition-transform text-[#a3f69c]">
                menu_book
              </span>
              <div>
                <h3 className="font-bold text-[16px]">Study Material</h3>
                <p className="text-[#a3f69c]/80 text-[11px] mt-1">PDFs, Videos & Repo Links</p>
              </div>
            </div>
          </div>

          {/* Recent Uploads Table Card */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-[#c6c5d4] flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[18px] text-[#071e27]">Recent Uploads</h2>
              <button
                onClick={() => onNavigate('curriculum')}
                className="text-[#000666] font-semibold text-[13px] flex items-center gap-1 hover:underline"
              >
                <span>View Archive</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-[#c6c5d4] text-[#454652] font-semibold bg-[#e6f6ff]">
                  <tr>
                    <th className="py-2.5 px-3">Asset Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c5d4]/40">
                  {uploads.map((asset) => (
                    <tr key={asset.id} className="hover:bg-[#f3faff] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#071e27]">{asset.title}</td>
                      <td className="py-3 px-3 text-[#454652]">{asset.category}</td>
                      <td className="py-3 px-3 text-[#454652]">{asset.uploadedAt}</td>
                      <td className="py-3 px-3">
                        {asset.status === 'Published' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-orange-600 font-bold text-[11px] bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                            Pending Review
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="p-1 hover:bg-[#cfe6f2] rounded text-[#454652] hover:text-[#000666]">
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Student Performance & Events Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Student Performance Overview */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl shadow-xs border border-[#c6c5d4]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="font-bold text-[18px] text-[#071e27]">Student Performance Overview</h2>
              <p className="text-[12px] text-[#454652]">Monitor attendance and academic progress</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
                placeholder="Filter by Roll No or Name..."
                className="text-[13px] border border-[#c6c5d4] px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#000666] w-full sm:w-56"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredStudents.map((st) => (
              <div
                key={st.id}
                onClick={() => setSelectedStudent(st)}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-[#c6c5d4] rounded-xl hover:border-[#000666] hover:bg-[#f3faff] transition-all cursor-pointer gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${st.avatarBg || 'bg-[#d9e2ff] text-[#00429c]'} rounded-full flex items-center justify-center font-bold text-[14px]`}>
                    {st.initials || st.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[14px] text-[#071e27]">{st.name}</p>
                    <p className="text-[11px] text-[#454652]">ID: {st.rollNo} • Batch: {st.cohortBatch}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-[10px] text-[#454652] uppercase font-bold tracking-wider">PRN</p>
                    <p className="text-[13px] font-mono text-[#071e27]">{st.prn}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#454652] uppercase font-bold tracking-wider">GPA</p>
                    <p className={`text-[13px] font-bold ${st.gpa >= 3.5 ? 'text-emerald-600' : 'text-orange-500'}`}>
                      {st.gpa}
                    </p>
                  </div>
                  <button className="text-[#000666] hover:bg-[#d5ecf8] p-1.5 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                  </button>
                </div>
              </div>
            ))}
            {filteredStudents.length === 0 && (
              <p className="py-10 text-center text-[13px] text-[#454652]">No student records have been added yet.</p>
            )}
          </div>
        </div>

        {/* Department Events Calendar & Finals Prep Banner */}
        <div className="lg:col-span-5 bg-[#f3faff]/90 glass-card p-6 rounded-xl border border-[#c6c5d4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-[18px] text-[#071e27]">Department Events</h2>
              <span className="text-[#454652] text-[12px] font-semibold">Nov 2024</span>
            </div>

            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="flex gap-4 p-3 bg-white rounded-lg border border-[#c6c5d4]/40 shadow-2xs">
                  <div className="flex flex-col items-center justify-center min-w-[50px] bg-[#1a237e] text-white rounded-lg p-2 shrink-0">
                    <span className="text-[14px] font-bold">{ev.dateDay}</span>
                    <span className="text-[10px] uppercase font-bold">{ev.dateMonth}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-bold text-[#071e27] truncate">{ev.title}</h4>
                    <p className="text-[11px] text-[#454652]">{ev.location} • {ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finals Prep Reminder Box */}
          <div className="mt-6 p-4 bg-[#000666] text-white rounded-xl relative overflow-hidden shadow-md">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#759efd] mb-1">Reminder</p>
            <h4 className="text-[16px] font-bold">Semester Finals Prep</h4>
            <p className="text-[11px] opacity-80 mb-3">Please ensure all grades are uploaded by the 30th of this month.</p>
            <button
              onClick={() => onNavigate('students')}
              className="bg-white text-[#000666] px-4 py-2 rounded-lg text-[12px] font-bold w-full hover:bg-[#cfe6f2] transition-colors"
            >
              Open Grade Portal
            </button>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#c6c5d4] animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${selectedStudent.avatarBg || 'bg-[#d9e2ff] text-[#00429c]'} rounded-full flex items-center justify-center font-bold text-[18px]`}>
                  {selectedStudent.initials}
                </div>
                <div>
                  <h3 className="font-bold text-[18px] text-[#071e27]">{selectedStudent.name}</h3>
                  <p className="text-[12px] text-[#454652]">Roll No: {selectedStudent.rollNo}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-[#767683] hover:text-[#071e27]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 bg-[#e6f6ff] p-4 rounded-xl text-[13px] mb-4">
              <div className="flex justify-between">
                <span className="text-[#454652]">Email:</span>
                <span className="font-semibold text-[#071e27]">{selectedStudent.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454652]">Batch:</span>
                <span className="font-semibold text-[#071e27]">{selectedStudent.cohortBatch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454652]">PRN:</span>
                <span className="font-mono text-[#071e27]">{selectedStudent.prn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#454652]">Current Cumulative GPA:</span>
                <span className="font-bold text-emerald-600">{selectedStudent.gpa} / 4.00</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 border border-[#c6c5d4] rounded-lg text-[13px] font-semibold text-[#071e27] hover:bg-[#e6f6ff]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const studentEmail = selectedStudent.email;
                  setSelectedStudent(null);
                  onNavigate('bulk-email', studentEmail);
                }}
                className="px-4 py-2 bg-[#000666] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1a237e] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>Send Direct Email</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
