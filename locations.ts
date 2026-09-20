export interface Location {
  name: string;
  x: number;
  y: number;
}

export const LOCATIONS: Location[] = [
  { name: 'Amrita College', x: 10, y: 15 },
  { name: 'Chennai Central', x: 25, y: 30 },
  { name: 'Chennai Airport', x: 5, y: 5 },
  { name: 'T Nagar', x: 20, y: 20 },
  { name: 'Anna Nagar', x: 15, y: 35 },
  { name: 'Marina Beach', x: 35, y: 25 },
  { name: 'Tambaram', x: 12, y: 8 },
  { name: 'Guindy', x: 18, y: 15 },
  { name: 'Velachery', x: 22, y: 12 },
  { name: 'Adyar', x: 28, y: 18 },
  { name: 'Chromepet', x: 14, y: 6 },
  { name: 'Porur', x: 8, y: 20 },
];

export const LOCATION_MAP = new Map<string, Location>(
  LOCATIONS.map(l => [l.name, l])
);

export function getCoords(name: string): { x: number; y: number } | null {
  return LOCATION_MAP.get(name) ?? null;
}

export function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return parseFloat(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2).toFixed(2));
}
