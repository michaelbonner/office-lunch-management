import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { getUserOrganizations, isUserAdmin } from '$lib/server/organization';
import { restaurant } from '../../../../drizzle/schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated and is an admin
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden: Admin access required');
	}

	// Parse and validate request body
	const body = await request.json();
	const { name, menuLink, organizationId } = body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		throw error(400, 'Restaurant name is required');
	}

	if (!menuLink || typeof menuLink !== 'string' || menuLink.trim().length === 0) {
		throw error(400, 'Menu link is required');
	}

	// Validate organizationId
	if (!organizationId || typeof organizationId !== 'string') {
		throw error(400, 'Organization ID is required');
	}

	// Validate URL format
	try {
		new URL(menuLink);
	} catch {
		throw error(400, 'Menu link must be a valid URL');
	}

	// Verify user is admin in this organization
	const userOrgs = await getUserOrganizations(user.id);
	const hasAdminAccess = userOrgs.some(
		(org) => org.id === organizationId && (org.role === 'admin' || org.role === 'owner')
	);

	if (!hasAdminAccess) {
		throw error(403, 'Forbidden: You do not have admin access to this organization');
	}

	// Insert restaurant into database
	const [newRestaurant] = await db
		.insert(restaurant)
		.values({
			id: crypto.randomUUID(),
			name: name.trim(),
			menuLink: menuLink.trim(),
			organizationId
		})
		.returning();

	return json(newRestaurant, { status: 201 });
};

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;
	const activeOrgId = locals.activeOrganizationId;

	// Return empty array if user is not authenticated or has no active org
	if (!user || !activeOrgId) {
		return json([]);
	}

	// Get restaurants for active organization
	const orgRestaurants = await db
		.select()
		.from(restaurant)
		.where(eq(restaurant.organizationId, activeOrgId))
		.orderBy(restaurant.name);

	return json(orgRestaurants);
};
