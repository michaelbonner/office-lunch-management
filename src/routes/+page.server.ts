import { isUserAdmin } from '$lib/server/organization';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Check if user is admin
	let isAdmin = false;
	if (user) {
		isAdmin = await isUserAdmin(user.id);
	}

	return {
		isAdmin
	};
};
