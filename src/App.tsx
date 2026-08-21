import React, { useState, useEffect } from 'react';
import { ViewMode, UserRole, UserProfile, FacultyMember, ActivityLog, UploadAsset, EmailLog, StudentRecord, NoticeItem } from '@/types';
import { apiService } from '@/services/api';
import { registerWebPushDevice } from '@/utils/webPush';
import { useUrlRouter } from '@/hooks/useUrlRouter';


import { Sidebar, Header, Footer } from '@/components/layout';
import { Modals } from '@/components/modals';
import { Sparkles } from 'lucide-react';

import { AdminDashboard, FacultyDashboard, HodDashboard } from '@/features/dashboard';
import { PublicLanding } from '@/features/public-landing';
import { LoginView } from '@/features/auth';
import { BulkEmailPanel } from '@/features/email';
import { CurriculumView } from '@/features/curriculum';
import { FacultyDirectoryView, StudentsDirectoryView } from '@/features/directory';
import { AnalyticsView } from '@/features/analytics';
import { SettingsView } from '@/features/settings';
import { NoticeFeedView, NoticePublishModal } from '@/features/notices';
import { DocumentLibraryView } from '@/features/documents';
import { EditProfileModal, ContactFacultyModal } from '@/components/modals';
import { AiHelpdeskChatbot } from '@/components/AiHelpdeskChatbot';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('public-landing');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('public');
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [viewHistory, setViewHistory] = useState<ViewMode[]>([]);
  const [intendedView, setIntendedView] = useState<ViewMode | null>(null);

  // Hook in the URL Router (Fixes BUG-004 & BUG-005)
  useUrlRouter(activeView, setActiveView);

  // 100% Database-driven state initialized to empty arrays (No local storage)
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([]);
  const [studentsList, setStudentsList] = useState<StudentRecord[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [uploads, setUploads] = useState<UploadAsset[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showUrgentNotice, setShowUrgentNotice] = useState(false);
  const [showAddNotice, setShowAddNotice] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddFaculty, setShowAddFaculty] = useState(false);
  const [showUploadAssignment, setShowUploadAssignment] = useState(false);
  const [showUploadMaterial, setShowUploadMaterial] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPublishNoticeModal, setShowPublishNoticeModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showContactFacultyModal, setShowContactFacultyModal] = useState(false);
  const [selectedFacultyForContact, setSelectedFacultyForContact] = useState<FacultyMember | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Lazy Fetch Database Records based on active view
  useEffect(() => {
    const fetchDataForView = async () => {
      try {
        if (['dashboard', 'hod-dashboard', 'public-landing', 'notices'].includes(activeView) && notices.length === 0) {
          apiService.fetchNotices().then(setNotices).catch(console.warn);
        }
        if (['dashboard', 'hod-dashboard', 'faculty-portal', 'students', 'analytics'].includes(activeView) && studentsList.length === 0) {
          apiService.fetchStudents().then(setStudentsList).catch(console.warn);
        }
        if (['dashboard', 'hod-dashboard', 'faculty', 'bulk-email', 'faculty-email'].includes(activeView) && facultyList.length === 0) {
          apiService.fetchFaculty().then(setFacultyList).catch(console.warn);
        }
        if (['bulk-email', 'faculty-email', 'analytics'].includes(activeView) && emailLogs.length === 0) {
          apiService.fetchEmailLogs().then(setEmailLogs).catch(console.warn);
        }
        if (['documents', 'faculty-portal'].includes(activeView) && uploads.length === 0) {
          apiService.fetchDocuments().then(setUploads).catch(console.warn);
        }
        if (['dashboard'].includes(activeView) && activities.length === 0) {
          apiService.fetchActivities().then(setActivities).catch(console.warn);
        }
        if (['curriculum'].includes(activeView) && coursesList.length === 0) {
          apiService.fetchCourses().then(setCoursesList).catch(console.warn);
        }
      } catch (err) {
        console.warn('Lazy loading warning:', err);
      }
    };
    fetchDataForView();
  }, [activeView]);

  useEffect(() => {
    registerWebPushDevice().catch(() => {});
    const savedSession = localStorage.getItem('sit_portal_auth_session');
    if (savedSession) {
      try {
        const { role, profile, activeView: savedView } = JSON.parse(savedSession);
        if (role && profile) {
          setIsLoggedIn(true);
          setUserRole(role);
          setCurrentProfile(profile);
          setActiveView(savedView || (role === 'admin' ? 'dashboard' : role === 'hod' ? 'hod-dashboard' : role === 'faculty' ? 'faculty-portal' : 'notices'));
        }
      } catch (err) {
        console.warn('Session parse warning:', err);
      }
    }
  }, []);

  const [prefilledEmail, setPrefilledEmail] = useState<string>('');
  
  // Authentication & Role Navigation Guard
  const handleProtectedNavigate = (targetView: ViewMode, emailContext?: string) => {
    setPrefilledEmail(emailContext || '');
    const publicViews: ViewMode[] = ['public-landing', 'login', 'curriculum', 'notices', 'faculty', 'documents', 'students'];
    const adminViews: ViewMode[] = ['bulk-email', 'faculty-email'];

    if (!isLoggedIn && !publicViews.includes(targetView)) {
      alert('Authentication Required: Please sign in to access this portal section.');
      setIntendedView(targetView);
      setActiveView('login');
      return;
    }

    if (targetView === 'settings' && userRole !== 'admin') {
      alert('Access Restricted: System settings require Administrator credentials.');
      return;
    }

    if (targetView === 'analytics' && !['admin', 'hod'].includes(userRole)) {
      alert('Access Restricted: System analytics require Administrator or HOD credentials.');
      return;
    }

    if (adminViews.includes(targetView) && !['admin', 'hod', 'faculty'].includes(userRole)) {
      alert('Access Restricted: Broadcast panels require Administrator, HOD, or Faculty credentials.');
      return;
    }
    
    if (activeView !== targetView) {
      if (targetView === 'public-landing') {
        setViewHistory([]);
      } else {
        setViewHistory(prev => {
          // Prevent infinite history loops if they click the same sidebar links
          const filtered = prev.filter(v => v !== targetView);
          return [...filtered, activeView];
        });
      }
      setActiveView(targetView);
    }
  };

  const handleGoBack = () => {
    setViewHistory(prev => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const lastView = newHistory.pop();
      if (lastView) {
        setActiveView(lastView);
      }
      return newHistory;
    });
  };

  // Login Success Handler (With localStorage Session Persistence)
  const handleLoginSuccess = (role: UserRole, email: string, customProfile?: Partial<UserProfile>) => {
    setIsLoggedIn(true);
    setUserRole(role);

    let profile: UserProfile;
    let defaultView: ViewMode = 'notices';

    if (customProfile) {
      profile = {
        name: customProfile.name || 'Unknown User',
        roleTitle: customProfile.roleTitle || 'Verified User',
        role: customProfile.role || role,
        avatar: customProfile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        department: customProfile.department || 'Computer Science & Engineering',
        email: customProfile.email || email
      };
      defaultView = role === 'admin' ? 'dashboard' : role === 'hod' ? 'hod-dashboard' : role === 'faculty' ? 'faculty-portal' : 'notices';
    } else {
      profile = {
        name: 'Unknown User',
        roleTitle: 'Verified User',
        role: role,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        department: 'Computer Science & Engineering',
        email: email
      };
      defaultView = role === 'admin' ? 'dashboard' : role === 'hod' ? 'hod-dashboard' : role === 'faculty' ? 'faculty-portal' : 'notices';
    }

    // Fix BUG-001: Restore intended view if it exists
    if (intendedView) {
      const adminViews: ViewMode[] = ['bulk-email', 'faculty-email', 'analytics', 'settings'];
      if (!adminViews.includes(intendedView) || role === 'admin' || (role === 'hod' && intendedView !== 'settings')) {
        defaultView = intendedView;
      }
      setIntendedView(null);
    }

    // Seed history so dashboards can always go back to home
    if ((defaultView as string) !== 'public-landing') {
      setViewHistory(['public-landing']);
    } else {
      setViewHistory([]);
    }

    setCurrentProfile(profile);
    setActiveView(defaultView);

    // Save Persistent Session to localStorage
    localStorage.setItem('sit_portal_auth_session', JSON.stringify({
      role,
      email: profile.email,
      profile,
      activeView: defaultView
    }));

    // Register web push device with the newly acquired authentication token
    registerWebPushDevice().catch(() => {});
  };

  // Logout Handler (Clears Persistent Session)
  const handleLogout = () => {
    localStorage.removeItem('sit_portal_auth_session');
    localStorage.removeItem('sit_portal_jwt_token');
    setIsLoggedIn(false);
    setUserRole('public');
    setCurrentProfile(null);
    setViewHistory([]);
    setActiveView('public-landing');
  };

  // Protected Action Handler
  const requireAuthAction = (action: () => void) => {
    if (!isLoggedIn) {
      alert('Authentication Required: Please sign in to perform this activity.');
      setIntendedView(activeView);
      setActiveView('login');
      return;
    }
    action();
  };

  // Toggle Faculty status
  const handleToggleFacultyStatus = (id: string) => {
    requireAuthAction(() => {
      setFacultyList((prev) =>
        prev.map((f) => {
          if (f.id === id) {
            const statuses: FacultyMember['status'][] = ['ON CAMPUS', 'IN MEETING', 'IN LAB', 'OFF CAMPUS'];
            const nextIndex = (statuses.indexOf(f.status) + 1) % statuses.length;
            return { ...f, status: statuses[nextIndex] };
          }
          return f;
        })
      );
    });
  };

  // Delete Faculty Handler
  const handleDeleteFaculty = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this faculty member?")) return;
    requireAuthAction(async () => {
      try {
        await apiService.deleteFaculty(id);
        setFacultyList((prev) => prev.filter(f => f.id !== id));
      } catch (err) {
        console.error("Failed to delete faculty:", err);
        alert("Failed to delete faculty record.");
      }
    });
  };

  // Delete Student Handler
  const handleDeleteStudent = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this student record?")) return;
    requireAuthAction(async () => {
      try {
        await apiService.deleteStudent(id);
        setStudentsList((prev) => prev.filter(s => s.id !== id));
      } catch (err) {
        console.error("Failed to delete student:", err);
        alert("Failed to delete student record.");
      }
    });
  };

  // Delete Document Handler
  const handleDeleteDocument = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    requireAuthAction(async () => {
      try {
        await apiService.deleteDocument(id);
        setUploads((prev) => prev.filter(d => d.id !== id));
      } catch (err) {
        console.error("Failed to delete document:", err);
        alert("Failed to delete document.");
      }
    });
  };

  // Notice Handlers (Saves directly to PostgreSQL sitportaldb via REST API)
  const handlePublishNotice = async (newNotice: NoticeItem) => {
    requireAuthAction(async () => {
      try {
        const savedNotice = await apiService.createNotice(newNotice);
        setNotices((prev) => [savedNotice || newNotice, ...prev]);
        try {
          const savedAct = await apiService.createActivity({
            title: `Notice Published: ${newNotice.title}`,
            subtitle: `Target: ${newNotice.targetAudience?.academicYear?.join(', ') || 'Global Notice Board'}`,
            icon: 'campaign',
            type: 'notice',
          });
          setActivities((prev) => [savedAct, ...prev]);
        } catch (e) { console.warn(e) }
        
        alert('Notice published successfully!');
        
        // Trigger a browser push notification
        import('@/utils/fcmService').then(({ fcmService }) => {
          fcmService.sendPushNotification(
            `New Notice: ${newNotice.title}`,
            newNotice.content
          );
        });
        
      } catch (err) {
        alert('Failed to save notice to PostgreSQL database.');
      }
    });
  };

  const handleDeleteNotice = async (noticeId: string) => {
    requireAuthAction(async () => {
      try {
        await apiService.deleteNotice(noticeId);
        setNotices((prev) => prev.filter((n) => n.id !== noticeId));
      } catch (err) {
        alert('Failed to delete notice from PostgreSQL database.');
      }
    });
  };

  const handleMarkAsRead = (noticeId: string) => {
    requireAuthAction(() => {
      const userId = currentProfile?.role === 'admin' ? 'admin-1' : currentProfile?.role === 'faculty' ? 'fac-1' : 'stu-1';
      setNotices((prev) =>
        prev.map((n) => {
          const readByList = n.readBy || [];
          if (n.id === noticeId && !readByList.includes(userId)) {
            return { ...n, readBy: [...readByList, userId] };
          }
          return n;
        })
      );
    });
  };

  // Email Broadcast Handler (Saves directly to PostgreSQL sitportaldb)
  const handleSendBroadcast = async (payload: any) => {
    requireAuthAction(async () => {
      try {
        const savedLog = await apiService.sendBroadcast(payload);
        setEmailLogs((prev) => [savedLog || payload, ...prev]);
        
        if (savedLog?.status === 'SIMULATED') {
          setTimeout(() => {
            alert('WARNING: Backend is running in Simulation Mode because SMTP credentials (spring.mail.username, etc.) are not configured. The email was logged but NOT actually sent.');
          }, 100);
        } else if (savedLog?.status === 'NO_RECIPIENTS') {
          setTimeout(() => {
            alert('WARNING: No recipients matched your filters. The email was NOT sent to anyone.');
          }, 100);
        }
        try {
          const savedAct = await apiService.createActivity({
            title: `Broadcast: ${savedLog.subject}`,
            subtitle: `To ${savedLog.recipientGroup}`,
            icon: 'mail',
            type: 'email',
          });
          setActivities((prev) => [savedAct, ...prev]);
        } catch (e) { console.warn(e) }
      } catch (err) {
        alert('Failed to save broadcast log to database.');
      }
    });
  };

  const handleSendUrgentNotice = (title: string, message: string, file: File | null) => {
    requireAuthAction(() => {
      const attachments: UploadAsset[] = file ? [{
        id: `att-${Date.now()}`,
        title: file.name,
        category: 'Notice',
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedAt: new Date().toISOString(),
        status: 'Published',
        downloadUrl: URL.createObjectURL(file)
      }] : [];

      const urgentNoticeItem: NoticeItem = {
        title: `[URGENT] ${title}`,
        content: message,
        authorName: currentProfile?.name || 'Unknown Author',
        authorRole: currentProfile?.roleTitle || 'Authorized Personnel',
        category: 'Emergency',
        priority: 'URGENT',
        status: 'PUBLISHED',
        targetAudience: { role: ['student', 'faculty'] },
        attachments,
        publishedAt: 'Just now',
        readBy: [],
        viewsCount: 0
      };
      handlePublishNotice(urgentNoticeItem);
      alert('Urgent notice published successfully.');
    });
  };

  const handleAddNotice = (notice: ActivityLog) => {
    requireAuthAction(() => setActivities((prev) => [notice, ...prev]));
  };

  // Document Upload Handler (Saves directly to PostgreSQL sitportaldb)
  const handleAddAsset = async (asset: UploadAsset) => {
    requireAuthAction(async () => {
      try {
        const savedAsset = await apiService.createDocument(asset);
        setUploads((prev) => [savedAsset || asset, ...prev]);
      } catch (err) {
        alert('Failed to save document to PostgreSQL database.');
      }
    });
  };

  // Add Student Handler (Saves directly to PostgreSQL sitportaldb)
  const handleAddStudent = async (student: StudentRecord) => {
    requireAuthAction(async () => {
      try {
        const savedStudent = await apiService.addStudent(student);
        setStudentsList((prev) => [savedStudent || student, ...prev]);
      } catch (err) {
        alert('Failed to save student record to PostgreSQL database.');
      }
    });
  };

  const handleAddStudentsBulk = async (students: StudentRecord[]) => {
    requireAuthAction(async () => {
      try {
        const savedStudents = await apiService.addStudentsBulk(students);
        setStudentsList((prev) => [...(savedStudents || students), ...prev]);
        alert(`Successfully imported ${students.length} student records.`);
      } catch (err) {
        alert('Failed to bulk import student records to PostgreSQL database.');
      }
    });
  };

  // Add Faculty Handlers
  const handleAddFaculty = async (faculty: FacultyMember) => {
    requireAuthAction(async () => {
      try {
        const savedFaculty = await apiService.createFaculty(faculty);
        setFacultyList((prev) => [savedFaculty || faculty, ...prev]);
      } catch (err) {
        alert('Failed to save faculty record to PostgreSQL database.');
      }
    });
  };

  const handleAddFacultyBulk = async (facultyList: FacultyMember[]) => {
    requireAuthAction(async () => {
      try {
        const savedFacultyList = await apiService.addFacultyBulk(facultyList);
        setFacultyList((prev) => [...(savedFacultyList || facultyList), ...prev]);
        alert(`Successfully imported ${facultyList.length} faculty records.`);
      } catch (err) {
        alert('Failed to bulk import faculty records to PostgreSQL database.');
      }
    });
  };

  // Render standalone Login Page
  if (activeView === 'login') {
    return <LoginView onLoginSuccess={handleLoginSuccess} onNavigate={handleProtectedNavigate} />;
  }

  return (
    <div className="min-h-screen bg-[#f3faff] text-[#071e27] flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onNavigate={handleProtectedNavigate}
        userRole={userRole}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenUrgentNotice={() => requireAuthAction(() => setShowUrgentNotice(true))}
      />

      {/* Main Content Area */}
      <div className="lg:pl-[260px] pl-0 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          currentProfile={currentProfile}
          isLoggedIn={isLoggedIn}
          onLogout={handleLogout}
          onNavigate={handleProtectedNavigate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenNotifications={() => requireAuthAction(() => setShowNotifications(true))}
          onOpenHelp={() => setShowHelp(true)}
          onOpenEditProfile={() => requireAuthAction(() => setShowEditProfileModal(true))}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          canGoBack={viewHistory.length > 0}
          onGoBack={handleGoBack}
        />

        {/* Global Updates Ticker */}
        <div className="px-6 pt-4 max-w-[1440px] w-full mx-auto">
          <div className="bg-white border border-slate-200 rounded-xl h-10 flex items-center overflow-hidden px-4 text-xs shadow-sm">
            <span className="font-bold text-zinc-900 uppercase tracking-wider text-[11px] shrink-0 mr-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Updates
            </span>
            <div className="flex-1 overflow-hidden relative">
              <div className="ticker-animate whitespace-nowrap flex items-center gap-10 text-slate-600 text-[12px]">
                {notices.length > 0 ? (
                  notices.map((notice) => (
                    <span key={notice.id}>• {notice.title}</span>
                  ))
                ) : (
                  <span>• No new updates at this time.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic View Container */}
        <main className="flex-1 p-6 max-w-[1440px] w-full mx-auto animate-in fade-in duration-150">
          {activeView === 'dashboard' && (
            <AdminDashboard
              onNavigate={handleProtectedNavigate}
              facultyList={facultyList}
              onToggleFacultyStatus={handleToggleFacultyStatus}
              activities={activities}
              students={studentsList}
              onOpenQuickNoticeModal={() => requireAuthAction(() => setShowPublishNoticeModal(true))}
            />
          )}

          {activeView === 'hod-dashboard' && (
            <HodDashboard
              currentProfile={currentProfile}
              facultyList={facultyList}
              notices={notices}
              studentsList={studentsList}
              onNavigate={handleProtectedNavigate}
              onOpenPublishNotice={() => requireAuthAction(() => setShowPublishNoticeModal(true))}
            />
          )}

          {activeView === 'notices' && (
            <NoticeFeedView
              notices={notices}
              currentProfile={currentProfile || {
                name: 'Guest User',
                roleTitle: 'Public Visitor',
                role: 'student',
                avatar: '',
                department: 'CSE',
                email: ''
              }}
              onMarkAsRead={handleMarkAsRead}
              onOpenPublishModal={() => requireAuthAction(() => setShowPublishNoticeModal(true))}
              onDeleteNotice={userRole === 'admin' ? handleDeleteNotice : undefined}
              onRefreshNotices={() => apiService.fetchNotices().then(setNotices).catch(console.warn)}
            />
          )}

          {activeView === 'documents' && (
            <DocumentLibraryView
              uploads={uploads}
              onOpenUploadModal={['admin', 'hod', 'faculty'].includes(userRole) ? () => requireAuthAction(() => setShowUploadMaterial(true)) : undefined}
              onNavigate={handleProtectedNavigate}
              onDeleteDocument={['admin', 'hod', 'faculty'].includes(userRole) ? handleDeleteDocument : undefined}
            />
          )}

          {activeView === 'faculty-portal' && (
            <FacultyDashboard
              onNavigate={handleProtectedNavigate}
              uploads={uploads}
              students={studentsList}
              events={[]}
              onOpenAssignmentModal={() => requireAuthAction(() => setShowUploadAssignment(true))}
              onOpenNoticeModal={() => requireAuthAction(() => setShowPublishNoticeModal(true))}
              onOpenMaterialModal={() => requireAuthAction(() => setShowUploadMaterial(true))}
            />
          )}

          {activeView === 'public-landing' && (
            <PublicLanding notices={notices} onNavigate={handleProtectedNavigate} isLoggedIn={isLoggedIn} userRole={userRole} />
          )}

          {activeView === 'bulk-email' && (
            <BulkEmailPanel
              emailLogs={emailLogs}
              facultyList={facultyList}
              studentsList={studentsList}
              onSendBroadcast={handleSendBroadcast}
              onNavigate={handleProtectedNavigate}
              defaultTargetRole="STUDENT"
              prefilledEmail={prefilledEmail}
              currentProfile={currentProfile}
            />
          )}

          {activeView === 'faculty-email' && (
            <BulkEmailPanel
              emailLogs={emailLogs}
              facultyList={facultyList}
              studentsList={studentsList}
              onSendBroadcast={handleSendBroadcast}
              onNavigate={handleProtectedNavigate}
              defaultTargetRole="FACULTY"
              prefilledEmail={prefilledEmail}
              currentProfile={currentProfile}
            />
          )}

          {activeView === 'curriculum' && (
            <CurriculumView courses={coursesList} onNavigate={handleProtectedNavigate} />
          )}

          {activeView === 'faculty' && (
            <FacultyDirectoryView
              facultyList={facultyList}
              onToggleFacultyStatus={['admin', 'hod'].includes(userRole) ? handleToggleFacultyStatus : undefined}
              onDeleteFaculty={userRole === 'admin' ? handleDeleteFaculty : undefined}
              onNavigate={handleProtectedNavigate}
              onAddFaculty={userRole === 'admin' ? () => requireAuthAction(() => setShowAddFaculty(true)) : undefined}
              onAddFacultyBulk={userRole === 'admin' ? handleAddFacultyBulk : undefined}
              onContactFaculty={(fac) => {
                setSelectedFacultyForContact(fac);
                setShowContactFacultyModal(true);
              }}
              currentProfile={currentProfile}
            />
          )}

          {activeView === 'students' && (
            <StudentsDirectoryView
              students={studentsList}
              onAddStudent={userRole === 'admin' ? () => requireAuthAction(() => setShowAddStudent(true)) : undefined}
              onDeleteStudent={userRole === 'admin' ? handleDeleteStudent : undefined}
              onNavigate={handleProtectedNavigate}
              onAddStudentsBulk={userRole === 'admin' ? handleAddStudentsBulk : undefined}
            />
          )}

          {activeView === 'analytics' && <AnalyticsView notices={notices} students={studentsList} emails={emailLogs} />}

          {activeView === 'settings' && <SettingsView currentProfile={currentProfile} />}
        </main>

        {/* Footer */}
        <Footer onNavigate={handleProtectedNavigate} />
      </div>

      {/* Modals & Triggers */}
      <Modals
        showUrgentNotice={showUrgentNotice}
        onOpenUrgentNotice={['admin', 'hod', 'faculty'].includes(userRole) ? () => requireAuthAction(() => setShowUrgentNotice(true)) : undefined}
        onCloseUrgentNotice={() => setShowUrgentNotice(false)}
        onSendUrgentNotice={handleSendUrgentNotice}
        showAddNotice={showAddNotice}
        onCloseAddNotice={() => setShowAddNotice(false)}
        onAddNotice={(n) => { console.log(n); setShowAddNotice(false); }}
        showAddStudent={showAddStudent}
        onCloseAddStudent={() => setShowAddStudent(false)}
        onAddStudent={handleAddStudent}
        onAddStudentsBulk={handleAddStudentsBulk}
        showAddFaculty={showAddFaculty}
        onCloseAddFaculty={() => setShowAddFaculty(false)}
        onAddFaculty={handleAddFaculty}
        showUploadAssignment={showUploadAssignment}
        onCloseUploadAssignment={() => setShowUploadAssignment(false)}
        onAddAsset={handleAddAsset}
        showUploadMaterial={showUploadMaterial}
        onCloseUploadMaterial={() => setShowUploadMaterial(false)}
        showNotifications={showNotifications}
        onCloseNotifications={() => setShowNotifications(false)}
        showHelp={showHelp}
        onCloseHelp={() => setShowHelp(false)}
      />

      <NoticePublishModal
        isOpen={showPublishNoticeModal}
        onClose={() => setShowPublishNoticeModal(false)}
        onPublishNotice={handlePublishNotice}
        currentUserName={currentProfile?.name || 'Unknown Author'}
        currentUserRoleTitle={currentProfile?.roleTitle || 'Authorized Personnel'}
        studentsList={studentsList}
      />

      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        currentProfile={currentProfile}
        onProfileUpdated={(updated) => {
          setCurrentProfile(updated);
          const savedSession = localStorage.getItem('sit_portal_auth_session');
          if (savedSession) {
            try {
              const session = JSON.parse(savedSession);
              session.profile = updated;
              localStorage.setItem('sit_portal_auth_session', JSON.stringify(session));
            } catch (e) {}
          }
        }}
      />

      <ContactFacultyModal
        isOpen={showContactFacultyModal}
        onClose={() => {
          setShowContactFacultyModal(false);
          setSelectedFacultyForContact(null);
        }}
        faculty={selectedFacultyForContact}
        currentProfile={currentProfile}
        onSuccess={(msg) => {
          if (selectedFacultyForContact) {
            apiService.createActivity({
              title: `Inquiry to ${selectedFacultyForContact.name}`,
              subtitle: `From ${currentProfile?.name || 'Student'}`,
              icon: 'mail',
              type: 'email'
            }).then(saved => setActivities(prev => [saved, ...prev])).catch(console.warn);
          }
          alert(msg);
        }}
      />

      {/* Embedded AI Department Helpdesk & Summarizer Widget */}
      <AiHelpdeskChatbot
        notices={notices}
        faculty={facultyList}
        students={studentsList}
        documents={uploads}
      />
    </div>
  );
}
