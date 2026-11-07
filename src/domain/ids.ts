export function newId(prefix = ''): string {
  const values = crypto.getRandomValues(new Uint32Array(3));
  return prefix + Array.from(values).map(value => value.toString(16).padStart(8, '0')).join('');
}
