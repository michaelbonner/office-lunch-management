import { db } from '$lib/server/db';
import { restaurant } from '$lib/server/db/schema';
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

	// Load all restaurants
	const allRestaurants = await db.select().from(restaurant);

	return {
		restaurants: allRestaurants,
		user
	};
};
