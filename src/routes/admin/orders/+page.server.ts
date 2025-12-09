import { db } from '$lib/server/db';
import { getUsersInSameOrganizations, isUserAdmin } from '$lib/server/organization';
import { getOptedOutUsers, getTodayDate } from '$lib/server/opt-out';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { restaurant } from '../../../../drizzle/schema';

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

	// Load all restaurants
	const allRestaurants = await db.select().from(restaurant);

	// Load users in the same organization(s)
	const allUsers = await getUsersInSameOrganizations(user.id);

	// Load opted-out users for today
	const optedOutUsers = await getOptedOutUsers(user.id, getTodayDate());

	return {
		restaurants: allRestaurants,
		users: allUsers,
		optedOutUsers,
		user
	};
};
