import type { Preferences } from '@/types/travel';

export const seasons: Preferences['season'][] = [
  'Any season',
  'Spring',
  'Summer',
  'Autumn',
  'Winter',
];
export const interests: string[] = ['Coast', 'Culture', 'Food', 'Nature', 'Adventure', 'Cities'];
export const regions: Preferences['region'][] = [
  'Anywhere',
  'Europe',
  'Asia',
  'Africa',
  'South America',
];
export const journeyLimits = [2, 3, 4, 5, 6, 8, 12, 18, 24];
