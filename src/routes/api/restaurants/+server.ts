import { db } from '$lib/server/db';
import { restaurant } from '$lib/server/db/schema';
import { isUserAdmin } from '$lib/server/organization';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated and is an admin
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden: Admin access required');
	}

	// Parse and validate request body
	const body = await request.json();
	const { name, menuLink } = body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		throw error(400, 'Restaurant name is required');
	}

	if (!menuLink || typeof menuLink !== 'string' || menuLink.trim().length === 0) {
		throw error(400, 'Menu link is required');
	}

	// Validate URL format
	try {
		new URL(menuLink);
	} catch {
		throw error(400, 'Menu link must be a valid URL');
	}

	// Insert restaurant into database
	const [newRestaurant] = await db
		.insert(restaurant)
		.values({
			name: name.trim(),
			menuLink: menuLink.trim()
		})
		.returning();

	return json(newRestaurant, { status: 201 });
};

export const GET: RequestHandler = async () => {
	// Get all restaurants (public endpoint)
	const allRestaurants = await db.select().from(restaurant);

	return json(allRestaurants);
};
