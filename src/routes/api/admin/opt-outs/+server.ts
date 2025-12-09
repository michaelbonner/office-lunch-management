import { getOptedOutUsers, getTodayDate } from '$lib/server/opt-out';
import { isUserAdmin } from '$lib/server/organization';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;

	// Check authentication
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	// Check admin status
	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	// Get date parameter (defaults to today)
	const dateParam = url.searchParams.get('date');
	const date = dateParam || getTodayDate();

	// Validate date format (YYYY-MM-DD)
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		throw error(400, 'Invalid date format. Use YYYY-MM-DD');
	}

	try {
		const optedOutUsers = await getOptedOutUsers(user.id, date);
		return json(optedOutUsers);
	} catch (err) {
		console.error('Error fetching opted-out users:', err);
		throw error(500, 'Failed to fetch opted-out users');
	}
};
