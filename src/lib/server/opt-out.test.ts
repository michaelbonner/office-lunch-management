import { describe, expect, it } from 'vitest';
import { getTodayDate } from './opt-out';

describe('opt-out functionality', () => {
	it("should return today's date in YYYY-MM-DD format", () => {
		const date = getTodayDate();
		expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

		// Verify it's actually today's date
		const now = new Date();
		const expectedDate = now.toISOString().split('T')[0];
		expect(date).toBe(expectedDate);
	});

	// Note: Database-dependent tests (optUserOut, isUserOptedOut, etc.)
	// are covered by E2E tests or require proper test database setup
	// These would be integration tests rather than unit tests
});
