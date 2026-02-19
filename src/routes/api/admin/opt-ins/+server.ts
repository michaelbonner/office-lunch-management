import { error, json } from '@sveltejs/kit';
import {
	adminOptUserIn,
	adminOptUserOut,
	getNotOptedInUsers,
	getOptedInUsers,
	getTodayDate
} from '$lib/server/opt-in';
import { isUserAdmin } from '$lib/server/organization';
import type { RequestHandler } from './$types';

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

	// Get list type parameter (defaults to opted-in users)
	const listType = url.searchParams.get('listType') || 'opted-in';

	try {
		if (listType === 'not-opted-in') {
			const notOptedInUsers = await getNotOptedInUsers(user.id, date);
			return json(notOptedInUsers);
		} else {
			const optedInUsers = await getOptedInUsers(user.id, date);
			return json(optedInUsers);
		}
	} catch (err) {
		console.error('Error fetching opted-in users:', err);
		throw error(500, 'Failed to fetch opted-in users');
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
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

	try {
		const body = await request.json();
		const { userId: targetUserId, action, date } = body;

		if (!targetUserId) {
			throw error(400, 'userId is required');
		}

		if (!action || !['in', 'out'].includes(action)) {
			throw error(400, 'action must be "in" or "out"');
		}

		const dateToUse = date || getTodayDate();

		// Validate date format
		if (!/^\d{4}-\d{2}-\d{2}$/.test(dateToUse)) {
			throw error(400, 'Invalid date format. Use YYYY-MM-DD');
		}

		if (action === 'in') {
			await adminOptUserIn(user.id, targetUserId, dateToUse);
			return json({ success: true, message: 'User opted in successfully' });
		} else {
			await adminOptUserOut(user.id, targetUserId, dateToUse);
			return json({ success: true, message: 'User opted out successfully' });
		}
	} catch (err) {
		console.error('Error processing admin opt-in request:', err);
		if (err instanceof Error && err.message.includes('Unauthorized')) {
			throw error(403, err.message);
		}
		throw error(500, 'Failed to process opt-in request');
	}
};
