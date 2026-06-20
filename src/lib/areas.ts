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

export const AREA_GROUPS = [
  {
    label: 'Kashmir Valley',
    items: ['Srinagar', 'Baramulla', 'Anantnag', 'Budgam', 'Ganderbal', 'Kupwara', 'Bandipora', 'Pulwama', 'Kulgam', 'Shopian'],
  },
  {
    label: 'Jammu Region',
    items: ['Jammu', 'Doda', 'Kathua', 'Kishtwar', 'Poonch', 'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Udhampur'],
  },
  {
    label: 'Tourist Destinations',
    items: ['Dal Lake', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Patnitop', 'Yusmarg', 'Doodhpathri', 'Kokernag', 'Nigeen Lake', 'Other'],
  },
];

export type KashmirArea = (typeof KASHMIR_AREAS)[number];
export type ShikaraArea = (typeof SHIKARA_AREAS)[number];
