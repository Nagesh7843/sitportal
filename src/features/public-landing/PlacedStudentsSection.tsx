import React, { useState, useEffect, useRef } from 'react';
import { PlacedStudentAchievement } from '@/types/placement';
import { apiService } from '@/services/api';
import { CompanyLogoBadge } from '@/components/common/CompanyLogoBadge';

interface PlacedStudentsSectionProps {
  userRole?: string;
}

export const PlacedStudentsSection: React.FC<PlacedStudentsSectionProps> = ({ userRole = 'public' }) => {
  const canManage = ['admin', 'hod'].includes(userRole?.toLowerCase());

  const [achievers, setAchievers] = useState<PlacedStudentAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [isPaused, setIsPaused] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Edit / Add modal state
  const [editingAchiever, setEditingAchiever] = useState<PlacedStudentAchievement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    studentName: '',
    prn: '',
    division: 'A',
    photoUrl: '',
    companyName: '',
    companyLogoUrl: '',
    role: '',
    packageLpa: '',
    batchYear: '2025-2026',
    bannerImageUrl: ''
  });

  const photoFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
  const marqueeRef = useRef<HTMLDivElement | null>(null);

  const loadAchievers = async () => {
    try {
      setLoading(true);
      const data = await apiService.fetchPlacedAchievers();
      setAchievers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load placed achievers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievers();
  }, []);

  // Filtered list
  const filteredAchievers = achievers.filter((a) => {
    if (selectedBatch === 'ALL') return true;
    return a.batchYear === selectedBatch;
  });

  // Unique batches for filter tabs
  const batches = Array.from(new Set(achievers.map((a) => a.batchYear).filter(Boolean))) as string[];

  // 🟢 Automated Smooth Sliding Window (Auto-Scroll Ticker)
  useEffect(() => {
    if (viewMode !== 'carousel' || isPaused || filteredAchievers.length <= 1) return;

    const interval = setInterval(() => {
      if (marqueeRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = marqueeRef.current;
        const maxScroll = scrollWidth - clientWidth;
        if (scrollLeft >= maxScroll - 10) {
          marqueeRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          marqueeRef.current.scrollBy({ left: 340, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [viewMode, isPaused, filteredAchievers.length]);

  // Horizontal scroll step handlers
  const scrollLeft = () => {
    if (marqueeRef.current) {
      marqueeRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (marqueeRef.current) {
      marqueeRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  // Image upload handler
  const handlePhotoUpload = (file: File | null, isBanner = false) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (isBanner) {
        setEditForm((prev) => ({ ...prev, bannerImageUrl: reader.result as string }));
      } else {
        setEditForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Edit Modal
  const handleOpenEdit = (ach: PlacedStudentAchievement) => {
    setEditingAchiever(ach);
    setEditForm({
      studentName: ach.studentName || '',
      prn: ach.prn || '',
      division: ach.division || 'A',
      photoUrl: ach.photoUrl || '',
      companyName: ach.companyName || '',
      companyLogoUrl: ach.companyLogoUrl || '',
      role: ach.role || '',
      packageLpa: ach.packageLpa || '',
      batchYear: ach.batchYear || '2025-2026',
      bannerImageUrl: ach.bannerImageUrl || ''
    });
    setShowEditModal(true);
  };

  const handleOpenAddNew = () => {
    setEditingAchiever(null);
    setEditForm({
      studentName: '',
      prn: '',
      division: 'A',
      photoUrl: '',
      companyName: '',
      companyLogoUrl: '',
      role: 'Software Development Engineer',
      packageLpa: '₹9.50 LPA',
      batchYear: '2025-2026',
      bannerImageUrl: ''
    });
    setShowEditModal(true);
  };

  const handleSaveAchiever = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.studentName.trim() || !editForm.companyName.trim()) {
      alert('Student Name and Company Name are required.');
      return;
    }

    try {
      if (editingAchiever && editingAchiever.id) {
        await apiService.updatePlacedAchiever(editingAchiever.id, editForm);
      } else {
        await apiService.createPlacedAchiever(editForm);
      }
      setShowEditModal(false);
      loadAchievers();
    } catch (err: any) {
      alert(err.message || 'Failed to save student achiever.');
    }
  };

  const handleDeleteAchiever = async (id: number | string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove placed student: ${name}?`)) return;
    try {
      await apiService.deletePlacedAchiever(id);
      loadAchievers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete placed student.');
    }
  };

  return (
    <section className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-4 shadow-xs font-sans">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">military_tech</span>
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Placed Students & Star Achievers
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Success Gallery
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Showcase featuring placed students, high-package recruitment offers, and company milestones.
          </p>
        </div>

        {/* Controls & Management Bar (Only Visible to Admin / HOD) */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Batch Year Filter */}
            {batches.length > 0 && (
              <div className="flex items-center bg-white border border-gray-300 rounded-xl p-1 shadow-2xs">
                <button
                  onClick={() => setSelectedBatch('ALL')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    selectedBatch === 'ALL' ? 'bg-[#000666] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All Batches ({achievers.length})
                </button>
                {batches.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBatch(b)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      selectedBatch === b ? 'bg-[#000666] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-gray-300 rounded-xl p-1 shadow-2xs">
              <button
                onClick={() => setViewMode('carousel')}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
                  viewMode === 'carousel' ? 'bg-blue-100 text-[#000666]' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Auto Sliding Window"
              >
                <span className="material-symbols-outlined text-[16px]">view_carousel</span>
                <span className="hidden sm:inline">Auto Slider</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold ${
                  viewMode === 'grid' ? 'bg-blue-100 text-[#000666]' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Grid View"
              >
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span className="hidden sm:inline">Grid</span>
              </button>
            </div>

            {/* Left / Right Carousel Controls */}
            {viewMode === 'carousel' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={scrollLeft}
                  className="w-8 h-8 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center justify-center shadow-2xs transition-colors cursor-pointer active:scale-95"
                  title="Previous Slide"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  onClick={scrollRight}
                  className="w-8 h-8 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center justify-center shadow-2xs transition-colors cursor-pointer active:scale-95"
                  title="Next Slide"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`px-2.5 h-8 rounded-xl border flex items-center gap-1 text-xs font-bold shadow-2xs transition-colors cursor-pointer ${
                    isPaused ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                  title={isPaused ? 'Click to Resume Auto-Sliding' : 'Click to Pause Auto-Sliding'}
                >
                  <span className="material-symbols-outlined text-[15px]">{isPaused ? 'play_arrow' : 'pause'}</span>
                  <span className="text-[11px]">{isPaused ? 'Paused' : 'Auto'}</span>
                </button>
              </div>
            )}

            {/* Admin Add Button */}
            <button
              onClick={handleOpenAddNew}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Add Placed Student</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 text-center text-xs text-gray-500 flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl animate-spin text-[#000666]">sync</span>
          <span>Loading student achievers...</span>
        </div>
      ) : filteredAchievers.length === 0 ? (
        <div className="py-8 px-4 text-center bg-slate-50/50 rounded-xl border border-slate-200 space-y-2">
          <div className="w-10 h-10 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">military_tech</span>
          </div>
          <h4 className="text-xs font-bold text-slate-800">No Placed Student Achievers Added Yet</h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Placed student profiles, company offers, and package announcements will appear here.
          </p>
          {canManage && (
            <button
              onClick={handleOpenAddNew}
              className="mt-1 px-3.5 py-1.5 bg-[#000666] hover:bg-[#002171] text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Add Placed Student</span>
            </button>
          )}
        </div>
      ) : viewMode === 'carousel' ? (
        /* 🟢 Premium Auto-Sliding Window with Large Main Image Banner */
        <div
          ref={marqueeRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent select-none"
          style={{ scrollBehavior: 'smooth' }}
        >
          {filteredAchievers.map((ach) => {
            const mainDisplayImage = ach.bannerImageUrl || ach.photoUrl;
            return (
              <div
                key={ach.id}
                className="snap-start shrink-0 w-80 sm:w-88 bg-white rounded-3xl border border-gray-200 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative"
              >
                {/* 🌟 100% CLEAN HERO IMAGE (NO OVERLAY TEXT / NO BADGES BLOCKING PHOTO) */}
                <div className="relative w-full h-56 sm:h-64 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-gray-100">
                  {mainDisplayImage ? (
                    <img
                      src={mainDisplayImage}
                      alt={ach.studentName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                      onClick={() => setLightboxImage(mainDisplayImage)}
                    />
                  ) : (
                    /* Clean stylized banner if no image is uploaded */
                    <div className="w-full h-full bg-gradient-to-br from-[#000666] via-blue-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center text-white relative">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-2xl uppercase tracking-wider mb-1 shadow-lg">
                        {ach.studentName.slice(0, 2)}
                      </div>
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                        ⭐ Placed Achiever
                      </span>
                    </div>
                  )}

                  {/* Subtle Zoom Indicator on Hover Only */}
                  {mainDisplayImage && (
                    <button
                      type="button"
                      onClick={() => setLightboxImage(mainDisplayImage)}
                      className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs shadow-md cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Enlarge Image"
                    >
                      <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                      <span>View</span>
                    </button>
                  )}
                </div>

                {/* 📋 DETAILS SECTION BELOW THE PHOTO */}
                <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between bg-white">
                  {/* Student Name & PRN */}
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-[#071e27] truncate group-hover:text-[#000666] transition-colors">
                        {ach.studentName}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold truncate mt-0.5">
                        {ach.prn ? `PRN: ${ach.prn}` : 'BE CSE'} {ach.division ? `• Div ${ach.division}` : ''}
                      </p>
                    </div>
                    {ach.batchYear && (
                      <span className="text-[10px] font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                        {ach.batchYear}
                      </span>
                    )}
                  </div>

                  {/* Recruiter & CTC Package */}
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-2xl border border-gray-200/80">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <CompanyLogoBadge
                        name={ach.companyName}
                        logoUrl={ach.companyLogoUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1 truncate">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Recruiter</span>
                        <span className="text-xs font-black text-slate-900 truncate block">{ach.companyName}</span>
                      </div>
                    </div>

                    {ach.packageLpa && (
                      <div className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1 shrink-0">
                        <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                        <span>{ach.packageLpa}</span>
                      </div>
                    )}
                  </div>

                  {/* Role / Job Title */}
                  {ach.role && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold px-1">
                      <span className="material-symbols-outlined text-blue-700 text-[16px]">work</span>
                      <span className="truncate">{ach.role}</span>
                    </div>
                  )}

                  {/* Action Controls for Admins */}
                  {canManage && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(ach)}
                        className="px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAchiever(ach.id!, ach.studentName)}
                        className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Full Grid Gallery View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredAchievers.map((ach) => {
            const mainDisplayImage = ach.bannerImageUrl || ach.photoUrl;
            return (
              <div
                key={ach.id}
                className="bg-white rounded-3xl border border-gray-200 hover:border-amber-400 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group"
              >
                {/* 100% Clean Image */}
                <div className="relative w-full h-48 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-gray-100">
                  {mainDisplayImage ? (
                    <img
                      src={mainDisplayImage}
                      alt={ach.studentName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setLightboxImage(mainDisplayImage)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#000666] to-blue-800 flex items-center justify-center text-white font-black text-2xl uppercase">
                      {ach.studentName.slice(0, 2)}
                    </div>
                  )}
                </div>

                <div className="p-3.5 space-y-2.5 bg-white flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-gray-900 truncate">{ach.studentName}</h4>
                    <p className="text-[11px] text-gray-500 font-semibold truncate">
                      {ach.prn ? `PRN: ${ach.prn}` : 'BE CSE'} {ach.division ? `• Div ${ach.division}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <CompanyLogoBadge name={ach.companyName} logoUrl={ach.companyLogoUrl} size="sm" />
                      <span className="truncate font-bold text-gray-800">{ach.companyName}</span>
                    </div>
                    {ach.packageLpa && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-black rounded-md shadow-xs shrink-0">
                        {ach.packageLpa}
                      </span>
                    )}
                  </div>

                  {canManage && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(ach)}
                        className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50 text-xs font-bold"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAchiever(ach.id!, ach.studentName)}
                        className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50 text-xs font-bold"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add / Edit Achiever Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl border border-gray-200 font-sans space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600 text-2xl">workspace_premium</span>
                <h3 className="text-base font-bold text-gray-900">
                  {editingAchiever ? 'Edit Placed Student & Banner' : 'Add Placed Student & Achievement Banner'}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveAchiever} className="space-y-4">
              {/* 1. Main Banner Image Upload Section */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-black text-blue-900 uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-blue-700">image</span>
                    Main Achievement Poster / Banner Image (Featured Content)
                  </label>
                  {editForm.bannerImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, bannerImageUrl: '' })}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Remove Banner
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={bannerFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null, true)}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
                  >
                    Upload Banner Poster
                  </button>
                  <input
                    type="text"
                    placeholder="Or paste Direct Banner Image URL (https://...)"
                    value={editForm.bannerImageUrl}
                    onChange={(e) => setEditForm({ ...editForm, bannerImageUrl: e.target.value })}
                    className="flex-1 p-2 bg-white border border-blue-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {editForm.bannerImageUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-blue-300 max-h-36">
                    <img
                      src={editForm.bannerImageUrl}
                      alt="Banner Preview"
                      className="w-full h-36 object-cover"
                    />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded-md">
                      ✓ Banner Attached
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Student Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Sharma"
                    value={editForm.studentName}
                    onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">PRN / Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 2023CSE014"
                    value={editForm.prn}
                    onChange={(e) => setEditForm({ ...editForm, prn: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Division</label>
                  <select
                    value={editForm.division}
                    onChange={(e) => setEditForm({ ...editForm, division: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666] bg-white"
                  >
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                    <option value="D">Division D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Hiring Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCS, Infosys, Persistent"
                    value={editForm.companyName}
                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Package CTC</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹9.50 LPA"
                    value={editForm.packageLpa}
                    onChange={(e) => setEditForm({ ...editForm, packageLpa: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Designation / Role</label>
                  <input
                    type="text"
                    placeholder="e.g. SDE-1 / Cloud Engineer"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Batch Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2025-2026"
                    value={editForm.batchYear}
                    onChange={(e) => setEditForm({ ...editForm, batchYear: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                  />
                </div>
              </div>

              {/* 3. Student Profile Photo Upload */}
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-blue-700">account_circle</span>
                    Student Profile Photo
                  </label>
                  {editForm.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, photoUrl: '' })}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={photoFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null, false)}
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-xl border border-gray-300 shrink-0 cursor-pointer"
                  >
                    Upload Photo
                  </button>
                  <input
                    type="text"
                    placeholder="Or paste Photo URL (https://...)"
                    value={editForm.photoUrl}
                    onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                    className="flex-1 p-2 bg-white border border-gray-300 rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#000666]"
                  />
                </div>

                {editForm.photoUrl && (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={editForm.photoUrl}
                      alt="Student Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-amber-300"
                    />
                    <span className="text-[11px] text-emerald-700 font-bold">✓ Profile Photo Attached</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#000666] hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingAchiever ? 'Update Achiever' : 'Save Achiever'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 flex items-center gap-1 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">close</span> Close
            </button>
            <img
              src={lightboxImage}
              alt="Achiever Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </section>
  );
};
