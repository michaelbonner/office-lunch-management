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

	// Load all users
	const users = await db.execute<{
		id: string;
		email: string;
		name: string;
		role: string | null;
	}>(sql`
		SELECT id, email, name, role
		FROM "user"
		ORDER BY name ASC
	`);

	// Load all restaurants
	const restaurants = await db.select().from(restaurant);

	return {
		users,
		restaurants,
		user
	};
};
