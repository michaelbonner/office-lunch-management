import { redirect } from '@sveltejs/kit';
import { getTodayDate } from '$lib/server/opt-in';
import { isUserAdmin } from '$lib/server/organization';
import { getLunchSelection, getVoteTalliesForDate } from '$lib/server/voting';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) throw redirect(303, '/');

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) throw redirect(303, '/');

	const orgId = locals.activeOrganizationId;

	const [tallies, selection] = await Promise.all([
		orgId ? getVoteTalliesForDate(orgId) : [],
		orgId ? getLunchSelection(orgId) : null
	]);

	return {
		tallies,
		selection,
		activeOrganizationId: orgId,
		todayDate: getTodayDate()
	};
};
