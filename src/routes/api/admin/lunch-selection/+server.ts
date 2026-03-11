import { json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { isUserAdmin } from '$lib/server/organization';
import {
	clearLunchSelection,
	getLunchSelection,
	getVoteTalliesForDate,
	setLunchSelection
} from '$lib/server/voting';
import { restaurant } from '../../../../../drizzle/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) return json({ error: 'Forbidden' }, { status: 403 });

	const orgId = locals.activeOrganizationId;
	if (!orgId) return json({ error: 'No active organization' }, { status: 400 });

	const [tallies, selection] = await Promise.all([
		getVoteTalliesForDate(orgId),
		getLunchSelection(orgId)
	]);

	return json({ tallies, selection });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) return json({ error: 'Forbidden' }, { status: 403 });

	const orgId = locals.activeOrganizationId;
	if (!orgId) return json({ error: 'No active organization' }, { status: 400 });

	const { restaurantId } = await request.json();
	if (!restaurantId) return json({ error: 'Missing restaurantId' }, { status: 400 });

	// Validate restaurant belongs to the active organization
	const [owned] = await db
		.select({ id: restaurant.id })
		.from(restaurant)
		.where(and(eq(restaurant.id, restaurantId), eq(restaurant.organizationId, orgId)))
		.limit(1);

	if (!owned)
		return json({ error: 'Restaurant not found in active organization' }, { status: 404 });

	await setLunchSelection(user.id, orgId, restaurantId);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) return json({ error: 'Forbidden' }, { status: 403 });

	const orgId = locals.activeOrganizationId;
	if (!orgId) return json({ error: 'No active organization' }, { status: 400 });

	await clearLunchSelection(orgId);
	return json({ success: true });
};
