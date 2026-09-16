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
      {/* Minimal Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000666] text-[22px]">menu_book</span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Department Curriculum & Syllabus
            </h1>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-md border border-blue-200">
              CBCS Scheme
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            B.Tech Computer Science & Engineering • Choice-Based Credit System (CBCS)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {canManageCurriculum && onAddCourse && (
            <button
              onClick={onAddCourse}
              className="px-3.5 py-2 bg-[#000666] hover:bg-[#002171] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
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
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              title="Delete all courses from database"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>Clear All</span>
            </button>
          )}

          <a
            href={THIRD_YEAR_CSE_SYLLABUS}
            download="TY-CSE_0001-2.pdf"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] text-blue-700">download</span>
            <span>TY Syllabus</span>
          </a>
        </div>
      </div>

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

