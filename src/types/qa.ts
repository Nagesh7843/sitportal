export interface QuestionAnswerItem {
  id: number;
  questionId?: number;
  responderId?: number;
  responderName: string;
  responderRole: string;
  responderTitle?: string;
  content: string;
  isOfficialAnswer?: boolean;
  createdAt: string;
}

export interface QuestionItem {
  id: number;
  title: string;
  content: string;
  category: string; // Academics, Examinations, Fees, Placement, Campus, Attendance, General
  authorId?: number;
  authorName: string;
  authorRole: 'student' | 'parent' | 'faculty' | 'admin';
  authorEmail?: string;
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED';
  upvotes: number;
  viewsCount: number;
  answers: QuestionAnswerItem[];
  createdAt: string;
  updatedAt?: string;
}
