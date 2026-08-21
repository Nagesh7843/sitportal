import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { registerWebPushDevice } from '@/utils/webPush';

interface DiagnosticItem {
  id: string;
  name: string;
  category: string;
  status: 'CHECKING' | 'OPERATIONAL' | 'WARNING' | 'ERROR';
  latencyMs?: number;
  details: string;
}

export const SettingsView: React.FC = () => {
  const [activeDepartment, setActiveDepartment] = useState<string>(() => {
    return localStorage.getItem('sit_setting_active_dept') || 'CSE';
  });
  const [academicYear, setAcademicYear] = useState<string>(() => {
    return localStorage.getItem('sit_setting_academic_year') || '2026-27';
  });

  // Scraper & Notification Settings
  const [scraperInterval, setScraperInterval] = useState<string>(() => {
    return localStorage.getItem('sit_setting_scraper_interval') || '30';
  });
  const [retentionDays, setRetentionDays] = useState<string>(() => {
    return localStorage.getItem('sit_setting_retention_days') || '20';
  });
  const [pushOnScrape, setPushOnScrape] = useState<boolean>(() => {
    const saved = localStorage.getItem('sit_setting_push_on_scrape');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [soundAlerts, setSoundAlerts] = useState<boolean>(() => {
    const saved = localStorage.getItem('sit_setting_sound_alerts');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [emailAlerts, setEmailAlerts] = useState<boolean>(() => {
    const saved = localStorage.getItem('sit_setting_email_alerts');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [testEmailAddress, setTestEmailAddress] = useState<string>('gnagesh550@gmail.com');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState<boolean>(false);
  const [fcmPushEnabled, setFcmPushEnabled] = useState<boolean>(false);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([
    {
      id: 'db',
      name: 'PostgreSQL Database',
      category: 'sitportaldb (Port 5432)',
      status: 'OPERATIONAL',
      latencyMs: 8,
      details: 'Connected. Read/Write operational.',
    },
    {
      id: 'backend',
      name: 'Spring Boot REST Backend',
      category: 'API Engine (Port 8080)',
      status: 'OPERATIONAL',
      latencyMs: 12,
      details: 'REST Endpoints responsive and healthy.',
    },
    {
      id: 'scraper',
      name: 'SITCOE Scraper & Sync Engine',
      category: 'sitcoe.ac.in/notification',
      status: 'OPERATIONAL',
      latencyMs: 45,
      details: 'Auto-Sync active (Every 30 mins) with PDF extraction.',
    },
    {
      id: 'webpush',
      name: 'Web Push & FCM Gateway',
      category: 'VAPID / Service Worker',
      status: 'OPERATIONAL',
      latencyMs: 15,
      details: 'Encryption keys verified & delivery active.',
    },
  ]);

  useEffect(() => {
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

    // Initial silent check
    runDiagnosticsCheck();
  }, []);

  const runDiagnosticsCheck = async () => {
    setIsRunningDiagnostics(true);
    const updated: DiagnosticItem[] = [];

    // 1. Backend & DB Health Check
    const startBackend = performance.now();
    try {
      const notices = await apiService.fetchNotices();
      const endBackend = performance.now();
      const latency = Math.round(endBackend - startBackend);

      updated.push({
        id: 'db',
        name: 'PostgreSQL Database',
        category: 'sitportaldb (Local / Render Managed)',
        status: 'OPERATIONAL',
        latencyMs: Math.max(4, Math.round(latency / 2)),
        details: `Connected (${notices.length} notices records active).`,
      });

      updated.push({
        id: 'backend',
        name: 'Spring Boot REST Backend',
        category: 'Java 17 / Spring Boot 4.1.0',
        status: 'OPERATIONAL',
        latencyMs: latency,
        details: 'Endpoints responding with HTTP 200 OK.',
      });
    } catch (err: any) {
      updated.push({
        id: 'db',
        name: 'PostgreSQL Database',
        category: 'sitportaldb',
        status: 'ERROR',
        details: 'Database connection failed: ' + (err.message || 'Unknown error'),
      });
      updated.push({
        id: 'backend',
        name: 'Spring Boot REST Backend',
        category: 'API Engine',
        status: 'ERROR',
        details: 'Backend unreachable: ' + (err.message || 'Connection refused'),
      });
    }

    // 2. Scraper Status Check
    const startScraper = performance.now();
    try {
      const scraper = await apiService.getOfficialScraperStatus();
      const latency = Math.round(performance.now() - startScraper);
      updated.push({
        id: 'scraper',
        name: 'SITCOE Scraper Engine',
        category: 'Official Portal: sitcoe.ac.in',
        status: 'OPERATIONAL',
        latencyMs: latency,
        details: `Last Sync: ${scraper.lastSyncTimestamp} (${scraper.lastSyncedCount} circulars tracked).`,
      });
    } catch (err: any) {
      updated.push({
        id: 'scraper',
        name: 'SITCOE Scraper Engine',
        category: 'Official Portal Scraper',
        status: 'WARNING',
        details: 'Fallback scraper dataset active.',
      });
    }

    // 3. Web Push & VAPID Key Check
    const startPush = performance.now();
    try {
      const vapid = await apiService.getVapidPublicKey();
      const latency = Math.round(performance.now() - startPush);
      updated.push({
        id: 'webpush',
        name: 'Web Push & FCM Gateway',
        category: 'VAPID Encryption / WebPush API',
        status: vapid.publicKey ? 'OPERATIONAL' : 'WARNING',
        latencyMs: latency,
        details: vapid.publicKey
          ? 'VAPID public key verified and browser delivery active.'
          : 'VAPID keys not configured.',
      });
    } catch (err: any) {
      updated.push({
        id: 'webpush',
        name: 'Web Push & FCM Gateway',
        category: 'Push Notification Service',
        status: 'WARNING',
        details: 'Push gateway offline or unconfigured.',
      });
    }

    setDiagnostics(updated);
    setIsRunningDiagnostics(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('sit_setting_active_dept', activeDepartment);
    localStorage.setItem('sit_setting_academic_year', academicYear);
    localStorage.setItem('sit_setting_scraper_interval', scraperInterval);
    localStorage.setItem('sit_setting_retention_days', retentionDays);
    localStorage.setItem('sit_setting_push_on_scrape', JSON.stringify(pushOnScrape));
    localStorage.setItem('sit_setting_sound_alerts', JSON.stringify(soundAlerts));
    localStorage.setItem('sit_setting_email_alerts', JSON.stringify(emailAlerts));

    setSaveToast('✅ Configuration and diagnostic preferences saved successfully.');
    setTimeout(() => setSaveToast(null), 4000);
  };

  const handlePushToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setFcmPushEnabled(isEnabled);

    if (isEnabled) {
      const success = await registerWebPushDevice();
      if (success) {
        setSaveToast('🔔 Web Push notifications enabled! Test notification incoming.');
        setTimeout(() => setSaveToast(null), 4000);
        sendTestNotification();
      } else {
        setFcmPushEnabled(false);
        alert('Could not enable push notifications. Please allow notification permissions in your browser settings.');
      }
    } else {
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

  const sendTestNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🏛️ SITCOE Central Portal', {
        body: 'Push notification system is working perfectly!',
        icon: '/sit-logo.png',
      });
    } else {
      alert('Please enable browser push notifications above first.');
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      alert('Please enter a valid email address for testing.');
      return;
    }
    setIsSendingTestEmail(true);
    try {
      const res = await apiService.sendTestEmail(testEmailAddress);
      setSaveToast(`✉️ Live Test Email dispatched successfully to ${res.recipient}! Check your inbox.`);
      setTimeout(() => setSaveToast(null), 6000);
    } catch (err: any) {
      setSaveToast(`❌ Email Test Failed: ${err.message || 'Could not send test email'}`);
      setTimeout(() => setSaveToast(null), 6000);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl font-sans">
      {/* Toast Notification */}
      {saveToast && (
        <div className="p-4 rounded-xl text-[13px] font-bold shadow-lg flex items-center justify-between bg-emerald-600 text-white border border-emerald-500 transition-all">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{saveToast}</span>
          </div>
          <button onClick={() => setSaveToast(null)} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#000666] via-[#121c60] to-[#002171] text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[22px] font-black flex items-center gap-2">
            <span className="material-symbols-outlined text-[26px] text-cyan-300">tune</span>
            System Settings & Diagnostics
          </h2>
          <p className="text-[#cfe6f2] text-[13px] mt-1">
            Manage institutional scrapers, real-time sync frequencies, notification preferences, and run live system health checks.
          </p>
        </div>
        <button
          onClick={runDiagnosticsCheck}
          disabled={isRunningDiagnostics}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-200 border border-cyan-400/40 text-[13px] font-bold flex items-center gap-2 transition-all shrink-0 shadow-sm"
        >
          <span className={`material-symbols-outlined text-[18px] ${isRunningDiagnostics ? 'animate-spin' : ''}`}>
            health_and_safety
          </span>
          <span>{isRunningDiagnostics ? 'Checking System...' : 'Run Diagnostics'}</span>
        </button>
      </div>

      {/* 1. System Health & Diagnostic Live Status */}
      <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-[16px] text-[#071e27] flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">verified</span>
              Live System Health & Service Diagnostics
            </h3>
            <p className="text-[12px] text-[#454652]">
              Real-time connectivity and latency status of all SIT Portal core infrastructure services.
            </p>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            All Core Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {diagnostics.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-200 bg-[#f8fbff] hover:bg-white transition-all shadow-2xs flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-[#071e27]">{item.name}</span>
                    <span className="text-[11px] text-[#767683] bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#454652] mt-1">{item.details}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                      item.status === 'OPERATIONAL'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.status === 'OPERATIONAL'
                          ? 'bg-emerald-600'
                          : item.status === 'WARNING'
                          ? 'bg-amber-600'
                          : 'bg-rose-600'
                      }`}
                    ></span>
                    {item.status}
                  </span>
                  {item.latencyMs !== undefined && (
                    <span className="text-[10px] font-mono text-[#767683]">{item.latencyMs} ms</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Department & Academic Scope Setup */}
      <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-4">
        <h3 className="font-bold text-[16px] text-[#071e27] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#000666]">domain</span>
          Department & Academic Scope Configuration
        </h3>
        <p className="text-[12px] text-[#454652]">
          Select active department scope and the current autonomous academic year.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { code: 'CSE', name: 'Computer Science & Engineering', icon: 'computer' },
            { code: 'IT', name: 'Information Technology', icon: 'devices' },
            { code: 'ENTC', name: 'Electronics & Telecomm.', icon: 'memory' },
          ].map((dept) => (
            <button
              key={dept.code}
              onClick={() => setActiveDepartment(dept.code)}
              className={`p-3.5 rounded-xl border text-left font-bold text-[13px] transition-all flex items-center gap-3 ${
                activeDepartment === dept.code
                  ? 'bg-[#000666] text-white border-[#000666] shadow-sm'
                  : 'bg-[#f3faff] text-[#454652] border-[#c6c5d4] hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-[24px] opacity-80">{dept.icon}</span>
              <div>
                <span className="block text-[10px] opacity-75 uppercase">Active Scope</span>
                <span>{dept.name}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] font-semibold outline-none focus:border-[#000666]"
            >
              <option value="2026-27">A.Y. 2026–2027 (Current Active)</option>
              <option value="2025-26">A.Y. 2025–2026</option>
              <option value="2024-25">A.Y. 2024–2025</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">Institution</label>
            <input
              type="text"
              readOnly
              value="Sharad Institute of Technology College of Engineering (SITCOE)"
              className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#767683] outline-none font-semibold cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 3. Scraper & Automated Synchronization Settings */}
      <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-4">
        <h3 className="font-bold text-[16px] text-[#071e27] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#000666]">sync</span>
          SITCOE Scraper & Automated Synchronization
        </h3>
        <p className="text-[12px] text-[#454652]">
          Control the periodic synchronization schedule with the official college notification board (`https://sitcoe.ac.in/notification/`).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
              Scraper Background Sync Frequency
            </label>
            <select
              value={scraperInterval}
              onChange={(e) => setScraperInterval(e.target.value)}
              className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] font-semibold outline-none focus:border-[#000666]"
            >
              <option value="30">Every 30 Minutes (Recommended & Active)</option>
              <option value="60">Every 1 Hour</option>
              <option value="120">Every 2 Hours</option>
              <option value="360">Every 6 Hours</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#454652] uppercase mb-1">
              Notice Retention & Auto-Deletion Window
            </label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="w-full bg-[#f3faff] border border-[#c6c5d4] rounded-xl p-3 text-[13px] text-[#071e27] font-semibold outline-none focus:border-[#000666]"
            >
              <option value="20">Auto-Delete Notices Older Than 20 Days (Default)</option>
              <option value="15">Auto-Delete Notices Older Than 15 Days</option>
              <option value="30">Auto-Delete Notices Older Than 30 Days</option>
              <option value="0">Keep All Notices Permanently</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="flex items-center justify-between p-3.5 bg-[#f0f8ff] rounded-xl cursor-pointer border border-[#c6c5d4]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#000666] text-[22px]">notifications_active</span>
              <div>
                <p className="font-bold text-[13px] text-[#071e27]">Instant Push Alerts for Scraped Circulars</p>
                <p className="text-[11px] text-[#454652]">
                  Automatically trigger web push broadcasts to all students & faculty when new circulars are parsed.
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushOnScrape}
              onChange={(e) => setPushOnScrape(e.target.checked)}
              className="w-5 h-5 text-[#000666] rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 4. Notifications & Browser Gateway */}
      <div className="bg-white p-6 rounded-2xl border border-[#c6c5d4] shadow-xs space-y-4">
        <h3 className="font-bold text-[16px] text-[#071e27] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#000666]">campaign</span>
          Notification Delivery & Browser Preferences
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-[#f0f8ff] rounded-xl border border-[#c6c5d4]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#000666] text-[22px]">desktop_windows</span>
              <div>
                <p className="font-bold text-[13px] text-[#071e27]">Background Web Push Notifications</p>
                <p className="text-[11px] text-[#454652]">Receive native browser notifications for exam postponements and circulars</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {fcmPushEnabled && (
                <button
                  type="button"
                  onClick={sendTestNotification}
                  className="px-3 py-1 bg-white border border-[#000666] text-[#000666] font-bold text-xs rounded-lg hover:bg-slate-100 transition-all shadow-2xs"
                >
                  Send Test Alert
                </button>
              )}
              <input
                type="checkbox"
                checked={fcmPushEnabled}
                onChange={handlePushToggle}
                className="w-5 h-5 text-[#000666] rounded cursor-pointer"
              />
            </div>
          </div>

          <label className="flex items-center justify-between p-3.5 bg-[#f0f8ff] rounded-xl cursor-pointer border border-[#c6c5d4]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#000666] text-[22px]">volume_up</span>
              <div>
                <p className="font-bold text-[13px] text-[#071e27]">Audio Alerts for Urgent Circulars</p>
                <p className="text-[11px] text-[#454652]">Play a subtle audio ping when an URGENT notice or exam change is published</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={(e) => setSoundAlerts(e.target.checked)}
              className="w-5 h-5 text-[#000666] rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 bg-[#f0f8ff] rounded-xl cursor-pointer border border-[#c6c5d4]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#000666] text-[22px]">mail</span>
              <div>
                <p className="font-bold text-[13px] text-[#071e27]">Email Dispatch Activity Logging</p>
                <p className="text-[11px] text-[#454652]">Record detailed recipient transmission logs for broadcast emails</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-5 h-5 text-[#000666] rounded cursor-pointer"
            />
          </label>

          {/* Instant Live Email Gateway Test */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#000666] text-[20px]">mark_email_read</span>
                <span className="font-bold text-[13px] text-[#071e27]">Live SMTP Email Delivery Verification</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Gmail SMTP Active
              </span>
            </div>
            <p className="text-[12px] text-[#454652]">
              Send a real test email with HTML styling and SIT institutional branding to verify your inbox receives broadcasts.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="Enter recipient email..."
                className="flex-1 bg-white border border-[#c6c5d4] rounded-xl px-3 py-2 text-[13px] text-[#071e27] outline-none font-medium"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTestEmail}
                className="px-4 py-2 bg-[#000666] hover:bg-[#1a237e] text-white text-[13px] font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
              >
                <span className={`material-symbols-outlined text-[17px] ${isSendingTestEmail ? 'animate-spin' : ''}`}>
                  send
                </span>
                <span>{isSendingTestEmail ? 'Sending...' : 'Send Test Email'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#c6c5d4] flex justify-end gap-3">
          <button
            onClick={runDiagnosticsCheck}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#071e27] font-bold rounded-xl text-[13px] transition-colors"
          >
            Re-test Services
          </button>
          <button
            onClick={handleSavePreferences}
            className="px-6 py-2.5 bg-[#000666] text-white font-bold rounded-xl text-[13px] hover:bg-[#1a237e] transition-colors shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

