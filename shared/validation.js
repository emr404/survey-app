// Shared by the browser and Node. No network claims or external validation dependency.
const contracts = require('./contracts.json');
const { countryCodes } = require('./countries.js');

function matches(value, schema) {
  if (schema.anyOf) return schema.anyOf.some(option => matches(value, option));
  if (schema.type === 'null') return value === null;
  if (schema.enum && !schema.enum.includes(value)) return false;
  if (schema.type === 'string') return typeof value === 'string' &&
    value.length >= (schema.minLength || 0) && value.length <= (schema.maxLength || 10000) &&
    (!schema.minLength || !!value.trim()) && (!schema.pattern || new RegExp(schema.pattern).test(value));
  if (schema.type === 'number' || schema.type === 'integer') return typeof value === 'number' &&
    Number.isFinite(value) && (schema.type !== 'integer' || Number.isSafeInteger(value)) &&
    (schema.minimum === undefined || value >= schema.minimum) && (schema.maximum === undefined || value <= schema.maximum);
  if (schema.type === 'array') return Array.isArray(value) && value.length >= schema.minItems &&
    (schema.maxItems === undefined || value.length <= schema.maxItems) && value.every(item => matches(item, schema.items));
  if (schema.type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === schema.required.length && schema.required.every(key =>
      Object.hasOwn(value, key) && matches(value[key], schema.properties[key]));
  return false;
}

/** @returns {Record<string, string>} */
function preferenceIssues(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { form: 'Please check your trip details.' };
  const errors = {};
  const messages = {
    departure: 'Enter a departure city or airport.',
    dailyBudget: 'Enter a daily budget greater than zero and no more than 10,000.',
    days: 'Enter a positive whole number of days.',
    travellers: 'Enter a positive whole number of travellers.',
    currency: 'Choose a currency from the list.', timing: 'Choose your date flexibility.',
    startDate: 'Choose a valid departure date.', season: 'Choose a season from the list.',
    region: 'Choose a region from the list.', interests: 'Choose at least one interest.',
    pace: 'Choose a pace from the list.', transport: 'Choose a transport option from the list.',
    maxJourneyHours: 'Choose a journey limit from 1 to 24 hours, or no limit.',
    crowds: 'Choose a crowd preference from the list.', constraints: 'Keep travel notes within 1,500 characters.',
    passportCountries: 'Choose each passport nationality once from the list.',
    residenceCountry: 'Choose a country of residence from the list.', passportType: 'Choose a travel document from the list.',
  };
  for (const key of contracts.preferences.required) {
    if (!matches(value[key], contracts.preferences.properties[key])) errors[key] = messages[key];
  }
  if (Object.keys(value).some(key => !Object.hasOwn(contracts.preferences.properties, key))) errors.form = 'Please check your trip details.';
  if (!errors.passportCountries && (value.passportCountries.some(code => !countryCodes.includes(code)) || new Set(value.passportCountries).size !== value.passportCountries.length)) errors.passportCountries = messages.passportCountries;
  if (!errors.residenceCountry && value.residenceCountry && !countryCodes.includes(value.residenceCountry)) errors.residenceCountry = messages.residenceCountry;
  if (!errors.departure && value.departure.trim().length < 2) errors.departure = messages.departure;
  if (!errors.dailyBudget && value.dailyBudget < 1) errors.dailyBudget = messages.dailyBudget;
  if (!errors.interests && !value.interests.length) errors.interests = messages.interests;
  if (!errors.interests && new Set(value.interests).size !== value.interests.length) errors.interests = 'Choose each interest only once.';
  if (!errors.startDate && value.timing === 'dates') {
    const date = new Date(value.startDate + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.startDate) || !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value.startDate) errors.startDate = messages.startDate;
  }
  return errors;
}

function validRange(range) { return range.low <= range.high; }
function validDestination(value) { return matches(value, contracts.destination) && validRange(value.dailyCost) &&
  value.visaAdvice.every(advice => countryCodes.includes(advice.passportCountry)) &&
  new Set(value.visaAdvice.map(advice => advice.passportCountry)).size === value.visaAdvice.length; }
function visaAdviceMatchesPreferences(advice, preferences) {
  return advice.length === preferences.passportCountries.length && advice.every(item =>
    preferences.passportCountries.includes(item.passportCountry) && (preferences.passportType === 'ordinary' || item.status === 'check_required'));
}
function validRecommendations(value) {
  return matches(value, contracts.recommendations) && value.destinations.every(validDestination) &&
    new Set(value.destinations.map(d => d.id)).size === value.destinations.length;
}
module.exports = { visaAdviceMatchesPreferences, contracts, matches, preferenceIssues, validDestination, validRecommendations };
