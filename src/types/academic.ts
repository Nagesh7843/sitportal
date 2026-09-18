export type AcademicYear = 'FE' | 'SE' | 'TE' | 'BE';
export type Division = 'Div A' | 'Div B' | 'Div C';
export type BatchGroup = 'A1' | 'A2' | 'A3' | 'B1' | 'B2' | 'B3' | 'C1' | 'C2' | 'C3';
export type DepartmentCode = 
  | 'CSE' 
  | 'AIDS' 
  | 'MECH' 
  | 'CIVIL' 
  | 'ENTC' 
  | 'ELECTRICAL' 
  | 'MECHATRONICS' 
  | 'BASIC_SCIENCES' 
  | string;

export interface FacultyMember {
  id?: string | number;
  name: string;
  specialization: string;
  rank: string;
  status?: string;
  email: string;
  avatar?: string;
  officeHours?: string;
  publicationsCount?: number;
  designation?: string;
  qualification?: string;
  teachingExperience?: string;
  industrialExperience?: string;
  department?: DepartmentCode;
  assignedDivisions?: Division[];
  assignedCourses?: string[];
}

export interface StudentRecord {
  id?: string | number;
  name: string;
  rollNo: string;
  prn: string;
  gpa: number;
  cohortBatch: string;
  email: string;
  department?: string;
  avatarBg?: string;
  initials?: string;
  academicYear?: AcademicYear;
  division?: Division;
  batchGroup?: BatchGroup;
  status?: 'Active' | 'Inactive';
  attendance?: number;
  cgpa?: number;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  diplomaPercentage?: number;
  qualificationPath?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentRelationship?: string;
  addressLine1?: string;
  addressLine2?: string;
  villageCity?: string;
  taluka?: string;
  district?: string;
  state?: string;
  pinCode?: string;
  country?: string;
}

export interface CourseItem {
  id?: string | number;
  code: string;
  title: string;
  semester: number;
  credits: number;
  type: 'Core' | 'Elective' | 'Lab' | 'Audit' | string;
  instructor: string;
  description: string;
}
