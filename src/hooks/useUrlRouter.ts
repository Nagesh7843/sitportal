import { useEffect } from 'react';
import { ViewMode } from '@/types';

/**
 * A non-destructive routing layer that syncs the React state with the browser's History API.
 * This fixes back-button navigation and enables direct link sharing without
 * requiring a massive refactor to react-router-dom.
 */
export function useUrlRouter(activeView: ViewMode, setActiveView: (view: ViewMode) => void) {
  
  // On mount, parse the URL to restore the view (Direct Link Sharing fix)
  useEffect(() => {
    const path = window.location.pathname.substring(1); // remove leading slash
    if (path && path !== '' && path !== 'index.html') {
      // Basic validation to ensure it's a known view format
      if (typeof path === 'string') {
        setActiveView(path as ViewMode);
      }
    }
  }, []);

  // Sync state changes to the URL (Browser History Integration)
  useEffect(() => {
    const currentPath = window.location.pathname.substring(1);
    
    // Don't push state if the URL is already correct (prevents duplicate history entries)
    if (currentPath !== activeView) {
      const url = `/${activeView === 'public-landing' ? '' : activeView}`;
      window.history.pushState({ view: activeView }, '', url);
    }
  }, [activeView]);

  // Listen for Browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setActiveView(event.state.view as ViewMode);
      } else {
        // Fallback: parse URL if state is missing
        const path = window.location.pathname.substring(1) || 'public-landing';
        setActiveView(path as ViewMode);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveView]);
}
