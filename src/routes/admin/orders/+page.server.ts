import { db } from '$lib/server/db';
import { getOptedInUsers, getNotOptedInUsers, getTodayDate } from '$lib/server/opt-in';
import { getUsersInSameOrganizations, isUserAdmin } from '$lib/server/organization';
import { restaurant } from '../../../../drizzle/schema';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

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
