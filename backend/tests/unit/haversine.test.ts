import { describe, expect, it } from 'vitest';
import { haversineDistanceKm } from '../../src/algorithms/haversine';

const SAO_PAULO = { latitude: -23.5505, longitude: -46.6333 };
const RIO_DE_JANEIRO = { latitude: -22.9068, longitude: -43.1729 };

describe('haversineDistanceKm', () => {
	it('returns zero for identical points', () => {
		expect(haversineDistanceKm(SAO_PAULO, SAO_PAULO)).toBe(0);
	});

	it('matches the reference geodesic distance between São Paulo and Rio de Janeiro', () => {
		expect(haversineDistanceKm(SAO_PAULO, RIO_DE_JANEIRO)).toBeCloseTo(360.75, 1);
	});

	it('is symmetric', () => {
		expect(haversineDistanceKm(SAO_PAULO, RIO_DE_JANEIRO)).toBeCloseTo(
			haversineDistanceKm(RIO_DE_JANEIRO, SAO_PAULO),
			10,
		);
	});

	it.each([
		[{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }, 111.19],
		[{ latitude: 0, longitude: 179.5 }, { latitude: 0, longitude: -179.5 }, 111.19],
		[{ latitude: 90, longitude: 0 }, { latitude: -90, longitude: 0 }, 20015.09],
	])('handles %j -> %j (%d km)', (from, to, expected) => {
		expect(haversineDistanceKm(from, to)).toBeCloseTo(expected, 1);
	});
});
