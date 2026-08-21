import React, { useState, useRef } from 'react';
import { NoticeItem, NoticeCategory, NoticePriority, NoticeStatus, AcademicYear, Division, BatchGroup, UploadAsset, UserRole, StudentRecord } from '@/types';

interface NoticePublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishNotice: (notice: NoticeItem) => void;
  currentUserName: string;
  currentUserRoleTitle: string;
  studentsList?: StudentRecord[];
}

export const NoticePublishModal: React.FC<NoticePublishModalProps> = ({
  isOpen,
  onClose,
  onPublishNotice,
  currentUserName,
  currentUserRoleTitle,
  studentsList = []
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoticeCategory>('Academic');
  const [priority, setPriority] = useState<NoticePriority>('NORMAL');
  const [status, setStatus] = useState<NoticeStatus>('PUBLISHED');
  const [scheduledFor, setScheduledFor] = useState('');
  
  // Target Audience State
  const [audienceType, setAudienceType] = useState<'GLOBAL' | 'YEARS' | 'INDIVIDUAL'>('GLOBAL');
  const [selectedYears, setSelectedYears] = useState<AcademicYear[]>([]);
  const [selectedStudentEmails, setSelectedStudentEmails] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Auto-Delete / Expiry Timer State
  const [expiryPreset, setExpiryPreset] = useState<'none' | '12h' | '24h' | '3d' | '7d' | 'custom'>('none');
  const [customExpiryDate, setCustomExpiryDate] = useState('');

  // Attachments
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentsList, setAttachmentsList] = useState<UploadAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleYear = (year: AcademicYear) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newItems: UploadAsset[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;
      newItems.push({
        id: `att-${Date.now()}-${i}`,
        title: file.name,
        category: 'Notice',
        uploadedAt: new Date().toISOString(),
        status: 'Published',
        fileSize: sizeStr
      });
    }
    setAttachmentsList((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddAttachment = () => {
    if (attachmentName.trim()) {
      const name = attachmentName.includes('.') ? attachmentName : `${attachmentName}.pdf`;
      const newAtt: UploadAsset = {
        id: `att-${Date.now()}`,
        title: name,
        category: 'Notice',
        uploadedAt: new Date().toISOString(),
        status: 'Published',
        fileSize: '2.4 MB'
      };
      setAttachmentsList((prev) => [...prev, newAtt]);
      setAttachmentName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachmentsList((prev) => prev.filter((_, i) => i !== idx));
  };

  const calculateExpiresAt = (): string | undefined => {
    if (expiryPreset === 'none') return undefined;

    const now = new Date();
    if (expiryPreset === '12h') {
      now.setHours(now.getHours() + 12);
      return now.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (expiryPreset === '24h') {
      now.setHours(now.getHours() + 24);
      return now.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (expiryPreset === '3d') {
      now.setDate(now.getDate() + 3);
      return now.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (expiryPreset === '7d') {
      now.setDate(now.getDate() + 7);
      return now.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (expiryPreset === 'custom' && customExpiryDate) {
      return new Date(customExpiryDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (audienceType === 'YEARS' && selectedYears.length === 0) {
      alert('Please select at least one Academic Year target.');
      return;
    }

    if (audienceType === 'INDIVIDUAL' && selectedStudentEmails.length === 0) {
      alert('Please select at least one individual student recipient.');
      return;
    }

    const expiresAt = calculateExpiresAt();

    const targetAudience: any = {};
    if (audienceType === 'YEARS') {
      targetAudience.academicYear = selectedYears;
    } else if (audienceType === 'INDIVIDUAL') {
      targetAudience.studentEmails = selectedStudentEmails;
    }

    const newNotice: NoticeItem = {
      title: title.trim(),
      content: content.trim(),
      authorName: currentUserName,
      authorRole: currentUserRoleTitle,
      category,
      priority,
      status,
      targetAudience,
      attachments: attachmentsList.length > 0 ? attachmentsList : undefined,
      scheduledFor: status === 'SCHEDULED' ? scheduledFor : undefined,
      expiresAt,
      publishedAt: new Date().toISOString(),
      readBy: [],
      viewsCount: 0
    };

    onPublishNotice(newNotice);
    setTitle('');
    setContent('');
    setAttachmentsList([]);
    setExpiryPreset('none');
    setCustomExpiryDate('');
    setSelectedYears([]);
    setSelectedStudentEmails([]);
    setAudienceType('GLOBAL');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#c6c5d4] max-h-[90vh] overflow-y-auto font-sans text-slate-800">
        <div className="flex justify-between items-center mb-4 border-b border-[#c6c5d4] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#000666] text-[24px]">campaign</span>
            <h3 className="font-bold text-[20px] text-[#071e27]">Publish Official Notice</h3>
          </div>
          <button onClick={onClose} className="text-[#767683] hover:text-[#071e27]">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">Notice Heading</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. End-Semester Practical Exam Schedule for TE CSE"
              className="w-full border border-[#c6c5d4] bg-[#f3faff] rounded-xl p-3 text-[13px] font-semibold text-[#071e27] outline-none focus:ring-2 focus:ring-[#000666]"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                className="w-full border border-[#c6c5d4] bg-[#f3faff] rounded-xl p-3 text-[13px] font-semibold text-[#071e27] outline-none"
              >
                <option value="Academic">Academic</option>
                <option value="Exam">Examination</option>
                <option value="Event">Department Event</option>
                <option value="Emergency">Urgent Notice</option>
                <option value="Administrative">Administrative</option>
                <option value="Placement">Placement Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">Priority</label>
              <div className="flex gap-2">
                {(['NORMAL', 'HIGH', 'URGENT'] as NoticePriority[]).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      priority === p
                        ? p === 'URGENT'
                          ? 'bg-[#ffdad6] text-[#ba1a1a] ring-2 ring-[#ba1a1a]'
                          : p === 'HIGH'
                          ? 'bg-[#ffe9c7] text-[#7a4b00] ring-2 ring-amber-500'
                          : 'bg-[#d9e2ff] text-[#00429c] ring-2 ring-[#000666]'
                        : 'bg-[#f3faff] text-[#454652] border border-[#c6c5d4]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Auto-Delete / Expiry Timer Selector */}
          <div className="bg-[#fff8f6] p-4 rounded-xl border border-[#ffb4ab] space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[12px] font-bold text-[#ba1a1a] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">timer</span>
                Auto-Delete Expiry Timer
              </h4>
              <span className="text-[11px] text-[#767683]">Notice will automatically expire & delete</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { id: 'none', label: '♾️ Never Expire' },
                { id: '12h', label: '⏱️ 12 Hours' },
                { id: '24h', label: '⏱️ 24 Hours (1 Day)' },
                { id: '3d', label: '⏱️ 3 Days' },
                { id: '7d', label: '⏱️ 7 Days (1 Week)' },
                { id: 'custom', label: '📅 Custom Date' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setExpiryPreset(opt.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                    expiryPreset === opt.id
                      ? 'bg-[#ba1a1a] text-white border-[#ba1a1a] shadow-xs'
                      : 'bg-white text-[#454652] border-[#c6c5d4] hover:bg-[#fff0ee]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {expiryPreset === 'custom' && (
              <div className="pt-2">
                <input
                  type="datetime-local"
                  value={customExpiryDate}
                  onChange={(e) => setCustomExpiryDate(e.target.value)}
                  className="bg-white border border-[#c6c5d4] rounded-lg px-3 py-1.5 text-xs text-[#071e27] font-medium outline-none focus:ring-2 focus:ring-[#ba1a1a]"
                />
              </div>
            )}
          </div>

          {/* Target Audience Targeting Section */}
          <div className="bg-[#e6f6ff] p-4 rounded-xl border border-[#c6c5d4] space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-[12px] font-bold text-[#000666] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">groups</span>
                Target Audience
              </h4>
              <span className="text-[11px] text-[#454652]">Who should receive this notice</span>
            </div>

            {/* Audience Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAudienceType('GLOBAL')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  audienceType === 'GLOBAL'
                    ? 'bg-[#000666] text-white shadow-xs'
                    : 'bg-white text-[#454652] border border-[#c6c5d4]'
                }`}
              >
                🌐 Global Notice (All Department)
              </button>
              <button
                type="button"
                onClick={() => setAudienceType('YEARS')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  audienceType === 'YEARS'
                    ? 'bg-[#000666] text-white shadow-xs'
                    : 'bg-white text-[#454652] border border-[#c6c5d4]'
                }`}
              >
                🏛️ Specific Academic Years ({selectedYears.length})
              </button>
              <button
                type="button"
                onClick={() => setAudienceType('INDIVIDUAL')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  audienceType === 'INDIVIDUAL'
                    ? 'bg-[#000666] text-white shadow-xs'
                    : 'bg-white text-[#454652] border border-[#c6c5d4]'
                }`}
              >
                👤 Individual Student(s) ({selectedStudentEmails.length})
              </button>
            </div>

            {/* Academic Years Selector */}
            {audienceType === 'YEARS' && (
              <div className="bg-white p-3 rounded-xl border border-[#c6c5d4] space-y-2">
                <p className="text-[11px] font-bold text-[#454652]">Select target academic cohorts:</p>
                <div className="flex flex-wrap gap-2">
                  {(['FE', 'SE', 'TE', 'BE'] as AcademicYear[]).map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => toggleYear(y)}
                      className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold border transition-colors ${
                        selectedYears.includes(y)
                          ? 'bg-[#000666] text-white border-[#000666]'
                          : 'bg-[#f3faff] text-[#454652] border-[#c6c5d4]'
                      }`}
                    >
                      {y} CSE
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Individual Student Target Selector */}
            {audienceType === 'INDIVIDUAL' && (
              <div className="bg-white p-3 rounded-xl border border-[#c6c5d4] space-y-3">
                {/* Selected Student Cards */}
                {selectedStudentEmails.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-[#000666]">
                      Selected Recipients ({selectedStudentEmails.length}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedStudentEmails.map((email) => {
                        const st = studentsList.find((s) => s.email.toLowerCase() === email.toLowerCase()) || {
                          id: email,
                          name: email.split('@')[0].replace('.', ' ').toUpperCase(),
                          rollNo: 'Student',
                          email: email,
                          academicYear: 'SE' as AcademicYear,
                          avatarBg: 'bg-[#d9e2ff] text-[#00429c]',
                          initials: email.slice(0, 2).toUpperCase()
                        };

                        return (
                          <div
                            key={email}
                            className="bg-[#f3faff] border border-[#000666]/30 rounded-lg p-2 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-7 h-7 ${st.avatarBg || 'bg-[#d9e2ff] text-[#00429c]'} rounded-full flex items-center justify-center font-bold text-[11px] shrink-0`}>
                                {st.initials || st.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[12px] text-[#071e27] truncate">{st.name}</p>
                                <p className="text-[10px] text-[#454652] truncate">{st.rollNo} • {st.email}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentEmails((prev) => prev.filter((e) => e !== email))}
                              className="text-[#767683] hover:text-red-600 p-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ⚠️ No students selected. Search below to select specific student recipients.
                  </p>
                )}

                {/* Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student by Name, Roll No, or Email..."
                    className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-lg pl-8 pr-3 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-[#000666]"
                  />
                  <span className="material-symbols-outlined absolute left-2 top-2 text-[#767683] text-[16px]">
                    search
                  </span>
                </div>

                {/* Matching Candidates */}
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {studentsList
                    .filter((st) => {
                      if (!studentSearch.trim()) return true;
                      const q = studentSearch.toLowerCase();
                      return st.name.toLowerCase().includes(q) || st.rollNo.toLowerCase().includes(q) || st.email.toLowerCase().includes(q);
                    })
                    .slice(0, 5)
                    .map((st) => {
                      const isSel = selectedStudentEmails.includes(st.email);
                      return (
                        <div
                          key={st.id}
                          onClick={() => {
                            if (isSel) {
                              setSelectedStudentEmails((prev) => prev.filter((e) => e !== st.email));
                            } else {
                              setSelectedStudentEmails((prev) => [...prev, st.email]);
                            }
                          }}
                          className={`flex items-center justify-between p-1.5 rounded-lg border cursor-pointer text-[11px] ${
                            isSel ? 'bg-[#d9e2ff] border-[#000666]' : 'bg-white border-[#c6c5d4] hover:bg-[#f3faff]'
                          }`}
                        >
                          <span className="font-bold text-[#071e27] truncate">{st.name} ({st.rollNo})</span>
                          <span className="text-[10px] font-bold text-[#000666]">{isSel ? '✓ Added' : '+ Add'}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Content TextArea */}
          <div>
            <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">Notice Content</label>
            <textarea
              rows={5}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide information for students..."
              className="w-full border border-[#c6c5d4] bg-[#f3faff] rounded-xl p-3 text-[13px] text-[#071e27] outline-none focus:ring-2 focus:ring-[#000666]"
            ></textarea>
          </div>

          {/* File Attachments Uploader */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[12px] font-bold text-[#454652] uppercase">
                Notice Attachments ({attachmentsList.length})
              </label>
              {attachmentsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAttachmentsList([])}
                  className="text-[11px] font-bold text-red-600 hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="flex-1 border border-[#c6c5d4] bg-[#f3faff] rounded-xl px-3 py-1.5 text-[12px] outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-[#000666] file:text-white hover:file:bg-[#000666]/90 cursor-pointer"
                />
              </div>

              {/* Attached Files List */}
              {attachmentsList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {attachmentsList.map((att, idx) => (
                    <div
                      key={att.id || idx}
                      className="bg-[#d9e2ff] text-[#00429c] text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 border border-[#000666]/20 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">description</span>
                      <span className="truncate max-w-[200px]">{att.title}</span>
                      {att.fileSize && (
                        <span className="text-[10px] bg-white/70 px-1 rounded text-slate-700 font-mono">
                          {att.fileSize}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-[#00429c] hover:text-red-600 p-0.5 rounded transition-colors"
                        title="Remove attachment"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Publishing Mode */}
          <div className="flex items-center justify-between pt-3 border-t border-[#c6c5d4]">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[12px] font-bold text-[#071e27] cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'PUBLISHED'}
                  onChange={() => setStatus('PUBLISHED')}
                  className="w-4 h-4 text-[#000666]"
                />
                <span>Publish Immediately</span>
              </label>

              <label className="flex items-center gap-1.5 text-[12px] font-bold text-[#071e27] cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'DRAFT'}
                  onChange={() => setStatus('DRAFT')}
                  className="w-4 h-4 text-[#000666]"
                />
                <span>Save as Draft</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#c6c5d4] rounded-lg text-[13px] font-semibold text-[#071e27]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#000666] text-white rounded-lg text-[13px] font-bold hover:bg-[#1a237e] transition-colors shadow-md"
              >
                {status === 'DRAFT' ? 'SAVE DRAFT' : 'PUBLISH NOTICE NOW'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
