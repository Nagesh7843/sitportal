export type UserRole = 'admin' | 'hod' | 'faculty' | 'student' | 'parent' | 'public';

export interface UserProfile {
  name: string;
  roleTitle: string;
  role: UserRole;
  avatar: string;
  department: string;
  email: string;
  phone?: string;
  bio?: string;
  officeLocation?: string;
  qualification?: string;
}
