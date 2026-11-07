// Shared by the browser and Node. No network claims or external validation dependency.
const contracts = require('./contracts.json');

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
  if (!matches(value, contracts.preferences)) return { form: 'Please check your entries. Use a daily budget up to 10,000, 1–10 travellers and a positive whole number of days.' };
  const errors = {};
  if (value.departure.trim().length < 2) errors.departure = 'Enter a departure city or airport.';
  if (value.dailyBudget < 1) errors.dailyBudget = 'Enter a daily budget greater than zero.';
  if (!value.interests.length) errors.interests = 'Choose at least one interest.';
  if (new Set(value.interests).size !== value.interests.length) errors.interests = 'Choose each interest only once.';
  if (value.timing === 'dates') {
    const date = new Date(value.startDate + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.startDate) || !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value.startDate) errors.startDate = 'Choose a valid departure date.';
  }
  return errors;
}

function validRange(range) { return range.low <= range.high; }
function validDestination(value) { return matches(value, contracts.destination) && validRange(value.dailyCost); }
function validRecommendations(value) {
  return matches(value, contracts.recommendations) && value.destinations.every(validDestination) &&
    new Set(value.destinations.map(d => d.id)).size === value.destinations.length;
}
function validItinerary(value, days) {
  return matches(value, contracts.itinerary) && validRange(value.baseDailyCost) &&
    (days === undefined || value.days.length === days) && value.days.every((day, i) => day.day === i + 1 &&
      day.activities.every(activity => validRange(activity.cost))) &&
    new Set(value.days.flatMap(day => day.activities.map(activity => activity.id))).size ===
      value.days.reduce((sum, day) => sum + day.activities.length, 0);
}
module.exports = { contracts, matches, preferenceIssues, validDestination, validRecommendations, validItinerary };
