export const OFFICE_NOW_VALUE = 'I am at the office now';

export const consultationMethods = [
  'In-Person (at the office for future date)',
  'Online Consultation (Zoom, Teams, Meets)',
  OFFICE_NOW_VALUE,
] as const;

export const consultationTimes = ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00'] as const;

