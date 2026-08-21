import { NoticeItem, StudentRecord, FacultyMember, EmailLog, UploadAsset, ActivityLog, ScrapedNotice } from '@/types';

const getRawApiUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    const cleanUrl = envUrl.replace(/\/$/, '');
    return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
  }
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost:3000')) {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:8080/api/v1';
};

const API_BASE_URL = getRawApiUrl();

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('sit_portal_jwt_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiService = {
  // Authentication Endpoints (JWT + PostgreSQL sitportaldb)
  async loginUser(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Authentication failed');
    }
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('sit_portal_jwt_token', data.token);
    }
    return data;
  },

  async registerUser(userData: { name: string; email: string; password: string; role: string; roleTitle: string; department?: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('sit_portal_jwt_token', data.token);
    }
    return data;
  },

  async loginWithGoogle(email: string) {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Google Authentication failed');
    }
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('sit_portal_jwt_token', data.token);
    }
    return data;
  },

  async getMe() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch authenticated user session');
    return await response.json();
  },

  // Notice Endpoints (PostgreSQL sitportaldb)
  async fetchNotices(): Promise<NoticeItem[]> {
    const response = await fetch(`${API_BASE_URL}/notices`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch notices from database');
    return await response.json();
  },

  async fetchNoticeById(id: string | number): Promise<NoticeItem> {
    const response = await fetch(`${API_BASE_URL}/notices/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch notice');
    return await response.json();
  },

  async createNotice(notice: Partial<NoticeItem>): Promise<NoticeItem> {
    const response = await fetch(`${API_BASE_URL}/notices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(notice),
    });
    if (!response.ok) throw new Error('Failed to save notice to database');
    return await response.json();
  },

  async updateNotice(id: string | number, notice: Partial<NoticeItem>): Promise<NoticeItem> {
    const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(notice),
    });
    if (!response.ok) throw new Error('Failed to update notice');
    return await response.json();
  },

  async deleteNotice(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete notice from database');
  },

  // SITCOE Official Notice Scraper & Sync
  async previewOfficialNotices(): Promise<ScrapedNotice[]> {
    const response = await fetch(`${API_BASE_URL}/scraper/notices/preview`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to preview notices from college portal');
    return await response.json();
  },

  async syncOfficialNotices(): Promise<{ status: string; totalScraped: number; newlyAdded: number; alreadyExisted: number; notices: NoticeItem[] }> {
    const response = await fetch(`${API_BASE_URL}/scraper/notices/sync`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to synchronize official college notices');
    return await response.json();
  },

  async getOfficialScraperStatus(): Promise<{ lastSyncTimestamp: string; lastSyncedCount: number; lastSyncStatus: string; targetUrl: string }> {
    const response = await fetch(`${API_BASE_URL}/scraper/notices/status`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to get scraper status');
    return await response.json();
  },

  async cleanupExpiredNotices(days = 20): Promise<{ status: string; deletedCount: number; retentionDays: number; message: string }> {
    const response = await fetch(`${API_BASE_URL}/notices/cleanup-expired?days=${days}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to cleanup expired notices');
    return await response.json();
  },

  // Student Endpoints (PostgreSQL sitportaldb)
  async fetchStudents(): Promise<StudentRecord[]> {
    const response = await fetch(`${API_BASE_URL}/students`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch students from database');
    return await response.json();
  },

  async fetchStudentById(id: string | number): Promise<StudentRecord> {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch student');
    return await response.json();
  },

  async addStudent(student: StudentRecord): Promise<StudentRecord> {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(student),
    });
    if (!response.ok) throw new Error('Failed to save student to database');
    return await response.json();
  },

  async updateStudent(id: string | number, student: Partial<StudentRecord>): Promise<StudentRecord> {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(student),
    });
    if (!response.ok) throw new Error('Failed to update student');
    return await response.json();
  },

  async deleteStudent(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete student record');
  },

  async addStudentsBulk(students: StudentRecord[]): Promise<StudentRecord[]> {
    const response = await fetch(`${API_BASE_URL}/students/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(students),
    });
    if (!response.ok) throw new Error('Failed to save students bulk to database');
    return await response.json();
  },

  // Faculty Endpoints (PostgreSQL sitportaldb)
  async fetchFaculty(): Promise<FacultyMember[]> {
    const response = await fetch(`${API_BASE_URL}/faculty`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch faculty from database');
    return await response.json();
  },

  async fetchFacultyById(id: string | number): Promise<FacultyMember> {
    const response = await fetch(`${API_BASE_URL}/faculty/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch faculty member');
    return await response.json();
  },

  async createFaculty(faculty: Omit<FacultyMember, 'id'>): Promise<FacultyMember> {
    const response = await fetch(`${API_BASE_URL}/faculty`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(faculty),
    });
    if (!response.ok) throw new Error('Failed to create faculty record');
    return await response.json();
  },

  async updateFaculty(id: string | number, faculty: Partial<FacultyMember>): Promise<FacultyMember> {
    const response = await fetch(`${API_BASE_URL}/faculty/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(faculty),
    });
    if (!response.ok) throw new Error('Failed to update faculty member');
    return await response.json();
  },

  async updateFacultyStatus(id: string | number, status: string): Promise<FacultyMember> {
    const response = await fetch(`${API_BASE_URL}/faculty/${id}/status?status=${encodeURIComponent(status)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to update faculty status');
    return await response.json();
  },

  async deleteFaculty(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/faculty/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete faculty record');
  },

  async addFacultyBulk(facultyList: Omit<FacultyMember, 'id'>[]): Promise<FacultyMember[]> {
    const response = await fetch(`${API_BASE_URL}/faculty/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(facultyList),
    });
    if (!response.ok) throw new Error('Failed to save faculty bulk to database');
    return await response.json();
  },

  // Document Endpoints (PostgreSQL sitportaldb)
  async fetchDocuments(): Promise<UploadAsset[]> {
    const response = await fetch(`${API_BASE_URL}/documents`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch documents from database');
    return await response.json();
  },

  async fetchDocumentById(id: string | number): Promise<UploadAsset> {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch document');
    return await response.json();
  },

  async createDocument(doc: Partial<UploadAsset>): Promise<UploadAsset> {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(doc),
    });
    if (!response.ok) throw new Error('Failed to save document to database');
    return await response.json();
  },

  async updateDocument(id: string | number, doc: Partial<UploadAsset>): Promise<UploadAsset> {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(doc),
    });
    if (!response.ok) throw new Error('Failed to update document');
    return await response.json();
  },

  async deleteDocument(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete document');
  },

  // Course Endpoints
  async fetchCourses(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/courses`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch courses from database');
    return await response.json();
  },

  async fetchCourseById(id: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch course');
    return await response.json();
  },

  async createCourse(course: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/courses`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(course),
    });
    if (!response.ok) throw new Error('Failed to save course');
    return await response.json();
  },

  async updateCourse(id: string | number, course: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(course),
    });
    if (!response.ok) throw new Error('Failed to update course');
    return await response.json();
  },

  async deleteCourse(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete course');
  },

  // Research & Lab Endpoints
  async fetchLaboratories(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/laboratories`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch laboratories from database');
    return await response.json();
  },

  async fetchLaboratoryById(id: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/laboratories/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch laboratory');
    return await response.json();
  },

  async createLaboratory(lab: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/laboratories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(lab),
    });
    if (!response.ok) throw new Error('Failed to save laboratory');
    return await response.json();
  },

  async updateLaboratory(id: string | number, lab: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/laboratories/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(lab),
    });
    if (!response.ok) throw new Error('Failed to update laboratory');
    return await response.json();
  },

  async deleteLaboratory(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/laboratories/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete laboratory');
  },

  async fetchResearchLabs(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/research-labs`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch research labs from database');
    return await response.json();
  },

  async fetchResearchLabById(id: string | number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/research-labs/${id}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch research lab');
    return await response.json();
  },

  async createResearchLab(lab: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/research-labs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(lab),
    });
    if (!response.ok) throw new Error('Failed to create research lab');
    return await response.json();
  },

  async updateResearchLab(id: string | number, lab: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/research-labs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(lab),
    });
    if (!response.ok) throw new Error('Failed to update research lab');
    return await response.json();
  },

  async deleteResearchLab(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/research-labs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete research lab');
  },

  // Email Log Endpoints (PostgreSQL sitportaldb)
  async fetchEmailLogs(): Promise<EmailLog[]> {
    const response = await fetch(`${API_BASE_URL}/email/logs`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch email logs from database');
    return await response.json();
  },

  async sendBroadcast(request: any): Promise<EmailLog> {
    const response = await fetch(`${API_BASE_URL}/email/broadcast`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to save email broadcast to database');
    return await response.json();
  },

  async sendTestEmail(targetEmail: string): Promise<{ status: string; recipient: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/email/test?targetEmail=${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to dispatch test email');
    return await response.json();
  },

  // Activity Log Endpoints
  async fetchActivities(): Promise<ActivityLog[]> {
    const response = await fetch(`${API_BASE_URL}/activities`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch activities from database');
    return await response.json();
  },

  async createActivity(activity: Partial<ActivityLog>): Promise<ActivityLog> {
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(activity),
    });
    if (!response.ok) throw new Error('Failed to save activity to database');
    return await response.json();
  },

  async deleteActivity(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete activity log');
  },

  async clearAllActivities(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/activities`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to clear activity logs');
  },

  // FCM Device Token Registration for Push Notifications
  async registerFcmToken(token: string, email?: string) {
    const response = await fetch(`${API_BASE_URL}/notifications/register-token`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ token, email, deviceType: 'WEB' }),
    });
    if (!response.ok) throw new Error('Failed to register FCM token');
    return await response.text();
  },

  // Native Web Push API (Service Worker based)
  async getVapidPublicKey(): Promise<{ publicKey: string }> {
    const response = await fetch(`${API_BASE_URL}/push/vapid-public-key`);
    if (!response.ok) throw new Error('Failed to fetch VAPID public key');
    return await response.json();
  },

  async subscribeToWebPush(subscription: any): Promise<string> {
    const payload = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys ? subscription.keys.p256dh : '',
      auth: subscription.keys ? subscription.keys.auth : ''
    };

    const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Failed to save push subscription to database');
    return await response.text();
  },

  async unsubscribeFromWebPush(endpoint: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/push/unsubscribe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ endpoint })
    });

    if (!response.ok) throw new Error('Failed to remove push subscription from database');
    return await response.text();
  },

  // Real-time Analytics Statistics
  async fetchAnalyticsStats() {
    const response = await fetch(`${API_BASE_URL}/analytics/stats`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch analytics stats');
    return await response.json();
  },

  // User Profile & Password Management
  async fetchAllUsers() {
    const response = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  },

  async fetchUserProfile() {
    const response = await fetch(`${API_BASE_URL}/users/profile`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return await response.json();
  },

  async updateUserProfile(profileData: Record<string, any>) {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update user profile');
    }
    return await response.json();
  },

  async changePassword(passwords: { currentPassword: string; newPassword: string }) {
    const response = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwords),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to change password');
    }
    return await response.json();
  }
};
