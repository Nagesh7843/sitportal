export interface PlacementStat {
  id?: number;
  highestPackage?: string;
  averagePackage?: string;
  placementRatio?: string;
  totalOffers?: string;
  batchYear?: string;
  bannerImageUrl?: string;
  description?: string;
  updatedAt?: string;
}

export interface PlacementRecruiter {
  id: number | string;
  name: string;
  packageBand?: string;
  roleTag?: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  createdAt?: string;
}

export interface PlacementDrive {
  id: number | string;
  companyName: string;
  role: string;
  packageLpa?: string;
  driveDate?: string;
  eligibility?: string;
  location?: string;
  applyDeadline?: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | string;
  logoUrl?: string;
  bannerImageUrl?: string;
  description?: string;
  createdAt?: string;
}

export interface PlacedStudentAchievement {
  id?: number | string;
  studentName: string;
  prn?: string;
  division?: string;
  photoUrl?: string;
  companyName: string;
  companyLogoUrl?: string;
  role?: string;
  packageLpa?: string;
  batchYear?: string;
  placedDate?: string;
  bannerImageUrl?: string;
  createdAt?: string;
}

export interface PlacedStudent {
  name: string;
  rollNo?: string;
  prn?: string;
  division?: string;
  packageLpa?: string;
  photoUrl?: string;
}

export interface PlacementNoticeRequest {
  companyName: string;
  role?: string;
  packageLpa?: string;
  companyLogoUrl?: string;
  placedStudents: PlacedStudent[];
  bannerImageUrl?: string;
  congratulationsMessage?: string;
  batchYear?: string;
}

export interface PlacementSummaryResponse {
  stats: PlacementStat | null;
  recruiters: PlacementRecruiter[];
  drives: PlacementDrive[];
  achievers?: PlacedStudentAchievement[];
}
