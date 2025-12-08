import { db } from '$lib/server/db';
import { order, restaurant } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect to home if not authenticated
	if (!user) {
		throw redirect(303, '/');
	}

	// Load all restaurants
	const allRestaurants = await db.select().from(restaurant);

	// Load user's orders
	const userOrders = await db.select().from(order).where(eq(order.userId, user.id));

	// Create a map of restaurant ID to order details for easy lookup
	const ordersMap = new Map(userOrders.map((o) => [o.restaurantId, o.orderDetails]));

	return {
		restaurants: allRestaurants,
		orders: ordersMap,
		user
	};
};
