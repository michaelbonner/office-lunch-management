import { isUserAdmin, isUserSystemAdmin } from '$lib/server/organization';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Check if user is admin
	let isAdmin = false;
	let isSystemAdmin = false;
	if (user) {
		isAdmin = await isUserAdmin(user.id);
		isSystemAdmin = await isUserSystemAdmin(user.id);
	}

	return {
		isAdmin,
		isSystemAdmin,
		isLoggedIn: !!user
	};
};
