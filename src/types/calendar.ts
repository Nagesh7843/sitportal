export type EventType = 
  | 'EXAM' 
  | 'ASSIGNMENT' 
  | 'PROJECT_REVIEW' 
  | 'HOLIDAY' 
  | 'WORKSHOP' 
  | 'FEST' 
  | 'RESULT' 
  | 'REGISTRATION' 
  | 'GENERAL';

export interface CalendarEventItem {
  id: number;
  calendarId?: number;
  title: string;
  eventType: EventType;
  startDate: string;
  endDate?: string;
  description?: string;
  targetAudience: 'ALL' | 'STUDENT' | 'PARENT' | 'FACULTY';
  location?: string;
  isNoticePlanned: boolean;
  daysBeforeNotice: number;
  noticeStatus: 'PENDING' | 'GENERATED' | 'DISABLED';
  generatedNoticeId?: number;
  createdAt?: string;
}

export interface AcademicCalendarItem {
  id: number;
  title: string;
  academicYear: string;
  semesterType: 'EVEN' | 'ODD';
  startDate: string;
  endDate: string;
  isActive: boolean;
  events: CalendarEventItem[];
  createdAt?: string;
}
