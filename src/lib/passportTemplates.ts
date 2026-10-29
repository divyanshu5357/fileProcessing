import { PassportPreset } from '@/types';

export const PASSPORT_PRESETS: PassportPreset[] = [
  {
    id: 'us',
    name: 'US Passport / Visa',
    country: 'United States',
    widthMm: 50.8, // 2 inches
    heightMm: 50.8,
    aspectRatio: 1.0,
    description: '2 × 2 inches (51 × 51 mm) • 600 × 600 px @ 300 DPI',
  },
  {
    id: 'schengen',
    name: 'Schengen / EU Visa',
    country: 'European Union',
    widthMm: 35,
    heightMm: 45,
    aspectRatio: 35 / 45,
    description: '35 × 45 mm • ICAO Standard compliant',
  },
  {
    id: 'india',
    name: 'India Passport / OCI',
    country: 'India',
    widthMm: 35,
    heightMm: 45,
    aspectRatio: 35 / 45,
    description: '35 × 45 mm (or 51 × 51 mm for Visa/OCI)',
  },
  {
    id: 'uk',
    name: 'UK Passport',
    country: 'United Kingdom',
    widthMm: 35,
    heightMm: 45,
    aspectRatio: 35 / 45,
    description: '35 × 45 mm • HM Passport Office standard',
  },
  {
    id: 'canada',
    name: 'Canada Passport',
    country: 'Canada',
    widthMm: 50,
    heightMm: 70,
    aspectRatio: 50 / 70,
    description: '50 × 70 mm • Government of Canada official specs',
  },
  {
    id: 'china',
    name: 'China Visa / Passport',
    country: 'China',
    widthMm: 33,
    heightMm: 48,
    aspectRatio: 33 / 48,
    description: '33 × 48 mm • Official consular requirement',
  },
  {
    id: 'custom',
    name: 'Custom Dimensions',
    country: 'Custom',
    widthMm: 35,
    heightMm: 45,
    aspectRatio: 35 / 45,
    description: 'Specify your required millimeters or aspect ratio',
  },
];

export const PASSPORT_BG_COLORS = {
  original: 'transparent',
  white: '#FFFFFF',
  offwhite: '#F4F4F6',
  light_blue: '#C5D8E8',
  light_grey: '#E2E8F0',
};
