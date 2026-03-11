import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { getTodayDate } from '$lib/server/opt-in';
import { isUserAdmin } from '$lib/server/organization';
import { getLunchSelection, getUserVotesForDate } from '$lib/server/voting';
import { restaurant } from '../../../drizzle/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user) throw redirect(303, '/');

	const orgId = locals.activeOrganizationId;

	const [restaurants, userVotes, todaySelection, isAdmin] = await Promise.all([
		orgId
			? db
					.select()
					.from(restaurant)
					.where(eq(restaurant.organizationId, orgId))
					.orderBy(restaurant.name)
			: [],
		orgId ? getUserVotesForDate(user.id, orgId) : [],
		orgId ? getLunchSelection(orgId) : null,
		isUserAdmin(user.id)
	]);

	return {
		restaurants,
		userVotes,
		todaySelection,
		isAdmin,
		activeOrganizationId: orgId,
		todayDate: getTodayDate()
	};
};
