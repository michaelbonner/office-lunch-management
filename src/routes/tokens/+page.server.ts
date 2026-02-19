import { redirect } from '@sveltejs/kit';
import { getUserTokens } from '$lib/server/api-token';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect to home if not authenticated
	if (!user) {
		throw redirect(303, '/');
	}

	const tokens = await getUserTokens(user.id);

	return {
		tokens,
		user
	};
};
