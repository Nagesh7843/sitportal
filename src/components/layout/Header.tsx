import React, { useState } from 'react';
import { UserProfile, ViewMode } from '@/types';

interface HeaderProps {
  currentProfile: UserProfile | null;
  isLoggedIn: boolean;
  onLogout: () => void;
  onNavigate: (view: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenNotifications: () => void;
  onOpenHelp: () => void;
  onOpenEditProfile?: () => void;
  onToggleMobileSidebar?: () => void;
  unreadCount?: number;
  canGoBack?: boolean;
  onGoBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  isLoggedIn,
  onLogout,
  onNavigate,
  searchQuery,
  setSearchQuery,
  onOpenNotifications,
  onOpenHelp,
  onOpenEditProfile,
  onToggleMobileSidebar,
  unreadCount = 0,
  canGoBack,
  onGoBack
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="flex justify-between items-center px-4 sm:px-6 w-full sticky top-0 z-30 bg-[#f3faff] h-[64px] border-b border-[#c6c5d4] shadow-xs font-sans">
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Mobile Hamburger Menu Toggle */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-[#000666] hover:bg-[#d5ecf8] transition-colors"
            title="Toggle Navigation Menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        )}

        {canGoBack && onGoBack && (
          <button
            onClick={onGoBack}
            className="p-2 rounded-xl text-[#000666] hover:bg-[#d5ecf8] transition-colors"
            title="Go Back"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
        )}

        {/* Global Search Bar */}
        <div className="relative hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#454652] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices, curriculum, or directory..."
            className="pl-10 pr-4 py-2 bg-[#dbf1fe] rounded-full border-none focus:outline-none focus:ring-2 focus:ring-[#000666] w-64 lg:w-96 text-[13px] text-[#071e27] placeholder-[#767683] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767683] hover:text-[#071e27]"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#454652] hover:bg-[#d5ecf8] hover:text-[#000666] transition-colors"
          title="Notifications"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full border border-white"></span>
          )}
        </button>

        {/* Help Center Icon */}
        <button
          onClick={onOpenHelp}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#454652] hover:bg-[#d5ecf8] hover:text-[#000666] transition-colors hidden sm:flex"
          title="Help & Guidelines"
        >
          <span className="material-symbols-outlined text-[22px]">help</span>
        </button>

        <div className="h-7 w-px bg-[#c6c5d4] mx-0.5 sm:mx-1 hidden sm:block"></div>

        {/* Account Controls */}
        {!isLoggedIn || !currentProfile ? (
          <button
            onClick={() => onNavigate('login')}
            className="px-3 sm:px-4 py-2 bg-[#000666] text-white font-bold rounded-xl text-[12px] sm:text-[13px] hover:bg-[#1a237e] transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <span>SIGN IN</span>
            <span className="material-symbols-outlined text-[16px]">login</span>
          </button>
        ) : (
          <div className="relative">
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer p-1 rounded-xl hover:bg-[#d5ecf8] transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-bold text-[#071e27] leading-none">
                  {currentProfile.name}
                </p>
              </div>
              <img
                src={currentProfile.avatar}
                alt={currentProfile.name}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-[#000666] object-cover shadow-xs"
              />
              <span className="material-symbols-outlined text-[#454652] text-[18px]">
                expand_more
              </span>
            </div>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#c6c5d4] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-[#c6c5d4] bg-[#f3faff] rounded-t-2xl">
                  <p className="text-[13px] font-bold text-[#071e27]">{currentProfile.name}</p>
                  <p className="text-[11px] text-[#454652] truncate">{currentProfile.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#000666] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {currentProfile.role}
                  </span>
                </div>

                <div className="py-1">
                  {onOpenEditProfile && (
                    <button
                      onClick={() => {
                        onOpenEditProfile();
                        setShowProfileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#f3faff] text-[13px] font-semibold text-[#071e27] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#000666]">edit_square</span>
                      <span>Edit My Profile</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onNavigate('settings');
                      setShowProfileMenu(false);
                    }}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#f3faff] text-[13px] font-semibold text-[#071e27] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#454652]">settings</span>
                    <span>Account Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#ffdad6] text-[13px] font-bold text-[#ba1a1a] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">logout</span>
                    <span>Sign Out of Portal</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
