import type { DemandLevel } from './dsa';

export const BASE_FARE = 50;
export const RATE_PER_UNIT = 15;

export const DEMAND_MULTIPLIERS: Record<DemandLevel, number> = {
  'Low': 1.0,
  'Normal': 1.0,
  'High': 1.25,
  'Very High': 1.50,
};

export const VEHICLE_MULTIPLIERS: Record<string, number> = {
  'Auto': 1.0,
  'Bike': 0.8,
  'Sedan': 1.2,
  'SUV': 1.5,
};

export const VEHICLE_TYPES = ['Auto', 'Bike', 'Sedan', 'SUV'];

export function calculateFare(distance: number, demand: DemandLevel, vehicle: string): number {
  const surge = DEMAND_MULTIPLIERS[demand];
  const vehicleFactor = VEHICLE_MULTIPLIERS[vehicle] ?? 1.0;
  return Math.round((BASE_FARE + distance * RATE_PER_UNIT * surge) * vehicleFactor);
}

export function getDemandFromState(activeRides: number, availableDrivers: number): DemandLevel {
  const ratio = activeRides / Math.max(1, availableDrivers);
  if (ratio < 0.5) return 'Low';
  if (ratio < 1.0) return 'Normal';
  if (ratio < 1.5) return 'High';
  return 'Very High';
}
