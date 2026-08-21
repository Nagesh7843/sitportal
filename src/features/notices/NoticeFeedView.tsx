import React, { useState, useEffect } from 'react';
import { NoticeItem, NoticeCategory, UserProfile, ScrapedNotice } from '@/types';
import { apiService } from '@/services/api';

interface NoticeFeedViewProps {
  notices: NoticeItem[];
  currentProfile: UserProfile;
  onMarkAsRead: (noticeId: string) => void;
  onOpenPublishModal: () => void;
  onDeleteNotice?: (noticeId: string) => void;
  onRefreshNotices?: () => void;
}

export const NoticeFeedView: React.FC<NoticeFeedViewProps> = ({
  notices,
  currentProfile,
  onMarkAsRead,
  onOpenPublishModal,
  onDeleteNotice,
  onRefreshNotices
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);
  
  // Scraper states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewNotices, setPreviewNotices] = useState<ScrapedNotice[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [scraperStatus, setScraperStatus] = useState<{ lastSyncTimestamp: string; lastSyncedCount: number; lastSyncStatus: string } | null>(null);

  const currentUserId = currentProfile.role === 'admin' ? 'admin-1' : currentProfile.role === 'faculty' ? 'fac-1' : 'stu-1';
  const canManageNotices = currentProfile.role === 'admin' || currentProfile.role === 'hod' || currentProfile.role === 'faculty';

  // Fetch initial scraper status
  useEffect(() => {
    apiService.getOfficialScraperStatus()
      .then(setScraperStatus)
      .catch(console.warn);
  }, []);

  const handleSyncOfficialNotices = async () => {
    setIsSyncing(true);
    setSyncToast(null);
    try {
      const res = await apiService.syncOfficialNotices();
      setSyncToast({
        message: `✅ Scraped & Synced! ${res.newlyAdded} new official circulars imported (${res.alreadyExisted} up-to-date).`,
        type: 'success'
      });
      if (onRefreshNotices) {
        onRefreshNotices();
      }
      apiService.getOfficialScraperStatus().then(setScraperStatus).catch(console.warn);
    } catch (err: any) {
      setSyncToast({
        message: `❌ Scraping Error: ${err.message || 'Failed to sync with college portal'}`,
        type: 'error'
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 6000);
    }
  };

  const handleOpenPreviewModal = async () => {
    setShowPreviewModal(true);
    setIsLoadingPreview(true);
    try {
      const data = await apiService.previewOfficialNotices();
      setPreviewNotices(data);
    } catch (err) {
      console.warn('Failed to load preview:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const isCollegeOfficialNotice = (item: NoticeItem) => {
    return (
      item.authorRole?.toLowerCase().includes('sitcoe') ||
      item.authorRole?.toLowerCase().includes('college official') ||
      item.authorName?.toLowerCase().includes('central administration') ||
      item.targetAudience?.collegeSynced === true
    );
  };

  const filteredNotices = notices
    .filter((item) => {
      const matchesSearch =
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.content?.toLowerCase().includes(search.toLowerCase()) ||
        item.authorName?.toLowerCase().includes(search.toLowerCase());

      let matchesCategory = true;
      if (selectedCategory === 'ALL') {
        matchesCategory = true;
      } else if (selectedCategory === 'OFFICIAL_SIT') {
        matchesCategory = isCollegeOfficialNotice(item);
      } else {
        matchesCategory = item.category === selectedCategory;
      }

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const priorityWeights: Record<string, number> = {
        URGENT: 1,
        HIGH: 2,
        NORMAL: 3,
        LOW: 4
      };
      const pA = priorityWeights[a.priority || 'NORMAL'] || 3;
      const pB = priorityWeights[b.priority || 'NORMAL'] || 3;
      if (pA !== pB) return pA - pB;

      const idA = typeof a.id === 'number' ? a.id : parseInt(String(a.id || 0), 10) || 0;
      const idB = typeof b.id === 'number' ? b.id : parseInt(String(b.id || 0), 10) || 0;
      return idB - idA;
    });

  const officialSyncedCount = notices.filter(isCollegeOfficialNotice).length;

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {syncToast && (
        <div
          className={`p-4 rounded-xl text-[13px] font-bold shadow-lg flex items-center justify-between transition-all duration-300 ${
            syncToast.type === 'success'
              ? 'bg-emerald-600 text-white border border-emerald-500'
              : 'bg-rose-600 text-white border border-rose-500'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              {syncToast.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{syncToast.message}</span>
          </div>
          <button onClick={() => setSyncToast(null)} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Official Central Notice Board Banner */}
      <div className="bg-gradient-to-r from-[#000666] via-[#121c60] to-[#002171] text-white p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-cyan-200 font-semibold text-xs border border-white/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Official Institutional Notice Board
            </div>
            {scraperStatus && scraperStatus.lastSyncTimestamp !== 'Never' && (
              <span className="text-[11px] text-cyan-200/80 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                Last Sync: {scraperStatus.lastSyncTimestamp}
              </span>
            )}
          </div>

          <h1 className="text-[24px] sm:text-[28px] font-black text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-[#759efd]">campaign</span>
            SIT CSE Central Notice Board
          </h1>
          <p className="text-[#cfe6f2] text-[13px] max-w-2xl leading-relaxed">
            Live departmental circulars, semester exam schedules, priority announcements, and auto-synchronized circulars from Sharad Institute of Technology College of Engineering (SITCOE).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 z-10 w-full lg:w-auto">
          {/* Live SITCOE Scraper Sync Button */}
          <button
            onClick={handleSyncOfficialNotices}
            disabled={isSyncing}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all shadow-md ${
              isSyncing
                ? 'bg-cyan-900/60 text-cyan-200 cursor-not-allowed border border-cyan-500/30'
                : 'bg-white/10 hover:bg-white/20 text-cyan-200 border border-cyan-400/40 hover:border-cyan-300'
            }`}
            title="Scrape and synchronize official notices from sitcoe.ac.in"
          >
            <span className={`material-symbols-outlined text-[18px] ${isSyncing ? 'animate-spin text-cyan-300' : ''}`}>
              sync
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Sync College Notices'}</span>
          </button>

          {/* Live Preview Button */}
          <button
            onClick={handleOpenPreviewModal}
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-2 transition-all shadow-md"
            title="Inspect live circulars directly from sitcoe.ac.in"
          >
            <span className="material-symbols-outlined text-[18px]">travel_explore</span>
            <span>Live Feed</span>
          </button>

          {/* Publish Notice Modal (Faculty/Admin/HOD) */}
          {canManageNotices && (
            <button
              onClick={onOpenPublishModal}
              className="bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-[13px] hover:bg-amber-300 transition-all shadow-lg flex items-center gap-2 shrink-0 border border-amber-300"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Publish Notice</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#c6c5d4] shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'All Notices' },
            { id: 'OFFICIAL_SIT', label: `🏛️ SITCOE Circulars (${officialSyncedCount})` },
            { id: 'Exam', label: 'Exam' },
            { id: 'Academic', label: 'Academic' },
            { id: 'Administrative', label: 'Administrative' },
            { id: 'Placement', label: 'Placement' },
            { id: 'Event', label: 'Event' },
            { id: 'Emergency', label: 'Emergency' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-all ${
                selectedCategory === tab.id
                  ? 'bg-[#000666] text-white shadow-xs'
                  : 'bg-[#f0f7ff] text-[#454652] hover:bg-[#d9eaff] border border-blue-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative shrink-0 sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#767683] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search circulars, exams, topics..."
            className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl pl-9 pr-3.5 py-2 text-[13px] text-[#071e27] placeholder:text-[#767683] focus:ring-2 focus:ring-[#000666] outline-none transition-all"
          />
        </div>
      </div>

      {/* Notice Feed List */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => {
          const isRead = notice.readBy?.includes(currentUserId) ?? false;
          const isOfficial = isCollegeOfficialNotice(notice);

          const priorityStyles = {
            URGENT: 'border-l-4 border-l-[#ba1a1a] bg-[#ffdad6]/15 hover:bg-[#ffdad6]/25',
            HIGH: 'border-l-4 border-l-amber-500 bg-[#ffe9c7]/15 hover:bg-[#ffe9c7]/25',
            NORMAL: 'border-l-4 border-l-[#000666] bg-white hover:bg-slate-50/50',
            LOW: 'border-l-4 border-l-gray-400 bg-white'
          }[notice.priority || 'NORMAL'];

          return (
            <div
              key={notice.id}
              className={`p-6 rounded-2xl border border-[#c6c5d4] shadow-xs hover:shadow-md transition-all ${priorityStyles} flex flex-col justify-between gap-4 relative group`}
            >
              <div>
                <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Official Synced Badge */}
                    {isOfficial && (
                      <span className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        SITCOE Official Circular
                      </span>
                    )}

                    <span className="bg-[#d9e2ff] text-[#00429c] font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                      {notice.category}
                    </span>

                    {notice.priority === 'URGENT' && (
                      <span className="bg-[#ffdad6] text-[#93000a] font-bold text-[10px] uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        Urgent Circular
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
                        New
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

                {/* Direct Attachment Chips on Card */}
                {notice.attachments && notice.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {notice.attachments.map((att, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (att.downloadUrl) {
                            window.open(att.downloadUrl, '_blank');
                          } else {
                            setSelectedNotice(notice);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 text-[#000666] border border-blue-200 rounded-lg text-[12px] font-bold transition-all shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[15px] text-red-600">picture_as_pdf</span>
                        <span className="truncate max-w-[240px]">{att.title}</span>
                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#c6c5d4]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[12px]">
                <div className="flex items-center gap-1.5 text-[11px] text-[#454652]">
                  <span className="material-symbols-outlined text-[15px] text-[#767683]">person</span>
                  <span>Issued by: <strong>{notice.authorName}</strong> ({notice.authorRole})</span>
                </div>

                <div className="flex items-center gap-3">
                  {isOfficial && (
                    <a
                      href="https://sitcoe.ac.in/notification/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>sitcoe.ac.in</span>
                      <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  )}
                  <button
                    onClick={() => {
                      setSelectedNotice(notice);
                      if (!isRead) onMarkAsRead(String(notice.id));
                    }}
                    className="text-[#000666] font-bold text-[12px] hover:underline flex items-center gap-1"
                  >
                    <span>View Circular</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredNotices.length === 0 && (
          <div className="bg-white p-12 rounded-2xl border border-[#c6c5d4] text-center space-y-3">
            <span className="material-symbols-outlined text-[48px] text-[#759efd]">mark_email_read</span>
            <h3 className="font-bold text-[18px] text-[#071e27]">No circulars found</h3>
            <p className="text-[13px] text-[#454652] max-w-md mx-auto">
              There are no notices matching your current filter. You can click <strong>"Sync College Notices"</strong> above to fetch the latest circulars from the official SITCOE website.
            </p>
            <button
              onClick={handleSyncOfficialNotices}
              className="mt-2 px-5 py-2 bg-[#000666] text-white text-[13px] font-bold rounded-xl hover:bg-[#1a237e] transition-all inline-flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">sync</span>
              <span>Sync with SITCOE Official Portal</span>
            </button>
          </div>
        )}
      </div>

      {/* Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-[#c6c5d4] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {isCollegeOfficialNotice(selectedNotice) && (
                    <span className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      SITCOE Official Circular
                    </span>
                  )}
                  <span className="bg-[#d9e2ff] text-[#00429c] font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                    {selectedNotice.category}
                  </span>
                  {selectedNotice.priority === 'URGENT' && (
                    <span className="bg-[#ffdad6] text-[#93000a] font-bold text-[10px] uppercase px-2 py-0.5 rounded-md">
                      Urgent
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-[20px] text-[#071e27] leading-snug">{selectedNotice.title}</h3>
                <p className="text-[12px] text-[#454652]">
                  Issued by <strong>{selectedNotice.authorName}</strong> ({selectedNotice.authorRole}) • Published {selectedNotice.publishedAt}
                </p>
                {selectedNotice.expiresAt && (
                  <p className="text-[11px] text-amber-800 font-bold">
                    ⏳ Auto-Expiry Timer: {selectedNotice.expiresAt}
                  </p>
                )}
              </div>
              <button onClick={() => setSelectedNotice(null)} className="text-[#767683] hover:text-[#071e27] p-1">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="bg-[#f3faff] p-4 rounded-xl border border-[#c6c5d4] text-[13px] text-[#071e27] whitespace-pre-wrap leading-relaxed mb-4">
              {selectedNotice.content}
            </div>

            {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
              <div className="mb-4 space-y-2">
                <h4 className="text-[12px] font-bold text-[#454652] uppercase flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#000666]">attach_file</span>
                  Official Circular Attachments ({selectedNotice.attachments.length}):
                </h4>
                <div className="space-y-2">
                  {selectedNotice.attachments.map((att, idx) => (
                    <div key={att.id || idx} className="p-3 bg-[#e6f6ff] rounded-xl border border-[#c6c5d4] flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5 text-[13px] font-bold text-[#071e27] min-w-0">
                        <span className="material-symbols-outlined text-red-600 text-[24px] shrink-0">
                          picture_as_pdf
                        </span>
                        <div className="truncate">
                          <p className="truncate text-[12px] font-bold text-[#071e27]">{att.title}</p>
                          <p className="text-[10px] text-[#454652] font-mono">{att.fileSize || 'Official PDF Document'}</p>
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
                        className="text-[#000666] font-bold text-[12px] hover:bg-blue-100 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#c6c5d4] shadow-2xs shrink-0 transition-colors"
                      >
                        <span>Open PDF</span>
                        <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
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
                className="px-6 py-2 bg-[#000666] text-white rounded-lg font-bold text-[13px] ml-auto hover:bg-[#1a237e] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live SITCOE Portal Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl border border-[#c6c5d4] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-700 text-[24px]">travel_explore</span>
                  <h3 className="font-extrabold text-[20px] text-[#071e27]">
                    SITCOE Official Portal Live Scraper Feed
                  </h3>
                </div>
                <p className="text-[12px] text-[#454652] mt-0.5">
                  Source: <a href="https://sitcoe.ac.in/notification/" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">https://sitcoe.ac.in/notification/</a> (Sharad Institute of Technology College of Engineering)
                </p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-[#767683] hover:text-[#071e27] p-1">
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {isLoadingPreview ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-[13px] font-bold text-slate-700">Connecting to SITCOE Official Portal & extracting notices...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[12px] text-blue-900 flex justify-between items-center">
                  <span>Found <strong>{previewNotices.length}</strong> official notices on the college notifications portal.</span>
                  <button
                    onClick={async () => {
                      setShowPreviewModal(false);
                      await handleSyncOfficialNotices();
                    }}
                    className="px-3.5 py-1.5 bg-[#000666] text-white text-[12px] font-bold rounded-lg hover:bg-blue-900 transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">cloud_download</span>
                    <span>Sync All to Central Board</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {previewNotices.map((pn, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                            {pn.category}
                          </span>
                          {pn.priority === 'URGENT' && (
                            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                              Urgent
                            </span>
                          )}
                          {pn.isNew && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                              ✨ New to Import
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-[14px] text-slate-900 leading-snug">{pn.title}</h4>
                        <p className="text-[11px] text-slate-500">{pn.author} • {pn.date}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={pn.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-blue-700 font-bold text-[12px] rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px] text-red-600">picture_as_pdf</span>
                          <span>PDF</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-[13px] hover:bg-slate-200"
              >
                Close Preview
              </button>
              <button
                onClick={async () => {
                  setShowPreviewModal(false);
                  await handleSyncOfficialNotices();
                }}
                className="px-5 py-2 bg-[#000666] text-white rounded-lg font-bold text-[13px] hover:bg-[#1a237e] flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">sync</span>
                <span>Sync Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
