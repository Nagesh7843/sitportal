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
  const [inquiryType, setInquiryType] = useState('Office Hours Appointment');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !faculty) return null;

  const studentName = currentProfile?.name || 'SIT Student';
  const studentEmail = currentProfile?.email || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Please fill in both the subject and your message.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      await apiService.contactFaculty({
        facultyId: faculty.id,
        facultyName: faculty.name,
        facultyEmail: faculty.email,
        studentName: studentName,
        studentEmail: studentEmail,
        studentPrn: (currentProfile as any)?.prn || (currentProfile as any)?.rollNo || 'N/A',
        academicYear: (currentProfile as any)?.academicYear || 'CSE Department',
        division: (currentProfile as any)?.division || '',
        inquiryType: inquiryType,
        subject: subject.trim(),
        message: message.trim(),
        priority: priority,
      });

      if (onSuccess) {
        onSuccess(`Your inquiry has been emailed to ${faculty.name}!`);
      } else {
        alert(`Your message has been sent to ${faculty.name} (${faculty.email})!`);
      }

      setSubject('');
      setMessage('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to transmit inquiry to faculty.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#c6c5d4] max-h-[92vh] overflow-y-auto font-sans">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-[#e2e8f0]">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666] text-[24px]">school</span>
              <h2 className="text-[20px] font-extrabold text-[#071e27]">Contact Faculty Member</h2>
            </div>
            <p className="text-[13px] text-[#454652] mt-0.5">
              Send an official direct inquiry & email to department faculty
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#767683] hover:text-[#071e27] hover:bg-slate-100 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Target Faculty Badge */}
        <div className="my-4 p-3.5 bg-gradient-to-r from-blue-50 via-[#f0f8ff] to-indigo-50 rounded-2xl border border-blue-200 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#000666] text-white flex items-center justify-center font-bold text-[18px] shrink-0 shadow-xs">
            {faculty.name.replace('Dr.', '').replace('Prof.', '').trim().charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-[15px] text-[#071e27] truncate">{faculty.name}</h4>
            <p className="text-[12px] text-[#2b5bb5] font-semibold truncate">
              {faculty.designation || faculty.rank} &bull; {faculty.specialization}
            </p>
            <p className="text-[11px] text-[#64748b] truncate mt-0.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">mail</span>
              {faculty.email}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-[12px] font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sender Identity Preview */}
          <div className="p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-[12px] text-[#334155] flex flex-col sm:flex-row justify-between gap-2">
            <div>
              <span className="text-[#64748b]">Sending as: </span>
              <strong className="text-[#071e27]">{studentName}</strong>
              {studentEmail && <span className="text-[#64748b]"> ({studentEmail})</span>}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md self-start sm:self-auto border border-emerald-200">
              Direct Reply-To Active
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Inquiry Category */}
            <div>
              <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
                Inquiry Category
              </label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-2.5 text-[13px] font-semibold text-[#071e27] outline-none focus:border-[#000666]"
              >
                <option value="Office Hours Appointment">Office Hours Appointment</option>
                <option value="Project Guidance">Project Guidance / Capstone</option>
                <option value="Doubt Resolution">Doubt Resolution / Concept Query</option>
                <option value="Attendance Query">Attendance / Examination Query</option>
                <option value="Recommendation Letter">Letter of Recommendation</option>
                <option value="General Inquiry">General Inquiry</option>
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
                Priority Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('NORMAL')}
                  className={`py-2 px-3 rounded-xl text-[12px] font-bold border transition-all ${
                    priority === 'NORMAL'
                      ? 'bg-blue-50 text-[#000666] border-[#000666]'
                      : 'bg-white text-[#767683] border-[#c6c5d4] hover:bg-slate-50'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('URGENT')}
                  className={`py-2 px-3 rounded-xl text-[12px] font-bold border transition-all ${
                    priority === 'URGENT'
                      ? 'bg-red-50 text-red-700 border-red-600'
                      : 'bg-white text-[#767683] border-[#c6c5d4] hover:bg-slate-50'
                  }`}
                >
                  Urgent
                </button>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Guidance on Machine Learning Pipeline Implementation"
              className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] font-medium outline-none focus:border-[#000666]"
            />
          </div>

          {/* Message Body */}
          <div>
            <label className="block text-[11px] font-bold text-[#454652] uppercase mb-1">
              Message / Description
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your detailed inquiry or meeting request here. Please specify your availability if asking for an appointment..."
              className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] font-medium outline-none focus:border-[#000666] resize-none"
            />
          </div>

          {/* Institutional Note */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">info</span>
            <span>
              This inquiry is officially dispatched to the faculty member's institutional email with an SIT header. When the professor replies, it will arrive directly in your inbox (<strong>{studentEmail || 'your email'}</strong>).
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071e27] font-bold rounded-xl text-[13px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2.5 bg-[#000666] hover:bg-[#1a237e] text-white font-bold rounded-xl text-[13px] transition-all shadow-md flex items-center gap-2"
            >
              <span className={`material-symbols-outlined text-[18px] ${isSending ? 'animate-spin' : ''}`}>
                send
              </span>
              <span>{isSending ? 'Transmitting...' : 'Send Inquiry to Faculty'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
