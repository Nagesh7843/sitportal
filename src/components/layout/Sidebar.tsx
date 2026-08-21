import React from 'react';
import { ViewMode, UserRole } from '@/types';
import sitLogo from '@/assets/sit-logo.png';

interface SidebarProps {
  activeView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  userRole: UserRole;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenUrgentNotice?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  userRole,
  isMobileOpen = false,
  onCloseMobile
}) => {
  // Role-aware Navigation Items
  const getNavItems = (): { id: ViewMode; label: string; icon: string }[] => {
    if (userRole === 'admin') {
      return [
        { id: 'public-landing', label: 'Portal Home', icon: 'public' },
        { id: 'dashboard', label: 'Admin Dashboard', icon: 'dashboard' },
        { id: 'notices', label: 'Digital Notices', icon: 'campaign' },
        { id: 'documents', label: 'Document Library', icon: 'folder_open' },
        { id: 'curriculum', label: 'Curriculum', icon: 'menu_book' },
        { id: 'faculty', label: 'Faculty Directory', icon: 'groups' },
        { id: 'students', label: 'Students Directory', icon: 'school' },
        { id: 'analytics', label: 'System Analytics', icon: 'analytics' },
      ];
    } else if (userRole === 'hod') {
      return [
        { id: 'public-landing', label: 'Portal Home', icon: 'public' },
        { id: 'hod-dashboard', label: 'HOD Executive Hub', icon: 'shield' },
        { id: 'notices', label: 'Digital Notices', icon: 'campaign' },
        { id: 'documents', label: 'Document Library', icon: 'folder_open' },
        { id: 'curriculum', label: 'Curriculum', icon: 'menu_book' },
        { id: 'faculty', label: 'Faculty Directory', icon: 'groups' },
        { id: 'students', label: 'Students Directory', icon: 'school' },
        { id: 'analytics', label: 'System Analytics', icon: 'analytics' },
      ];
    } else if (userRole === 'faculty') {
      return [
        { id: 'public-landing', label: 'Portal Home', icon: 'public' },
        { id: 'faculty-portal', label: 'Faculty Hub', icon: 'badge' },
        { id: 'notices', label: 'Digital Notices', icon: 'campaign' },
        { id: 'documents', label: 'Document Library', icon: 'folder_open' },
        { id: 'curriculum', label: 'Curriculum', icon: 'menu_book' },
        { id: 'faculty', label: 'Faculty Roster', icon: 'groups' },
        { id: 'students', label: 'Students Directory', icon: 'school' },
      ];
    } else {
      // Student or Public
      return [
        { id: 'public-landing', label: 'Portal Home', icon: 'public' },
        { id: 'notices', label: 'Digital Notices', icon: 'campaign' },
        { id: 'documents', label: 'Document Library', icon: 'folder_open' },
        { id: 'curriculum', label: 'Curriculum & Syllabus', icon: 'menu_book' },
        { id: 'faculty', label: 'Faculty Availability', icon: 'groups' },
      ];
    }
  };

  const navItems = getNavItems();

  const handleNavClick = (view: ViewMode) => {
    onNavigate(view);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Responsive Sidebar Drawer */}
      <aside className={`w-[260px] h-screen fixed left-0 top-0 bg-[#e6f6ff] border-r border-[#c6c5d4] flex flex-col py-2 z-50 transition-transform duration-300 ${
        isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Identity & Close Mobile Button */}
        <div className="px-4 mb-4 flex items-center justify-between">
          <div 
            onClick={() => handleNavClick('public-landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="shrink-0 group-hover:scale-105 transition-transform">
              <img src={sitLogo} alt="SIT Logo" className="w-12 h-auto object-contain drop-shadow-md" />
            </div>
            <div>
              <h1 className="font-bold text-[17px] leading-tight text-[#071e27] group-hover:text-[#2b5bb5] transition-colors">
                CSE Department
              </h1>
              <p className="text-[10px] font-semibold text-[#454652] opacity-80 uppercase tracking-wider">
                Communication Portal
              </p>
            </div>
          </div>

          {/* Close button for Mobile Drawer */}
          {onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-[#767683] hover:text-[#071e27] rounded-lg focus-visible:ring-2 focus-visible:ring-[#000666] outline-none"
              aria-label="Close Navigation Menu"
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">close</span>
            </button>
          )}
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-1 px-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left text-[13px] font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#000666] outline-none ${
                  isActive
                    ? 'bg-[#759efd] text-[#00337c] border-l-4 border-[#2b5bb5] shadow-xs'
                    : 'text-[#454652] hover:bg-[#d5ecf8] hover:text-[#000666]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-[#00337c]' : 'text-[#454652]'}`} aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* CTA Section & Module Badge */}
        <div className="mt-auto px-3 pb-3 space-y-2 pt-2 border-t border-[#c6c5d4]">


          {/* View Switching Quick Links */}
          <div className="space-y-1">

            {userRole === 'admin' && (
              <button
                onClick={() => handleNavClick('settings')}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#000666] outline-none ${
                  activeView === 'settings'
                    ? 'bg-[#cfe6f2] text-[#000666]'
                    : 'text-[#454652] hover:bg-[#d5ecf8]'
                }`}
                aria-current={activeView === 'settings' ? 'page' : undefined}
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">settings</span>
                <span>Settings</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
