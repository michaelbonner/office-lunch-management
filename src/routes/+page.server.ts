import { getUserOptInStatus, getTodayDate } from '$lib/server/opt-in';
import { isUserAdmin, isUserSystemAdmin } from '$lib/server/organization';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Check if user is admin
	let isAdmin = false;
	let isSystemAdmin = false;
	let optInStatus = null;
	let todayDate = null;

	if (user) {
		isAdmin = await isUserAdmin(user.id);
		isSystemAdmin = await isUserSystemAdmin(user.id);
		optInStatus = await getUserOptInStatus(user.id);
		todayDate = getTodayDate();
	}

	return {
		isAdmin,
		isSystemAdmin,
		isLoggedIn: !!user,
		optInStatus,
		todayDate
	};
};
