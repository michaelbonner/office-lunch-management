import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { optUserOut, optUserIn, getTodayDate } from '$lib/server/opt-out';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;

	// Redirect to auth if not logged in
	if (!user) {
		// Store intended destination in URL for redirect after login
		const returnUrl = url.pathname + url.search;
		throw redirect(303, `/api/auth/sign-in?callbackURL=${encodeURIComponent(returnUrl)}`);
	}

	const action = url.searchParams.get('action');

	if (!action || !['in', 'out'].includes(action)) {
		throw error(400, 'Invalid action. Use ?action=in or ?action=out');
	}

	try {
		if (action === 'out') {
			await optUserOut(user.id, getTodayDate());
		} else {
			await optUserIn(user.id, getTodayDate());
		}
	} catch (err) {
		console.error('Error processing opt-out:', err);
		throw error(500, 'Failed to process opt-out request');
	}

	// Redirect after successful operation
	throw redirect(303, `/opt-out/success?action=${action}`);
};
