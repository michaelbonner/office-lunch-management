import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { getNotOptedInUsers, getOptedInUsers, getTodayDate } from '$lib/server/opt-in';
import { getUsersInSameOrganizations, isUserAdmin } from '$lib/server/organization';
import { restaurant } from '../../../../drizzle/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect to home if not authenticated
	if (!user) {
		throw redirect(303, '/');
	}

	// Redirect to home if not admin in any organization
	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw redirect(303, '/');
	}

	const activeOrgId = locals.activeOrganizationId;

	// Load restaurants for active organization only
	const allRestaurants = activeOrgId
		? await db.select().from(restaurant).where(eq(restaurant.organizationId, activeOrgId))
		: [];

	// Load users in the same organization(s)
	const allUsers = await getUsersInSameOrganizations(user.id);

	// Load opted-in users for today
	const optedInUsers = await getOptedInUsers(user.id, getTodayDate());

	// Load users who haven't opted in for today
	const notOptedInUsers = await getNotOptedInUsers(user.id, getTodayDate());

	return {
		restaurants: allRestaurants,
		users: allUsers,
		optedInUsers,
		notOptedInUsers,
		user
	};
};
