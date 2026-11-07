// Test-only authored data. Never imported by the application or used as a live fallback.
const catalogue = [
  { id: 'porto', name: 'Porto', country: 'Portugal', region: 'Europe', interests: ['Food', 'Culture', 'Cities', 'Coast'], low: 65, high: 115, flight: 6, train: 28, quieter: false,
    highlights: ['A neighbourhood food walk', 'Time beside the river', 'An unhurried coastal day'] },
  { id: 'ljubljana', name: 'Ljubljana', country: 'Slovenia', region: 'Europe', interests: ['Nature', 'Culture', 'Food', 'Adventure'], low: 70, high: 125, flight: 7, train: 22, quieter: true,
    highlights: ['A gentle river walk', 'A small-city cultural day', 'Room for an outdoor escape'] },
  { id: 'valencia', name: 'Valencia', country: 'Spain', region: 'Europe', interests: ['Coast', 'Food', 'Culture', 'Cities'], low: 75, high: 135, flight: 6, train: 18, quieter: false,
    highlights: ['An easy-going beach day', 'Food as the main event', 'A park and old-town pairing'] },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', region: 'Asia', interests: ['Culture', 'Food', 'Nature'], low: 90, high: 170, flight: 20, train: null, quieter: false,
    highlights: ['Neighbourhood culture', 'An outdoor morning', 'A food-focused evening'] },
  { id: 'cape-town', name: 'Cape Town', country: 'South Africa', region: 'Africa', interests: ['Coast', 'Nature', 'Adventure', 'Food'], low: 75, high: 145, flight: 18, train: null, quieter: true,
    highlights: ['An outdoor-focused day', 'Time along the coast', 'Local food and culture'] },
  { id: 'medellin', name: 'Medellín', country: 'Colombia', region: 'South America', interests: ['Culture', 'Food', 'Nature', 'Cities'], low: 55, high: 105, flight: 22, train: null, quieter: true,
    highlights: ['A cultural neighbourhood day', 'An open-air afternoon', 'Space for local food'] },
];

export function recommendationFixture(p) {
  const london = /\blondon\b|\blhr\b|\blgw\b/i.test(p.departure);
  const conflicts = ['Test fixture matches use a small authored catalogue. Free-text constraints are preserved but cannot be evaluated by this simulation.'];
  if (!london) conflicts.push('This test fixture only has illustrative journey durations from London. Other departure locations have unknown journey times.');
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
      visaAdvice: (p.passportCountries || []).map(passportCountry => ({ passportCountry, status: 'check_required', note: 'This fixture does not evaluate entry rules. Check requirements for this passport and your trip with the destination authorities or IATA.' })),
      id: d.id, name: d.name, country: d.country,
      matchReasons: [shared.length ? `Your interests in ${shared.join(' and ').toLowerCase()} align with this sample plan.` : 'This sample is an alternative; your interests are only a partial match.',
        `The illustrative daily range starts at ${p.currency} ${d.low}, compared with your ${p.currency} ${p.dailyBudget} daily limit per person.`,
        `Your ${p.days}-day, ${p.pace.toLowerCase()} trip leaves room to edit this into your own plan.`],
      tradeoffs: [`The upper end of the sample cost range ${d.high > p.dailyBudget ? 'exceeds' : 'is within'} your daily target. Actual costs are unknown.`,
        p.crowds === 'Quieter places' ? 'The test fixture favours slower neighbourhood activities; it cannot verify crowd levels.' : 'Journey time, weather and local conditions still need checking.'],
      highlights: d.highlights, dailyCost: { low: d.low, high: d.high },
      costNote: `Illustrative ${p.currency} amounts per person per day, including accommodation, meals, local transport and activities. Excludes travel to the destination. These are sample numbers, not exchange-rate conversions or market prices.`,
      journeyHours: duration,
      journeyNote: duration === null ? 'Journey duration is unknown for this departure location.' : `Illustrative one-way, door-to-door ${p.transport === 'Train' ? 'rail' : 'air'} journey from London; not a checked route or schedule.`,
      seasonNote: 'Seasonal conditions have not been checked. Outdoor activities need a weather alternative.',
      crowdNote: p.crowds === 'Quieter places' ? 'Sample plan prioritises neighbourhood walks. Actual crowd levels are unknown.' : 'Crowd levels are unknown; central attractions may need advance planning.',
    };
  });
  return {
    summary: destinations.length ? `A starting shortlist for ${p.days} days, leaving ${p.departure}, with ${p.currency} ${p.dailyBudget} per person per day. These are simulated matches for you to question and refine.` : 'No test fixture destinations fit these structured limits. Try a wider region, a higher budget or a longer journey allowance. No preferences were relaxed automatically.',
    conflicts, destinations,
    notes: ['All destination details and numeric ranges here are authored test fixture assumptions, not verified external data.',
      'Check transport, accommodation, weather and accessibility directly before relying on this plan.',
      'No booking, payment, live availability or external research takes place.'],
  };
}

