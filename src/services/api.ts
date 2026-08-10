import { NoticeItem, StudentRecord, FacultyMember, EmailLog, UploadAsset, ActivityLog } from '@/types';

const getRawApiUrl = () => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
  const cleanUrl = envUrl.replace(/\/$/, '');
  return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
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

  async registerUser(userData: { name: string; email: string; password: string; role: string; roleTitle: string }) {
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

  // Notice Endpoints (PostgreSQL sitportaldb)
  async fetchNotices(): Promise<NoticeItem[]> {
    const response = await fetch(`${API_BASE_URL}/notices`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch notices from database');
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

  async deleteNotice(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete notice from database');
  },

  // Student Endpoints (PostgreSQL sitportaldb)
  async fetchStudents(): Promise<StudentRecord[]> {
    const response = await fetch(`${API_BASE_URL}/students`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch students from database');
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

  async createFaculty(faculty: Omit<FacultyMember, 'id'>): Promise<FacultyMember> {
    const response = await fetch(`${API_BASE_URL}/faculty`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(faculty),
    });
    if (!response.ok) throw new Error('Failed to create faculty record');
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

  async createDocument(doc: Partial<UploadAsset>): Promise<UploadAsset> {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(doc),
    });
    if (!response.ok) throw new Error('Failed to save document to database');
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

  // Research & Lab Endpoints
  async fetchLaboratories(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/laboratories`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch laboratories from database');
    return await response.json();
  },

  async fetchResearchLabs(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/research-labs`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch research labs from database');
    return await response.json();
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
  async getVapidPublicKey(): Promise<{publicKey: string}> {
    const response = await fetch(`${API_BASE_URL}/push/vapid-public-key`);
    if (!response.ok) throw new Error('Failed to fetch VAPID public key');
    return await response.json();
  },

  async subscribeToWebPush(subscription: any): Promise<string> {
    // The Web Push API standard `PushSubscription.toJSON()` outputs endpoint and keys object
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

  // Real-time Analytics Statistics
  async fetchAnalyticsStats() {
    const response = await fetch(`${API_BASE_URL}/analytics/stats`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch analytics stats');
    return await response.json();
  }
};
