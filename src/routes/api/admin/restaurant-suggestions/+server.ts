import { error, json } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { isUserOrgAdmin } from '$lib/server/organization';
import { organization, restaurantSuggestion, user } from '../../../../../drizzle/schema';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const currentUser = locals.user;
	const activeOrganizationId = locals.activeOrganizationId;

	if (!currentUser) {
		throw error(401, 'Unauthorized');
	}

	if (!activeOrganizationId) {
		return json({ suggestions: [] });
	}

	const canAdminister = await isUserOrgAdmin(currentUser.id, activeOrganizationId);
	if (!canAdminister) {
		throw error(403, 'Forbidden - Admin access required');
	}

	const suggestions = await db
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
			requestedByName: user.name,
			requestedByEmail: user.email
		})
		.from(restaurantSuggestion)
		.innerJoin(organization, eq(organization.id, restaurantSuggestion.organizationId))
		.innerJoin(user, eq(user.id, restaurantSuggestion.requestedByUserId))
		.where(eq(restaurantSuggestion.organizationId, activeOrganizationId))
		.orderBy(desc(restaurantSuggestion.createdAt));

	return json({ suggestions });
};
