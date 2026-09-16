import { AcademicYear, Division, BatchGroup } from './academic';

export type UserRole = 'admin' | 'hod' | 'faculty' | 'student' | 'parent' | 'public';

export interface UserProfile {
  id?: number | string;
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

  // Student Specific Profile Fields
  prn?: string;
  rollNo?: string;
  academicYear?: AcademicYear;
  division?: Division;
  batchGroup?: BatchGroup;
  cohortBatch?: string;
  gpa?: number;
  cgpa?: number;
  attendance?: number;
  qualificationPath?: '12TH' | 'DIPLOMA';
  tenthPercentage?: number;
  twelfthPercentage?: number;
  diplomaPercentage?: number;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentRelationship?: string;

  // Faculty / HOD Specific Profile Fields
  designation?: string;
  rankTitle?: string;
  rank?: string;
  specialization?: string;
  teachingExperience?: string;
  industrialExperience?: string;
  officeHours?: string;

  // Faculty Default Working Batch (Propagated across the portal)
  defaultAcademicYear?: AcademicYear | string;
  defaultDivision?: Division | string;
  defaultBatchGroup?: BatchGroup | string;

  // Parent Specific Profile Fields
  studentRollNo?: string;
}

export interface WorkingBatchConfig {
  department: string;
  academicYear: AcademicYear | string;
  division: Division | string;
  batchGroup: BatchGroup | string;
}

