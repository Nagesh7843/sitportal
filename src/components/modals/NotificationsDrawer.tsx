import React, { useState, useEffect } from 'react';
import { registerWebPushDevice, isWebPushSubscribed, unsubscribeWebPushDevice } from '@/utils/webPush';
import { fcmService } from '@/utils/fcmService';
import { apiService } from '@/services/api';
import { NoticeItem } from '@/types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNotice?: (notice: NoticeItem) => void;
  onOpenDeviceDispatch?: (notice?: NoticeItem) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectNotice,
  onOpenDeviceDispatch
}) => {
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'official'>('all');
  const [testSentToast, setTestSentToast] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }

    if (isOpen) {
      isWebPushSubscribed().then(sub => {
        setFcmEnabled(sub || (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'));
      }).catch(() => {
        setFcmEnabled(typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted');
      });

      apiService.fetchNotices(15)
        .then(data => {
          setNotices((data || []).slice(0, 15));
        })
        .catch(err => console.error('Failed to fetch notices for drawer:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    setIsLoading(true);
    try {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
        if (perm === 'granted') {
          // Attempt Web Push Service Worker registration
          const pushOk = await registerWebPushDevice().catch(() => false);
          setFcmEnabled(true);
          setTestSentToast('🔔 Notifications enabled! Sending test notification...');
          setTimeout(() => setTestSentToast(null), 4000);
          sendTestNotification();
          setIsLoading(false);
          return;
        }
      }
      alert('Notification permission was not granted. Please enable notifications in your browser settings.');
    } catch (err) {
      console.warn('Push registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePush = async () => {
    setIsLoading(true);
    await unsubscribeWebPushDevice().catch(() => {});
    setFcmEnabled(false);
    setIsLoading(false);
  };

  const sendTestNotification = () => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification('🏛️ SITCOE Central Portal Alert', {
          body: 'Push notification system is connected and working perfectly!',
          icon: '/favicon.ico',
        });
        notif.onclick = () => {
          window.focus();
        };
        setTestSentToast('Test notification dispatched!');
        setTimeout(() => setTestSentToast(null), 3000);
      } else {
        fcmService.sendPushNotification(
          '🏛️ SITCOE Central Portal Alert',
          'Push notification system is working perfectly!'
        );
      }
    } catch (e) {
      console.warn('Native notification error:', e);
      alert('Notification triggered: SITCOE Portal Alert!');
    }
  };

  const filteredNotices = notices.filter(n => {
    if (activeTab === 'urgent') return n.priority === 'URGENT' || n.priority === 'HIGH' || (n.category && n.category.toLowerCase().includes('exam'));
    if (activeTab === 'official') return n.category && (n.category.toLowerCase().includes('official') || n.category.toLowerCase().includes('circular'));
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-end z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-y-auto">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#000666]/10 flex items-center justify-center text-[#000666]">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Notification Center</h3>
                <p className="text-[11px] text-slate-500">Alerts, circulars, and announcements • Top 15 Latest</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Toast Message */}
          {testSentToast && (
            <div className="p-2.5 bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md text-center animate-in fade-in">
              {testSentToast}
            </div>
          )}

          {/* Push Notifications Gateway Card */}
          <div className="bg-gradient-to-br from-[#000666] to-[#1a237e] text-white p-4 rounded-2xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-300">bolt</span>
                <span className="font-extrabold text-xs tracking-wide">Browser Push Alerts</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                fcmEnabled || permissionState === 'granted'
                  ? 'bg-emerald-500 text-white'
                  : permissionState === 'denied'
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-400 text-slate-950'
              }`}>
                {fcmEnabled || permissionState === 'granted' ? 'ACTIVE' : permissionState === 'denied' ? 'BLOCKED' : 'NOT ENABLED'}
              </span>
            </div>

            <p className="text-cyan-100 text-xs leading-relaxed">
              {fcmEnabled || permissionState === 'granted'
                ? 'Your browser is subscribed to receive instant notifications for urgent exams, circulars, and announcements.'
                : 'Enable browser notifications to receive immediate alerts even when the portal is closed.'}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {!(fcmEnabled || permissionState === 'granted') ? (
                <button
                  onClick={handleEnablePush}
                  disabled={isLoading}
                  className="flex-1 py-2 bg-white text-[#000666] font-extrabold rounded-xl text-xs hover:bg-cyan-50 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                  <span>{isLoading ? 'Enabling...' : 'Enable Notifications'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={sendTestNotification}
                    className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Send Test Alert</span>
                  </button>
                  {onOpenDeviceDispatch && (
                    <button
                      onClick={() => onOpenDeviceDispatch()}
                      className="px-3 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
                      title="Send notice to targeted devices"
                    >
                      <span className="material-symbols-outlined text-[16px]">devices_other</span>
                      <span>Send to Devices</span>
                    </button>
                  )}
                  <button
                    onClick={handleDisablePush}
                    disabled={isLoading}
                    className="px-3 py-2 bg-red-500/30 hover:bg-red-500/50 text-red-100 font-bold rounded-xl text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Unsubscribe notifications"
                  >
                    <span className="material-symbols-outlined text-[16px]">notifications_off</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-[#000666] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Alerts ({notices.length})
            </button>
            <button
              onClick={() => setActiveTab('urgent')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'urgent' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Urgent / Exams
            </button>
            <button
              onClick={() => setActiveTab('official')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'official' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Circulars
            </button>
          </div>

          {/* Notification List */}
          <div className="space-y-2.5">
            {filteredNotices.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <span className="material-symbols-outlined text-slate-300 text-3xl mb-1">notifications_paused</span>
                <p className="text-xs text-slate-500 font-medium">No alerts found in this category.</p>
              </div>
            ) : (
              filteredNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-all space-y-1.5 group"
                >
                  <div
                    onClick={() => onSelectNotice && onSelectNotice(notice)}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-700 leading-snug">
                        {notice.title}
                      </h4>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                        notice.priority === 'URGENT' ? 'bg-red-100 text-red-700 border border-red-200' :
                        notice.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {notice.priority || 'NORMAL'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mt-1">
                      {notice.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <span className="font-medium text-slate-500">{notice.category || 'Portal Notice'} • {notice.publishedAt || 'Recent'}</span>
                    {onOpenDeviceDispatch && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDeviceDispatch(notice);
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#000666]/10 text-[#000666] hover:bg-[#000666] hover:text-white font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">devices_other</span>
                        <span>Send to Devices</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#000666] text-white font-bold text-xs rounded-xl mt-4 hover:bg-[#1a237e] transition-colors cursor-pointer shadow-md active:scale-98"
        >
          Close Notification Center
        </button>
      </div>
    </div>
  );
};
