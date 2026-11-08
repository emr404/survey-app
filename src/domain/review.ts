import type { Preferences } from '@/types/travel';
import type { ReviewSection } from '@/types/brief';
import { money, countLabel } from './preferences';
import { countryName } from './countries';

export function reviewSections(p: Preferences): ReviewSection[] {
  return [
    {
      title: 'Your trip',
      rows: [
        ['Departure', p.departure],
        [
          'Length & group',
          `${countLabel(p.days, 'day')}, ${countLabel(p.travellers, 'traveller')}`,
        ],
        ['Dates', p.timing === 'dates' ? p.startDate : `${p.season}, flexible dates`],
      ],
    },
    {
      title: 'Budget',
      rows: [
        [
          'Per person',
          `${money(p.dailyBudget, p.currency)} a day, ${money(
            p.dailyBudget * p.days,
            p.currency
          )} for the trip`,
        ],
        ['Group target', money(p.dailyBudget * p.days * p.travellers, p.currency)],
        [
          'Journey',
          `${p.transport}, ${
            p.maxJourneyHours === null
              ? 'no time limit set'
              : 'up to ' + countLabel(p.maxJourneyHours, 'hour') + ' door to door, one way'
          }`,
        ],
      ],
    },
    {
      title: 'Passports',
      rows: [
        [
          'Nationalities',
          p.passportCountries.map(countryName).join(', ') ||
            'Not provided. Entry requirements will need a separate check.',
        ],
        ['Residence', p.residenceCountry ? countryName(p.residenceCountry) : 'Not specified'],
        [
          'Travel document',
          p.passportType === 'ordinary' ? 'Ordinary passport' : 'Other travel document',
        ],
      ],
    },
    {
      title: 'Interests',
      rows: [
        ['What you enjoy', p.interests.join(', ')],
        ['Pace & crowds', `${p.pace}, ${p.crowds.toLowerCase()}`],
        ['Region', p.region],
        ['Things to consider', p.constraints || 'None added'],
      ],
    },
  ];
}
