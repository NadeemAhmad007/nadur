export const KASHMIR_AREAS = [
  // Kashmir Valley Districts
  'Anantnag',
  'Baramulla',
  'Bandipora',
  'Budgam',
  'Ganderbal',
  'Kulgam',
  'Kupwara',
  'Pulwama',
  'Shopian',
  'Srinagar',
  // Jammu Region Districts
  'Doda',
  'Jammu',
  'Kathua',
  'Kishtwar',
  'Poonch',
  'Rajouri',
  'Ramban',
  'Reasi',
  'Samba',
  'Udhampur',
  // Major Tourist Destinations
  'Dal Lake',
  'Doodhpathri',
  'Gulmarg',
  'Kokernag',
  'Nigeen Lake',
  'Pahalgam',
  'Patnitop',
  'Sonamarg',
  'Yusmarg',
  // Other
  'Other',
] as const;

export const SHIKARA_AREAS = [
  'Dal Lake',
  'Nigeen Lake',
  'Jhelum',
  'Other',
] as const;

export type KashmirArea = (typeof KASHMIR_AREAS)[number];
export type ShikaraArea = (typeof SHIKARA_AREAS)[number];
