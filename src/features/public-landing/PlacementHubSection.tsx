import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface PlacementHubSectionProps {
  onExploreNotices?: () => void;
  userRole?: string;
}

export const PlacementHubSection: React.FC<PlacementHubSectionProps> = ({ onExploreNotices, userRole = 'public' }) => {
  const [stats, setStats] = useState<any>(null);
  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Admin Modal States
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'recruiters' | 'drives'>('metrics');
  const [selectedDrive, setSelectedDrive] = useState<any | null>(null);

  // Forms
  const [statsForm, setStatsForm] = useState({
    highestPackage: '',
    averagePackage: '',
    placementRatio: '',
    totalOffers: '',
    batchYear: ''
  });

  const [recruiterForm, setRecruiterForm] = useState({
    name: '',
    packageBand: '',
    roleTag: ''
  });

  const [driveForm, setDriveForm] = useState({
    companyName: '',
    role: '',
    packageLpa: '',
    driveDate: '',
    eligibility: '',
    location: '',
    applyDeadline: '',
    status: 'UPCOMING'
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
          batchYear: data.stats.batchYear || ''
        });
      }
    } catch (err) {
      console.warn('Failed to load placement data from backend:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await apiService.updatePlacementStats(statsForm);
      setStats(saved);
      alert('Placement metrics updated in PostgreSQL and desktop broadcast notification sent to all users!');
    } catch (err: any) {
      alert(err.message || 'Failed to update stats.');
    }
  };

  const handleAddRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiterForm.name.trim()) return;
    try {
      const saved = await apiService.addPlacementRecruiter(recruiterForm);
      setRecruiters((prev) => [...prev, saved]);
      setRecruiterForm({ name: '', packageBand: '', roleTag: '' });
      alert(`Recruiting partner "${saved.name}" added successfully and broadcast notification sent to all subscribers!`);
    } catch (err: any) {
      alert(err.message || 'Failed to add recruiter.');
    }
  };

  const handleDeleteRecruiter = async (id: number | string) => {
    if (!window.confirm('Delete this recruiting partner record?')) return;
    try {
      await apiService.deletePlacementRecruiter(id);
      setRecruiters((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete recruiter.');
    }
  };

  const handleAddDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveForm.companyName.trim() || !driveForm.role.trim()) return;
    try {
      const saved = await apiService.addPlacementDrive(driveForm);
      setDrives((prev) => [saved, ...prev]);
      setDriveForm({
        companyName: '',
        role: '',
        packageLpa: '',
        driveDate: '',
        eligibility: '',
        location: '',
        applyDeadline: '',
        status: 'UPCOMING'
      });
      alert(`💼 New Placement Drive for "${saved.companyName}" scheduled successfully! Chrome desktop notification dispatched to all students, parents, and faculty.`);
    } catch (err: any) {
      alert(err.message || 'Failed to schedule drive.');
    }
  };

  const handleDeleteDrive = async (id: number | string) => {
    if (!window.confirm('Delete this placement drive record from database?')) return;
    try {
      await apiService.deletePlacementDrive(id);
      setDrives((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete drive.');
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete ALL placement records from the database?')) return;
    try {
      await apiService.resetPlacementData();
      setStats(null);
      setRecruiters([]);
      setDrives([]);
      setStatsForm({ highestPackage: '', averagePackage: '', placementRatio: '', totalOffers: '', batchYear: '' });
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
              onClick={() => setShowAdminModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
              <span>Manage Placement Data</span>
            </button>
          )}

          {onExploreNotices && (
            <button
              onClick={onExploreNotices}
              className="px-4 py-2 bg-[#000666] text-white hover:bg-blue-900 text-xs font-bold rounded-xl transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">campaign</span>
              <span>Placement Notices</span>
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {recruiters.map((rec) => (
              <div
                key={rec.id}
                className="bg-white p-3 rounded-xl border border-[#c3d3d9] hover:border-[#000666] transition-all flex flex-col justify-between"
              >
                <div>
                  <p className="font-extrabold text-xs text-[#071e27]">{rec.name}</p>
                  {rec.roleTag && <p className="text-[10px] text-gray-500 mt-0.5">{rec.roleTag}</p>}
                </div>
                {rec.packageBand && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Package</span>
                    <span className="text-[11px] font-bold text-emerald-700">{rec.packageBand}</span>
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
                className="bg-white p-4 rounded-2xl border border-[#c3d3d9] hover:shadow-md transition-shadow flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {drive.packageLpa && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-extrabold uppercase">
                          {drive.packageLpa}
                        </span>
                      )}
                      <h4 className="font-bold text-sm text-[#071e27] mt-1.5">{drive.companyName}</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-[#000666] rounded text-[10px] font-bold uppercase">
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
                  <button
                    onClick={() => setSelectedDrive(drive)}
                    className="px-3 py-1.5 bg-[#f0f4ff] hover:bg-[#d9e2ff] text-[#000666] font-bold text-xs rounded-lg transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Placement Drive Details */}
      {selectedDrive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 font-sans space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                {selectedDrive.packageLpa && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-extrabold text-[11px]">
                    {selectedDrive.packageLpa}
                  </span>
                )}
                <h3 className="text-lg font-bold text-[#071e27] mt-1">{selectedDrive.companyName}</h3>
                <p className="text-xs text-gray-500">{selectedDrive.role}</p>
              </div>
              <button onClick={() => setSelectedDrive(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p><strong>Recruitment Date:</strong> {selectedDrive.driveDate || 'To be announced'}</p>
              <p><strong>Eligibility Criteria:</strong> {selectedDrive.eligibility || 'BE CSE'}</p>
              <p><strong>Campus Location:</strong> {selectedDrive.location || 'SIT Campus'}</p>
              {selectedDrive.applyDeadline && (
                <p><strong>Application Registration Deadline:</strong> <span className="text-red-700 font-bold">{selectedDrive.applyDeadline}</span></p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
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
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#000666] text-white font-bold text-xs rounded-xl hover:bg-blue-900 shadow-xs"
                  >
                    Save Metrics to Database
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Recruiting Partners */}
            {activeTab === 'recruiters' && (
              <div className="space-y-5">
                <form onSubmit={handleAddRecruiter} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase">Add New Recruiting Partner</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Company Name (e.g. TCS)"
                      value={recruiterForm.name}
                      onChange={(e) => setRecruiterForm({ ...recruiterForm, name: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Package Band (e.g. ₹7.5 - 11 LPA)"
                      value={recruiterForm.packageBand}
                      onChange={(e) => setRecruiterForm({ ...recruiterForm, packageBand: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Role Tag (e.g. Product Dev)"
                      value={recruiterForm.roleTag}
                      onChange={(e) => setRecruiterForm({ ...recruiterForm, roleTag: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-lg hover:bg-emerald-800"
                  >
                    + Add Partner
                  </button>
                </form>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">Current Recruiting Partners in Database</h4>
                  {recruiters.length === 0 ? (
                    <p className="text-xs text-gray-400">No partners in database.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {recruiters.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl"
                        >
                          <div>
                            <span className="font-bold text-xs text-gray-900">{r.name}</span>
                            <span className="text-[11px] text-gray-500 ml-2">({r.roleTag || 'Partner'})</span>
                            {r.packageBand && (
                              <span className="text-[11px] text-emerald-700 font-bold ml-2">• {r.packageBand}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteRecruiter(r.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold p-1"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
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
                <form onSubmit={handleAddDrive} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold text-gray-800 uppercase">Schedule New Placement Drive</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="Company Name *"
                      value={driveForm.companyName}
                      onChange={(e) => setDriveForm({ ...driveForm, companyName: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Designation / Role *"
                      value={driveForm.role}
                      onChange={(e) => setDriveForm({ ...driveForm, role: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="CTC Package (e.g. ₹8.5 LPA)"
                      value={driveForm.packageLpa}
                      onChange={(e) => setDriveForm({ ...driveForm, packageLpa: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Drive Date (e.g. April 15, 2026)"
                      value={driveForm.driveDate}
                      onChange={(e) => setDriveForm({ ...driveForm, driveDate: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Eligibility (e.g. BE CSE • CGPA ≥ 7.0)"
                      value={driveForm.eligibility}
                      onChange={(e) => setDriveForm({ ...driveForm, eligibility: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs sm:col-span-2"
                    />
                    <input
                      type="text"
                      placeholder="Location / Platform (e.g. Campus Lab 1)"
                      value={driveForm.location}
                      onChange={(e) => setDriveForm({ ...driveForm, location: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Deadline (e.g. April 10, 2026)"
                      value={driveForm.applyDeadline}
                      onChange={(e) => setDriveForm({ ...driveForm, applyDeadline: e.target.value })}
                      className="p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-lg hover:bg-emerald-800"
                  >
                    + Schedule Drive
                  </button>
                </form>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase">Scheduled Drives in Database</h4>
                  {drives.length === 0 ? (
                    <p className="text-xs text-gray-400">No drives in database.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {drives.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl"
                        >
                          <div>
                            <span className="font-bold text-xs text-gray-900">{d.companyName}</span>
                            <span className="text-[11px] text-gray-500 ml-2">({d.role})</span>
                            {d.packageLpa && (
                              <span className="text-[11px] text-emerald-700 font-bold ml-2">• {d.packageLpa}</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteDrive(d.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold p-1"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
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
    </section>
  );
};
