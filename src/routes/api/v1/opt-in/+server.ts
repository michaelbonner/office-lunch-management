import { error, json } from '@sveltejs/kit';
import { authenticateRequest } from '$lib/server/api-auth';
import { getTodayDate, isUserOptedIn, optUserIn, optUserOut } from '$lib/server/opt-in';
import type { RequestHandler } from './$types';

/**
 * GET /api/v1/opt-in
 * Get current opt-in status
 * Supports authentication via session or API token
 */
export const GET: RequestHandler = async (event) => {
	const user = await authenticateRequest(event);
	const { url } = event;

	// Get date parameter (defaults to today)
	const dateParam = url.searchParams.get('date');
	const date = dateParam || getTodayDate();

	// Validate date format (YYYY-MM-DD)
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw error(400, 'Invalid date format. Use YYYY-MM-DD');
	}

	try {
		const optedIn = await isUserOptedIn(user.id, date);

		return json({
			userId: user.id,
			date,
			optedIn
		});
	} catch (err) {
		console.error('Error checking opt-in status:', err);
		throw error(500, 'Failed to check opt-in status');
	}
};

/**
 * POST /api/v1/opt-in
 * Opt in or out for a specific date
 * Supports authentication via session or API token
 * Body: { action: "in" | "out", date?: "YYYY-MM-DD" }
 */
export const POST: RequestHandler = async (event) => {
	const user = await authenticateRequest(event);
	const { request } = event;

	try {
		const body = await request.json();
		const { action, date } = body;

		if (!action || !['in', 'out'].includes(action)) {
			throw error(400, 'action must be "in" or "out"');
		}

		const dateToUse = date || getTodayDate();

		// Validate date format
		if (!/^\d{4}-\d{2}-\d{2}$/.test(dateToUse)) {
			throw error(400, 'Invalid date format. Use YYYY-MM-DD');
		}

		if (action === 'in') {
			await optUserIn(user.id, dateToUse);
			return json({
				success: true,
				message: 'Successfully opted in',
				userId: user.id,
				date: dateToUse,
				optedIn: true
			});
		} else {
			await optUserOut(user.id, dateToUse);
			return json({
				success: true,
				message: 'Successfully opted out',
				userId: user.id,
				date: dateToUse,
				optedIn: false
			});
		}
	} catch (err) {
		console.error('Error processing opt-in request:', err);
		throw error(500, 'Failed to process opt-in request');
	}
};
