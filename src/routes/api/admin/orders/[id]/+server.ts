import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { isUserAdmin } from '$lib/server/organization';
import { order } from '../../../../../../drizzle/schema';
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

	const orderId = params.id;

	if (!orderId) {
		throw error(400, 'Order ID is required');
	}

	const body = await request.json();
	const { orderDetails } = body;

	if (!orderDetails || typeof orderDetails !== 'string') {
		throw error(400, 'Order details are required');
	}

	try {
		// Update the order
		const updatedOrder = await db
			.update(order)
			.set({
				orderDetails
			})
			.where(eq(order.id, orderId))
			.returning();

		if (updatedOrder.length === 0) {
			throw error(404, 'Order not found');
		}

		return json({ success: true, order: updatedOrder[0] });
	} catch (err) {
		console.error('Error updating order:', err);
		throw error(500, 'Failed to update order');
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

	const orderId = params.id;

	if (!orderId) {
		throw error(400, 'Order ID is required');
	}

	try {
		// Delete the order
		const deletedOrder = await db.delete(order).where(eq(order.id, orderId)).returning();

		if (deletedOrder.length === 0) {
			throw error(404, 'Order not found');
		}

		return json({ success: true, message: 'Order deleted successfully' });
	} catch (err) {
		console.error('Error deleting order:', err);
		throw error(500, 'Failed to delete order');
	}
};
