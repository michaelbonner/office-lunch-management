import { db } from '$lib/server/db';
import { isUserAdmin } from '$lib/server/organization';
import { order, restaurant, user as userTable } from '../../../../../drizzle/schema';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;

	// Check if user is authenticated and is an admin
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	const body = await request.json();
	const { userId, restaurantId, orderDetails } = body;

	if (!userId || !restaurantId || !orderDetails) {
		throw error(400, 'User ID, restaurant ID, and order details are required');
	}

	const activeOrgId = locals.activeOrganizationId;

	if (!activeOrgId) {
		throw error(400, 'No active organization');
	}

	// Verify restaurant belongs to active organization
	const restaurants = await db
		.select()
		.from(restaurant)
		.where(and(eq(restaurant.id, restaurantId), eq(restaurant.organizationId, activeOrgId)))
		.limit(1);

	if (restaurants.length === 0) {
		throw error(403, 'Restaurant not in your organization');
	}

	try {
		// Create or update the order

		const newOrder = await db
			.insert(order)
			.values({
				id: crypto.randomUUID(),
				userId,
				restaurantId,
				orderDetails: orderDetails.trim()
			})
			.onConflictDoUpdate({
				target: [order.userId, order.restaurantId],
				set: { orderDetails: orderDetails.trim() }
			})
			.returning();

		return json({ success: true, order: newOrder[0] }, { status: 201 });
	} catch (err) {
		console.error('Error creating order:', err);
		const errorMessage = err instanceof Error ? err.message : 'Failed to create order';

		// Check for unique constraint violation (user already has order for this restaurant)
		if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
			throw error(400, 'User already has an order for this restaurant');
		}

		throw error(500, errorMessage);
	}
};

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

	const restaurantId = url.searchParams.get('restaurantId');

	if (!restaurantId) {
		throw error(400, 'Restaurant ID is required');
	}

	const activeOrgId = locals.activeOrganizationId;

	if (!activeOrgId) {
		throw error(400, 'No active organization');
	}

	// Verify restaurant belongs to active organization
	const restaurants = await db
		.select()
		.from(restaurant)
		.where(and(eq(restaurant.id, restaurantId), eq(restaurant.organizationId, activeOrgId)))
		.limit(1);

	if (restaurants.length === 0) {
		throw error(403, 'Restaurant not in your organization');
	}

	// Get all orders for the restaurant with user information using a JOIN
	const ordersWithUsers = await db
		.select({
			id: order.id,
			user_id: order.userId,
			restaurant_id: order.restaurantId,
			order_details: order.orderDetails,
			created_at: order.createdAt,
			updated_at: order.updatedAt,
			user_name: userTable.name,
			user_email: userTable.email
		})
		.from(order)
		.leftJoin(userTable, eq(order.userId, userTable.id))
		.where(eq(order.restaurantId, restaurantId))
		.orderBy(order.createdAt);

	// Transform the results to match the expected format
	const result = ordersWithUsers.map((row) => ({
		id: row.id,
		userId: row.user_id,
		restaurantId: row.restaurant_id,
		orderDetails: row.order_details,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		user: {
			id: row.user_id,
			name: row.user_name,
			email: row.user_email
		}
	}));

	return json(result);
};
