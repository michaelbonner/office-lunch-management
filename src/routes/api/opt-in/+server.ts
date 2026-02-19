import { error, redirect } from '@sveltejs/kit';
import { getTodayDate, optUserIn, optUserOut } from '$lib/server/opt-in';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;

	// Redirect to auth if not logged in
	if (!user) {
		// Store intended destination in URL for redirect after login
		const returnUrl = url.pathname + url.search;
		throw redirect(303, `/sign-in?callbackURL=${encodeURIComponent(returnUrl)}`);
	}

	const action = url.searchParams.get('action');

	if (!action || !['in', 'out'].includes(action)) {
		throw error(400, 'Invalid action. Use ?action=in or ?action=out');
	}

	try {
		if (action === 'in') {
			await optUserIn(user.id, getTodayDate());
		} else {
			await optUserOut(user.id, getTodayDate());
		}
	} catch (err) {
		console.error('Error processing opt-in:', err);
		throw error(500, 'Failed to process opt-in request');
	}

	// Redirect after successful operation
	throw redirect(303, `/opt-in/success?action=${action}`);
};
