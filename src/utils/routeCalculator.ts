export interface MeetPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export const POPULAR_MEET_POINTS: MeetPoint[] = [
  { id: 'arh_morvokzal', name: 'Архангельск (Морской вокзал)', lat: 64.5385, lon: 40.5180 },
  { id: 'arh_solombala', name: 'Архангельск (Соломбала, пл. Терёхина)', lat: 64.5880, lon: 40.5280 },
  { id: 'sev_yagry', name: 'Северодвинск (о. Ягры, вахта)', lat: 64.5980, lon: 39.8150 },
  { id: 'sev_center', name: 'Северодвинск (пл. Победы)', lat: 64.5630, lon: 39.8300 },
  { id: 'novodvinsk', name: 'Новодвинск (Центральная площадь)', lat: 64.4170, lon: 40.8120 },
  { id: 'lapominka', name: 'Пос. Лапоминка (причал катеров)', lat: 64.7800, lon: 40.4500 }
];

/**
 * Calculates distance (km) between two coordinates using Haversine formula
 * with a realistic road/water coefficient (~1.35x) and round-trip (2x).
 */
export function calculateRoundTripDistanceKm(
  startLat: number,
  startLon: number,
  destLat: number,
  destLon: number
): number {
  if (!startLat || !startLon || !destLat || !destLon) return 40;

  const R = 6371; // Earth radius in km
  const dLat = ((destLat - startLat) * Math.PI) / 180;
  const dLon = ((destLon - startLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((startLat * Math.PI) / 180) *
      Math.cos((destLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;

  // Multiplier 1.35 for realistic roads/ice tracks, x2 for round-trip (туда и обратно)
  const roundTrip = Math.round(directDistance * 1.35 * 2);
  return Math.max(roundTrip, 15);
}

export function calculateFuelCost(
  distanceKm: number,
  consumptionPer100km: number = 11.5,
  pricePerLiter: number = 56.5,
  crewCount: number = 3
) {
  const liters = (distanceKm / 100) * consumptionPer100km;
  const totalCost = Math.round(liters * pricePerLiter);
  const safeCrew = Math.max(crewCount, 1);
  const costPerPerson = Math.round(totalCost / safeCrew);

  return {
    liters: Number(liters.toFixed(1)),
    totalCost,
    costPerPerson
  };
}
