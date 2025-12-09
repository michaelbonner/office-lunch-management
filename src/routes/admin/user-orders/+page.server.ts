import { db } from '$lib/server/db';
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

	// Load users in the same organization(s)
	const users = await getUsersInSameOrganizations(user.id);

	// Load all restaurants
	const restaurants = await db.select().from(restaurant);

	return {
		users,
		restaurants,
		user
	};
};
