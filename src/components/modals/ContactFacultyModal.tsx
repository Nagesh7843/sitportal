import React, { useState } from 'react';
import { FacultyMember, UserProfile } from '@/types';
import { apiService } from '@/services/api';

interface ContactFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: FacultyMember | null;
  currentProfile: UserProfile | null;
  onSuccess?: (message: string) => void;
}

export const ContactFacultyModal: React.FC<ContactFacultyModalProps> = ({
  isOpen,
  onClose,
  faculty,
  currentProfile,
  onSuccess,
}) => {
  const [senderName, setSenderName] = useState(currentProfile?.name || '');
  const [senderEmail, setSenderEmail] = useState(currentProfile?.email || '');
  const [inquiryType, setInquiryType] = useState('Office Hours & Appointment');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (currentProfile) {
      if (currentProfile.name) setSenderName(currentProfile.name);
      if (currentProfile.email) setSenderEmail(currentProfile.email);
    }
  }, [currentProfile, isOpen]);

  if (!isOpen || !faculty) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = senderName.trim() || currentProfile?.name || 'SIT Student';
    const finalEmail = senderEmail.trim();

    if (!finalEmail || !finalEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Please fill in both subject and message.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      await apiService.contactFaculty({
        facultyId: faculty.id,
        facultyName: faculty.name,
        facultyEmail: faculty.email,
        studentName: finalName,
        studentEmail: finalEmail,
        studentPrn: (currentProfile as any)?.prn || (currentProfile as any)?.rollNo || 'N/A',
        academicYear: (currentProfile as any)?.academicYear || 'CSE',
        division: (currentProfile as any)?.division || '',
        inquiryType: inquiryType,
        subject: subject.trim(),
        message: message.trim(),
        priority: 'NORMAL',
      });

      if (onSuccess) {
        onSuccess(`Message sent to ${faculty.name}!`);
      }

      setSubject('');
      setMessage('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-[24px]">mail</span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Contact Faculty Member</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Send an official direct inquiry & email to department faculty
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Target Faculty Details Card */}
        <div className="my-4 p-4 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 rounded-2xl border border-blue-200 flex items-center justify-between gap-3.5 shadow-2xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#000666] text-white flex items-center justify-center font-extrabold text-[18px] shrink-0 shadow-xs">
              {faculty.name.replace('Dr.', '').replace('Prof.', '').trim().charAt(0)}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate">{faculty.name}</h4>
              <p className="text-xs text-blue-700 font-semibold truncate">
                {faculty.designation || faculty.rank} {faculty.specialization ? `• ${faculty.specialization}` : ''}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">mail</span>
                <span>{faculty.email}</span>
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-extrabold text-[10px] rounded-lg border border-blue-200 shrink-0">
            {faculty.department || 'CSE'}
          </span>
        </div>

        {/* Sender Info Strip */}
        {currentProfile && (
          <div className="mb-4 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="text-slate-500">Sending as: </span>
              <strong className="text-slate-900">{currentProfile.name}</strong>
              <span className="text-slate-500"> ({currentProfile.role === 'parent' ? 'Parent' : 'Student'})</span>
              {currentProfile.email && <span className="text-slate-500"> • {currentProfile.email}</span>}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Sender inputs if unauthenticated / guest */}
          {!currentProfile && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="e.g. Shankar Gaikwad"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#000666] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Your Email Address *</label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g. name@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#000666] focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Inquiry Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Inquiry Category</label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-[#000666] focus:bg-white cursor-pointer"
            >
              <option value="Office Hours & Appointment">Office Hours & Appointment</option>
              <option value="Academic Doubt & Concept Query">Academic Doubt & Concept Query</option>
              <option value="Project & Capstone Guidance">Project & Capstone Guidance</option>
              <option value="Ward Academic Progress / Monitoring">Ward Academic Progress / Monitoring</option>
              <option value="Attendance & Exam Query">Attendance & Exam Query</option>
              <option value="Letter of Recommendation">Letter of Recommendation</option>
              <option value="General Inquiry">General Inquiry</option>
            </select>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Subject Line</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Inquiring regarding academic progress and office hours"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium outline-none focus:border-[#000666] focus:bg-white"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Message / Description</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message or inquiry here..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 outline-none focus:border-[#000666] focus:bg-white resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2.5 bg-[#000666] hover:bg-[#1a237e] text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSending ? 'animate-spin' : ''}`}>
                send
              </span>
              <span>{isSending ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
