import React, { useState } from 'react';
import { ViewMode, NoticeItem } from '@/types';
import sitLogo from '@/assets/sit-logo.png';
import { Shield, Megaphone, Calendar, Users, ArrowRight, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { PlacementHubSection } from './PlacementHubSection';
import { PlacedStudentsSection } from './PlacedStudentsSection';
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
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-50 text-amber-600">
                <Megaphone className="w-4 h-4" aria-hidden="true" />
              </span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Central Notice Board</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/80 text-amber-800 border border-amber-200">
                Official CSE Circulars
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              General academic, institutional, and student circulars from the Principal, HOD, and Staff.
            </p>
          </div>
          <button
            onClick={() => onNavigate('notices')}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 group focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none rounded-lg p-1"
          >
            <span>View All Notices</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </button>
        </div>

        {notices.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
            <p className="text-xs font-medium">No published notices available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notices.slice(0, 3).map((notice) => (
              <button
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-white transition-all space-y-2 text-left cursor-pointer group focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    notice.priority === 'URGENT' ? 'bg-red-50 text-red-700 border border-red-200' :
                    notice.priority === 'NORMAL' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {notice.category}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {notice.publishedAt.split('•')[0]}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 group-hover:text-indigo-900 transition-colors line-clamp-1">
                  {notice.title}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {notice.content}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                  <span className="truncate">By {notice.authorName}</span>
                  <span className="text-indigo-700 font-semibold group-hover:underline">Read Full</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 🚀 Quick Portal Access Hub */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Department Services & Resources</h2>
          <p className="text-xs text-slate-500">Direct shortcuts to department facilities, schedules, and directories.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('academic-calendar')}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer space-y-2 group text-left focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">Academic Calendar</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Semester roadmaps, examination schedules, and milestones.</p>
          </button>

          <button
            onClick={() => onNavigate('curriculum')}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer space-y-2 group text-left focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">Curriculum & Syllabus</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">DBATU Autonomous scheme course structures & credits.</p>
          </button>

          <button
            onClick={() => onNavigate('documents')}
            className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer space-y-2 group text-left focus-visible:ring-2 focus-visible:ring-indigo-600 outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-xs text-slate-900">Department Documents</h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">Official curriculum circulars, forms, and institutional guides.</p>
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

      {/* Training & Placement (T&P) Hub Window */}
      <PlacementHubSection onExploreNotices={() => onNavigate('notices')} userRole={userRole} />

      {/* 🌟 Dedicated Placed Students & Star Achievers Scrolling Showcase */}
      <PlacedStudentsSection userRole={userRole} />

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
