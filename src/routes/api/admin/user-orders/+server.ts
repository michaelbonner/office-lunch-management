import { db } from '$lib/server/db';
import { isUserAdmin } from '$lib/server/organization';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;

	// Check if user is authenticated and is an admin
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	const userId = url.searchParams.get('userId');

	if (!userId) {
		throw error(400, 'User ID is required');
	}

	try {
		// Get all orders for the user with restaurant information
		const ordersWithRestaurants = await db.execute<{
			id: string;
			user_id: string;
			restaurant_id: string;
			order_details: string;
			created_at: Date;
			updated_at: Date;
			restaurant_name: string;
			restaurant_menu_link: string;
		}>(sql`
			SELECT
				o.id,
				o.user_id,
				o.restaurant_id,
				o.order_details,
				o.created_at,
				o.updated_at,
				r.name as restaurant_name,
				r.menu_link as restaurant_menu_link
			FROM "order" o
			LEFT JOIN "restaurant" r ON o.restaurant_id = r.id
			WHERE o.user_id = ${userId}
			ORDER BY o.created_at DESC
		`);

		// Transform the results to match the expected format
		const result = ordersWithRestaurants.map((row) => ({
			id: row.id,
			userId: row.user_id,
			restaurantId: row.restaurant_id,
			orderDetails: row.order_details,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
			restaurant: {
				id: row.restaurant_id,
				name: row.restaurant_name,
				menuLink: row.restaurant_menu_link
			}
		}));

		return json(result);
	} catch (err) {
		console.error('Error fetching user orders:', err);
		throw error(500, 'Failed to fetch user orders');
	}
};
