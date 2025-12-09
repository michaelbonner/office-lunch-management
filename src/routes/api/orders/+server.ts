import { db } from '$lib/server/db';
import { error, json } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { order } from '../../../../drizzle/schema';

export const GET: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const restaurantId = url.searchParams.get('restaurantId');

	// Get user's orders - optionally filtered by restaurant
	const whereClause = restaurantId
		? and(eq(order.userId, user.id), eq(order.restaurantId, restaurantId))
		: eq(order.userId, user.id);

	const userOrders = await db.select().from(order).where(whereClause);

	return json(userOrders);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { restaurantId, orderDetails } = body;

	if (!restaurantId || typeof restaurantId !== 'string') {
		throw error(400, 'Restaurant ID is required');
	}

	if (!orderDetails || typeof orderDetails !== 'string' || orderDetails.trim().length === 0) {
		throw error(400, 'Order details are required');
	}

	// Check if order already exists for this user and restaurant
	const existingOrder = await db
		.select()
		.from(order)
		.where(and(eq(order.userId, user.id), eq(order.restaurantId, restaurantId)))
		.limit(1);

	let result;

	if (existingOrder.length > 0) {
		// Update existing order
		[result] = await db
			.update(order)
			.set({
				orderDetails: orderDetails.trim()
			})
			.where(eq(order.id, existingOrder[0].id))
			.returning();
	} else {
		// Create new order
		[result] = await db
			.insert(order)
			.values({
				id: crypto.randomUUID(),
				userId: user.id,
				restaurantId,
				orderDetails: orderDetails.trim()
			})
			.returning();
	}

	return json(result, { status: existingOrder.length > 0 ? 200 : 201 });
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const restaurantId = url.searchParams.get('restaurantId');

	if (!restaurantId) {
		throw error(400, 'Restaurant ID is required');
	}

	await db
		.delete(order)
		.where(and(eq(order.userId, user.id), eq(order.restaurantId, restaurantId)));

	return json({ success: true });
};
