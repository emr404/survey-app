import { countries } from '../../shared/countries';

const countryNames = new Map(countries.map((country) => [country.code, country.name]));

export function countryName(code: string): string {
  return countryNames.get(code) ?? code;
}
