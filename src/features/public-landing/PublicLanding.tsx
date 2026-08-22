import React, { useState } from 'react';
import { ViewMode, NoticeItem } from '@/types';
import sitLogo from '@/assets/sit-logo.png';
import { Shield, Megaphone, BookOpen, Users, ArrowRight, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { PlacementHubSection } from './PlacementHubSection';
import { CollegeNewsEventsSection } from './CollegeNewsEventsSection';

interface PublicLandingProps {
  onNavigate: (view: ViewMode) => void;
  notices?: NoticeItem[];
  isLoggedIn?: boolean;
  userRole?: string;
}

export const PublicLanding: React.FC<PublicLandingProps> = ({ onNavigate, notices = [], isLoggedIn = false, userRole = 'public' }) => {
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  return (
    <div className="space-y-6 font-sans text-slate-800">


      {/* 📌 Sleek Central Digital Notice Stream */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              Central Digital Notice Stream
            </h2>
            <p className="text-xs text-slate-500">Official circulars and academic updates</p>
          </div>

          <button
            onClick={() => onNavigate('notices')}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none rounded-md px-1"
            aria-label="View all circulars"
          >
            <span>All Circulars</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Live Notices Stream */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...notices].sort((a, b) => {
            const idA = typeof a.id === 'number' ? a.id : parseInt(String(a.id || 0), 10) || 0;
            const idB = typeof b.id === 'number' ? b.id : parseInt(String(b.id || 0), 10) || 0;
            return idB - idA;
          }).slice(0, 4).map((notice) => (
            <button
              key={notice.id}
              onClick={() => setSelectedNotice(notice)}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-100/60 transition-all cursor-pointer space-y-2 flex flex-col justify-between text-left focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none"
              aria-label={`Read notice: ${notice.title}`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {notice.category}
                  </span>
                  {notice.expiresAt && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notice.expiresAt}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-xs text-slate-900 line-clamp-1">
                  {notice.title}
                </h3>
                
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {notice.content}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>By <strong>{notice.authorName}</strong></span>
                <span className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                  Read Notice
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Sleek Department Modules Grid */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Department Modules</h2>
          <p className="text-xs text-slate-500">Quick navigation to key academic tools</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigate('notices')}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer space-y-2 group text-left focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Megaphone className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">Digital Notice Board</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Targeted circulars by Year, Division, and Batch.</p>
          </button>

          <button 
            onClick={() => onNavigate('curriculum')}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer space-y-2 group text-left focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">Curriculum & Syllabus</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Course structures, credit schemes, and official syllabus.</p>
          </button>

          <button 
            onClick={() => onNavigate('faculty')}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer space-y-2 group text-left focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">Faculty Directory</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Faculty profiles, availability status, and office hours.</p>
          </button>
        </div>
      </section>

      {/* Placement Hub Window */}
      <PlacementHubSection onExploreNotices={() => onNavigate('notices')} userRole={userRole} />

      {/* SIT Portal News & Campus Events Section with Photos */}
      <CollegeNewsEventsSection userRole={userRole} />

      {/* Embedded Notice Detail Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="bg-indigo-50 text-indigo-700 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                  {selectedNotice.category}
                </span>
                <h3 className="font-bold text-lg text-slate-900 mt-2 leading-snug">{selectedNotice.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Published by <strong>{selectedNotice.authorName}</strong> ({selectedNotice.authorRole}) • {selectedNotice.publishedAt}
                </p>
                {selectedNotice.expiresAt && (
                  <p className="text-xs text-amber-800 font-bold mt-1">
                    ⏳ Auto-Expiry Timer: {selectedNotice.expiresAt}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setSelectedNotice(null)} 
                className="text-slate-400 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none rounded-lg p-1"
                aria-label="Close Notice Dialog"
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed mb-4">
              {selectedNotice.content}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
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
