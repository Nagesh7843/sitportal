import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { apiService } from '@/services/api';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile | null;
  onProfileUpdated: (updatedProfile: UserProfile) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=250',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');
  const [name, setName] = useState(currentProfile?.name || '');
  const [roleTitle, setRoleTitle] = useState(currentProfile?.roleTitle || '');
  const [department, setDepartment] = useState(currentProfile?.department || 'Computer Science & Engineering');
  const [phone, setPhone] = useState(currentProfile?.phone || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [officeLocation, setOfficeLocation] = useState(currentProfile?.officeLocation || '');
  const [avatar, setAvatar] = useState(currentProfile?.avatar || AVATAR_PRESETS[0]);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        name,
        roleTitle,
        department,
        phone,
        bio,
        officeLocation,
        avatar,
      };

      const res = await apiService.updateUserProfile(payload);
      
      const updated: UserProfile = {
        name: res.user?.name || name,
        roleTitle: res.user?.roleTitle || roleTitle,
        role: currentProfile?.role || 'faculty',
        avatar: res.user?.avatar || avatar,
        department: res.user?.department || department,
        email: currentProfile?.email || '',
        phone: res.user?.phone || phone,
        bio: res.user?.bio || bio,
        officeLocation: res.user?.officeLocation || officeLocation,
      };

      onProfileUpdated(updated);
      setMessage({ type: 'success', text: 'User profile updated successfully!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password must be at least 4 characters.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await apiService.changePassword({ currentPassword, newPassword });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071e27]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl border border-[#c6c5d4] shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-[#000666] text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[28px]">manage_accounts</span>
            <div>
              <h2 className="font-bold text-[18px]">My Profile & Account Settings</h2>
              <p className="text-[12px] opacity-80">{currentProfile?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-[#c6c5d4] bg-[#f3faff] px-6">
          <button
            onClick={() => { setActiveTab('details'); setMessage(null); }}
            className={`py-3.5 px-4 font-bold text-[13px] border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-[#000666] text-[#000666]'
                : 'border-transparent text-[#454652] hover:text-[#071e27]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Profile Details
          </button>
          <button
            onClick={() => { setActiveTab('security'); setMessage(null); }}
            className={`py-3.5 px-4 font-bold text-[13px] border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-[#000666] text-[#000666]'
                : 'border-transparent text-[#454652] hover:text-[#071e27]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            Security & Password
          </button>
        </div>

        {/* Status Message Alert */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3.5 rounded-xl text-[13px] font-bold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {message.text}
          </div>
        )}

        {/* Tab 1: Profile Details */}
        {activeTab === 'details' && (
          <form onSubmit={handleProfileSave} className="p-6 space-y-5">
            {/* Avatar Selector */}
            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-2">
                Profile Avatar / Photo
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={avatar}
                  alt="Avatar Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#000666] shadow-sm"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setAvatar(preset)}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                          avatar === preset ? 'border-[#000666] scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="Or enter custom Image URL..."
                    className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl px-3 py-1.5 text-[12px] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Associate Professor"
                  className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                  Phone / Mobile
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                  Office Location / Cabin
                </label>
                <input
                  type="text"
                  value={officeLocation}
                  onChange={(e) => setOfficeLocation(e.target.value)}
                  placeholder="e.g. CSE Dept Cabin 204"
                  className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                About / Biography
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief profile summary..."
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#c6c5d4]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#c6c5d4] text-[#454652] font-bold text-[13px] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#000666] text-white font-bold rounded-xl text-[13px] hover:bg-[#1a237e] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>}
                Save Profile
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password..."
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 4 characters)..."
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password..."
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#c6c5d4]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-[#c6c5d4] text-[#454652] font-bold text-[13px] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#000666] text-white font-bold rounded-xl text-[13px] hover:bg-[#1a237e] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>}
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
