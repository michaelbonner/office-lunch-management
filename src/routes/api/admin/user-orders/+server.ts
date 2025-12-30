import { db } from '$lib/server/db';
import { isUserAdmin } from '$lib/server/organization';
import { order, restaurant } from '../../../../../drizzle/schema';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

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
		const ordersWithRestaurants = await db
			.select({
				id: order.id,
				user_id: order.userId,
				restaurant_id: order.restaurantId,
				order_details: order.orderDetails,
				created_at: order.createdAt,
				updated_at: order.updatedAt,
				restaurant_name: restaurant.name,
				restaurant_menu_link: restaurant.menuLink
			})
			.from(order)
			.leftJoin(restaurant, eq(order.restaurantId, restaurant.id))
			.where(eq(order.userId, userId))
			.orderBy(order.createdAt);

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
