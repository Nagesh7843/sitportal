import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '@/services/api';
import { CompanyLogoBadge } from '@/components/common/CompanyLogoBadge';
import { resolveCompanyDomain, getAutoCompanyLogoUrl } from '@/utils/companyLogo';
import { PlacementRecruiter, PlacementDrive, PlacementStat } from '@/types';

interface PlacementHubSectionProps {
  onExploreNotices?: () => void;
  userRole?: string;
}

export const PlacementHubSection: React.FC<PlacementHubSectionProps> = ({ onExploreNotices, userRole = 'public' }) => {
  const [stats, setStats] = useState<PlacementStat | null>(null);
  const [recruiters, setRecruiters] = useState<PlacementRecruiter[]>([]);
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Admin Modal States
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'recruiters' | 'drives'>('metrics');
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const statsFileInputRef = useRef<HTMLInputElement | null>(null);
  const driveFileInputRef = useRef<HTMLInputElement | null>(null);
  const noticeFileInputRef = useRef<HTMLInputElement | null>(null);

  // Forms
  const [statsForm, setStatsForm] = useState({
    highestPackage: '',
    averagePackage: '',
    placementRatio: '',
    totalOffers: '',
    batchYear: '',
    bannerImageUrl: '',
    description: ''
  });

  const [editingRecruiterId, setEditingRecruiterId] = useState<number | string | null>(null);
  const [editingDriveId, setEditingDriveId] = useState<number | string | null>(null);

  const [recruiterForm, setRecruiterForm] = useState({
    name: '',
    packageBand: '',
    roleTag: '',
    websiteUrl: '',
    logoUrl: '',
    description: ''
  });
  const [showAdvancedRecruiterFields, setShowAdvancedRecruiterFields] = useState<boolean>(false);

  const [driveForm, setDriveForm] = useState({
    companyName: '',
    role: '',
    packageLpa: '',
    driveDate: '',
    eligibility: '',
    location: '',
    applyDeadline: '',
    status: 'UPCOMING',
    logoUrl: '',
    bannerImageUrl: '',
    description: ''
  });

  // Notice Generator State
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);
  const [noticeSubmitting, setNoticeSubmitting] = useState<boolean>(false);
  const [noticeSuccessMsg, setNoticeSuccessMsg] = useState<string | null>(null);
  const [noticeForm, setNoticeForm] = useState<{
    companyName: string;
    role: string;
    packageLpa: string;
    batchYear: string;
    congratulationsMessage: string;
    bannerImageUrl: string;
    placedStudents: Array<{ name: string; prn: string; division: string; packageLpa: string; photoUrl?: string }>;
  }>({
    companyName: '',
    role: 'Software Engineer',
    packageLpa: '₹8.50 LPA',
    batchYear: '2025-2026',
    congratulationsMessage: 'Heartiest congratulations to our talented student achievers! May your commitment and technological passion pave the way for a stellar career.',
    bannerImageUrl: '',
    placedStudents: [
      { name: '', prn: '', division: 'A', packageLpa: '', photoUrl: '' }
    ]
  });

  const canManage = ['admin', 'hod'].includes(userRole);

  useEffect(() => {
    loadPlacementData();
  }, []);

  const loadPlacementData = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.fetchPlacementSummary();
      setStats(data.stats);
      setRecruiters(data.recruiters || []);
      setDrives(data.drives || []);

      if (data.stats) {
        setStatsForm({
          highestPackage: data.stats.highestPackage || '',
          averagePackage: data.stats.averagePackage || '',
          placementRatio: data.stats.placementRatio || '',
          totalOffers: data.stats.totalOffers || '',
          batchYear: data.stats.batchYear || '',
          bannerImageUrl: data.stats.bannerImageUrl || '',
          description: data.stats.description || ''
        });
      }
    } catch (err) {
      console.warn('Failed to load placement data from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageFileChange = (file: File | null, target: 'stats' | 'drive' | 'notice') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      alert('Image size exceeds 8MB limit. Please choose a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const base64 = reader.result as string;
        if (target === 'stats') {
          setStatsForm((prev) => ({ ...prev, bannerImageUrl: base64 }));
        } else if (target === 'drive') {
          setDriveForm((prev) => ({ ...prev, bannerImageUrl: base64 }));
        } else if (target === 'notice') {
          setNoticeForm((prev) => ({ ...prev, bannerImageUrl: base64 }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await apiService.updatePlacementStats(statsForm);
      setStats(saved);
      alert('Placement metrics, overview description, and banner image updated in database!');
    } catch (err: any) {
      alert(err.message || 'Failed to update stats.');
    }
  };

  const handleSaveRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiterForm.name.trim()) return;
    try {
      const autoLogoUrl = recruiterForm.logoUrl.trim() || getAutoCompanyLogoUrl(recruiterForm.name, recruiterForm.websiteUrl);
      const payload = {
        ...recruiterForm,
        logoUrl: autoLogoUrl,
      };

      if (editingRecruiterId) {
        const updated = await apiService.updatePlacementRecruiter(editingRecruiterId, payload);
        setRecruiters((prev) => prev.map((r) => (r.id === editingRecruiterId ? updated : r)));
        alert(`Recruiting partner "${updated.name}" updated successfully!`);
        setEditingRecruiterId(null);
      } else {
        const saved = await apiService.addPlacementRecruiter(payload);
        setRecruiters((prev) => [...prev, saved]);
        alert(`Recruiting partner "${saved.name}" added with auto-fetched web logo and broadcast notification sent!`);
      }
      setRecruiterForm({ name: '', packageBand: '', roleTag: '', websiteUrl: '', logoUrl: '', description: '' });
      setShowAdvancedRecruiterFields(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save recruiter.');
    }
  };

  const handleStartEditRecruiter = (rec: PlacementRecruiter) => {
    setEditingRecruiterId(rec.id);
    setRecruiterForm({
      name: rec.name || '',
      packageBand: rec.packageBand || '',
      roleTag: rec.roleTag || '',
      websiteUrl: rec.websiteUrl || '',
      logoUrl: rec.logoUrl || '',
      description: rec.description || ''
    });
    setShowAdvancedRecruiterFields(true);
  };

  const handleCancelEditRecruiter = () => {
    setEditingRecruiterId(null);
    setRecruiterForm({ name: '', packageBand: '', roleTag: '', websiteUrl: '', logoUrl: '', description: '' });
    setShowAdvancedRecruiterFields(false);
  };

  const handleDeleteRecruiter = async (id: number | string) => {
    if (!window.confirm('Delete this recruiting partner record?')) return;
    try {
      await apiService.deletePlacementRecruiter(id);
      setRecruiters((prev) => prev.filter((r) => r.id !== id));
      if (editingRecruiterId === id) handleCancelEditRecruiter();
    } catch (err: any) {
      alert(err.message || 'Failed to delete recruiter.');
    }
  };

  const handleSaveDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveForm.companyName.trim() || !driveForm.role.trim()) return;
    try {
      const autoLogoUrl = driveForm.logoUrl.trim() || getAutoCompanyLogoUrl(driveForm.companyName);
      const payload = {
        ...driveForm,
        logoUrl: autoLogoUrl,
      };

      if (editingDriveId) {
        const updated = await apiService.updatePlacementDrive(editingDriveId, payload);
        setDrives((prev) => prev.map((d) => (d.id === editingDriveId ? updated : d)));
        alert(`💼 Placement Drive for "${updated.companyName}" updated successfully in database!`);
        setEditingDriveId(null);
      } else {
        const saved = await apiService.addPlacementDrive(payload);
        setDrives((prev) => [saved, ...prev]);
        alert(`💼 New Placement Drive for "${saved.companyName}" scheduled with ad poster banner! Notification dispatched to all subscribers.`);
      }
      setDriveForm({
        companyName: '',
        role: '',
        packageLpa: '',
        driveDate: '',
        eligibility: '',
        location: '',
        applyDeadline: '',
        status: 'UPCOMING',
        logoUrl: '',
        bannerImageUrl: '',
        description: ''
      });
    } catch (err: any) {
      alert(err.message || 'Failed to save drive.');
    }
  };

  const handleStartEditDrive = (drive: PlacementDrive) => {
    setEditingDriveId(drive.id);
    setDriveForm({
      companyName: drive.companyName || '',
      role: drive.role || '',
      packageLpa: drive.packageLpa || '',
      driveDate: drive.driveDate || '',
      eligibility: drive.eligibility || '',
      location: drive.location || '',
      applyDeadline: drive.applyDeadline || '',
      status: drive.status || 'UPCOMING',
      logoUrl: drive.logoUrl || '',
      bannerImageUrl: drive.bannerImageUrl || '',
      description: drive.description || ''
    });
  };

  const handleCancelEditDrive = () => {
    setEditingDriveId(null);
    setDriveForm({
      companyName: '',
      role: '',
      packageLpa: '',
      driveDate: '',
      eligibility: '',
      location: '',
      applyDeadline: '',
      status: 'UPCOMING',
      logoUrl: '',
      bannerImageUrl: '',
      description: ''
    });
  };

  const handleDeleteDrive = async (id: number | string) => {
    if (!window.confirm('Delete this placement drive record from database?')) return;
    try {
      await apiService.deletePlacementDrive(id);
      setDrives((prev) => prev.filter((d) => d.id !== id));
      if (editingDriveId === id) handleCancelEditDrive();
    } catch (err: any) {
      alert(err.message || 'Failed to delete drive.');
    }
  };

  // Placed Students Management for Notice Generator
  const handleAddStudentRow = () => {
    setNoticeForm((prev) => ({
      ...prev,
      placedStudents: [...prev.placedStudents, { name: '', prn: '', division: 'A', packageLpa: '', photoUrl: '' }]
    }));
  };

  const handleRemoveStudentRow = (idx: number) => {
    if (noticeForm.placedStudents.length === 1) return;
    setNoticeForm((prev) => ({
      ...prev,
      placedStudents: prev.placedStudents.filter((_, i) => i !== idx)
    }));
  };

  const handleStudentChange = (idx: number, field: string, value: string) => {
    setNoticeForm((prev) => {
      const updated = [...prev.placedStudents];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, placedStudents: updated };
    });
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.companyName.trim()) {
      alert('Please specify the Company Name.');
      return;
    }
    const validStudents = noticeForm.placedStudents.filter((s) => s.name.trim().length > 0);
    setNoticeSubmitting(true);
    try {
      const autoLogo = getAutoCompanyLogoUrl(noticeForm.companyName.trim());
      await apiService.generatePlacementNotice({
        companyName: noticeForm.companyName.trim(),
        role: noticeForm.role.trim(),
        packageLpa: noticeForm.packageLpa.trim(),
        batchYear: noticeForm.batchYear.trim(),
        congratulationsMessage: noticeForm.congratulationsMessage.trim(),
        bannerImageUrl: noticeForm.bannerImageUrl.trim(),
        companyLogoUrl: autoLogo,
        placedStudents: validStudents
      });
      setNoticeSuccessMsg(`🎉 Official Placement Announcement for "${noticeForm.companyName}" published! Placed students added to showcase and desktop notification broadcast to all subscribers!`);
      setTimeout(() => {
        setNoticeSuccessMsg(null);
        setShowNoticeModal(false);
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to generate placement notice.');
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete ALL placement records from the database?')) return;
    try {
      await apiService.resetPlacementData();
      setStats(null);
      setRecruiters([]);
      setDrives([]);
      setStatsForm({
        highestPackage: '',
        averagePackage: '',
        placementRatio: '',
        totalOffers: '',
        batchYear: '',
        bannerImageUrl: '',
        description: ''
      });
      alert('All placement records cleared.');
    } catch (err: any) {
      alert(err.message || 'Failed to reset.');
    }
  };

  return (
    <section className="bg-gradient-to-br from-white via-[#f3f9ff] to-[#e8f3ff] p-6 sm:p-7 rounded-3xl border border-[#c3d3d9] shadow-xs space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c3d3d9]/60 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#000666]/10 text-[#000666] rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            Training & Placement (T&P) Hub
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#071e27] tracking-tight">
            Department Placement & Career Milestones
          </h2>
          <p className="text-xs text-[#454652] max-w-2xl">
            Official department recruitment statistics, upcoming drives, and prominent hiring partners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {canManage && (
            <button
              onClick={() => setShowNoticeModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
              title="Create Placement Announcement / Achievers Notice"
            >
              <span className="material-symbols-outlined text-[16px]">celebration</span>
              <span>Generate Placement Notice</span>
            </button>
          )}

          {canManage && (
            <button
              onClick={() => setShowAdminModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
              <span>Manage Placement Data</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Highlights Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#c3d3d9] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#454652]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Highest Package</span>
            <span className="material-symbols-outlined text-emerald-600 text-lg">workspace_premium</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">
            {stats?.highestPackage || <span className="text-gray-400 text-base font-normal">Not Configured</span>}
          </p>
          <span className="text-[10px] text-gray-500 font-medium">
            {stats?.batchYear ? `Batch ${stats.batchYear}` : 'Updated by Placement Cell'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#c3d3d9] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#454652]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Average Package</span>
            <span className="material-symbols-outlined text-blue-600 text-lg">stacked_line_chart</span>
          </div>
          <p className="text-2xl font-black text-[#000666]">
            {stats?.averagePackage || <span className="text-gray-400 text-base font-normal">Not Configured</span>}
          </p>
          <span className="text-[10px] text-gray-500 font-medium">Department Average CTC</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#c3d3d9] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#454652]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Placement Ratio</span>
            <span className="material-symbols-outlined text-indigo-600 text-lg">verified</span>
          </div>
          <p className="text-2xl font-black text-indigo-800">
            {stats?.placementRatio || <span className="text-gray-400 text-base font-normal">Not Configured</span>}
          </p>
          <span className="text-[10px] text-gray-500 font-medium">Eligible Candidates Placed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#c3d3d9] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#454652]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Job Offers</span>
            <span className="material-symbols-outlined text-amber-600 text-lg">military_tech</span>
          </div>
          <p className="text-2xl font-black text-amber-700">
            {stats?.totalOffers || <span className="text-gray-400 text-base font-normal">Not Configured</span>}
          </p>
          <span className="text-[10px] text-gray-500 font-medium">Total Recruitment Offers</span>
        </div>
      </div>

      {/* Placement Highlights & Achievers Banner Image (if configured) */}
      {stats?.bannerImageUrl && (
        <div className="relative overflow-hidden rounded-2xl border border-[#c3d3d9] bg-white shadow-xs group">
          <img
            src={stats.bannerImageUrl}
            alt="Department Placement Highlights & Achievers Banner"
            className="w-full max-h-72 object-cover object-center cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
            onClick={() => setLightboxImage(stats.bannerImageUrl || null)}
          />
          <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-lg pointer-events-none flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">zoom_in</span> Click to Enlarge
          </div>
        </div>
      )}

      {/* Placement Cell Overview & Highlights Description (if configured) */}
      {stats?.description && (
        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs flex items-start gap-3">
          <span className="material-symbols-outlined text-blue-700 text-xl mt-0.5 shrink-0">info</span>
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="text-xs font-bold text-[#071e27] uppercase tracking-wider">Placement Cell Overview & Highlights</h4>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{stats.description}</p>
          </div>
        </div>
      )}

      {/* Prominent Recruiting Companies */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#071e27] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-blue-700 text-[16px]">domain</span>
            Prominent Recruiting Partners & Salary Bands
          </h3>
          <span className="text-[11px] text-gray-500 font-medium">
            {recruiters.length > 0 ? `${recruiters.length} Companies Configured` : 'Managed via Admin'}
          </span>
        </div>

        {recruiters.length === 0 ? (
          <div className="bg-white/80 p-5 rounded-2xl border border-dashed border-[#c3d3d9] text-center">
            <p className="text-xs text-gray-500">No recruiting partners added yet.</p>
            {canManage && (
              <button
                onClick={() => { setShowAdminModal(true); setActiveTab('recruiters'); }}
                className="mt-2 text-xs font-bold text-[#000666] hover:underline inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span> Add Recruiting Partners
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recruiters.map((rec) => (
              <div
                key={rec.id}
                className="group bg-white p-3.5 rounded-2xl border border-[#c3d3d9] hover:border-[#000666] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 mb-2 min-w-0 flex-1">
                    <CompanyLogoBadge
                      name={rec.name}
                      logoUrl={rec.logoUrl}
                      websiteUrl={rec.websiteUrl}
                      size="md"
                      className="border-gray-200 group-hover:border-blue-300 transition-colors"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-xs text-[#071e27] truncate group-hover:text-[#000666] transition-colors" title={rec.name}>
                        {rec.name}
                      </p>
                      {rec.roleTag && (
                        <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5" title={rec.roleTag}>
                          {rec.roleTag}
                        </p>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditRecruiter(rec);
                        setActiveTab('recruiters');
                        setShowAdminModal(true);
                      }}
                      className="text-gray-400 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors"
                      title="Edit Partner"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                    </button>
                  )}
                </div>
                {rec.packageBand && (
                  <div className="mt-1 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Package</span>
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {rec.packageBand}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active & Upcoming Placement Drives */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#071e27] uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-emerald-600 text-[16px]">event_available</span>
            Upcoming On-Campus & Virtual Placement Drives
          </h3>
          <span className="text-[11px] text-blue-700 font-semibold">
            {drives.length > 0 ? `${drives.length} Active Drives` : 'Live Schedule'}
          </span>
        </div>

        {drives.length === 0 ? (
          <div className="bg-white/80 p-6 rounded-2xl border border-dashed border-[#c3d3d9] text-center space-y-1">
            <span className="material-symbols-outlined text-gray-400 text-2xl">event_busy</span>
            <p className="text-xs text-gray-600 font-medium">No placement drives currently active in the database.</p>
            <p className="text-[11px] text-gray-400">Upcoming drive announcements and eligibility criteria will appear here.</p>
            {canManage && (
              <button
                onClick={() => { setShowAdminModal(true); setActiveTab('drives'); }}
                className="mt-2 px-3 py-1.5 bg-[#000666] text-white text-xs font-bold rounded-lg hover:bg-blue-900"
              >
                + Schedule Placement Drive
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {drives.map((drive) => (
              <div
                key={drive.id}
                className="group bg-white p-4 rounded-2xl border border-[#c3d3d9] hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  {drive.bannerImageUrl && (
                    <div
                      className="relative overflow-hidden rounded-xl h-32 bg-gray-100 cursor-pointer mb-2 group/img"
                      onClick={() => setLightboxImage(drive.bannerImageUrl || null)}
                    >
                      <img
                        src={drive.bannerImageUrl}
                        alt={`${drive.companyName} Drive Poster`}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold rounded flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">zoom_in</span> Poster
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <CompanyLogoBadge
                        name={drive.companyName}
                        logoUrl={drive.logoUrl}
                        size="md"
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        {drive.packageLpa && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-extrabold uppercase">
                            {drive.packageLpa}
                          </span>
                        )}
                        <h4 className="font-bold text-sm text-[#071e27] mt-1 truncate" title={drive.companyName}>
                          {drive.companyName}
                        </h4>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-[#000666] rounded text-[10px] font-bold uppercase shrink-0">
                      {drive.status || 'UPCOMING'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-snug">{drive.role}</p>

                  <div className="text-[11px] text-gray-500 space-y-1 pt-1">
                    {drive.driveDate && (
                      <p className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-gray-400">calendar_month</span>
                        <span>Drive Date: <strong>{drive.driveDate}</strong></span>
                      </p>
                    )}
                    {drive.eligibility && (
                      <p className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] text-gray-400">checklist</span>
                        <span>{drive.eligibility}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-red-600 font-semibold">
                    {drive.applyDeadline ? `Deadline: ${drive.applyDeadline}` : ''}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {canManage && (
                      <button
                        onClick={() => {
                          handleStartEditDrive(drive);
                          setActiveTab('drives');
                          setShowAdminModal(true);
                        }}
                        className="px-2.5 py-1.5 text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Edit Drive"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedDrive(drive)}
                      className="px-3 py-1.5 bg-[#f0f4ff] hover:bg-[#d9e2ff] text-[#000666] font-bold text-xs rounded-lg transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Placement Drive Details */}
      {selectedDrive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 font-sans space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-start gap-3">
                <CompanyLogoBadge
                  name={selectedDrive.companyName}
                  logoUrl={selectedDrive.logoUrl}
                  size="lg"
                />
                <div>
                  {selectedDrive.packageLpa && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-extrabold text-[11px]">
                      {selectedDrive.packageLpa}
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-[#071e27] mt-1">{selectedDrive.companyName}</h3>
                  <p className="text-xs text-gray-500">{selectedDrive.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDrive(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Full Advertisement Poster Image if present */}
            {selectedDrive.bannerImageUrl && (
              <div
                className="relative rounded-xl overflow-hidden max-h-60 bg-gray-100 cursor-pointer group"
                onClick={() => setLightboxImage(selectedDrive.bannerImageUrl || null)}
              >
                <img
                  src={selectedDrive.bannerImageUrl}
                  alt={`${selectedDrive.companyName} Poster`}
                  className="w-full max-h-60 object-contain bg-black/5 group-hover:scale-[1.01] transition-transform"
                />
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">zoom_in</span> Click to Enlarge
                </div>
              </div>
            )}

            <div className="space-y-2.5 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p><strong>Recruitment Date:</strong> {selectedDrive.driveDate || 'To be announced'}</p>
              <p><strong>Eligibility Criteria:</strong> {selectedDrive.eligibility || 'BE CSE'}</p>
              <p><strong>Campus Location:</strong> {selectedDrive.location || 'SIT Campus'}</p>
              {selectedDrive.applyDeadline && (
                <p><strong>Application Registration Deadline:</strong> <span className="text-red-700 font-bold">{selectedDrive.applyDeadline}</span></p>
              )}
            </div>

            {/* Detailed Job Description and Selection Process */}
            {selectedDrive.description && (
              <div className="space-y-1.5 p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                <h5 className="text-xs font-bold text-[#000666] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">description</span>
                  Job Description & Selection Process
                </h5>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{selectedDrive.description}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {canManage && (
                <button
                  onClick={() => {
                    const d = selectedDrive;
                    setSelectedDrive(null);
                    handleStartEditDrive(d);
                    setActiveTab('drives');
                    setShowAdminModal(true);
                  }}
                  className="px-4 py-2 bg-blue-700 text-white font-bold text-xs rounded-lg hover:bg-blue-800 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit</span> Edit Drive
                </button>
              )}
              <button
                onClick={() => setSelectedDrive(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Placement Control Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-200 font-sans space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-2xl">tune</span>
                <div>
                  <h3 className="text-lg font-black text-gray-900">Placement Data Control Panel</h3>
                  <p className="text-xs text-gray-500">Inject, update, and manage official placement records in the database</p>
                </div>
              </div>
              <button onClick={() => setShowAdminModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 gap-2">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'metrics'
                    ? 'border-[#000666] text-[#000666]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                1. Placement Metrics
              </button>
              <button
                onClick={() => setActiveTab('recruiters')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'recruiters'
                    ? 'border-[#000666] text-[#000666]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                2. Recruiting Partners ({recruiters.length})
              </button>
              <button
                onClick={() => setActiveTab('drives')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'drives'
                    ? 'border-[#000666] text-[#000666]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                3. Placement Drives ({drives.length})
              </button>
            </div>

            {/* Tab 1: Key Metrics */}
            {activeTab === 'metrics' && (
              <form onSubmit={handleSaveStats} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Highest Package</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹21.0 LPA"
                      value={statsForm.highestPackage}
                      onChange={(e) => setStatsForm({ ...statsForm, highestPackage: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Average Package</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹6.20 LPA"
                      value={statsForm.averagePackage}
                      onChange={(e) => setStatsForm({ ...statsForm, averagePackage: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Placement Ratio</label>
                    <input
                      type="text"
                      placeholder="e.g. 92.4%"
                      value={statsForm.placementRatio}
                      onChange={(e) => setStatsForm({ ...statsForm, placementRatio: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Total Offers Count</label>
                    <input
                      type="text"
                      placeholder="e.g. 140+ Offers"
                      value={statsForm.totalOffers}
                      onChange={(e) => setStatsForm({ ...statsForm, totalOffers: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase">Batch Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2025-2026"
                      value={statsForm.batchYear}
                      onChange={(e) => setStatsForm({ ...statsForm, batchYear: e.target.value })}
                      className="w-full mt-1 p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                      Placement Highlights / Message from T&P Cell (Description)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. In academic year 2025-26, CSE students achieved historic milestones with offers across Tier-1 IT, Product & Core engineering companies..."
                      value={statsForm.description}
                      onChange={(e) => setStatsForm({ ...statsForm, description: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666] resize-none"
                    />
                  </div>

                  {/* Placement Highlights & Achievers Banner Image Upload */}
                  <div className="sm:col-span-2 space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-blue-700 text-[16px]">add_photo_alternate</span>
                        Placement Highlights / Achievers Banner Image (Optional)
                      </label>
                      {statsForm.bannerImageUrl && (
                        <button
                          type="button"
                          onClick={() => setStatsForm({ ...statsForm, bannerImageUrl: '' })}
                          className="text-[11px] text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove Image
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={statsFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileChange(e.target.files?.[0] || null, 'stats')}
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => statsFileInputRef.current?.click()}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 border border-gray-300"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        Upload Image from Device
                      </button>
                      <input
                        type="text"
                        placeholder="Or paste Direct Image URL (e.g. https://.../placement-banner.jpg)"
                        value={statsForm.bannerImageUrl}
                        onChange={(e) => setStatsForm({ ...statsForm, bannerImageUrl: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                      />
                    </div>

                    {statsForm.bannerImageUrl && (
                      <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200 max-h-48 bg-gray-50 flex items-center justify-center">
                        <img
                          src={statsForm.bannerImageUrl}
                          alt="Placement Banner Preview"
                          className="max-h-48 w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#000666] text-white font-bold text-xs rounded-xl hover:bg-blue-900 shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Save Metrics & Banner to Database
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Recruiting Partners */}
            {activeTab === 'recruiters' && (
              <div className="space-y-5">
                <form onSubmit={handleSaveRecruiter} className="bg-gradient-to-br from-gray-50 to-blue-50/40 p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-700 text-[16px]">
                        {editingRecruiterId ? 'edit_note' : 'domain_add'}
                      </span>
                      {editingRecruiterId ? `Edit Recruiting Partner: ${recruiterForm.name || 'Selected'}` : 'Add New Recruiting Partner'}
                    </h4>
                    {editingRecruiterId && (
                      <button
                        type="button"
                        onClick={handleCancelEditRecruiter}
                        className="text-xs font-bold text-gray-500 hover:text-gray-800 px-2 py-0.5 rounded bg-gray-200"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. TCS, PHN Technologies, Google"
                        value={recruiterForm.name}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, name: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Package Band</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹7.5 - 11 LPA"
                        value={recruiterForm.packageBand}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, packageBand: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Role / Domain Tag</label>
                      <input
                        type="text"
                        placeholder="e.g. Product Dev / Cloud"
                        value={recruiterForm.roleTag}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, roleTag: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                        Company Description / Hiring Details (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Leading multinational IT services provider hiring for Software Engineer, Cloud Architect, and Full Stack roles."
                        value={recruiterForm.description}
                        onChange={(e) => setRecruiterForm({ ...recruiterForm, description: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Real-time Live Logo Preview Box */}
                  {recruiterForm.name.trim() && (
                    <div className="p-3 bg-white rounded-xl border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CompanyLogoBadge
                          name={recruiterForm.name}
                          logoUrl={recruiterForm.logoUrl}
                          websiteUrl={recruiterForm.websiteUrl}
                          size="lg"
                          className="border-gray-200"
                        />
                        <div>
                          <p className="text-xs font-black text-[#071e27]">{recruiterForm.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Target Domain: <span className="font-mono text-blue-700 font-bold">{resolveCompanyDomain(recruiterForm.name, recruiterForm.websiteUrl) || 'auto-resolving...'}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAdvancedRecruiterFields(!showAdvancedRecruiterFields)}
                        className="text-[11px] font-bold text-blue-700 hover:text-blue-900 self-start sm:self-center underline inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">tune</span>
                        {showAdvancedRecruiterFields ? 'Hide Custom Domain' : 'Customize Domain / Logo'}
                      </button>
                    </div>
                  )}

                  {/* Expandable Custom Domain & Logo URL Inputs */}
                  {showAdvancedRecruiterFields && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Custom Website Domain (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. tcs.com or https://company.com"
                          value={recruiterForm.websiteUrl}
                          onChange={(e) => setRecruiterForm({ ...recruiterForm, websiteUrl: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-[#000666]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Custom Logo Direct URL (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. https://.../logo.png"
                          value={recruiterForm.logoUrl}
                          onChange={(e) => setRecruiterForm({ ...recruiterForm, logoUrl: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-[#000666]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 ${
                        editingRecruiterId ? 'bg-blue-700 hover:bg-blue-800' : 'bg-emerald-700 hover:bg-emerald-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {editingRecruiterId ? 'save' : 'add'}
                      </span>
                      {editingRecruiterId ? 'Update Partner' : 'Add Partner with Logo'}
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                    <span>Current Recruiting Partners in Database</span>
                    <span className="text-[11px] text-gray-400 font-normal">{recruiters.length} partners</span>
                  </h4>
                  {recruiters.length === 0 ? (
                    <p className="text-xs text-gray-400">No partners in database.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {recruiters.map((r) => (
                        <div
                          key={r.id}
                          className={`flex items-center justify-between p-2.5 bg-white border rounded-xl transition-colors ${
                            editingRecruiterId === r.id ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <CompanyLogoBadge
                              name={r.name}
                              logoUrl={r.logoUrl}
                              websiteUrl={r.websiteUrl}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-bold text-xs text-gray-900">{r.name}</span>
                              {r.roleTag && <span className="text-[11px] text-gray-500 ml-2">({r.roleTag})</span>}
                              {r.packageBand && (
                                <span className="text-[11px] text-emerald-700 font-bold ml-2">• {r.packageBand}</span>
                              )}
                              {r.description && (
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{r.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditRecruiter(r)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-bold p-1 rounded-lg hover:bg-blue-50"
                              title="Edit Partner"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteRecruiter(r.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-bold p-1 rounded-lg hover:bg-red-50"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Placement Drives */}
            {activeTab === 'drives' && (
              <div className="space-y-5">
                <form onSubmit={handleSaveDrive} className="bg-gradient-to-br from-gray-50 to-blue-50/40 p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-700 text-[16px]">
                        {editingDriveId ? 'edit_calendar' : 'work'}
                      </span>
                      {editingDriveId ? `Edit Placement Drive: ${driveForm.companyName || 'Selected'}` : 'Schedule New Placement Drive'}
                    </h4>
                    {editingDriveId && (
                      <button
                        type="button"
                        onClick={handleCancelEditDrive}
                        className="text-xs font-bold text-gray-500 hover:text-gray-800 px-2 py-0.5 rounded bg-gray-200"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Persistent Systems, TCS, Infosys"
                        value={driveForm.companyName}
                        onChange={(e) => setDriveForm({ ...driveForm, companyName: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Designation / Role *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Software Engineer / SDE-1"
                        value={driveForm.role}
                        onChange={(e) => setDriveForm({ ...driveForm, role: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">CTC Package</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹8.5 LPA"
                        value={driveForm.packageLpa}
                        onChange={(e) => setDriveForm({ ...driveForm, packageLpa: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Drive Date</label>
                      <input
                        type="text"
                        placeholder="e.g. April 15, 2026"
                        value={driveForm.driveDate}
                        onChange={(e) => setDriveForm({ ...driveForm, driveDate: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Eligibility Criteria</label>
                      <input
                        type="text"
                        placeholder="e.g. BE CSE • CGPA ≥ 7.0 • No Active Backlogs"
                        value={driveForm.eligibility}
                        onChange={(e) => setDriveForm({ ...driveForm, eligibility: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                        Job Description / Selection Rounds & Instructions
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Round 1: Online Aptitude & Coding Assessment (MS Teams). Round 2: Technical Interview on DS, Algorithms & Java/Python. Round 3: HR & Cultural Fit Discussion."
                        value={driveForm.description}
                        onChange={(e) => setDriveForm({ ...driveForm, description: e.target.value })}
                        className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Location / Platform</label>
                      <input
                        type="text"
                        placeholder="e.g. Campus Lab 1 / Virtual MS Teams"
                        value={driveForm.location}
                        onChange={(e) => setDriveForm({ ...driveForm, location: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Registration Deadline</label>
                      <input
                        type="text"
                        placeholder="e.g. April 10, 2026"
                        value={driveForm.applyDeadline}
                        onChange={(e) => setDriveForm({ ...driveForm, applyDeadline: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#000666] outline-none"
                      />
                    </div>
                  </div>

                  {/* Drive Company Logo & Poster Banner Section */}
                  {driveForm.companyName.trim() && (
                    <div className="p-3 bg-white rounded-xl border border-blue-200/80 shadow-xs flex items-center gap-3">
                      <CompanyLogoBadge
                        name={driveForm.companyName}
                        logoUrl={driveForm.logoUrl}
                        size="md"
                        className="border-gray-200"
                      />
                      <div>
                        <p className="text-xs font-black text-[#071e27]">{driveForm.companyName}</p>
                        <p className="text-[11px] text-gray-500">
                          Domain: <span className="font-mono text-blue-700 font-bold">{resolveCompanyDomain(driveForm.companyName) || 'auto-resolving...'}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Drive Ad Banner / Poster Image Upload */}
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-blue-700 text-[16px]">image</span>
                        Drive Poster / Advertisement Banner Image (Optional)
                      </label>
                      {driveForm.bannerImageUrl && (
                        <button
                          type="button"
                          onClick={() => setDriveForm({ ...driveForm, bannerImageUrl: '' })}
                          className="text-[11px] text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove Poster
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={driveFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFileChange(e.target.files?.[0] || null, 'drive')}
                    />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => driveFileInputRef.current?.click()}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 border border-gray-300"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        Upload Poster Image
                      </button>
                      <input
                        type="text"
                        placeholder="Or paste Direct Poster Image URL (e.g. https://.../drive-ad.jpg)"
                        value={driveForm.bannerImageUrl}
                        onChange={(e) => setDriveForm({ ...driveForm, bannerImageUrl: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#000666]"
                      />
                    </div>

                    {driveForm.bannerImageUrl && (
                      <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200 max-h-40 bg-gray-50 flex items-center justify-center">
                        <img
                          src={driveForm.bannerImageUrl}
                          alt="Drive Poster Preview"
                          className="max-h-40 w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 ${
                        editingDriveId ? 'bg-blue-700 hover:bg-blue-800' : 'bg-emerald-700 hover:bg-emerald-800'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {editingDriveId ? 'save' : 'add'}
                      </span>
                      {editingDriveId ? 'Update Placement Drive' : 'Schedule Drive with Poster'}
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                    <span>Scheduled Drives in Database</span>
                    <span className="text-[11px] text-gray-400 font-normal">{drives.length} drives</span>
                  </h4>
                  {drives.length === 0 ? (
                    <p className="text-xs text-gray-400">No drives in database.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {drives.map((d) => (
                        <div
                          key={d.id}
                          className={`flex items-center justify-between p-2.5 bg-white border rounded-xl transition-colors ${
                            editingDriveId === d.id ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <CompanyLogoBadge
                              name={d.companyName}
                              logoUrl={d.logoUrl}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-bold text-xs text-gray-900">{d.companyName}</span>
                              <span className="text-[11px] text-gray-500 ml-2">({d.role})</span>
                              {d.packageLpa && (
                                <span className="text-[11px] text-emerald-700 font-bold ml-2">• {d.packageLpa}</span>
                              )}
                              {d.bannerImageUrl && (
                                <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded ml-2 font-semibold">🖼️ Has Poster</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditDrive(d)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-bold p-1 rounded-lg hover:bg-blue-50"
                              title="Edit Drive"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDrive(d.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-bold p-1 rounded-lg hover:bg-red-50"
                              title="Delete"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetAll}
                className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                Reset / Delete All Placement Data
              </button>

              <button
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Placement Notice & Multiple Student Achievers Announcement Generator */}
      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 shadow-2xl border border-gray-200 font-sans space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-2xl">celebration</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    Generate Placement Notice & Achievers Announcement
                  </h3>
                  <p className="text-xs text-gray-500">
                    Announce single/multiple placed students with company logo, congratulatory flyer, and instant push broadcast
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowNoticeModal(false); setNoticeSuccessMsg(null); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {noticeSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
                <span>{noticeSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handlePublishNotice} className="space-y-4">
              {/* Company Selection / Auto-Resolution */}
              <div className="bg-gradient-to-br from-amber-50/60 to-blue-50/40 p-4 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-700 text-[16px]">domain</span>
                    Company & Recruitment Offer Details
                  </h4>
                  {recruiters.length > 0 && (
                    <span className="text-[11px] text-gray-500">Quick-select from partner list</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TCS, Infosys, Persistent"
                      value={noticeForm.companyName}
                      onChange={(e) => setNoticeForm({ ...noticeForm, companyName: e.target.value })}
                      list="recruiters-datalist"
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-600 outline-none"
                    />
                    <datalist id="recruiters-datalist">
                      {recruiters.map((r) => (
                        <option key={r.id} value={r.name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Designation / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer / SDE-1"
                      value={noticeForm.role}
                      onChange={(e) => setNoticeForm({ ...noticeForm, role: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">CTC Package</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹9.50 LPA"
                      value={noticeForm.packageLpa}
                      onChange={(e) => setNoticeForm({ ...noticeForm, packageLpa: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-600 outline-none"
                    />
                  </div>
                </div>

                {noticeForm.companyName.trim() && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-amber-200">
                    <CompanyLogoBadge
                      name={noticeForm.companyName}
                      size="md"
                    />
                    <div>
                      <p className="text-xs font-black text-gray-900">{noticeForm.companyName}</p>
                      <p className="text-[10px] text-gray-500">
                        Resolved Official Domain: <span className="font-mono font-bold text-blue-700">{resolveCompanyDomain(noticeForm.companyName) || 'auto-detecting...'}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Placed Students Multi-Row List */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-700 text-[16px]">group</span>
                    Placed Student Achievers ({noticeForm.placedStudents.filter(s => s.name.trim()).length} Added)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddStudentRow}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span> Add Another Student
                  </button>
                </div>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {noticeForm.placedStudents.map((student, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-gray-200 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Student Full Name *"
                          value={student.name}
                          onChange={(e) => handleStudentChange(idx, 'name', e.target.value)}
                          className="flex-1 min-w-[120px] p-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#000666]"
                        />
                        <input
                          type="text"
                          placeholder="PRN / Roll No"
                          value={student.prn}
                          onChange={(e) => handleStudentChange(idx, 'prn', e.target.value)}
                          className="w-28 p-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#000666]"
                        />
                        <select
                          value={student.division}
                          onChange={(e) => handleStudentChange(idx, 'division', e.target.value)}
                          className="w-20 p-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#000666] bg-white"
                        >
                          <option value="A">Div A</option>
                          <option value="B">Div B</option>
                          <option value="C">Div C</option>
                          <option value="D">Div D</option>
                        </select>
                        <input
                          type="text"
                          placeholder="CTC (Optional)"
                          value={student.packageLpa}
                          onChange={(e) => handleStudentChange(idx, 'packageLpa', e.target.value)}
                          className="w-24 p-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#000666]"
                        />
                        {noticeForm.placedStudents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStudentRow(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            title="Remove Student"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )}
                      </div>

                      {/* Photo Attachment URL for Student */}
                      <div className="flex items-center gap-2 pl-8">
                        <span className="material-symbols-outlined text-gray-400 text-[16px]">account_circle</span>
                        <input
                          type="text"
                          placeholder="Student Photo URL (Optional - or leave blank for stylized avatar)"
                          value={student.photoUrl || ''}
                          onChange={(e) => handleStudentChange(idx, 'photoUrl', e.target.value)}
                          className="flex-1 p-1.5 border border-gray-200 rounded-lg text-[11px] outline-none focus:ring-1 focus:ring-amber-600 bg-gray-50/50"
                        />
                        {student.photoUrl && (
                          <img
                            src={student.photoUrl}
                            alt="preview"
                            className="w-6 h-6 rounded-full object-cover border border-amber-300 shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Congratulations Message / HOD Note */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-700 uppercase">
                  Congratulations Message / Placement Cell & HOD Quote
                </label>
                <textarea
                  rows={2}
                  placeholder="Enter congratulations message for students and department community..."
                  value={noticeForm.congratulationsMessage}
                  onChange={(e) => setNoticeForm({ ...noticeForm, congratulationsMessage: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-600 resize-none"
                />
              </div>

              {/* Achievers Congratulatory Banner Image Upload / Direct URL */}
              <div className="space-y-2 p-3.5 bg-amber-50/40 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-700 text-[16px]">add_photo_alternate</span>
                    Congratulatory Achievement Banner / Flyer Poster Image (Optional)
                  </label>
                  {noticeForm.bannerImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNoticeForm({ ...noticeForm, bannerImageUrl: '' })}
                      className="text-[11px] text-red-600 hover:text-red-800 font-semibold"
                    >
                      Remove Poster
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={noticeFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageFileChange(e.target.files?.[0] || null, 'notice')}
                />

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => noticeFileInputRef.current?.click()}
                    className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 border border-gray-300"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    Upload Achievers Banner
                  </button>
                  <input
                    type="text"
                    placeholder="Or paste Direct Banner Poster URL (e.g. https://.../tcs-achievers.jpg)"
                    value={noticeForm.bannerImageUrl}
                    onChange={(e) => setNoticeForm({ ...noticeForm, bannerImageUrl: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-600 bg-white"
                  />
                </div>

                {noticeForm.bannerImageUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-amber-200 max-h-48 bg-white flex items-center justify-center">
                    <img
                      src={noticeForm.bannerImageUrl}
                      alt="Achievers Banner Preview"
                      className="max-h-48 w-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={noticeSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                  <span>{noticeSubmitting ? 'Publishing & Broadcasting...' : '🚀 Publish Official Placement Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Enlarge Image */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 flex items-center gap-1 text-sm font-bold bg-white/10 px-3 py-1 rounded-full"
            >
              <span className="material-symbols-outlined text-base">close</span> Close
            </button>
            <img
              src={lightboxImage}
              alt="Expanded Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </section>
  );
};

