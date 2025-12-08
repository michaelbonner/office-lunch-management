import { db } from '$lib/server/db';
import { restaurant } from '$lib/server/db/schema';
import { getUsersInSameOrganizations } from '$lib/server/organization';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect to home if not authenticated
	if (!user) {
		throw redirect(303, '/');
	}

	// Redirect to home if not admin
	if (user.role !== 'admin') {
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
