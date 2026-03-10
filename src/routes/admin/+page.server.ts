import { redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { isUserAdmin } from '$lib/server/organization';
import {
	organization,
	restaurant,
	restaurantSuggestion,
	user as userTable
} from '../../../drizzle/schema';
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

	const suggestions = activeOrgId
		? await db
				.select({
					id: restaurantSuggestion.id,
					name: restaurantSuggestion.name,
					menuLink: restaurantSuggestion.menuLink,
					notes: restaurantSuggestion.notes,
					status: restaurantSuggestion.status,
					reviewerNotes: restaurantSuggestion.reviewerNotes,
					createdAt: restaurantSuggestion.createdAt,
					reviewedAt: restaurantSuggestion.reviewedAt,
					restaurantId: restaurantSuggestion.restaurantId,
					organizationName: organization.name,
					requestedByUserId: restaurantSuggestion.requestedByUserId,
					requestedByName: userTable.name,
					requestedByEmail: userTable.email
				})
				.from(restaurantSuggestion)
				.innerJoin(organization, eq(organization.id, restaurantSuggestion.organizationId))
				.innerJoin(userTable, eq(userTable.id, restaurantSuggestion.requestedByUserId))
				.where(eq(restaurantSuggestion.organizationId, activeOrgId))
				.orderBy(desc(restaurantSuggestion.createdAt))
		: [];

	return {
		restaurants: allRestaurants,
		suggestions,
		user,
		activeOrganizationId: activeOrgId,
		userOrganizations: userOrgs
	};
};
