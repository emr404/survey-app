// Authored portfolio fixtures, not researched destinations, prices or live route data.
const catalogue = [
  { id: 'porto', name: 'Porto', country: 'Portugal', region: 'Europe', interests: ['Food', 'Culture', 'Cities', 'Coast'], low: 65, high: 115, flight: 6, train: 28, quieter: false,
    highlights: ['A neighbourhood food walk', 'Time beside the river', 'An unhurried coastal day'],
    activities: ['Explore a riverside neighbourhood', 'Try a local food market', 'Make time for a coastal walk', 'Visit a gallery of your choice', 'Find a quiet café', 'Explore beyond the city centre'] },
  { id: 'ljubljana', name: 'Ljubljana', country: 'Slovenia', region: 'Europe', interests: ['Nature', 'Culture', 'Food', 'Adventure'], low: 70, high: 125, flight: 7, train: 22, quieter: true,
    highlights: ['A gentle river walk', 'A small-city cultural day', 'Room for an outdoor escape'],
    activities: ['Walk beside the river', 'Browse a local market', 'Explore a city park', 'Choose a museum to visit', 'Plan an optional nature excursion', 'Take a slow neighbourhood walk'] },
  { id: 'valencia', name: 'Valencia', country: 'Spain', region: 'Europe', interests: ['Coast', 'Food', 'Culture', 'Cities'], low: 75, high: 135, flight: 6, train: 18, quieter: false,
    highlights: ['An easy-going beach day', 'Food as the main event', 'A park and old-town pairing'],
    activities: ['Explore an old-town neighbourhood', 'Walk through a city park', 'Spend time by the coast', 'Visit a food market', 'Choose a cultural exhibition', 'Make space for a relaxed lunch'] },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', region: 'Asia', interests: ['Culture', 'Food', 'Nature'], low: 90, high: 170, flight: 20, train: null, quieter: false,
    highlights: ['Neighbourhood culture', 'An outdoor morning', 'A food-focused evening'],
    activities: ['Explore a traditional neighbourhood', 'Plan a garden visit', 'Browse a food market', 'Choose a cultural workshop', 'Walk a quieter local route', 'Visit a small exhibition'] },
  { id: 'cape-town', name: 'Cape Town', country: 'South Africa', region: 'Africa', interests: ['Coast', 'Nature', 'Adventure', 'Food'], low: 75, high: 145, flight: 18, train: null, quieter: true,
    highlights: ['An outdoor-focused day', 'Time along the coast', 'Local food and culture'],
    activities: ['Plan a coastal walk', 'Choose a food market', 'Explore a cultural neighbourhood', 'Plan a weather-dependent outdoor trip', 'Take a relaxed café break', 'Visit a gallery of your choice'] },
  { id: 'medellin', name: 'Medellín', country: 'Colombia', region: 'South America', interests: ['Culture', 'Food', 'Nature', 'Cities'], low: 55, high: 105, flight: 22, train: null, quieter: true,
    highlights: ['A cultural neighbourhood day', 'An open-air afternoon', 'Space for local food'],
    activities: ['Choose a guided cultural walk', 'Visit a food market', 'Explore a city garden', 'Plan a neighbourhood café stop', 'Choose a museum', 'Leave time for a relaxed local walk'] },
];

export function demoRecommendations(p) {
  const london = /\blondon\b|\blhr\b|\blgw\b/i.test(p.departure);
  const conflicts = ['Demo matches use a small authored catalogue. Free-text constraints are preserved but cannot be evaluated by this simulation.'];
  if (!london) conflicts.push('This demo only has illustrative journey durations from London. Other departure locations have unknown journey times.');
  const candidates = catalogue.filter(d => (p.region === 'Anywhere' || p.region === d.region) &&
    (p.transport !== 'Train' || d.train !== null) && d.low <= p.dailyBudget &&
    (p.maxJourneyHours === null || (london && (p.transport === 'Train' ? d.train : d.flight) <= p.maxJourneyHours)));
  candidates.sort((a, b) => {
    const score = d => p.interests.filter(i => d.interests.includes(i)).length * 2 + (p.crowds === 'Quieter places' && d.quieter ? 3 : 0);
    return score(b) - score(a) || a.low - b.low;
  });
  const destinations = candidates.slice(0, 3).map(d => {
    const shared = p.interests.filter(i => d.interests.includes(i));
    const duration = london ? (p.transport === 'Train' ? d.train : d.flight) : null;
    return {
      id: d.id, name: d.name, country: d.country,
      matchReasons: [shared.length ? `Your interests in ${shared.join(' and ').toLowerCase()} align with this sample plan.` : 'This sample is an alternative; your interests are only a partial match.',
        `The illustrative daily range starts at ${p.currency} ${d.low}, compared with your ${p.currency} ${p.dailyBudget} daily limit per person.`,
        `Your ${p.days}-day, ${p.pace.toLowerCase()} trip leaves room to edit this into your own plan.`],
      tradeoffs: [`The upper end of the sample cost range ${d.high > p.dailyBudget ? 'exceeds' : 'is within'} your daily target. Actual costs are unknown.`,
        p.crowds === 'Quieter places' ? 'The demo favours slower neighbourhood activities; it cannot verify crowd levels.' : 'Journey time, weather and local conditions still need checking.'],
      highlights: d.highlights, dailyCost: { low: d.low, high: d.high },
      costNote: `Illustrative ${p.currency} amounts per person per day, including accommodation, meals, local transport and activities. Excludes travel to the destination. These are sample numbers, not exchange-rate conversions or market prices.`,
      journeyHours: duration,
      journeyNote: duration === null ? 'Journey duration is unknown for this departure location.' : `Illustrative one-way, door-to-door ${p.transport === 'Train' ? 'rail' : 'air'} journey from London; not a checked route or schedule.`,
      seasonNote: 'Seasonal conditions have not been checked. Outdoor activities need a weather alternative.',
      crowdNote: p.crowds === 'Quieter places' ? 'Sample plan prioritises neighbourhood walks. Actual crowd levels are unknown.' : 'Crowd levels are unknown; central attractions may need advance planning.',
    };
  });
  return {
    summary: destinations.length ? `A starting shortlist for ${p.days} days, leaving ${p.departure}, with ${p.currency} ${p.dailyBudget} per person per day. These are simulated matches for you to question and refine.` : 'No demo destinations fit these structured limits. Try a wider region, a higher budget or a longer journey allowance. No preferences were relaxed automatically.',
    conflicts, destinations,
    notes: ['All destination details and numeric ranges here are authored demo assumptions, not verified external data.',
      'Check transport, accommodation, weather and accessibility directly before relying on this plan.',
      'No booking, payment, live availability or external research takes place.'],
  };
}

export function demoItinerary(p, destination) {
  const source = catalogue.find(d => d.id === destination.id);
  const titles = source?.activities || ['Explore a neighbourhood', 'Make time for a local meal', 'Choose a cultural visit', 'Take an outdoor break'];
  return {
    days: Array.from({ length: p.days }, (_, i) => ({ day: i + 1, activities: [0, 1].map((_, j) => ({
      id: `day-${i + 1}-activity-${j + 1}`,
      title: titles[(i * 2 + j) % titles.length],
      description: 'An editable demo suggestion. Choose the actual location and check access, opening times and travel between stops. Repeated themes are intentional open planning time.',
      durationMinutes: p.pace === 'Relaxed' ? 90 : 120,
      cost: j === 0 ? { low: 0, high: 10 } : { low: 10, high: 25 },
    })) })),
    baseDailyCost: { low: Math.max(0, destination.dailyCost.low - 10), high: Math.max(0, destination.dailyCost.high - 35) },
    assumptions: [`All amounts are illustrative ${p.currency} estimates per person, not live prices.`,
      'Base daily costs cover accommodation, meals and local transport. Activity estimates are added separately; travel to the destination is excluded.',
      'Travel days are included in your trip length. Adjust the first and last day after checking arrival and departure times.',
      'The simulation rotates sample activities; replace repeated themes with your own choices. Accessibility, weather, travel times and opening hours are unverified.'],
  };
}
