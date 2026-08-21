import React, { useState } from 'react';
import { NoticeItem, NoticeCategory, UserProfile } from '@/types';

interface NoticeFeedViewProps {
  notices: NoticeItem[];
  currentProfile: UserProfile;
  onMarkAsRead: (noticeId: string) => void;
  onOpenPublishModal: () => void;
  onDeleteNotice?: (noticeId: string) => void;
}

export const NoticeFeedView: React.FC<NoticeFeedViewProps> = ({
  notices,
  currentProfile,
  onMarkAsRead,
  onOpenPublishModal,
  onDeleteNotice
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategory | 'ALL'>('ALL');
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  const currentUserId = currentProfile.role === 'admin' ? 'admin-1' : currentProfile.role === 'faculty' ? 'fac-1' : 'stu-1';
  const canManageNotices = currentProfile.role === 'admin' || currentProfile.role === 'hod' || currentProfile.role === 'faculty';

  const filteredNotices = notices.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.content?.toLowerCase().includes(search.toLowerCase()) ||
      item.authorName?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const unreadCount = notices.filter((item) => !(item.readBy?.includes(currentUserId))).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Official Central Notice Board Banner */}
      <div className="bg-gradient-to-r from-[#000666] via-[#1a237e] to-[#002171] text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-200 font-semibold text-xs border border-white/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Official Institutional Communication Board
          </div>
          <h1 className="text-[26px] font-extrabold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[30px] text-[#759efd]">campaign</span>
            SIT CSE Official Central Notice Board
          </h1>
          <p className="text-[#cfe6f2] text-[13px] max-w-2xl">
            Departmental circulars, exam updates, announcements, and urgent notices.
          </p>
        </div>

        {canManageNotices && (
          <button
            onClick={onOpenPublishModal}
            className="bg-amber-400 text-slate-950 font-bold px-5 py-3 rounded-xl text-[13px] hover:bg-amber-300 transition-all shadow-lg flex items-center gap-2 shrink-0 border border-amber-300 z-10"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Publish New Notice</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#c6c5d4] shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'Academic', 'Exam', 'Event', 'Emergency', 'Administrative', 'Placement'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#000666] text-white shadow-xs'
                  : 'bg-[#e6f6ff] text-[#454652] hover:bg-[#cfe6f2]'
              }`}
            >
              {cat === 'ALL' ? 'All Notices' : cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search circulars, keywords, or author..."
          className="w-full sm:w-72 bg-[#f3faff] border border-[#c6c5d4] rounded-xl px-3.5 py-2 text-[13px] focus:ring-2 focus:ring-[#000666] outline-none"
        />
      </div>

      {/* Notice Feed List */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => {
          const isRead = notice.readBy?.includes(currentUserId) ?? false;
          const priorityStyles = {
            URGENT: 'border-l-4 border-l-[#ba1a1a] bg-[#ffdad6]/20',
            HIGH: 'border-l-4 border-l-amber-500 bg-[#ffe9c7]/20',
            NORMAL: 'border-l-4 border-l-[#000666]',
            LOW: 'border-l-4 border-l-gray-400'
          }[notice.priority || 'NORMAL'];

          return (
            <div
              key={notice.id}
              className={`bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs hover:shadow-md transition-all ${priorityStyles} flex flex-col justify-between gap-4 relative group`}
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-[#d9e2ff] text-[#00429c] font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                      {notice.category}
                    </span>

                    {notice.priority === 'URGENT' && (
                      <span className="bg-[#ffdad6] text-[#93000a] font-bold text-[10px] uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        Urgent Alert
                      </span>
                    )}

                    {/* Auto-Delete / Expiry Timer Badge */}
                    {notice.expiresAt && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">timer</span>
                        Auto-Deletes: {notice.expiresAt}
                      </span>
                    )}

                    {!isRead && (
                      <span className="bg-[#ba1a1a] text-white font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                        Unread
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-semibold text-[#767683]">{notice.publishedAt}</span>
                    
                    {/* Delete Notice Button (HOD, Faculty & Admin) */}
                    {canManageNotices && onDeleteNotice && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete notice "${notice.title}"?`)) {
                            onDeleteNotice(String(notice.id));
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Notice"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                <h3
                  onClick={() => {
                    setSelectedNotice(notice);
                    if (!isRead) onMarkAsRead(String(notice.id));
                  }}
                  className="font-extrabold text-[18px] text-[#071e27] hover:text-[#000666] transition-colors cursor-pointer leading-snug mb-2"
                >
                  {notice.title}
                </h3>

                <p className="text-[13px] text-[#454652] leading-relaxed line-clamp-2">
                  {notice.content}
                </p>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#c6c5d4]/40 flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3 text-[12px]">
                  <span className="text-[11px] text-[#454652]">By <strong>{notice.authorName}</strong> ({notice.authorRole})</span>
                  <button
                    onClick={() => {
                      setSelectedNotice(notice);
                      if (!isRead) onMarkAsRead(String(notice.id));
                    }}
                    className="text-[#000666] font-bold text-[12px] hover:underline"
                  >
                    Read Full Notice
                  </button>
              </div>
            </div>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-[#c6c5d4] text-center space-y-2">
            <span className="material-symbols-outlined text-[42px] text-[#759efd]">mark_email_read</span>
            <h3 className="font-bold text-[18px] text-[#071e27]">No active circulars found</h3>
            <p className="text-[13px] text-[#454652]">There are no circulars matching your current search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-[#c6c5d4] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-[#d9e2ff] text-[#00429c] font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                  {selectedNotice.category}
                </span>
                <h3 className="font-bold text-[20px] text-[#071e27] mt-2 leading-snug">{selectedNotice.title}</h3>
                <p className="text-[12px] text-[#454652] mt-1">
                  Published by <strong>{selectedNotice.authorName}</strong> ({selectedNotice.authorRole}) • {selectedNotice.publishedAt}
                </p>
                {selectedNotice.expiresAt && (
                  <p className="text-[11px] text-amber-800 font-bold mt-1">
                    ⏳ Auto-Expiry Timer: {selectedNotice.expiresAt}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedNotice(null)} className="text-[#767683] hover:text-[#071e27]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#f3faff] p-4 rounded-xl border border-[#c6c5d4] text-[13px] text-[#071e27] whitespace-pre-wrap leading-relaxed mb-4">
              {selectedNotice.content}
            </div>

            {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
              <div className="mb-4">
                <h4 className="text-[12px] font-bold text-[#454652] uppercase mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#000666]">attach_file</span>
                  Official Attached Documents ({selectedNotice.attachments.length}):
                </h4>
                <div className="space-y-2">
                  {selectedNotice.attachments.map((att, idx) => (
                    <div key={att.id || idx} className="p-3 bg-[#e6f6ff] rounded-xl border border-[#c6c5d4] flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2 text-[13px] font-bold text-[#071e27] min-w-0">
                        <span className="material-symbols-outlined text-[#000666] text-[20px] shrink-0">
                          {att.title.endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                        </span>
                        <div className="truncate">
                          <p className="truncate text-[12px] font-bold text-[#071e27]">{att.title}</p>
                          {att.fileSize && <p className="text-[10px] text-[#454652] font-mono">{att.fileSize}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (att.downloadUrl) {
                            window.open(att.downloadUrl, '_blank');
                          } else {
                            const blob = new Blob([`Official Attachment for SIT CSE Notice: ${selectedNotice.title}\nDocument: ${att.title}\nDate: ${selectedNotice.publishedAt}`], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = att.title;
                            a.click();
                            URL.revokeObjectURL(url);
                          }
                        }}
                        className="text-[#000666] font-bold text-[12px] hover:underline flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-[#c6c5d4] shadow-2xs shrink-0"
                      >
                        <span>Download</span>
                        <span className="material-symbols-outlined text-[15px]">download</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              {canManageNotices && onDeleteNotice && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete notice "${selectedNotice.title}"?`)) {
                      onDeleteNotice(String(selectedNotice.id));
                      setSelectedNotice(null);
                    }
                  }}
                  className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded-lg text-[12px] hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  <span>Delete Notice</span>
                </button>
              )}
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-6 py-2 bg-[#000666] text-white rounded-lg font-bold text-[13px] ml-auto"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
