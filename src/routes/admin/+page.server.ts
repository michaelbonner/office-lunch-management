import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { isUserAdmin } from '$lib/server/organization';
import { restaurant } from '../../../drizzle/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect to home if not authenticated
	if (!user) {
		throw redirect(303, '/');
	}

	// Redirect to home if not admin in any organization
	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw redirect(303, '/');
	}

	const activeOrgId = locals.activeOrganizationId;
	const userOrgs = locals.userOrganizations || [];

	// Load restaurants for active organization only
	const allRestaurants = activeOrgId
		? await db
				.select()
				.from(restaurant)
				.where(eq(restaurant.organizationId, activeOrgId))
				.orderBy(restaurant.name)
		: [];

	return {
		restaurants: allRestaurants,
		user,
		activeOrganizationId: activeOrgId,
		userOrganizations: userOrgs
	};
};
