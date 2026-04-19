import type { Branch } from './branches';

export type BranchContact = {
  city: 'Manila' | 'Davao' | 'Cebu' | 'Pampanga';
  email: string;
  phone: string;
};

export const contactsByCity: Record<BranchContact['city'], BranchContact> = {
  Manila: {
    city: 'Manila',
    email: 'manila.office@example.com',
    phone: '+63 917 875 6567',
  },
  Davao: {
    city: 'Davao',
    email: 'davao.office@example.com',
    phone: '+63 906 787 8158',
  },
  Cebu: {
    city: 'Cebu',
    email: 'cebu.office@example.com',
    phone: '+63 920 482 4887',
  },
  Pampanga: {
    city: 'Pampanga',
    email: 'pampanga.office@example.com',
    phone: '+63 927 014 2177',
  },
};

export const branchToContactCity: Record<Branch, BranchContact['city']> = {
  Manila: 'Manila',
  Davao: 'Davao',
  Cebu: 'Cebu',
  Pampanga: 'Pampanga',
  Baguio: 'Pampanga',
  'Cagayan De Oro': 'Davao',
};

export const allBranchContacts = Object.values(contactsByCity);

export const getBranchContact = (branch: string | null) => {
  if (!branch) return null;
  const city = (branchToContactCity as Record<string, BranchContact['city'] | undefined>)[branch];
  return city ? contactsByCity[city] : null;
};

export const formatPhoneHref = (phone?: string) => (phone ? phone.replace(/[^+\d]/g, '') : '');


