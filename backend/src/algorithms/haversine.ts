export const EARTH_RADIUS_KM = 6371;

export type Coordinates = {
	latitude: number;
	longitude: number;
};

function toRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
	const fromLatitude = toRadians(from.latitude);
	const toLatitude = toRadians(to.latitude);
	const deltaLatitude = toRadians(to.latitude - from.latitude);
	const deltaLongitude = toRadians(to.longitude - from.longitude);

	const a =
		Math.sin(deltaLatitude / 2) ** 2 +
		Math.cos(fromLatitude) *
			Math.cos(toLatitude) *
			Math.sin(deltaLongitude / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_RADIUS_KM * c;
}
