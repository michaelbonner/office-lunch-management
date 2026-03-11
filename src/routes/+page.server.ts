import { getTodayDate, getUserOptInStatus } from '$lib/server/opt-in';
import { isUserAdmin, isUserSystemAdmin } from '$lib/server/organization';
import { getLunchSelection } from '$lib/server/voting';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	let isAdmin = false;
	let isSystemAdmin = false;
	let optInStatus = null;
	let todayDate = null;
	let todaySelection = null;

	if (user) {
		isAdmin = await isUserAdmin(user.id);
		isSystemAdmin = await isUserSystemAdmin(user.id);
		optInStatus = await getUserOptInStatus(user.id);
		todayDate = getTodayDate();

		const orgId = locals.activeOrganizationId;
		if (orgId) {
			todaySelection = await getLunchSelection(orgId);
		}
	}

	return {
		isAdmin,
		isSystemAdmin,
		isLoggedIn: !!user,
		optInStatus,
		todayDate,
		todaySelection
	};
};
