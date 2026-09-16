import React from 'react';
import { ViewMode, UserRole } from '@/types';
import { Home, LayoutDashboard, Megaphone, HelpCircle, Menu, School } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  userRole: UserRole;
  onOpenMobileSidebar: () => void;
  unreadCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onNavigate,
  userRole,
  onOpenMobileSidebar,
  unreadCount = 0
}) => {
  const getDashboardView = (): ViewMode => {
    switch (userRole) {
      case 'admin':
        return 'dashboard';
      case 'hod':
        return 'hod-dashboard';
      case 'faculty':
        return 'faculty-portal';
      case 'student':
        return 'student-dashboard';
      case 'parent':
        return 'parent-dashboard';
      default:
        return 'organization';
    }
  };

  const getDashboardLabel = (): string => {
    switch (userRole) {
      case 'admin':
        return 'Admin';
      case 'hod':
        return 'HOD Hub';
      case 'faculty':
        return 'Faculty';
      case 'student':
        return 'Student';
      case 'parent':
        return 'Parent';
      default:
        return 'Depts';
    }
  };

  const dashboardView = getDashboardView();

  const navButtons = [
    {
      id: 'public-landing' as ViewMode,
      label: 'Home',
      icon: Home,
      isActive: activeView === 'public-landing'
    },
    {
      id: 'notices' as ViewMode,
      label: 'Notices',
      icon: Megaphone,
      isActive: activeView === 'notices',
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      id: dashboardView,
      label: getDashboardLabel(),
      icon: userRole === 'student' ? School : LayoutDashboard,
      isActive: activeView === dashboardView
    },
    {
      id: 'questions' as ViewMode,
      label: 'Q&A',
      icon: HelpCircle,
      isActive: activeView === 'questions'
    }
  ];

  return (
    <nav 
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 safe-pb"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navButtons.map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.label}
              onClick={() => onNavigate(btn.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                btn.isActive 
                  ? 'text-[#000666] font-bold' 
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${btn.isActive ? 'scale-110 text-[#000666]' : ''}`} />
                {btn.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 py-0.2 rounded-full ring-2 ring-white animate-pulse">
                    {btn.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${btn.isActive ? 'font-bold' : ''}`}>
                {btn.label}
              </span>
              {btn.isActive && (
                <span className="w-1 h-1 bg-[#000666] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}

        {/* More / Menu Drawer Trigger */}
        <button
          onClick={onOpenMobileSidebar}
          className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-500 hover:text-slate-800 font-medium transition-all"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};
