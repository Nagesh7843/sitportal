import React, { useState } from 'react';
import { FacultyMember, DepartmentCode } from '@/types';

interface AddFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFaculty: (faculty: FacultyMember) => void;
}

export const AddFacultyModal: React.FC<AddFacultyModalProps> = ({
  isOpen,
  onClose,
  onAddFaculty,
}) => {
  const [formData, setFormData] = useState<Partial<FacultyMember>>({
    name: '',
    email: '',
    rank: 'Assistant Professor',
    designation: 'Assistant Professor',
    specialization: '',
    qualification: '',
    teachingExperience: '',
    industrialExperience: '',
    department: 'CSE'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.specialization) {
      alert("Please fill all required fields (Name, Email, Specialization).");
      return;
    }

    onAddFaculty(formData as FacultyMember);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#000666] text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[#759efd]">person_add</span>
            <h2 className="text-lg font-bold">Add Faculty Member</h2>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="add-faculty-form" onSubmit={handleSubmit} className="space-y-5 text-sm text-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#000666]"
                  placeholder="e.g., Dr. A. S. Poornima"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#000666]"
                  placeholder="e.g., poornima@sitcoe.ac.in or faculty@gmail.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">Rank / Title *</label>
                <select
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value, designation: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#000666]"
                >
                  <option value="Head of Department">Head of Department (HOD)</option>
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">Institutional Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value as DepartmentCode })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#000666] font-bold text-indigo-900"
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
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-600">Domain / Specialization *</label>
              <input
                type="text"
                required
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#000666]"
                placeholder="e.g., Artificial Intelligence, Cyber Security"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#000666]"
                  placeholder="e.g., Ph.D., M.Tech"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">Teaching Exp</label>
                <input
                  type="text"
                  value={formData.teachingExperience}
                  onChange={(e) => setFormData({ ...formData, teachingExperience: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#000666]"
                  placeholder="e.g., 10 Years"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-600">Industrial Exp</label>
                <input
                  type="text"
                  value={formData.industrialExperience}
                  onChange={(e) => setFormData({ ...formData, industrialExperience: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#000666]"
                  placeholder="e.g., 2 Years"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-faculty-form"
            className="px-6 py-2 bg-[#000666] text-white rounded-xl text-xs font-bold hover:bg-[#1a237e] transition-colors shadow-md"
          >
            Add Faculty
          </button>
        </div>
      </div>
    </div>
  );
};
