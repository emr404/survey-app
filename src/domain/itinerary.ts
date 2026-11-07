import { Activity, CostRange, Destination, ItineraryDraft, ItineraryResult, Preferences } from './types';
import { contracts, matches, validItinerary } from '../../shared/validation';
import { samePreferences } from './preferences';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function createDraft(destination: Destination, preferences: Preferences, result: ItineraryResult): ItineraryDraft {
  if (!validItinerary({ days: result.days, baseDailyCost: result.baseDailyCost, assumptions: result.assumptions }, preferences.days)) {
    throw new Error('The itinerary is incomplete. Please try again.');
  }
  return { destination: clone(destination), preferences: clone(preferences),
    content: clone({ days: result.days, baseDailyCost: result.baseDailyCost, assumptions: result.assumptions }),
    mode: result.mode, revision: 1, approvedRevision: null, approvedAt: null };
}
function changed(draft: ItineraryDraft): ItineraryDraft {
  const next = clone(draft);
  next.revision++;
  next.approvedRevision = null;
  next.approvedAt = null;
  return next;
}
export function removeActivity(draft: ItineraryDraft, day: number, id: string): ItineraryDraft {
  if (!draft.content.days[day]?.activities.some(activity => activity.id === id)) return draft;
  const next = changed(draft);
  next.content.days[day].activities = next.content.days[day].activities.filter(activity => activity.id !== id);
  return next;
}
export function moveActivity(draft: ItineraryDraft, day: number, id: string, direction: -1 | 1): ItineraryDraft {
  const activities = draft.content.days[day]?.activities;
  const index = activities?.findIndex(activity => activity.id === id) ?? -1;
  if (!activities || index < 0 || index + direction < 0 || index + direction >= activities.length) return draft;
  const next = changed(draft);
  const list = next.content.days[day].activities;
  [list[index], list[index + direction]] = [list[index + direction], list[index]];
  return next;
}
export function replaceActivity(draft: ItineraryDraft, day: number, activity: Activity): ItineraryDraft {
  if (!matches(activity, contracts.activity) || activity.cost.low > activity.cost.high) throw new Error('Check the activity title, duration and cost range.');
  const list = draft.content.days[day]?.activities;
  if (!list) throw new Error('This day no longer exists.');
  const index = list.findIndex(item => item.id === activity.id);
  if (index < 0 && list.length >= 4) throw new Error('Keep each day to four activities or fewer.');
  if (draft.content.days.some((item, i) => i !== day && item.activities.some(a => a.id === activity.id))) throw new Error('Activity IDs must be unique.');
  const next = changed(draft);
  if (index < 0) next.content.days[day].activities.push(clone(activity));
  else next.content.days[day].activities[index] = clone(activity);
  return next;
}
export function approvalIssues(draft: ItineraryDraft, preferences: Preferences): string[] {
  const issues: string[] = [];
  if (!samePreferences(draft.preferences, preferences)) issues.push('Your trip preferences changed. Return to recommendations and build a plan for those preferences.');
  if (!validItinerary(draft.content, draft.preferences.days)) issues.push('The itinerary contains invalid details.');
  if (draft.content.days.some(day => !day.activities.length)) issues.push('Add at least one activity to every day before approval.');
  if (draft.content.days.some(day => day.activities.reduce((sum, a) => sum + a.durationMinutes, 0) > 720)) issues.push('Keep planned activities within 12 hours per day.');
  return issues;
}
export function approveDraft(draft: ItineraryDraft, preferences: Preferences, confirmed: boolean, at: string): ItineraryDraft {
  const issues = approvalIssues(draft, preferences);
  if (!confirmed || issues.length || !Number.isFinite(Date.parse(at))) throw new Error(issues[0] || 'Confirm that you have reviewed this plan before approving it.');
  return { ...clone(draft), approvedRevision: draft.revision, approvedAt: at };
}
export const isApproved = (draft: ItineraryDraft, preferences: Preferences): boolean =>
  draft.approvedRevision === draft.revision && !!draft.approvedAt && !approvalIssues(draft, preferences).length;
export function estimateTotal(draft: ItineraryDraft): CostRange {
  const activityCosts = draft.content.days.flatMap(day => day.activities).reduce((sum, activity) => ({
    low: sum.low + activity.cost.low, high: sum.high + activity.cost.high,
  }), { low: 0, high: 0 });
  return { low: Math.round(draft.content.baseDailyCost.low * draft.preferences.days + activityCosts.low),
    high: Math.round(draft.content.baseDailyCost.high * draft.preferences.days + activityCosts.high) };
}
