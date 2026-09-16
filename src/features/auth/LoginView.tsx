import React, { useState, useEffect } from 'react';
import { UserRole, ViewMode, UserProfile, AcademicYear, Division, BatchGroup } from '@/types';
import { apiService } from '@/services/api';
import sitLogo from '@/assets/sit-logo.png';

declare global {
  interface Window {
    google?: any;
  }
}

interface LoginViewProps {
  onLoginSuccess: (role: UserRole, userEmail?: string, userProfile?: any) => void;
  onNavigate: (view: ViewMode) => void;
}

type RegistrationRole = 'student' | 'faculty' | 'hod';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigate }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regRole, setRegRole] = useState<RegistrationRole>('student');

  // Sign In Form State (Clean Initial State)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Common Registration State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isGoogleVerified, setIsGoogleVerified] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [confirmRegPassword, setConfirmRegPassword] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [qualification, setQualification] = useState('Ph.D.');
  const [specialization, setSpecialization] = useState('');
  const [securityCode, setSecurityCode] = useState('');

  // Faculty Specific
  const [designation, setDesignation] = useState('Assistant Professor');
  const [teachingExp, setTeachingExp] = useState('');
  const [industrialExp, setIndustrialExp] = useState('');

  // Student Specific
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

  // Parent Contact Details (Taken during Student Registration)
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Father');

  // Parent First-Time Password Activation Modal State
  const [showParentSetupModal, setShowParentSetupModal] = useState(false);
  const [parentSetupEmail, setParentSetupEmail] = useState('');
  const [parentSetupPrn, setParentSetupPrn] = useState('');
  const [parentSetupData, setParentSetupData] = useState<any>(null);
  const [newParentPassword, setNewParentPassword] = useState('');
  const [confirmParentPassword, setConfirmParentPassword] = useState('');
  const [parentSetupError, setParentSetupError] = useState('');

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check parent status on-the-fly or trigger modal
  const handleCheckParentActivation = async (inputEmail: string) => {
    const cleanEmail = inputEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered parent email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const status = await apiService.checkParentStatus(cleanEmail);
      setIsLoading(false);

      if (status.isRegisteredUnderStudent) {
        setParentSetupEmail(cleanEmail);
        setParentSetupPrn(status.studentPrn || status.studentRollNo || '');
        setParentSetupData(status);
        setShowParentSetupModal(true);
      } else {
        setErrorMessage('This email is not registered under any student record. Please ask your ward to provide your email during registration.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Could not verify parent registration status.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim() || !password.trim()) {
      setErrorMessage('Please enter both email/PRN and password.');
      return;
    }

    setIsLoading(true);

    try {
      const dbUser = await apiService.loginUser(loginIdentifier.trim(), password.trim());
      setIsLoading(false);
      onLoginSuccess(dbUser.role, dbUser.email || loginIdentifier.trim(), dbUser.user || dbUser);
    } catch (err: any) {
      setIsLoading(false);

      // If parent email without user password, trigger activation modal
      if (loginIdentifier.includes('@') && !loginIdentifier.endsWith('@sitcoe.ac.in')) {
        try {
          const status = await apiService.checkParentStatus(loginIdentifier.trim());
          if (status.isRegisteredUnderStudent && !status.hasPassword) {
            setParentSetupEmail(loginIdentifier.trim());
            setParentSetupPrn(status.studentPrn || status.studentRollNo || '');
            setParentSetupData(status);
            setShowParentSetupModal(true);
            return;
          }
        } catch {
          // ignore fallback
        }
      }

      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleParentPasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setParentSetupError('');

    if (!parentSetupPrn.trim()) {
      setParentSetupError("Please enter your ward's student PRN / Roll Number for verification.");
      return;
    }

    if (!newParentPassword.trim()) {
      setParentSetupError('Please enter a password.');
      return;
    }

    if (newParentPassword.length < 6) {
      setParentSetupError('Password must be at least 6 characters long.');
      return;
    }

    if (newParentPassword !== confirmParentPassword) {
      setParentSetupError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiService.setupParentPassword({
        email: parentSetupEmail,
        password: newParentPassword.trim(),
        prn: parentSetupPrn.trim(),
        parentName: parentSetupData?.parentName || 'Parent'
      });

      setIsLoading(false);
      setShowParentSetupModal(false);
      onLoginSuccess('parent', res.email || parentSetupEmail, res.user || res);
    } catch (err: any) {
      setIsLoading(false);
      setParentSetupError(err.message || 'Failed to activate parent account.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim() || !email.trim() || !regPassword.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (!isGoogleVerified) {
      setErrorMessage("Google Verification Required: Please click 'Verify with Google' next to your email address before completing registration.");
      return;
    }

    if (regRole === 'student' && !email.trim().toLowerCase().endsWith('@sitcoe.org.in')) {
      setErrorMessage('Registration Denied: Student accounts must use an official Google Workspace email ending with @sitcoe.org.in (e.g. prn.sitcoe@sitcoe.org.in). Personal email addresses are not permitted.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== confirmRegPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password to confirm.');
      return;
    }

    setIsLoading(true);

    try {
      if (regRole === 'student') {
        if (!prn.trim() || !rollNo.trim()) {
          setIsLoading(false);
          setErrorMessage('PRN and Roll Number are required for student registration.');
          return;
        }

        if (!parentName.trim() || !parentEmail.trim()) {
          setIsLoading(false);
          setErrorMessage("Please provide Parent's Full Name and Parent's Email Address.");
          return;
        }

        // 1. Register User in Database
        const dbUser = await apiService.registerUser({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: regPassword.trim(),
          role: 'student',
          roleTitle: `${department} B.Tech Student`,
          department: department
        });

        // 2. Add Student Record in Database
        const parsedCgpa = Math.min(10.0, Math.max(0, parseFloat(cgpa) || 8.0));
        try {
          await apiService.addStudent({
            name: fullName.trim(),
            rollNo: rollNo.trim(),
            prn: prn.trim(),
            email: email.trim().toLowerCase(),
            department: department,
            academicYear: academicYear,
            division: division,
            batchGroup: batchGroup,
            cohortBatch: '2024-2028',
            gpa: parsedCgpa,
            attendance: 90,
            status: 'Active',
            parentName: parentName.trim(),
            parentEmail: parentEmail.trim().toLowerCase(),
            parentPhone: parentPhone.trim(),
            parentRelationship: parentRelationship
          });
        } catch (err) {
          console.warn('Student record add notice:', err);
        }

        // 3. Save Student Academic Scores
        try {
          await apiService.saveStudentAcademicData(prn.trim(), {
            prn: prn.trim(),
            qualificationPath: qualificationPath,
            tenthPercentage: parseFloat(tenthPercentage) || 0,
            twelfthPercentage: qualificationPath === '12TH' ? parseFloat(twelfthPercentage) || 0 : 0,
            diplomaPercentage: qualificationPath === 'DIPLOMA' ? parseFloat(diplomaPercentage) || 0 : 0,
            cgpa: parsedCgpa,
            activeBacklogs: 0,
            totalBacklogs: 0
          });
        } catch (err) {
          console.warn('Academic data save notice:', err);
        }

        setIsLoading(false);
        onLoginSuccess('student', dbUser.email || email.trim(), dbUser.user || dbUser);

      } else if (regRole === 'faculty') {
        if (!securityCode.trim()) {
          setIsLoading(false);
          setErrorMessage('Please enter the Institutional Faculty Verification Key.');
          return;
        }

        const dbUser = await apiService.registerUser({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: regPassword.trim(),
          role: 'faculty',
          roleTitle: designation,
          department: department,
          qualification: qualification,
          specialization: specialization.trim(),
          teachingExperience: teachingExp.trim(),
          industrialExperience: industrialExp.trim(),
          securityCode: securityCode.trim()
        });

        setIsLoading(false);
        onLoginSuccess('faculty', dbUser.email || email.trim(), dbUser.user || dbUser);

      } else if (regRole === 'hod') {
        if (!securityCode.trim()) {
          setIsLoading(false);
          setErrorMessage('Please enter the Institutional HOD Security Key.');
          return;
        }

        const dbUser = await apiService.registerUser({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: regPassword.trim(),
          role: 'hod',
          roleTitle: `Head of Department (HOD ${department})`,
          department: department,
          qualification: qualification,
          specialization: specialization.trim(),
          securityCode: securityCode.trim()
        });

        setIsLoading(false);
        onLoginSuccess('hod', dbUser.email || email.trim(), dbUser.user || dbUser);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Registration failed. Please verify the input values.');
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) return;
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const profile = JSON.parse(jsonPayload);
      const verifiedEmail = (profile.email || '').toLowerCase().trim();
      const verifiedName = profile.name || verifiedEmail.split('@')[0];

      if (mode === 'register') {
        if (regRole === 'student' && !verifiedEmail.endsWith('@sitcoe.org.in')) {
          setIsLoading(false);
          setIsGoogleVerified(false);
          setEmail('');
          setErrorMessage('Google Verification Denied: Student accounts must use an official institutional Google Workspace email ending with @sitcoe.org.in (e.g. prn.sitcoe@sitcoe.org.in). Personal email domains (@gmail.com, etc.) are not allowed for students.');
          return;
        }

        setEmail(verifiedEmail);
        setIsGoogleVerified(true);
        if (!fullName.trim()) {
          setFullName(verifiedName);
        }
        setSuccessMessage(`Google identity (${verifiedEmail}) verified successfully! Complete remaining fields to finish registration.`);
      } else {
        setIsLoading(true);
        setErrorMessage('');
        const dbUser = await apiService.loginWithGoogle(verifiedEmail, response.credential);
        setIsLoading(false);
        onLoginSuccess(dbUser.role, dbUser.email || verifiedEmail, dbUser.user || dbUser);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Google identity verification failed.');
    }
  };

  const triggerGoogleOAuth = () => {
    setIsLoading(true);
    setErrorMessage('');

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1084293847291-sitcoe.apps.googleusercontent.com';

    // 1. If Google Identity Services OAuth2 Token Client is available, trigger Google native popup
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userData = await userRes.json();
                const verifiedEmail = (userData.email || '').toLowerCase().trim();
                const verifiedName = userData.name || verifiedEmail.split('@')[0];

                if (mode === 'register') {
                  if (regRole === 'student' && !verifiedEmail.endsWith('@sitcoe.org.in')) {
                    setIsLoading(false);
                    setIsGoogleVerified(false);
                    setEmail('');
                    setErrorMessage('Google Verification Denied: Student accounts must use an official institutional Google Workspace email ending with @sitcoe.org.in (e.g. prn.sitcoe@sitcoe.org.in). Personal email domains (@gmail.com, etc.) are not allowed for students.');
                    return;
                  }

                  setEmail(verifiedEmail);
                  setIsGoogleVerified(true);
                  if (!fullName.trim()) setFullName(verifiedName);
                  setIsLoading(false);
                  setSuccessMessage(`✓ Google identity (${verifiedEmail}) verified successfully! Complete remaining fields.`);
                } else {
                  const dbUser = await apiService.loginWithGoogle(verifiedEmail);
                  setIsLoading(false);
                  onLoginSuccess(dbUser.role, dbUser.email || verifiedEmail, dbUser.user || dbUser);
                }
              } catch (err: any) {
                setIsLoading(false);
                setErrorMessage(err.message || 'Failed to fetch verified Google profile.');
              }
            } else {
              setIsLoading(false);
            }
          },
          error_callback: (err: any) => {
            setIsLoading(false);
            console.warn('Google Token Client error:', err);
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Google Token Client init error:', err);
      }
    }

    // 2. Direct Google OAuth2 popup window
    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token%20id_token&scope=email%20profile%20openid&prompt=select_account`;
    window.open(authUrl, 'GoogleLogin', 'width=500,height=600,menubar=no,toolbar=no');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-3 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <img src={sitLogo} alt="Sharad Institute of Technology" className="h-10 w-auto object-contain shrink-0" />
          <div>
            <h1 className="text-sm font-bold text-[#000666] leading-tight">Sharad Institute of Technology</h1>
            <p className="text-[11px] text-slate-500">College of Engineering, Yadrav • Department Portal</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('public-landing')}
          className="w-full sm:w-auto justify-center text-xs font-semibold text-slate-600 hover:text-[#000666] flex items-center gap-1 transition-colors px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Public Portal</span>
        </button>
      </header>

      {/* Main Center Card */}
      <main className="max-w-lg w-full mx-auto my-3 sm:my-6 px-1 sm:px-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8 space-y-5">

          {/* Header & Main Mode Switcher */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'login' ? 'Sign In to Portal' : 'New Account Registration'}
            </h2>
            <p className="text-xs text-slate-500">
              {mode === 'login'
                ? 'Enter your institutional email address or PRN to continue'
                : 'Select your role and enter your institutional details to register'}
            </p>

            <div className="flex bg-slate-100 p-1 rounded-xl mt-3">
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${mode === 'login' ? 'bg-white text-[#000666] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${mode === 'register' ? 'bg-white text-[#000666] shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                New Registration
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-500 mt-0.5">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-emerald-500 mt-0.5">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* SIGN IN FORM                                            */}
          {/* ======================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address / PRN
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter email address or PRN"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-2.5 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666] focus:border-transparent transition-all"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                    person
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => handleCheckParentActivation(loginIdentifier)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    First time parent? Activate here
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666] focus:border-transparent transition-all font-mono"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                    lock
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#000666] focus:ring-0"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#000666] hover:bg-[#1a237e] text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[16px]">login</span>
                  </>
                )}
              </button>

              {/* Google Workspace SSO */}
              <button
                type="button"
                onClick={triggerGoogleOAuth}
                className="w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* REGISTRATION FORM (STUDENT, FACULTY, HOD)                 */}
          {/* ======================================================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">

              {/* Role Selector Tabs */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Select Registration Role:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => { setRegRole('student'); setErrorMessage(''); }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${regRole === 'student' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegRole('faculty'); setErrorMessage(''); }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${regRole === 'faculty' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    👨‍🏫 Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegRole('hod'); setErrorMessage(''); }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${regRole === 'hod' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                  >
                    🏛️ HOD
                  </button>
                </div>
              </div>

              {/* Common Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full legal name"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none"
                  >
                    <option value="CSE">CSE</option>
                    <option value="AIDS">AIDS</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="ENTC">ENTC</option>
                    <option value="ELECTRICAL">ELECTRICAL</option>
                    <option value="MECHATRONICS">MECHATRONICS</option>
                    <option value="BASIC_SCIENCES">BASIC SCIENCES</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {regRole === 'student' ? 'Academic Year *' : 'Highest Qualification *'}
                  </label>
                  {regRole === 'student' ? (
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value as AcademicYear)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none"
                    >
                      <option value="FE">First Year (FE)</option>
                      <option value="SE">Second Year (SE)</option>
                      <option value="TE">Third Year (TE)</option>
                      <option value="BE">Final Year (BE)</option>
                    </select>
                  ) : (
                    <select
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none"
                    >
                      <option value="Ph.D.">Ph.D. / Doctorate</option>
                      <option value="M.Tech">M.Tech / M.E.</option>
                      <option value="B.Tech">B.Tech / B.E.</option>
                      <option value="PostDoc">Post-Doctoral</option>
                    </select>
                  )}
                </div>
              </div>

              {/* ---------------- STUDENT FIELDS ---------------- */}
              {regRole === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">PRN *</label>
                      <input
                        type="text"
                        required
                        value={prn}
                        onChange={(e) => setPrn(e.target.value)}
                        placeholder="Enter 10-digit PRN"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Roll Number *</label>
                      <input
                        type="text"
                        required
                        value={rollNo}
                        onChange={(e) => setRollNo(e.target.value)}
                        placeholder="Enter roll number"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Division</label>
                      <select
                        value={division}
                        onChange={(e) => setDivision(e.target.value as Division)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                      >
                        <option value="Div A">Div A</option>
                        <option value="Div B">Div B</option>
                        <option value="Div C">Div C</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Batch</label>
                      <select
                        value={batchGroup}
                        onChange={(e) => setBatchGroup(e.target.value as BatchGroup)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none"
                      >
                        {division === 'Div A' && (
                          <>
                            <option value="A1">Batch A1 (Batch 1)</option>
                            <option value="A2">Batch A2 (Batch 2)</option>
                            <option value="A3">Batch A3 (Batch 3)</option>
                          </>
                        )}
                        {division === 'Div B' && (
                          <>
                            <option value="B1">Batch B1 (Batch 1)</option>
                            <option value="B2">Batch B2 (Batch 2)</option>
                            <option value="B3">Batch B3 (Batch 3)</option>
                          </>
                        )}
                        {division === 'Div C' && (
                          <>
                            <option value="C1">Batch C1 (Batch 1)</option>
                            <option value="C2">Batch C2 (Batch 2)</option>
                            <option value="C3">Batch C3 (Batch 3)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Prior Marks & CGPA */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-700 uppercase">Prior Academic Marks *</span>
                      <div className="flex gap-2.5">
                        <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="qualPath"
                            checked={qualificationPath === '12TH'}
                            onChange={() => setQualificationPath('12TH')}
                            className="text-[#000666] focus:ring-0"
                          />
                          <span>12th (HSC)</span>
                        </label>
                        <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="qualPath"
                            checked={qualificationPath === 'DIPLOMA'}
                            onChange={() => setQualificationPath('DIPLOMA')}
                            className="text-[#000666] focus:ring-0"
                          />
                          <span>Diploma (DSE)</span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">10th (SSC) % *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          required
                          value={tenthPercentage}
                          onChange={(e) => setTenthPercentage(e.target.value)}
                          placeholder="e.g. 85.50"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                        />
                      </div>

                      {qualificationPath === '12TH' ? (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">12th (HSC) % *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            value={twelfthPercentage}
                            onChange={(e) => setTwelfthPercentage(e.target.value)}
                            placeholder="e.g. 80.00"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-amber-800 mb-0.5">Diploma % *</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            required
                            value={diplomaPercentage}
                            onChange={(e) => setDiplomaPercentage(e.target.value)}
                            placeholder="e.g. 82.00"
                            className="w-full bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-amber-950 font-bold outline-none focus:ring-2 focus:ring-amber-600"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Current CGPA (0-10) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          required
                          value={cgpa}
                          onChange={(e) => setCgpa(e.target.value)}
                          placeholder="e.g. 8.50"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-blue-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parent Details */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase block">
                      Parent / Guardian Information *
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="Enter parent's full name"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                      />
                      <input
                        type="email"
                        required
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                        placeholder="Enter parent's email address"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="Enter parent's phone number"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                      />
                      <select
                        value={parentRelationship}
                        onChange={(e) => setParentRelationship(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none"
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ---------------- FACULTY FIELDS ---------------- */}
              {regRole === 'faculty' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Rank *</label>
                      <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold outline-none"
                      >
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Adjunct Faculty">Adjunct Faculty</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Domain / Specialization</label>
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        placeholder="e.g. Cloud Computing, AI"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Teaching Exp (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={teachingExp}
                        onChange={(e) => setTeachingExp(e.target.value)}
                        placeholder="Years"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Industrial Exp (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={industrialExp}
                        onChange={(e) => setIndustrialExp(e.target.value)}
                        placeholder="Years"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                      />
                    </div>
                  </div>

                  {/* Institutional Verification Code */}
                  <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                    <label className="text-xs font-bold text-teal-900 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-teal-700">verified_user</span>
                      <span>Institutional Faculty Verification Key *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={securityCode}
                      onChange={(e) => setSecurityCode(e.target.value)}
                      placeholder="Enter verification key"
                      className="w-full bg-white border border-teal-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-teal-900 outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </>
              )}

              {/* ---------------- HOD FIELDS ---------------- */}
              {regRole === 'hod' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Domain / Research Specialization</label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Distributed Systems, VLSI"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                    />
                  </div>

                  {/* Institutional HOD Security Key */}
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                    <label className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-indigo-700">admin_panel_settings</span>
                      <span>Institutional HOD Security Key *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={securityCode}
                      onChange={(e) => setSecurityCode(e.target.value)}
                      placeholder="Enter security key"
                      className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </>
              )}

              {/* Official Email with Integrated Google Verification */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {regRole === 'student'
                      ? 'Official Student Email (@sitcoe.org.in) *'
                      : regRole === 'faculty'
                        ? 'Faculty Email Address (Any Domain) *'
                        : 'HOD Email Address (Any Domain) *'}
                  </label>
                  {isGoogleVerified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      <span>✓ Google Verified</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      * Google Verification Required
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setIsGoogleVerified(false);
                    }}
                    placeholder={
                      regRole === 'student'
                        ? 'e.g. prn.sitcoe@sitcoe.org.in'
                        : regRole === 'faculty'
                          ? 'e.g. prof.name@gmail.com or name@sitcoe.ac.in'
                          : 'e.g. hod.dept@gmail.com or hod@sitcoe.ac.in'
                    }
                    className={`w-full bg-slate-50 border rounded-xl pl-3 pr-36 py-2 text-xs text-slate-900 outline-none transition-all ${isGoogleVerified
                        ? 'border-emerald-400 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500 font-medium'
                        : 'border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#000666]'
                      }`}
                  />
                  <div className="absolute right-1">
                    {isGoogleVerified ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsGoogleVerified(false);
                          triggerGoogleOAuth();
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[13px]">sync</span>
                        <span>Change</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={triggerGoogleOAuth}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Verify with Google</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Set Password *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmRegPassword}
                    onChange={(e) => setConfirmRegPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={`w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666] ${confirmRegPassword && confirmRegPassword !== regPassword
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-slate-300'
                      }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3 ${isGoogleVerified
                    ? 'bg-[#000666] hover:bg-[#1a237e] text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
              >
                {isLoading ? (
                  <span>Registering Profile in Database...</span>
                ) : !isGoogleVerified ? (
                  <>
                    <span>Verify with Google to Register</span>
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                  </>
                ) : (
                  <>
                    <span>Complete {regRole === 'student' ? 'Student' : regRole === 'faculty' ? 'Faculty' : 'HOD'} Registration</span>
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Simple Footer */}
      <footer className="text-center py-2 text-[11px] text-slate-400">
        © {new Date().getFullYear()} Sharad Institute of Technology College of Engineering, Yadrav (Ichalkaranji) • SITCOE Portal
      </footer>

      {/* ======================================================== */}
      {/* PARENT FIRST-TIME PASSWORD CREATION MODAL               */}
      {/* ======================================================== */}
      {showParentSetupModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px] text-amber-600">family_restroom</span>
                  <span>Activate Parent Portal Access</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  First-time password setup for registered parent
                </p>
              </div>
              <button onClick={() => setShowParentSetupModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Linked Ward Summary & Multi-Child Selection */}
            {parentSetupData && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span>Welcome, {parentSetupData.parentName || 'Parent / Guardian'}!</span>
                  {parentSetupData.wardsCount > 1 && (
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                      {parentSetupData.wardsCount} Children Registered
                    </span>
                  )}
                </div>

                {parentSetupData.wards && parentSetupData.wards.length > 1 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-amber-900 block">
                      Select your ward to verify PRN:
                    </span>
                    <div className="space-y-1">
                      {parentSetupData.wards.map((w: any) => {
                        const isSelected = parentSetupPrn === w.studentPrn || parentSetupPrn === w.studentRollNo;
                        return (
                          <button
                            key={w.studentPrn || w.studentRollNo}
                            type="button"
                            onClick={() => setParentSetupPrn(w.studentPrn || w.studentRollNo)}
                            className={`w-full p-2 rounded-lg text-left text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-800 hover:bg-amber-100/70 border-amber-200'
                              }`}
                          >
                            <span>🎓 {w.studentName} ({w.department} - {w.academicYear})</span>
                            <span className="font-mono text-[11px] opacity-90">{w.studentPrn || w.studentRollNo}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-800">
                    You are registered as the parent of{' '}
                    <strong className="text-amber-950">{parentSetupData.studentName}</strong> (Roll No:{' '}
                    <span className="font-mono">{parentSetupData.studentRollNo || parentSetupData.studentPrn}</span>,{' '}
                    {parentSetupData.department} Dept).
                  </p>
                )}
              </div>
            )}

            {parentSetupError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {parentSetupError}
              </div>
            )}

            <form onSubmit={handleParentPasswordSetup} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Parent Email</label>
                <input
                  type="email"
                  disabled
                  value={parentSetupEmail}
                  className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Child's Student PRN / Roll Number (For Verification) *
                </label>
                <input
                  type="text"
                  required
                  value={parentSetupPrn}
                  onChange={(e) => setParentSetupPrn(e.target.value)}
                  placeholder="Enter 10-digit Student PRN (e.g. 2410104007)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-[#000666]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                  <input
                    type="password"
                    required
                    value={newParentPassword}
                    onChange={(e) => setNewParentPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-[#000666]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmParentPassword}
                    onChange={(e) => setConfirmParentPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:ring-2 focus:ring-[#000666]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowParentSetupModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#000666] hover:bg-[#1a237e] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isLoading ? 'Activating...' : 'Activate & Sign In'}
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
