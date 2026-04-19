export const branches = [
  'Baguio',
  'Cagayan De Oro',
  'Cebu',
  'Davao',
  'Manila',
  'Pampanga',
] as const;

export type Branch = (typeof branches)[number];
export type StaffBranch = 'Pampanga' | 'Cebu' | 'Davao' | 'Manila';

const staffBranchByPreferred: Record<Branch, StaffBranch> = {
  Baguio: 'Pampanga',
  Pampanga: 'Pampanga',
  Cebu: 'Cebu',
  Davao: 'Davao',
  'Cagayan De Oro': 'Davao',
  Manila: 'Manila',
};

export const getStaffBranch = (preferredBranch: string) =>
  (staffBranchByPreferred as Record<string, StaffBranch | undefined>)[preferredBranch] ?? null;

