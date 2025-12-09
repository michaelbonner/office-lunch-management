import { db } from '$lib/server/db';
import { order } from '$lib/server/db/schema';
import { isUserAdmin } from '$lib/server/organization';
import { error, json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

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

	try {
		// Create or update the order

		const newOrder = await db
			.insert(order)
			.values({
				userId,
				restaurantId,
				orderDetails: orderDetails.trim()
			})
			.onConflictDoUpdate({
				target: [order.userId, order.restaurantId],
				set: { orderDetails: orderDetails.trim(), updatedAt: new Date() }
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

	// Get all orders for the restaurant with user information using a JOIN
	const ordersWithUsers = await db.execute<{
		id: string;
		user_id: string;
		restaurant_id: string;
		order_details: string;
		created_at: Date;
		updated_at: Date;
		user_name: string | null;
		user_email: string | null;
	}>(sql`
		SELECT
			o.id,
			o.user_id,
			o.restaurant_id,
			o.order_details,
			o.created_at,
			o.updated_at,
			u.name as user_name,
			u.email as user_email
		FROM "order" o
		LEFT JOIN "user" u ON o.user_id = u.id
		WHERE o.restaurant_id = ${restaurantId}
		ORDER BY o.created_at ASC
	`);

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
