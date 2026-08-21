import React, { useState, useEffect } from 'react';
import { registerWebPushDevice, isWebPushSubscribed, unsubscribeWebPushDevice } from '@/utils/webPush';
import { apiService } from '@/services/api';
import { NoticeItem } from '@/types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose
}) => {
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notices, setNotices] = useState<NoticeItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      isWebPushSubscribed().then(setFcmEnabled).catch(() => setFcmEnabled(false));
      apiService.fetchNotices()
        .then(data => {
          // Sort by publishedAt descending, take top 3
          const sorted = data.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          setNotices(sorted.slice(0, 3));
        })
        .catch(err => console.error('Failed to fetch notices for drawer:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    setIsLoading(true);
    const granted = await registerWebPushDevice();
    setFcmEnabled(granted);
    setIsLoading(false);
    if (!granted) {
      alert('Browser notification permission was not granted or subscription failed.');
    }
  };

  const handleDisablePush = async () => {
    setIsLoading(true);
    const success = await unsubscribeWebPushDevice();
    if (success) {
      setFcmEnabled(false);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50">
      <div className="bg-white w-full max-w-sm h-full p-6 shadow-2xl border-l border-[#c6c5d4] flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-y-auto">
        <div className="space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-[#c6c5d4]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#000666]">notifications</span>
              <h3 className="font-bold text-[18px] text-[#071e27]">Notification Center</h3>
            </div>
            <button onClick={onClose} className="text-[#767683] hover:text-[#071e27]">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* FCM Web Push Banner */}
          <div className="bg-[#000666] text-white p-4 rounded-2xl shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#759efd]">bolt</span>
                <span className="font-bold text-[13px]">Real-time Push Alerts</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${fcmEnabled ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-[#000666]'}`}>
                {fcmEnabled ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>

            <p className="text-[#cfe6f2] text-[11px] leading-relaxed">
              {fcmEnabled
                ? 'Your device is actively receiving secure push notifications seamlessly.'
                : 'Receive real-time push notifications when urgent notices or exam schedules are published.'}
            </p>

            {!fcmEnabled ? (
              <button
                onClick={handleEnablePush}
                disabled={isLoading}
                className="w-full py-2 bg-[#759efd] text-[#00337c] font-bold rounded-xl text-[12px] hover:bg-[#b0c6ff] transition-all flex items-center justify-center gap-1.5 mt-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                <span>{isLoading ? 'Enabling...' : 'Enable Push Notifications'}</span>
              </button>
            ) : (
              <button
                onClick={handleDisablePush}
                disabled={isLoading}
                className="w-full py-2 bg-red-500/20 text-red-100 font-bold rounded-xl text-[12px] hover:bg-red-500/40 transition-all flex items-center justify-center gap-1.5 mt-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">notifications_off</span>
                <span>{isLoading ? 'Disabling...' : 'Unsubscribe Device'}</span>
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold text-[#454652] uppercase tracking-wider">Recent Portal Alerts</h4>

            {notices.length === 0 ? (
              <p className="text-[12px] text-[#767683] italic">No recent alerts found.</p>
            ) : (
              notices.map((notice) => (
                <div key={notice.id} className="p-3.5 bg-[#e6f6ff] rounded-xl border border-[#dbf1fe] space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[13px] text-[#071e27] truncate max-w-[180px]">{notice.title}</span>
                    <span className="text-[10px] text-[#767683] shrink-0">
                      {new Date(notice.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#454652] line-clamp-2">{notice.content}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-1 ${
                    notice.priority === 'URGENT' ? 'bg-[#ffe9c7] text-[#7a4b00]' :
                    notice.priority === 'HIGH' ? 'bg-[#e2ffd9] text-[#0a4d00]' :
                    'bg-[#d9e2ff] text-[#00429c]'
                  }`}>
                    {notice.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#000666] text-white font-bold text-[13px] rounded-xl mt-6 hover:bg-[#1a237e] transition-colors"
        >
          Close Notification Center
        </button>
      </div>
    </div>
  );
};
