import { db } from '$lib/server/db';
import { order, restaurant } from '../../../drizzle/schema';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect to home if not authenticated
	if (!user) {
		throw redirect(303, '/');
	}

	const activeOrgId = locals.activeOrganizationId;
	const userOrgs = locals.userOrganizations || [];

	// Load restaurants for active organization
	const allRestaurants = activeOrgId
		? await db
				.select()
				.from(restaurant)
				.where(eq(restaurant.organizationId, activeOrgId))
				.orderBy(restaurant.name)
		: [];

	// Load user's orders
	const userOrders = await db.select().from(order).where(eq(order.userId, user.id));

	// Create a map of restaurant ID to order details for easy lookup
	const ordersMap = new Map(userOrders.map((o) => [o.restaurantId, o.orderDetails]));

	return {
		restaurants: allRestaurants,
		orders: ordersMap,
		user,
		activeOrganizationId: activeOrgId,
		userOrganizations: userOrgs
	};
};
