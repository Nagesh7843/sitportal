import { useEffect, useRef } from 'react';
import { ViewMode } from '@/types';

export function getInitialView(): ViewMode {
  // 1. Check URL pathname first (e.g. /notices, /dashboard, /curriculum)
  const path = window.location.pathname.replace(/^\/+/, '').trim();
  const validViews: ViewMode[] = [
    'public-landing', 'dashboard', 'hod-dashboard', 'faculty-portal', 'student-dashboard', 'parent-dashboard',
    'notices', 'faculty', 'students', 'curriculum', 'documents', 'analytics', 'settings',
    'bulk-email', 'faculty-email', 'questions', 'academic-calendar', 'login'
  ];
  
  if (path && validViews.includes(path as ViewMode)) {
    return path as ViewMode;
  }

  // 2. Check localStorage sit_portal_active_view
  const savedActive = localStorage.getItem('sit_portal_active_view');
  if (savedActive && validViews.includes(savedActive as ViewMode)) {
    return savedActive as ViewMode;
  }

  // 3. Check saved auth session
  const savedSession = localStorage.getItem('sit_portal_auth_session');
  if (savedSession) {
    try {
      const { role, activeView: sessionView } = JSON.parse(savedSession);
      if (sessionView && validViews.includes(sessionView as ViewMode)) {
        return sessionView as ViewMode;
      }
      if (role === 'admin') return 'dashboard';
      if (role === 'hod') return 'hod-dashboard';
      if (role === 'faculty') return 'faculty-portal';
      if (role === 'parent') return 'parent-dashboard';
      if (role === 'student') return 'student-dashboard';
    } catch (e) {
      console.warn('Session parse error:', e);
    }
  }

  return 'public-landing';
}

/**
 * A non-destructive routing layer that syncs the React state with the browser's History API
 * and preserves exact page position across page reloads.
 */
export function useUrlRouter(activeView: ViewMode, setActiveView: (view: ViewMode) => void) {
  const isInitialMount = useRef(true);

  // Sync state changes to the URL (Browser History Integration) and localStorage
  useEffect(() => {
    // Save to localStorage so state is always preserved on reload
    localStorage.setItem('sit_portal_active_view', activeView);

    const savedSession = localStorage.getItem('sit_portal_auth_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        parsed.activeView = activeView;
        localStorage.setItem('sit_portal_auth_session', JSON.stringify(parsed));
      } catch (ignored) {}
    }

    const currentPath = window.location.pathname.replace(/^\/+/, '').trim();
    const targetPath = activeView === 'public-landing' ? '' : activeView;

    if (currentPath !== targetPath) {
      const url = targetPath ? `/${targetPath}` : '/';
      if (isInitialMount.current) {
        window.history.replaceState({ view: activeView }, '', url);
      } else {
        window.history.pushState({ view: activeView }, '', url);
      }
    }
    isInitialMount.current = false;
  }, [activeView]);

  // Listen for Browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setActiveView(event.state.view as ViewMode);
      } else {
        const path = window.location.pathname.replace(/^\/+/, '').trim() || 'public-landing';
        setActiveView(path as ViewMode);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveView]);
}
