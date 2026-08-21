import React, { useState, useEffect } from 'react';
import { CourseItem, FacultyMember, UserProfile } from '@/types';

interface AddEditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Partial<CourseItem>) => void;
  initialCourse?: CourseItem | null;
  facultyList?: FacultyMember[];
  currentProfile?: UserProfile | null;
}

export const AddEditCourseModal: React.FC<AddEditCourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCourse,
  facultyList = [],
  currentProfile,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState<number>(3);
  const [credits, setCredits] = useState<number>(4);
  const [type, setType] = useState<string>('Core');
  const [instructor, setInstructor] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialCourse) {
      setCode(initialCourse.code || '');
      setTitle(initialCourse.title || '');
      setSemester(initialCourse.semester || 3);
      setCredits(initialCourse.credits || 4);
      setType(initialCourse.type || 'Core');
      setInstructor(initialCourse.instructor || '');
      setDescription(initialCourse.description || '');
    } else {
      setCode('');
      setTitle('');
      setSemester(3);
      setCredits(4);
      setType('Core');
      // If current user is faculty, auto-fill instructor with their name
      if (currentProfile && (currentProfile.role === 'faculty' || currentProfile.role === 'hod')) {
        setInstructor(currentProfile.name);
      } else {
        setInstructor('');
      }
      setDescription('');
    }
  }, [initialCourse, isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      alert('Please fill out Course Code and Course Title.');
      return;
    }

    setIsSubmitting(true);

    const courseData: Partial<CourseItem> = {
      ...(initialCourse?.id ? { id: initialCourse.id } : {}),
      code: code.trim().toUpperCase(),
      title: title.trim(),
      semester: Number(semester),
      credits: Number(credits),
      type: type,
      instructor: instructor.trim() || 'Department Faculty',
      description: description.trim(),
    };

    onSave(courseData);
    setIsSubmitting(false);
    onClose();
  };

  const isEditing = !!initialCourse;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#c6c5d4] max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-[#e2e8f0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-[24px]">
                {isEditing ? 'edit_note' : 'menu_book'}
              </span>
              <h2 className="text-[20px] font-extrabold text-[#071e27]">
                {isEditing ? 'Edit Curriculum Course' : 'Add New Department Course'}
              </h2>
            </div>
            <p className="text-[13px] text-[#454652] mt-0.5">
              {isEditing ? 'Modify course parameters and syllabus details' : 'Register a new course into the department academic syllabus'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#767683] hover:text-[#071e27] hover:bg-slate-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Course Code */}
            <div>
              <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. CS301"
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-2.5 text-[13px] font-bold text-[#071e27] uppercase outline-none focus:border-[#000666]"
              />
            </div>

            {/* Semester */}
            <div>
              <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
                Semester *
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-2.5 text-[13px] font-semibold text-[#071e27] outline-none focus:border-[#000666]"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Credits */}
            <div>
              <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
                Credits *
              </label>
              <select
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-2.5 text-[13px] font-semibold text-[#071e27] outline-none focus:border-[#000666]"
              >
                {[1, 2, 3, 4, 5, 6].map((c) => (
                  <option key={c} value={c}>
                    {c} {c === 1 ? 'Credit' : 'Credits'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Course Title */}
          <div>
            <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design & Analysis of Algorithms"
              className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] font-semibold text-[#071e27] outline-none focus:border-[#000666]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Course Type */}
            <div>
              <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
                Course Category / Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-2.5 text-[13px] font-semibold text-[#071e27] outline-none focus:border-[#000666]"
              >
                <option value="Core">Core Subject</option>
                <option value="Elective">Professional Elective</option>
                <option value="Lab">Laboratory / Practical</option>
                <option value="Audit">Audit / Mandatory</option>
              </select>
            </div>

            {/* Instructor */}
            <div>
              <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
                Instructor / Course In-charge
              </label>
              <input
                type="text"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                list="faculty-options"
                placeholder="e.g. Dr. S. S. Gurav"
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-2.5 text-[13px] text-[#071e27] font-medium outline-none focus:border-[#000666]"
              />
              <datalist id="faculty-options">
                {facultyList.map((f) => (
                  <option key={f.id} value={f.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Description & Syllabus Outline */}
          <div>
            <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
              Course Description & Syllabus Outline
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter key topic modules, prerequisites, learning objectives, or evaluation criteria..."
              className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] font-medium outline-none focus:border-[#000666] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071e27] font-bold rounded-xl text-[13px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#000666] hover:bg-[#1a237e] text-white font-bold rounded-xl text-[13px] transition-all shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isEditing ? 'save' : 'add'}
              </span>
              <span>{isEditing ? 'Update Course' : 'Save Course to Curriculum'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
