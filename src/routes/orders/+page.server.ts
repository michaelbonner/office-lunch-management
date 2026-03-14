import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { order, restaurant, user as userTable } from '../../../drizzle/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect to home if not authenticated
	if (!user) {
		throw redirect(303, '/');
	}

	const activeOrgId = locals.activeOrganizationId;
	const userOrgs = locals.userOrganizations || [];

	const [allRestaurants, userOrders, userProfiles] = await Promise.all([
		activeOrgId
			? db
					.select()
					.from(restaurant)
					.where(eq(restaurant.organizationId, activeOrgId))
					.orderBy(restaurant.name)
			: Promise.resolve([]),
		db.select().from(order).where(eq(order.userId, user.id)),
		db
			.select({
				dietaryPreferences: userTable.dietaryPreferences,
				allergyNotes: userTable.allergyNotes
			})
			.from(userTable)
			.where(eq(userTable.id, user.id))
			.limit(1)
	]);

	// Create a map of restaurant ID to order details for easy lookup
	const ordersMap = new Map(userOrders.map((o) => [o.restaurantId, o.orderDetails]));

	return {
		restaurants: allRestaurants,
		orders: ordersMap,
		userProfile: userProfiles[0] ?? {
			dietaryPreferences: null,
			allergyNotes: null
		},
		user,
		activeOrganizationId: activeOrgId,
		userOrganizations: userOrgs
	};
};
