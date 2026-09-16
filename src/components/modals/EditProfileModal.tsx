import React, { useState, useEffect } from 'react';
import { UserProfile, AcademicYear, Division, BatchGroup } from '@/types';
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

  // Common Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [bio, setBio] = useState('');

  // Student Specific State
  const [prn, setPrn] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [academicYear, setAcademicYear] = useState<AcademicYear>('SE');
  const [division, setDivision] = useState<Division>('Div A');
  const [batchGroup, setBatchGroup] = useState<BatchGroup>('A1');
  const [qualificationPath, setQualificationPath] = useState<'12TH' | 'DIPLOMA'>('12TH');
  const [tenthPercentage, setTenthPercentage] = useState('');
  const [twelfthPercentage, setTwelfthPercentage] = useState('');
  const [diplomaPercentage, setDiplomaPercentage] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Father');

  // Faculty / HOD Specific State
  const [qualification, setQualification] = useState('Ph.D.');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [specialization, setSpecialization] = useState('');
  const [teachingExp, setTeachingExp] = useState('');
  const [industrialExp, setIndustrialExp] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [defaultAcademicYear, setDefaultAcademicYear] = useState<AcademicYear>('TE');
  const [defaultDivision, setDefaultDivision] = useState<Division>('Div A');
  const [defaultBatchGroup, setDefaultBatchGroup] = useState<BatchGroup>('A1');

  // Password Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [fetchingFresh, setFetchingFresh] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const role = (currentProfile?.role || 'student').toLowerCase();
  const isStudent = role === 'student';
  const isFaculty = role === 'faculty' || role === 'hod';
  const isHod = role === 'hod';
  const isParent = role === 'parent';

  // Populate data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // First populate from currentProfile prop
    if (currentProfile) {
      setName(currentProfile.name || '');
      setEmail(currentProfile.email || '');
      setPhone(currentProfile.phone || '');
      setDepartment(currentProfile.department || 'CSE');
      setAvatar(currentProfile.avatar || AVATAR_PRESETS[0]);
      setBio(currentProfile.bio || '');

      setPrn(currentProfile.prn || '');
      setRollNo(currentProfile.rollNo || '');
      setAcademicYear(currentProfile.academicYear || 'SE');
      setDivision(currentProfile.division || 'Div A');
      setBatchGroup(currentProfile.batchGroup || 'A1');
      setQualificationPath(currentProfile.qualificationPath || '12TH');
      setTenthPercentage(currentProfile.tenthPercentage ? currentProfile.tenthPercentage.toString() : '');
      setTwelfthPercentage(currentProfile.twelfthPercentage ? currentProfile.twelfthPercentage.toString() : '');
      setDiplomaPercentage(currentProfile.diplomaPercentage ? currentProfile.diplomaPercentage.toString() : '');
      setCgpa(currentProfile.cgpa ? currentProfile.cgpa.toString() : currentProfile.gpa ? currentProfile.gpa.toString() : '');
      setParentName(currentProfile.parentName || '');
      setParentEmail(currentProfile.parentEmail || '');
      setParentPhone(currentProfile.parentPhone || '');
      setParentRelationship(currentProfile.parentRelationship || 'Father');

      setQualification(currentProfile.qualification || 'Ph.D.');
      setDesignation(currentProfile.designation || currentProfile.roleTitle || 'Assistant Professor');
      setSpecialization(currentProfile.specialization || '');
      setTeachingExp(currentProfile.teachingExperience || '');
      setIndustrialExp(currentProfile.industrialExperience || '');
      setOfficeLocation(currentProfile.officeLocation || '');
      setOfficeHours(currentProfile.officeHours || '');
      setDefaultAcademicYear((currentProfile.defaultAcademicYear as AcademicYear) || 'TE');
      setDefaultDivision((currentProfile.defaultDivision as Division) || 'Div A');
      setDefaultBatchGroup((currentProfile.defaultBatchGroup as BatchGroup) || 'A1');
    }

    // Also fetch fresh enriched profile from API to ensure all DB relations are loaded
    const loadFreshProfile = async () => {
      setFetchingFresh(true);
      try {
        const fresh = await apiService.fetchUserProfile();
        if (fresh) {
          if (fresh.name) setName(fresh.name);
          if (fresh.email) setEmail(fresh.email);
          if (fresh.phone) setPhone(fresh.phone);
          if (fresh.department) setDepartment(fresh.department);
          if (fresh.avatar) setAvatar(fresh.avatar);
          if (fresh.bio) setBio(fresh.bio);

          if (fresh.prn) setPrn(fresh.prn);
          if (fresh.rollNo) setRollNo(fresh.rollNo);
          if (fresh.academicYear) setAcademicYear(fresh.academicYear);
          if (fresh.division) setDivision(fresh.division);
          if (fresh.batchGroup) setBatchGroup(fresh.batchGroup);
          if (fresh.qualificationPath) setQualificationPath(fresh.qualificationPath);
          if (fresh.tenthPercentage) setTenthPercentage(fresh.tenthPercentage.toString());
          if (fresh.twelfthPercentage) setTwelfthPercentage(fresh.twelfthPercentage.toString());
          if (fresh.diplomaPercentage) setDiplomaPercentage(fresh.diplomaPercentage.toString());
          if (fresh.cgpa) setCgpa(fresh.cgpa.toString());
          else if (fresh.gpa) setCgpa(fresh.gpa.toString());
          if (fresh.parentName) setParentName(fresh.parentName);
          if (fresh.parentEmail) setParentEmail(fresh.parentEmail);
          if (fresh.parentPhone) setParentPhone(fresh.parentPhone);
          if (fresh.parentRelationship) setParentRelationship(fresh.parentRelationship);

          if (fresh.qualification) setQualification(fresh.qualification);
          if (fresh.designation) setDesignation(fresh.designation);
          else if (fresh.roleTitle) setDesignation(fresh.roleTitle);
          if (fresh.specialization) setSpecialization(fresh.specialization);
          if (fresh.teachingExperience) setTeachingExp(fresh.teachingExperience);
          if (fresh.industrialExperience) setIndustrialExp(fresh.industrialExperience);
          if (fresh.officeLocation) setOfficeLocation(fresh.officeLocation);
          if (fresh.officeHours) setOfficeHours(fresh.officeHours);
          if (fresh.defaultAcademicYear) setDefaultAcademicYear(fresh.defaultAcademicYear);
          if (fresh.defaultDivision) setDefaultDivision(fresh.defaultDivision);
          if (fresh.defaultBatchGroup) setDefaultBatchGroup(fresh.defaultBatchGroup);
        }
      } catch (err) {
        console.warn('Could not fetch fresh enriched profile:', err);
      } finally {
        setFetchingFresh(false);
      }
    };

    loadFreshProfile();
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, WEBP).' });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Failed to read the image file from your device.' });
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setMessage({ type: 'error', text: 'Invalid image format.' });
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
          setAvatar(dataUrl);
          setMessage({ type: 'success', text: 'Photo selected! Click "Save Profile" to commit changes.' });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const activeEmail = (email || currentProfile?.email || '').trim().toLowerCase();
      const payload: Record<string, any> = {
        name: name.trim(),
        email: activeEmail,
        role: role,
        department: department.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatar,
      };

      if (isStudent) {
        const parsedCgpa = cgpa && !isNaN(parseFloat(cgpa)) ? parseFloat(cgpa) : (currentProfile?.cgpa || currentProfile?.gpa || undefined);
        payload.roleTitle = `${department} B.Tech Student`;
        payload.prn = prn.trim();
        payload.rollNo = rollNo.trim();
        payload.academicYear = academicYear;
        payload.division = division;
        payload.batchGroup = batchGroup;
        if (parsedCgpa !== undefined) {
          payload.gpa = parsedCgpa;
          payload.cgpa = parsedCgpa;
        }
        payload.qualificationPath = qualificationPath;
        payload.tenthPercentage = tenthPercentage && !isNaN(parseFloat(tenthPercentage)) ? parseFloat(tenthPercentage) : 0;
        payload.twelfthPercentage = qualificationPath === '12TH' && twelfthPercentage && !isNaN(parseFloat(twelfthPercentage)) ? parseFloat(twelfthPercentage) : 0;
        payload.diplomaPercentage = qualificationPath === 'DIPLOMA' && diplomaPercentage && !isNaN(parseFloat(diplomaPercentage)) ? parseFloat(diplomaPercentage) : 0;
        payload.parentName = parentName.trim();
        payload.parentEmail = parentEmail.trim().toLowerCase();
        payload.parentPhone = parentPhone.trim();
        payload.parentRelationship = parentRelationship;
      } else if (isFaculty) {
        payload.roleTitle = isHod ? `Head of Department (HOD ${department})` : designation;
        payload.designation = designation;
        payload.qualification = qualification;
        payload.specialization = specialization.trim();
        payload.teachingExperience = teachingExp.trim();
        payload.industrialExperience = industrialExp.trim();
        payload.officeLocation = officeLocation.trim();
        payload.officeHours = officeHours.trim();
        payload.defaultAcademicYear = defaultAcademicYear;
        payload.defaultDivision = defaultDivision;
        payload.defaultBatchGroup = defaultBatchGroup;

        // Persist to local working batch cache
        localStorage.setItem('sit_faculty_active_batch', JSON.stringify({
          department: department || 'CSE',
          academicYear: defaultAcademicYear,
          division: defaultDivision,
          batchGroup: defaultBatchGroup
        }));
      } else if (isParent) {
        payload.roleTitle = `Parent / Guardian`;
        payload.parentRelationship = parentRelationship;
      } else {
        payload.officeLocation = officeLocation.trim();
      }

      const res = await apiService.updateUserProfile(payload);
      const userRes = res.user || {};

      const updated: UserProfile = {
        name: userRes.name || name,
        roleTitle: userRes.roleTitle || (isStudent ? `${department} B.Tech Student` : designation),
        role: currentProfile?.role || (role as any),
        avatar: userRes.avatar || avatar,
        department: userRes.department || department,
        email: currentProfile?.email || email,
        phone: userRes.phone || phone,
        bio: userRes.bio || bio,
        officeLocation: userRes.officeLocation || officeLocation,
        qualification: userRes.qualification || qualification,

        // Student Data
        prn: userRes.prn || prn,
        rollNo: userRes.rollNo || rollNo,
        academicYear: userRes.academicYear || academicYear,
        division: userRes.division || division,
        batchGroup: userRes.batchGroup || batchGroup,
        cohortBatch: userRes.cohortBatch || currentProfile?.cohortBatch,
        gpa: userRes.gpa !== undefined ? userRes.gpa : (cgpa ? parseFloat(cgpa) : currentProfile?.gpa),
        cgpa: userRes.cgpa !== undefined ? userRes.cgpa : (cgpa ? parseFloat(cgpa) : currentProfile?.cgpa),
        qualificationPath: userRes.qualificationPath || qualificationPath,
        tenthPercentage: userRes.tenthPercentage !== undefined ? parseFloat(userRes.tenthPercentage) : (tenthPercentage ? parseFloat(tenthPercentage) : currentProfile?.tenthPercentage),
        twelfthPercentage: userRes.twelfthPercentage !== undefined ? parseFloat(userRes.twelfthPercentage) : (twelfthPercentage ? parseFloat(twelfthPercentage) : currentProfile?.twelfthPercentage),
        diplomaPercentage: userRes.diplomaPercentage !== undefined ? parseFloat(userRes.diplomaPercentage) : (diplomaPercentage ? parseFloat(diplomaPercentage) : currentProfile?.diplomaPercentage),
        parentName: userRes.parentName || parentName,
        parentEmail: userRes.parentEmail || parentEmail,
        parentPhone: userRes.parentPhone || parentPhone,
        parentRelationship: userRes.parentRelationship || parentRelationship,

        // Faculty Data
        designation: userRes.designation || designation,
        specialization: userRes.specialization || specialization,
        teachingExperience: userRes.teachingExperience || teachingExp,
        industrialExperience: userRes.industrialExperience || industrialExp,
        officeHours: userRes.officeHours || officeHours,
        defaultAcademicYear: userRes.defaultAcademicYear || defaultAcademicYear,
        defaultDivision: userRes.defaultDivision || defaultDivision,
        defaultBatchGroup: userRes.defaultBatchGroup || defaultBatchGroup,

        // Parent Data
        studentRollNo: userRes.studentRollNo || currentProfile?.studentRollNo,
      };

      onProfileUpdated(updated);
      setMessage({ type: 'success', text: 'Personal information updated and saved successfully!' });
      setTimeout(() => {
        onClose();
      }, 1100);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update personal information.' });
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
      setMessage({ type: 'success', text: 'Password updated successfully!' });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071e27]/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-[#c6c5d4] shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-[#000666] text-white p-5 px-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-[17px] tracking-tight">My Profile & Personal Information</h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  isStudent
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : isFaculty
                    ? 'bg-teal-500/20 text-teal-300 border-teal-400/30'
                    : isParent
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                }`}>
                  {role}
                </span>
              </div>
              <p className="text-[12px] opacity-80 font-mono mt-0.5">{email || currentProfile?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#c6c5d4] bg-[#f8fafc] px-6 shrink-0">
          <button
            onClick={() => { setActiveTab('details'); setMessage(null); }}
            className={`py-3.5 px-4 font-bold text-[13px] border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'details'
                ? 'border-[#000666] text-[#000666] bg-white'
                : 'border-transparent text-[#454652] hover:text-[#071e27]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            Personal & Academic Information
          </button>
          <button
            onClick={() => { setActiveTab('security'); setMessage(null); }}
            className={`py-3.5 px-4 font-bold text-[13px] border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#000666] text-[#000666] bg-white'
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
            className={`mx-6 mt-4 p-3 rounded-xl text-[13px] font-bold flex items-center gap-2 shrink-0 ${
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

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {/* TAB 1: PERSONAL & ROLE SPECIFIC DETAILS */}
          {activeTab === 'details' && (
            <form onSubmit={handleProfileSave} id="profile-edit-form" className="space-y-6">
              
              {/* Profile Avatar Selector */}
              <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-4">
                <label className="block text-[11px] font-bold text-[#454652] uppercase mb-2">
                  Profile Avatar / Identity Photo
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={avatar}
                    alt="Avatar Preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#000666] shadow-sm shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setAvatar(preset)}
                          className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                            avatar === preset ? 'border-[#000666] scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        id="avatar-upload-file"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <label
                        htmlFor="avatar-upload-file"
                        className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-[11px] font-bold text-[#000666] hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">upload</span>
                        Upload from Device / Gallery
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------------- SECTION: BASIC IDENTITY (ALL ROLES) ---------------- */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#000666]">person</span>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Basic Identity & Contact</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full legal name"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                    />
                  </div>

                  {/* Read-Only Institutional Login Identifier */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">
                        Institutional Login Email
                      </label>
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px] text-slate-400">lock</span>
                        <span>Fixed Login ID</span>
                      </span>
                    </div>
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={email || currentProfile?.email}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-500 cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Phone / Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Department *
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                    >
                      <option value="CSE">Computer Science & Engineering (CSE)</option>
                      <option value="AIDS">Artificial Intelligence & Data Science (AIDS)</option>
                      <option value="MECH">Mechanical Engineering (MECH)</option>
                      <option value="CIVIL">Civil Engineering (CIVIL)</option>
                      <option value="ENTC">Electronics & Telecommunication (ENTC)</option>
                      <option value="ELECTRICAL">Electrical Engineering (ELECTRICAL)</option>
                      <option value="MECHATRONICS">Mechatronics Engineering</option>
                      <option value="BASIC_SCIENCES">Basic Sciences & Humanities</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ---------------- SECTION: STUDENT ACADEMIC & MARKS INFO ---------------- */}
              {isStudent && (
                <>
                  {/* Academic Class & Batch Identification */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                      <span className="material-symbols-outlined text-[18px] text-emerald-700">school</span>
                      <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Academic Class & Enrollment</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">PRN (Permanent Reg Number) *</label>
                        <input
                          type="text"
                          required
                          value={prn}
                          onChange={(e) => setPrn(e.target.value)}
                          placeholder="e.g. 210103001"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Roll Number *</label>
                        <input
                          type="text"
                          required
                          value={rollNo}
                          onChange={(e) => setRollNo(e.target.value)}
                          placeholder="e.g. 22CSE045"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Academic Year</label>
                        <select
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value as AcademicYear)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 outline-none"
                        >
                          <option value="FE">FE (First Year)</option>
                          <option value="SE">SE (Second Year)</option>
                          <option value="TE">TE (Third Year)</option>
                          <option value="BE">BE (Final Year)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Division</label>
                        <select
                          value={division}
                          onChange={(e) => setDivision(e.target.value as Division)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 outline-none"
                        >
                          <option value="Div A">Div A</option>
                          <option value="Div B">Div B</option>
                          <option value="Div C">Div C</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Batch Group</label>
                        <select
                          value={batchGroup}
                          onChange={(e) => setBatchGroup(e.target.value as BatchGroup)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 outline-none"
                        >
                          {division === 'Div A' && (
                            <>
                              <option value="A1">Batch A1</option>
                              <option value="A2">Batch A2</option>
                              <option value="A3">Batch A3</option>
                            </>
                          )}
                          {division === 'Div B' && (
                            <>
                              <option value="B1">Batch B1</option>
                              <option value="B2">Batch B2</option>
                              <option value="B3">Batch B3</option>
                            </>
                          )}
                          {division === 'Div C' && (
                            <>
                              <option value="C1">Batch C1</option>
                              <option value="C2">Batch C2</option>
                              <option value="C3">Batch C3</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Prior Marks & CGPA */}
                  <div className="space-y-3 pt-2 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-emerald-900 uppercase">Prior Academic Marks & Current CGPA</span>
                      <div className="flex gap-3">
                        <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="profileQualPath"
                            checked={qualificationPath === '12TH'}
                            onChange={() => setQualificationPath('12TH')}
                            className="text-[#000666]"
                          />
                          <span>12th (HSC)</span>
                        </label>
                        <label className="text-[11px] font-semibold text-slate-800 flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="profileQualPath"
                            checked={qualificationPath === 'DIPLOMA'}
                            onChange={() => setQualificationPath('DIPLOMA')}
                            className="text-[#000666]"
                          />
                          <span>Diploma (DSE)</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1">10th (SSC) %</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={tenthPercentage}
                          onChange={(e) => setTenthPercentage(e.target.value)}
                          placeholder="e.g. 85.50"
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      {qualificationPath === '12TH' ? (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">12th (HSC) %</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={twelfthPercentage}
                            onChange={(e) => setTwelfthPercentage(e.target.value)}
                            placeholder="e.g. 80.00"
                            className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-amber-900 mb-1">Diploma %</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={diplomaPercentage}
                            onChange={(e) => setDiplomaPercentage(e.target.value)}
                            placeholder="e.g. 82.00"
                            className="w-full bg-amber-50/80 border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-950 outline-none focus:ring-2 focus:ring-amber-600"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-blue-900 mb-1">Current CGPA (0-10)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                          placeholder="e.g. 8.50"
                          className="w-full bg-white border border-blue-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-blue-900 outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parent / Guardian Information */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                      <span className="material-symbols-outlined text-[18px] text-indigo-700">family_restroom</span>
                      <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Parent / Guardian Details</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Parent Full Name</label>
                        <input
                          type="text"
                          value={parentName}
                          onChange={(e) => setParentName(e.target.value)}
                          placeholder="Enter parent's full name"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Parent Portal Login Email</label>
                        <input
                          type="email"
                          value={parentEmail}
                          onChange={(e) => setParentEmail(e.target.value)}
                          placeholder="parent.name@gmail.com"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Parent Phone / Mobile</label>
                        <input
                          type="tel"
                          value={parentPhone}
                          onChange={(e) => setParentPhone(e.target.value)}
                          placeholder="+91 98765 00000"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Relationship</label>
                        <select
                          value={parentRelationship}
                          onChange={(e) => setParentRelationship(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ---------------- SECTION: FACULTY / HOD CREDENTIALS ---------------- */}
              {isFaculty && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className="material-symbols-outlined text-[18px] text-teal-700">clinical_notes</span>
                    <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wider">Academic & Faculty Credentials</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Highest Qualification *</label>
                      <select
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                      >
                        <option value="Ph.D.">Ph.D. / Doctorate</option>
                        <option value="M.Tech">M.Tech / M.E.</option>
                        <option value="B.Tech">B.Tech / B.E.</option>
                        <option value="PostDoc">Post-Doctoral</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Designation / Role Title *</label>
                      <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                      >
                        {isHod ? (
                          <option value={`Head of Department (HOD ${department})`}>Head of Department (HOD)</option>
                        ) : (
                          <>
                            <option value="Assistant Professor">Assistant Professor</option>
                            <option value="Associate Professor">Associate Professor</option>
                            <option value="Professor">Professor</option>
                            <option value="Adjunct Faculty">Adjunct Faculty</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Research Domain / Specialization</label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Artificial Intelligence, Cloud Computing, Distributed Systems"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Teaching Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={teachingExp}
                        onChange={(e) => setTeachingExp(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Industrial Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={industrialExp}
                        onChange={(e) => setIndustrialExp(e.target.value)}
                        placeholder="e.g. 2"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Office Location / Cabin</label>
                      <input
                        type="text"
                        value={officeLocation}
                        onChange={(e) => setOfficeLocation(e.target.value)}
                        placeholder="e.g. CSE Dept Cabin 204"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Office Hours / Consultation Schedule</label>
                      <input
                        type="text"
                        value={officeHours}
                        onChange={(e) => setOfficeHours(e.target.value)}
                        placeholder="e.g. Mon-Fri 10:00 AM - 12:00 PM"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  {/* Faculty Assigned Default Working Batch */}
                  <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#000666]">star</span>
                      <h4 className="text-xs font-bold text-[#000666] uppercase tracking-wider">
                        My Default Working Batch (Global Working Context)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      This batch will be your active pre-filtered batch across the whole portal (Students Directory, Roster Monitoring, and Email broadcasts).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Academic Year</label>
                        <select
                          value={defaultAcademicYear}
                          onChange={(e) => setDefaultAcademicYear(e.target.value as AcademicYear)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#000666]"
                        >
                          <option value="FE">FE (First Year)</option>
                          <option value="SE">SE (Second Year)</option>
                          <option value="TE">TE (Third Year)</option>
                          <option value="BE">BE (Final Year)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Division</label>
                        <select
                          value={defaultDivision}
                          onChange={(e) => setDefaultDivision(e.target.value as Division)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#000666]"
                        >
                          <option value="Div A">Div A</option>
                          <option value="Div B">Div B</option>
                          <option value="Div C">Div C</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Batch Group</label>
                        <select
                          value={defaultBatchGroup}
                          onChange={(e) => setDefaultBatchGroup(e.target.value as BatchGroup)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-[#000666]"
                        >
                          <option value="A1">Batch A1</option>
                          <option value="A2">Batch A2</option>
                          <option value="A3">Batch A3</option>
                          <option value="B1">Batch B1</option>
                          <option value="B2">Batch B2</option>
                          <option value="B3">Batch B3</option>
                          <option value="C1">Batch C1</option>
                          <option value="C2">Batch C2</option>
                          <option value="C3">Batch C3</option>
                          <option value="ALL">All Batches (Division)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- SECTION: PARENT ROLE SPECIFIC ---------------- */}
              {isParent && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className="material-symbols-outlined text-[18px] text-amber-700">family_restroom</span>
                    <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Parent & Ward Relationship</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Relationship</label>
                      <select
                        value={parentRelationship}
                        onChange={(e) => setParentRelationship(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>

                    {currentProfile?.studentRollNo && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Linked Student Ward</label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={`Ward Roll No: ${currentProfile.studentRollNo}`}
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Biography / About Section */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  About / Profile Biography
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary or description..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666] resize-none"
                />
              </div>

            </form>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange} id="password-change-form" className="space-y-4 max-w-md mx-auto py-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#000666] shrink-0 mt-0.5">shield</span>
                <span>Update your portal password. Your login email ({email || currentProfile?.email}) remains your persistent authentication identifier.</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Current Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 4 characters)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Confirm New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-password-toggle"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-slate-300 text-[#000666] focus:ring-0"
                />
                <label htmlFor="show-password-toggle" className="text-xs text-slate-600 font-medium cursor-pointer">
                  Show passwords
                </label>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            {fetchingFresh && <span>Refreshing profile data from database...</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === 'details' ? (
              <button
                type="submit"
                form="profile-edit-form"
                disabled={loading}
                className="px-6 py-2 bg-[#000666] hover:bg-[#1a237e] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading && <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>}
                <span>Save Profile</span>
              </button>
            ) : (
              <button
                type="submit"
                form="password-change-form"
                disabled={loading}
                className="px-6 py-2 bg-[#000666] hover:bg-[#1a237e] text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {loading && <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>}
                <span>Update Password</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
