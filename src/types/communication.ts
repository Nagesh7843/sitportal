export interface ActivityLog {
  id?: string | number;
  title: string;
  subtitle: string;
  timeAgo: string;
  icon: string;
  type: 'notice' | 'faculty' | 'email' | 'system';
  colorBg: string;
  colorIcon: string;
}

export interface UploadAsset {
  id?: string | number;
  title: string;
  category: 'Material' | 'Assignment' | 'Notice' | 'Syllabus';
  uploadedAt: string;
  status: 'Published' | 'Pending Review' | 'Archived';
  fileSize?: string;
  downloadUrl?: string;
}

export interface EmailLog {
  id?: string | number;
  subject: string;
  recipientGroup: string;
  recipientCount: number;
  sentAt: string;
  status: 'SUCCESS' | 'FAILED' | 'SCHEDULED' | 'SENDING' | 'SIMULATED' | 'NO_RECIPIENTS';
  priority: 'URGENT' | 'NORMAL';
  openRate?: string;
  content?: string;
  recipientEmails?: string;
  attachments?: string | string[];
}

export interface DepartmentEvent {
  id?: string | number;
  title: string;
  dateDay: string;
  dateMonth: string;
  location: string;
  time: string;
  category: string;
  status: 'Upcoming' | 'Closed' | 'Live';
}

export interface ScrapedNotice {
  title: string;
  pdfUrl: string;
  category: string;
  priority: string;
  date?: string;
  sourceUrl?: string;
  author?: string;
  isNew?: boolean;
}

export interface ContactFacultyRequest {
  facultyId?: string | number;
  facultyName: string;
  facultyEmail: string;
  studentName: string;
  studentEmail: string;
  studentPrn?: string;
  academicYear?: string;
  division?: string;
  inquiryType: string;
  subject: string;
  message: string;
  priority?: 'NORMAL' | 'URGENT';
}

