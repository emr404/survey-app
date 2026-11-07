// Public backend URL only. The Groq key is never part of frontend configuration.
const baseUrl = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/+$/, '');
export function apiUrl(path: string): string { return baseUrl + path; }
