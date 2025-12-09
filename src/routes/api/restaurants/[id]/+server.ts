import { db } from '$lib/server/db';
import { isUserAdmin } from '$lib/server/organization';
import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { restaurant } from '../../../../../drizzle/schema';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	// Check if user is authenticated and is an admin
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	const restaurantId = params.id;

	if (!restaurantId) {
		throw error(400, 'Restaurant ID is required');
	}

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

	try {
		// Update the restaurant
		const updatedRestaurant = await db
			.update(restaurant)
			.set({
				name: name.trim(),
				menuLink: menuLink.trim(),
				updatedAt: new Date()
			})
			.where(eq(restaurant.id, restaurantId))
			.returning();

		if (updatedRestaurant.length === 0) {
			throw error(404, 'Restaurant not found');
		}

		return json({ success: true, restaurant: updatedRestaurant[0] });
	} catch (err) {
		console.error('Error updating restaurant:', err);
		throw error(500, 'Failed to update restaurant');
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;

	// Check if user is authenticated and is an admin
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	const restaurantId = params.id;

	if (!restaurantId) {
		throw error(400, 'Restaurant ID is required');
	}

	try {
		// Delete the restaurant (cascade will delete associated orders due to schema)
		const deletedRestaurant = await db
			.delete(restaurant)
			.where(eq(restaurant.id, restaurantId))
			.returning();

		if (deletedRestaurant.length === 0) {
			throw error(404, 'Restaurant not found');
		}

		return json({ success: true, message: 'Restaurant deleted successfully' });
	} catch (err) {
		console.error('Error deleting restaurant:', err);
		throw error(500, 'Failed to delete restaurant');
	}
};
