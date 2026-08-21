import { AcademicYear, Division, BatchGroup } from './academic';
import { UserRole } from './user';
import { UploadAsset } from './communication';

export type NoticeCategory = 'Academic' | 'Exam' | 'Event' | 'Emergency' | 'Administrative' | 'Placement';
export type NoticePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type NoticeStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

export interface AudienceTarget {
  academicYear?: AcademicYear[];
  division?: Division[];
  batchGroup?: BatchGroup[];
  role?: UserRole[];
  department?: string;
  studentEmails?: string[];
}

export interface NoticeItem {
  id?: string | number;
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  category: NoticeCategory;
  priority: NoticePriority;
  status: NoticeStatus;
  targetAudience: AudienceTarget;
  attachments?: UploadAsset[];
  publishedAt: string;
  scheduledFor?: string;
  expiresAt?: string; // Auto-expiry timestamp or timer string
  readBy: string[]; // List of user IDs who marked this notice as read
  viewsCount: number;
}
