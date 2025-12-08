import { db } from '$lib/server/db';
import { restaurant } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
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

	// Load all users
	const allUsers = await db.execute<{
		id: string;
		email: string;
		name: string;
		role: string | null;
	}>(sql`
		SELECT id, email, name, role
		FROM "user"
		ORDER BY name ASC
	`);

	return {
		restaurants: allRestaurants,
		users: allUsers,
		user
	};
};
