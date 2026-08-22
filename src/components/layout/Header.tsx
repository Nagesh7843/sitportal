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
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="relative flex justify-between items-center px-3 sm:px-6 w-full sticky top-0 z-30 bg-[#f3faff] h-[64px] border-b border-[#c6c5d4] shadow-xs font-sans">
      <div className="flex items-center gap-2 sm:gap-6 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-[#000666] hover:bg-[#d5ecf8] transition-colors focus-visible:ring-2 focus-visible:ring-[#000666] outline-none shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
            aria-expanded="false"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">menu</span>
          </button>
        )}

        {canGoBack && onGoBack && (
          <button
            onClick={onGoBack}
            className="p-2 rounded-xl text-[#000666] hover:bg-[#d5ecf8] transition-colors focus-visible:ring-2 focus-visible:ring-[#000666] outline-none shrink-0"
            title="Go Back"
            aria-label="Go Back"
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">arrow_back</span>
          </button>
        )}

        {/* Mobile Search Toggle Button */}
        <button
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          className="md:hidden p-2 rounded-xl text-[#454652] hover:bg-[#d5ecf8] hover:text-[#000666] transition-colors focus-visible:ring-2 focus-visible:ring-[#000666] outline-none shrink-0"
          title="Search Portal"
          aria-label="Toggle Mobile Search Bar"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            {showMobileSearch ? 'close' : 'search'}
          </span>
        </button>

        {/* Global Search Bar (Desktop) */}
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767683] hover:text-[#071e27] focus-visible:ring-2 focus-visible:ring-[#000666] outline-none"
              aria-label="Clear Search"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Expandable Search Drawer Overlay */}
      {showMobileSearch && (
        <div className="md:hidden absolute top-[64px] left-0 right-0 bg-[#f3faff] p-3 border-b border-[#c6c5d4] shadow-md z-40 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#454652] text-[20px]">
              search
            </span>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, faculty, or students..."
              className="w-full pl-10 pr-9 py-2 bg-[#dbf1fe] rounded-xl border border-[#c6c5d4] text-[13px] text-[#071e27] placeholder-[#767683] focus:outline-none focus:ring-2 focus:ring-[#000666]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#767683] hover:text-[#071e27]"
                aria-label="Clear Search"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Icon */}
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#454652] hover:bg-[#d5ecf8] hover:text-[#000666] transition-colors focus-visible:ring-2 focus-visible:ring-[#000666] outline-none"
          title="Notifications"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full border border-white" aria-hidden="true"></span>
          )}
        </button>

        {/* Help Center Icon */}
        <button
          onClick={onOpenHelp}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-[#454652] hover:bg-[#d5ecf8] hover:text-[#000666] transition-colors hidden sm:flex focus-visible:ring-2 focus-visible:ring-[#000666] outline-none"
          title="Help & Guidelines"
          aria-label="Help and Guidelines"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">help</span>
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
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer p-1 rounded-xl hover:bg-[#d5ecf8] transition-colors focus-visible:ring-2 focus-visible:ring-[#000666] outline-none"
              aria-label="Profile Menu"
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
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
              <span className="material-symbols-outlined text-[#454652] text-[18px]" aria-hidden="true">
                expand_more
              </span>
            </button>

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
