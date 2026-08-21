import React, { useState } from 'react';
import { CourseItem, UserRole, UserProfile, ViewMode } from '@/types';

const THIRD_YEAR_CSE_SYLLABUS = '/syllabus/TY-CSE_0001-2.pdf';

interface CurriculumViewProps {
  courses: CourseItem[];
  userRole?: UserRole;
  currentProfile?: UserProfile | null;
  onAddCourse?: () => void;
  onEditCourse?: (course: CourseItem) => void;
  onDeleteCourse?: (id: string | number) => void;
  onDeleteAllCourses?: () => void;
  onNavigate: (view: ViewMode) => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  courses,
  userRole = 'public',
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onDeleteAllCourses,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const canManageCurriculum = ['admin', 'hod', 'faculty'].includes(userRole);

  const filteredCourses = courses.filter((course) => {
    const matchesSem = selectedSemester === 'ALL' || course.semester === selectedSemester;
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.instructor && course.instructor.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSem && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-[#000666] text-white p-6 sm:p-7 rounded-3xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-extrabold flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#759efd]">menu_book</span>
            Department Curriculum & Syllabus
          </h1>
          <p className="text-[#cfe6f2] text-[13px] mt-1">
            B.Tech Computer Science & Engineering • Choice-Based Credit System (CBCS)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canManageCurriculum && onAddCourse && (
            <button
              onClick={onAddCourse}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold px-4 py-2.5 rounded-xl text-[13px] transition-all shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Add Course</span>
            </button>
          )}

          {canManageCurriculum && onDeleteAllCourses && courses.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete ALL curriculum courses from the database? This action cannot be undone.')) {
                  onDeleteAllCourses();
                }
              }}
              className="bg-red-600/90 hover:bg-red-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-[13px] transition-all shadow-xs flex items-center gap-1.5"
              title="Delete all courses from database"
            >
              <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
              <span>Clear All</span>
            </button>
          )}

          <a
            href={THIRD_YEAR_CSE_SYLLABUS}
            download="TY-CSE_0001-2.pdf"
            className="bg-white text-[#000666] font-bold px-4 py-2.5 rounded-xl text-[13px] hover:bg-[#cfe6f2] transition-colors shadow-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>TY Syllabus</span>
          </a>
        </div>
      </div>

      {/* Official Syllabus Reference Banner */}
      <section className="bg-white p-5 rounded-2xl border border-[#c6c5d4] shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#000666] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
          </div>
          <div>
            <h2 className="font-bold text-[16px] text-[#071e27]">Third-Year CSE Syllabus Reference</h2>
            <p className="text-[12px] text-[#454652] mt-0.5">Official autonomous curriculum structure for Third Year Computer Science &amp; Engineering.</p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <a href={THIRD_YEAR_CSE_SYLLABUS} target="_blank" rel="noreferrer" className="px-3.5 py-1.5 bg-[#f0f8ff] text-[#000666] border border-[#c6c5d4] font-bold text-[12px] rounded-lg hover:bg-[#cfe6f2] transition-colors">
            View PDF
          </a>
          <a href={THIRD_YEAR_CSE_SYLLABUS} download="TY-CSE_0001-2.pdf" className="px-3.5 py-1.5 bg-[#000666] text-white font-bold text-[12px] rounded-lg hover:bg-[#1a237e] transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">file_download</span>
            Download
          </a>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#c6c5d4] shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] font-bold text-[#454652] uppercase tracking-wider mr-1.5">Semester:</span>
          {(['ALL', 1, 2, 3, 4, 5, 6, 7, 8] as const).map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${
                selectedSemester === sem
                  ? 'bg-[#000666] text-white shadow-xs'
                  : 'bg-[#e6f6ff] text-[#454652] hover:bg-[#cfe6f2]'
              }`}
            >
              {sem === 'ALL' ? 'All' : `Sem ${sem}`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by code, title, instructor..."
            className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl pl-9 pr-3.5 py-2 text-[13px] focus:ring-2 focus:ring-[#000666] outline-none font-medium"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[#767683] text-[18px]">
            search
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-[#767683] hover:text-[#071e27]"
            >
              <span className="material-symbols-outlined text-[16px]">clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Courses List or Empty State */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#c6c5d4] text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-[#000666] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-[36px]">menu_book</span>
          </div>
          <div>
            <h3 className="font-extrabold text-[18px] text-[#071e27]">No Curriculum Courses Found</h3>
            <p className="text-[13px] text-[#454652] max-w-md mx-auto mt-1">
              {courses.length === 0
                ? 'The curriculum database is currently empty. Faculty, HOD, and Administrators can add subjects and syllabus details.'
                : 'No courses matched your active semester or search filter.'}
            </p>
          </div>
          {canManageCurriculum && onAddCourse && (
            <button
              onClick={onAddCourse}
              className="px-5 py-2.5 bg-[#000666] hover:bg-[#1a237e] text-white font-bold rounded-xl text-[13px] transition-all shadow-md inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Add First Course</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCourses.map((course) => {
            const courseId = course.id || course.code;
            return (
              <div
                key={courseId}
                className="bg-white p-6 rounded-3xl border border-[#c6c5d4] shadow-xs hover:border-[#000666] hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#000666] text-white font-extrabold text-[12px] px-3 py-1 rounded-lg">
                        {course.code}
                      </span>
                      <span className="text-[11px] font-bold bg-[#e6f6ff] text-[#000666] px-2.5 py-0.5 rounded-full border border-blue-100">
                        Sem {course.semester} &bull; {course.credits} Credits
                      </span>
                      {course.type && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                          {course.type}
                        </span>
                      )}
                    </div>

                    {/* Faculty/Admin/HOD Quick Actions */}
                    {canManageCurriculum && (
                      <div className="flex items-center gap-1">
                        {onEditCourse && (
                          <button
                            onClick={() => onEditCourse(course)}
                            className="p-1.5 text-slate-500 hover:text-[#000666] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Course"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                        )}
                        {onDeleteCourse && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete course "${course.code} - ${course.title}"?`)) {
                                onDeleteCourse(course.id || course.code);
                              }
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Course"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <h3 className="font-extrabold text-[17px] text-[#071e27] mb-2 group-hover:text-[#000666] transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-[13px] text-[#454652] leading-relaxed mb-4 line-clamp-3">
                    {course.description || 'No detailed syllabus outline provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#c6c5d4]/40 flex justify-between items-center text-[12px]">
                  <div>
                    <p className="text-[#767683] uppercase text-[10px] font-bold tracking-wider">Instructor</p>
                    <p className="font-bold text-[#071e27]">{course.instructor || 'Department Faculty'}</p>
                  </div>
                  <a
                    href={THIRD_YEAR_CSE_SYLLABUS}
                    download="TY-CSE_0001-2.pdf"
                    className="text-[#000666] font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Syllabus PDF</span>
                    <span className="material-symbols-outlined text-[15px]">file_download</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

