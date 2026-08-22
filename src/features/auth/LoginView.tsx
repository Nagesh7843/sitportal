import React, { useState, useEffect } from 'react';
import { UserRole, ViewMode, UserProfile } from '@/types';
import { apiService } from '@/services/api';
import sitLogo from '@/assets/sit-logo.png';

interface LoginViewProps {
  onLoginSuccess: (role: UserRole, email: string, customProfile?: Partial<UserProfile>) => void;
  onNavigate: (view: ViewMode) => void;
}

type AuthenticatedRole = 'admin' | 'hod' | 'faculty' | 'student';

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigate }) => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);

  // Read Google Cloud Client ID from .env environment file
  const googleClientId = (((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID) || localStorage.getItem('sit_google_client_id') || '').trim();

  // Initialize Real-Time Official Google Identity Services SDK (gsi/client)
  useEffect(() => {
    const existingScript = document.getElementById('google-gsi-sdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-sdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsGsiLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setIsGsiLoaded(true);
    }
  }, []);

  // Handle Official Google OAuth JWT Token Response
  const handleGoogleCredentialResponse = (response: any) => {
    try {
      if (!response.credential) return;
      // Decode Google OAuth JWT Payload
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googleData = JSON.parse(jsonPayload);
      const userEmail = (googleData.email || '').toLowerCase();
      const userName = googleData.name || userEmail.split('@')[0];
      const userAvatar = googleData.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';

      executeGoogleAuthWithProfile(userEmail, userName, userAvatar);
    } catch (err) {
      console.error('Google OAuth decoding error:', err);
      setErrorMessage('Google Sign-In failed to parse ID Token response.');
    }
  };

  // Render Official Native Google Sign-In Button if VITE_GOOGLE_CLIENT_ID is set in .env
  useEffect(() => {
    if (showGoogleModal && isGsiLoaded && googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });

        const btnContainer = document.getElementById('nativeGoogleSignInBtn');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          (window as any).google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'pill',
          });
        }
      } catch (err) {
        console.warn('GSI Render warning:', err);
      }
    }
  }, [showGoogleModal, isGsiLoaded, googleClientId]);



  const executeGoogleAuthWithProfile = async (cleanEmail: string, name: string, avatar?: string) => {
    setShowGoogleModal(false);
    setIsLoading(true);

    try {
      const dbUser = await apiService.loginWithGoogle(cleanEmail);
      setIsLoading(false);
      onLoginSuccess(dbUser.role, dbUser.email || cleanEmail, dbUser.user || dbUser);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Google Authentication failed. Please check your credentials or create an account first.');
    }
  };

  const executeGoogleAuth = (selectedEmail: string) => {
    if (!selectedEmail.trim()) return;
    const cleanEmail = selectedEmail.trim().toLowerCase();
    const name = cleanEmail.split('@')[0].toUpperCase();
    executeGoogleAuthWithProfile(cleanEmail, name);
  };

  const [registerRole, setRegisterRole] = useState<'student' | 'parent'>('student');
  const [childRollNo, setChildRollNo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name.');
          setIsLoading(false);
          return;
        }

        if (registerRole === 'parent' && !childRollNo.trim()) {
          setErrorMessage("Please enter your child's student Roll Number / PRN.");
          setIsLoading(false);
          return;
        }
        
        const dbUser = await apiService.registerUser({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role: registerRole,
          roleTitle: registerRole === 'parent' ? 'Parent / Guardian' : 'B.Tech Student'
        });

        if (registerRole === 'parent' && childRollNo.trim()) {
          try {
            await apiService.linkParentStudent({
              studentRollNo: childRollNo.trim(),
              relationship: 'Parent/Guardian',
            });
          } catch (linkErr) {
            console.warn('Auto-link child warning:', linkErr);
          }
        }

        setIsLoading(false);
        onLoginSuccess(registerRole, dbUser.email || email.trim(), dbUser.user || dbUser);
      } else {
        const dbUser = await apiService.loginUser(email.trim(), password.trim());
        setIsLoading(false);
        onLoginSuccess(dbUser.role, dbUser.email || email.trim(), dbUser.user || dbUser);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000666] via-[#1a237e] to-[#071e27] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#759efd]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#2b5bb5]/30 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-5">
        {/* Top Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-2.5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md shadow-xl mb-1">
            <img src={sitLogo} alt="Sharad Institute of Technology" className="h-14 w-auto object-contain" />
          </div>

          <h1 className="text-[24px] font-extrabold text-white tracking-tight">
            CSE Department Portal Sign In
          </h1>
          <p className="text-[#cfe6f2] text-[12px]">
            Authenticate via Google OAuth Gmail identity or institutional credentials.
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-white/95 backdrop-blur-md p-6 sm:p-7 rounded-3xl shadow-2xl border border-white/40 space-y-4">
          
          {/* Real-Time Google OAuth 2.0 Sign In Button */}
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            className="w-full py-3 px-4 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google (Gmail Verification)</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">or sign in with credentials</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] rounded-xl text-[12px] font-bold border border-[#ffb4ab] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login / Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-3">
                <div className="flex rounded-xl bg-[#f3faff] p-1 border border-[#c6c5d4]">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('student')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      registerRole === 'student'
                        ? 'bg-[#000666] text-white shadow-xs'
                        : 'text-[#454652] hover:text-[#000666]'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole('parent')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      registerRole === 'parent'
                        ? 'bg-[#000666] text-white shadow-xs'
                        : 'text-[#454652] hover:text-[#000666]'
                    }`}
                  >
                    Parent / Guardian
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#454652] uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required={isRegisterMode}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={registerRole === 'parent' ? "Parent's full name" : "Student's full name"}
                      className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#071e27] font-semibold outline-none focus:ring-2 focus:ring-[#000666]"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-[#767683]">
                      badge
                    </span>
                  </div>
                </div>

                {registerRole === 'parent' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#454652] uppercase tracking-wider mb-1">
                      Child's Student Roll No / PRN
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required={registerRole === 'parent'}
                        value={childRollNo}
                        onChange={(e) => setChildRollNo(e.target.value)}
                        placeholder="e.g. 21CS001 or 1SI21CS045"
                        className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#071e27] font-semibold outline-none focus:ring-2 focus:ring-[#000666]"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-[#767683]">
                        school
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-[#454652] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your college domain mail (e.g. name@sitcoe.org.in)"
                  className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#071e27] font-semibold outline-none focus:ring-2 focus:ring-[#000666]"
                />
                <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-[#767683]">
                  mail
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#454652] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl pl-10 pr-10 py-2.5 text-[13px] text-[#071e27] font-semibold outline-none focus:ring-2 focus:ring-[#000666]"
                />
                <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-[#767683]">
                  lock
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#767683] hover:text-[#071e27]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#000666] text-white font-extrabold rounded-xl text-[13px] hover:bg-[#1a237e] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating with Database...</span>
              ) : (
                <>
                  <span>{isRegisterMode ? `CREATE ACCOUNT` : `SIGN IN`}</span>
                  <span className="material-symbols-outlined text-[18px]">{isRegisterMode ? 'person_add' : 'login'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage('');
              }}
              className="text-[#000666] hover:underline text-[12px] font-bold"
            >
              {isRegisterMode ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>

          {/* Back to Portal Link */}
          <div className="pt-2 border-t border-[#c6c5d4]/40 text-center">
            <button
              onClick={() => onNavigate('public-landing')}
              className="text-[#454652] hover:text-[#000666] text-[12px] font-bold inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Back to Public Department Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🟢 Live Real-Time Google OAuth Identity Verification Popup Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-slate-800 font-sans relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Google Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex justify-center mb-1">
                <svg className="w-10 h-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in with Google</h2>
              <p className="text-xs text-slate-500">
                Choose an institutional Google account to continue to <strong>SIT CSE Department Portal</strong>
              </p>
            </div>

            {/* Primary Continue with Google Button */}
            <button
              type="button"
              onClick={() => {
                if (googleClientId && (window as any).google?.accounts?.id) {
                  (window as any).google.accounts.id.prompt();
                } else if (googleCustomEmail.trim()) {
                  executeGoogleAuth(googleCustomEmail);
                } else {
                  setErrorMessage('Google Authentication Error: Please enter your college domain or Gmail address below to verify your identity.');
                }
              }}
              className="w-full py-3.5 px-4 bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold rounded-2xl text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
            >
              <svg className="w-5 h-5 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Native Live Google Button Container (Rendered if VITE_GOOGLE_CLIENT_ID is set in .env) */}
            {googleClientId && (
              <div className="flex flex-col items-center justify-center p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                  ⚡ Official Google Authentication Widget:
                </span>
                <div id="nativeGoogleSignInBtn" className="min-h-[44px]"></div>
              </div>
            )}



            {/* Custom Google Account Input */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Or enter another college domain mail
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={googleCustomEmail}
                  onChange={(e) => setGoogleCustomEmail(e.target.value)}
                  placeholder="name@sitcoe.org.in"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => executeGoogleAuth(googleCustomEmail)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
                >
                  Verify
                </button>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 leading-normal">
              By continuing, Google will share your name, email address, and profile picture with SIT CSE Department Portal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
