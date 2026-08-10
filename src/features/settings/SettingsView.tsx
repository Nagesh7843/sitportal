import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { registerWebPushDevice } from '@/utils/webPush';

export const SettingsView: React.FC = () => {
  const [emailAlerts, setEmailAlerts] = useState<boolean>(() => {
    const saved = localStorage.getItem('sit_setting_email_alerts');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [autoSyncDB, setAutoSyncDB] = useState<boolean>(() => {
    const saved = localStorage.getItem('sit_setting_auto_sync');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [fcmPushEnabled, setFcmPushEnabled] = useState<boolean>(false);
  const [smtpHost, setSmtpHost] = useState<string>(() => {
    return localStorage.getItem('sit_setting_smtp_host') || 'smtp.sitcoe.org';
  });
  const [activeDepartment, setActiveDepartment] = useState<string>(() => {
    return localStorage.getItem('sit_setting_active_dept') || 'CSE';
  });

  useEffect(() => {
    // Check if push notifications are already granted & active on mount
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.getRegistration('/sw.js').then((registration) => {
        if (registration) {
          registration.pushManager.getSubscription().then((subscription) => {
            if (subscription) {
              setFcmPushEnabled(true);
            }
          });
        }
      });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('sit_setting_email_alerts', JSON.stringify(emailAlerts));
    localStorage.setItem('sit_setting_auto_sync', JSON.stringify(autoSyncDB));
    localStorage.setItem('sit_setting_smtp_host', smtpHost);
    localStorage.setItem('sit_setting_active_dept', activeDepartment);
    alert('System preferences and security settings saved successfully.');
  };

  const handlePushToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setFcmPushEnabled(isEnabled);

    if (isEnabled) {
      const success = await registerWebPushDevice();
      if (success) {
        alert('Web Push notifications enabled successfully! Your device will now receive background notifications.');
      } else {
        setFcmPushEnabled(false);
      }
    } else {
      // Unsubscribe if toggled off
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Multi-Department Expansion Setup */}
      <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-4">
        <h3 className="font-bold text-[16px] text-[#071e27] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#000666]">domain</span>
          Department Scope Configuration
        </h3>
        <p className="text-[12px] text-[#454652]">
          Select active department scope or enable multi-department announcements.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { code: 'CSE', name: 'Computer Science & Eng.' },
            { code: 'IT', name: 'Information Technology' },
            { code: 'ENTC', name: 'Electronics & Telecomm.' },
          ].map((dept) => (
            <button
              key={dept.code}
              onClick={() => {
                setActiveDepartment(dept.code);
                localStorage.setItem('sit_setting_active_dept', dept.code);
              }}
              className={`p-3.5 rounded-xl border text-left font-bold text-[13px] transition-all ${
                activeDepartment === dept.code
                  ? 'bg-[#000666] text-white border-[#000666] shadow-sm'
                  : 'bg-[#f3faff] text-[#454652] border-[#c6c5d4]'
              }`}
            >
              <span className="block text-[11px] opacity-75 uppercase">Department</span>
              <span>{dept.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-6">
        <div>
          <h3 className="font-bold text-[16px] text-[#071e27] mb-3">SMTP & Notification Gateway</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                SMTP Relay Host
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
                Port Number
              </label>
              <input
                type="text"
                defaultValue="587 (TLS)"
                className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#c6c5d4] space-y-3">
          <h3 className="font-bold text-[16px] text-[#071e27]">Automated Services & FCM Push</h3>
          <label className="flex items-center justify-between p-3 bg-[#e6f6ff] rounded-xl cursor-pointer">
            <div>
              <p className="font-bold text-[13px] text-[#071e27]">Background Web Push Notifications</p>
              <p className="text-[11px] text-[#454652]">Receive native OS notifications even when browser is closed</p>
            </div>
            <input
              type="checkbox"
              checked={fcmPushEnabled}
              onChange={handlePushToggle}
              className="w-5 h-5 text-[#000666]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#e6f6ff] rounded-xl cursor-pointer">
            <div>
              <p className="font-bold text-[13px] text-[#071e27]">Automatic Student Database Sync</p>
              <p className="text-[11px] text-[#454652]">Reconcile attendance and enrollment nightly at 00:00 UTC</p>
            </div>
            <input
              type="checkbox"
              checked={autoSyncDB}
              onChange={(e) => {
                setAutoSyncDB(e.target.checked);
                localStorage.setItem('sit_setting_auto_sync', JSON.stringify(e.target.checked));
              }}
              className="w-5 h-5 text-[#000666]"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#e6f6ff] rounded-xl cursor-pointer">
            <div>
              <p className="font-bold text-[13px] text-[#071e27]">Email Audit Trail Digests</p>
              <p className="text-[11px] text-[#454652]">Send daily transmission audit digests to Department Head</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => {
                setEmailAlerts(e.target.checked);
                localStorage.setItem('sit_setting_email_alerts', JSON.stringify(e.target.checked));
              }}
              className="w-5 h-5 text-[#000666]"
            />
          </label>
        </div>

        {/* System Security Audit Stream */}
        <div className="pt-4 border-t border-[#c6c5d4] space-y-3">
          <h3 className="font-bold text-[16px] text-[#071e27]">System Audit Stream</h3>
          <div className="space-y-2 text-[12px]">
            <div className="p-3 bg-[#f3faff] rounded-xl border border-[#c6c5d4] flex justify-between items-center">
              <div>
                <p className="font-bold text-[#071e27]">Notice Category: Exam</p>
                <p className="text-[11px] text-[#454652]">Author: Dr. S. S. Gurav (HOD)</p>
              </div>
              <span className="text-[10px] text-[#767683]">Today, 11:20 AM</span>
            </div>

            <div className="p-3 bg-[#f3faff] rounded-xl border border-[#c6c5d4] flex justify-between items-center">
              <div>
                <p className="font-bold text-[#071e27]">FCM Web Push Device Token Registered</p>
                <p className="text-[11px] text-[#454652]">Role: Student (Alex Chen)</p>
              </div>
              <span className="text-[10px] text-[#767683]">Today, 10:45 AM</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#c6c5d4] flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#000666] text-white font-bold rounded-xl text-[13px] hover:bg-[#1a237e] transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
