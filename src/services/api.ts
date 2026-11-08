const baseUrl = (process.env.VUE_APP_API_BASE_URL || '').replace(/\/+$/, '');
export function apiUrl(path: string): string {
  return baseUrl + path;
}
