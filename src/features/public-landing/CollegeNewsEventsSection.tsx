import React, { useState, useEffect, useRef } from 'react';
import { CollegeNewsEventItem } from '@/types';
import { apiService } from '@/services/api';

interface CollegeNewsEventsSectionProps {
  userRole?: string;
}

export const CollegeNewsEventsSection: React.FC<CollegeNewsEventsSectionProps> = ({ userRole = 'admin' }) => {
  const [newsList, setNewsList] = useState<CollegeNewsEventItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedArticle, setSelectedArticle] = useState<CollegeNewsEventItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // New Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    category: 'HACKATHON & INNOVATION',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    description: '',
    imageUrl: '',
    sourceUrl: 'https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/',
    location: 'SITCOE Main Auditorium & CSE Labs',
    organizer: 'Department of Computer Science & Engineering'
  });

  useEffect(() => {
    loadNews();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.fetchNewsAndEvents();
      if (Array.isArray(data) && data.length > 0) {
        setNewsList(data);
      }
    } catch (err) {
      console.warn('Failed to load news & events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPushPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Desktop notifications are not supported in your browser.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('🔔 SIT Portal Chrome Alerts Active', {
          body: 'You will now receive automatic desktop notifications every time new SIT events or placement drives are published!',
          icon: '/vite.svg'
        });
        alert('Chrome desktop notifications enabled successfully!');
      }
    } catch (err) {
      console.error('Permission error:', err);
    }
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please choose an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB limit. Please choose a smaller photo.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setEventForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublishEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.description.trim()) {
      alert('Please fill out the Event Title and Description.');
      return;
    }

    try {
      const created = await apiService.createNewsEvent(eventForm);
      setNewsList((prev) => [created, ...prev]);
      setIsPublishModalOpen(false);
      setFileName('');
      setEventForm({
        title: '',
        category: 'HACKATHON & INNOVATION',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        description: '',
        imageUrl: '',
        sourceUrl: 'https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/',
        location: 'SITCOE Main Auditorium & CSE Labs',
        organizer: 'Department of Computer Science & Engineering'
      });
      alert(`🎉 Event "${created.title}" published successfully to PostgreSQL and desktop notification sent to all users!`);
    } catch (err: any) {
      alert(err.message || 'Failed to publish event.');
    }
  };

  const handleDeleteEvent = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (!window.confirm('Delete this event record from database?')) return;
    try {
      await apiService.deleteNewsEvent(id);
      setNewsList((prev) => prev.filter((item) => item.id !== id));
      if (selectedArticle?.id === id) {
        setSelectedArticle(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete event.');
    }
  };

  const categories = [
    'ALL',
    'CAMPUS & SOCIAL INITIATIVE',
    'INSTITUTE ACHIEVEMENT',
    'MOU & PARTNERSHIP',
    'HACKATHON & INNOVATION',
    'PLACEMENT DRIVE'
  ];

  const filteredNews = newsList.filter((item) => {
    if (selectedCategory === 'ALL') return true;
    return item.category?.toUpperCase() === selectedCategory.toUpperCase();
  });

  const canManage = ['admin', 'hod', 'faculty'].includes((userRole || '').toLowerCase());

  return (
    <section className="bg-white p-6 sm:p-7 rounded-3xl border border-[#c3d3d9] shadow-xs space-y-6 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c3d3d9]/60 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px] text-red-600">newspaper</span>
            SITCOE Official News & Campus Events
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#071e27] tracking-tight">
            Department News, Conclaves & Campus Events
          </h2>
          <p className="text-xs text-[#454652]">
            Live event feed & official announcements from SITCOE.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {canManage && (
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Publish a new campus event"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Publish New Event</span>
            </button>
          )}

          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestPushPermission}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
              title="Allow Chrome notifications on your desktop"
            >
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              <span>Enable Chrome Alerts</span>
            </button>
          )}

          <a
            href="https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <span>sitcoe.ac.in</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#000666] text-white shadow-xs'
                : 'bg-[#f3faff] text-[#454652] hover:bg-[#e1f0fa] border border-[#c3d3d9]'
            }`}
          >
            {cat === 'ALL' ? 'All News & Events' : cat}
          </button>
        ))}
      </div>

      {/* Photo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNews.map((news) => (
          <div
            key={news.id}
            onClick={() => setSelectedArticle(news)}
            className="group bg-white rounded-2xl border border-[#c3d3d9] overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between relative"
          >
            {/* Image Container with Zoom Effect */}
            <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
              <img
                src={news.imageUrl || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'}
                alt={news.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e: any) => {
                  e.target.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80';
                }}
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 bg-black/75 backdrop-blur-xs text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider">
                  {news.category}
                </span>
              </div>
              <div className="absolute bottom-3 right-3">
                <span className="px-2.5 py-0.5 bg-white/95 backdrop-blur-xs text-[#071e27] rounded-md text-[10px] font-bold shadow-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-blue-700">calendar_today</span>
                  {news.date}
                </span>
              </div>

              {/* Admin/Faculty Delete Quick Button */}
              {canManage && (
                <button
                  onClick={(e) => handleDeleteEvent(e, news.id)}
                  className="absolute top-3 right-3 p-1.5 bg-red-600/80 hover:bg-red-700 text-white rounded-lg backdrop-blur-xs transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete event record"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm text-[#071e27] group-hover:text-[#000666] transition-colors leading-snug line-clamp-2">
                  {news.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {news.description}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#000666] font-bold">
                <span className="flex items-center gap-1 text-gray-500 font-medium">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {news.location ? (news.location.length > 22 ? news.location.substring(0, 22) + '...' : news.location) : 'SITCOE Campus'}
                </span>
                <span className="group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  View Details <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Publish New Event */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <span className="material-symbols-outlined text-2xl">campaign</span>
                <h3 className="text-lg font-bold text-[#071e27]">Publish New Campus Event</h3>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handlePublishEvent} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Level Hackathon 2026 / Expert AI Workshop"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#000666] outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#000666] outline-none text-xs bg-white"
                  >
                    <option value="HACKATHON & INNOVATION">HACKATHON & INNOVATION</option>
                    <option value="TECHNICAL SYMPOSIUM">TECHNICAL SYMPOSIUM</option>
                    <option value="CAMPUS & SOCIAL INITIATIVE">CAMPUS & SOCIAL INITIATIVE</option>
                    <option value="INSTITUTE ACHIEVEMENT">INSTITUTE ACHIEVEMENT</option>
                    <option value="MOU & PARTNERSHIP">MOU & PARTNERSHIP</option>
                    <option value="PLACEMENT DRIVE">PLACEMENT DRIVE</option>
                    <option value="WORKSHOP & CONCLAVE">WORKSHOP & CONCLAVE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Event Date</label>
                  <input
                    type="text"
                    placeholder="e.g. August 28, 2026"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#000666] outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Venue / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Auditorium & CSE Labs"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#000666] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Organizer</label>
                  <input
                    type="text"
                    placeholder="e.g. Department of CSE / SITCOE NSS"
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#000666] outline-none text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Event Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide comprehensive details, eligibility, schedule, or agenda..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#000666] outline-none text-xs"
                />
              </div>

              {/* Local File Selector for Event Poster / Image */}
              <div className="space-y-2">
                <label className="font-bold text-gray-700 flex items-center justify-between">
                  <span>Upload Poster / Event Photo from File</span>
                  {eventForm.imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setEventForm({ ...eventForm, imageUrl: '' });
                        setFileName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-600 hover:text-red-800 text-[11px] font-bold inline-flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-[13px]">delete</span>
                      Remove Image
                    </button>
                  )}
                </label>

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="hidden"
                />

                {/* File Dropzone / Click Box */}
                {!eventForm.imageUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 hover:border-[#000666] bg-gray-50 hover:bg-blue-50/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-600 group-hover:text-[#000666] group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#071e27] text-xs">
                        Click to choose event image from your computer
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Supports PNG, JPG, JPEG, WEBP (Max 8MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-slate-950 flex flex-col items-center">
                    <img
                      src={eventForm.imageUrl}
                      alt="Event Preview"
                      className="h-44 w-full object-contain bg-slate-900"
                    />
                    <div className="w-full bg-slate-900/90 backdrop-blur-xs px-3 py-2 flex items-center justify-between text-white text-[11px]">
                      <span className="truncate max-w-[280px] font-medium text-gray-200 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-emerald-400">check_circle</span>
                        {fileName || 'Custom Selected Image'}
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-[10px] transition-colors"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPublishModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all inline-flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Publish & Broadcast Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Full Article & Photo Story */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-200 font-sans my-6">
            {/* Modal Image */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
              <img
                src={selectedArticle.imageUrl || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'}
                alt={selectedArticle.title}
                className="w-full h-full object-contain bg-slate-950"
                onError={(e: any) => {
                  e.target.src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80';
                }}
              />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 backdrop-blur-xs transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1 bg-[#000666] text-white rounded-lg text-xs font-bold uppercase tracking-wider">
                  {selectedArticle.category}
                </span>
              </div>
            </div>

            {/* Modal Details */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-blue-700">calendar_month</span>
                    {selectedArticle.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-blue-700">location_on</span>
                    {selectedArticle.location || 'SITCOE Campus'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#071e27] leading-tight">
                  {selectedArticle.title}
                </h3>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                {selectedArticle.description}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-[11px] text-gray-500">
                  Organized by: <strong>{selectedArticle.organizer || 'SITCOE & Department of CSE'}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedArticle.sourceUrl || 'https://www.sitcoe.ac.in/ptbtypes_of_news_events/event/'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#000666] text-white font-bold text-xs rounded-xl hover:bg-blue-900 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>View on SITCOE Portal</span>
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
