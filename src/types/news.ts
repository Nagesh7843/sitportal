export interface CollegeNewsEventItem {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string;
  imageUrl: string;
  sourceUrl: string;
  location?: string;
  organizer?: string;
}

export interface PlacementDriveItem {
  id: string;
  companyName: string;
  logoUrl?: string;
  role: string;
  packageLpa: string;
  driveDate: string;
  eligibility: string;
  location: string;
  applyDeadline: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
}

export interface PlacementStats {
  highestPackage: string;
  averagePackage: string;
  placementRatio: string;
  totalOffers: string;
  topRecruitersCount: string;
  tier1OffersCount: string;
}
