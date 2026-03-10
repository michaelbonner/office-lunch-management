import {
	getOrganizationById,
	getOrganizationMemberSettings,
	updateOrganizationMemberEmailPreferences
} from '$lib/server/organization';
import { verifyRestaurantSuggestionUnsubscribeToken } from '$lib/server/restaurant-suggestion-email-preferences';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return {
			status: 'invalid' as const
		};
	}

	const payload = verifyRestaurantSuggestionUnsubscribeToken(token);

	if (!payload) {
		return {
			status: 'invalid' as const
		};
	}

	const organization = await getOrganizationById(payload.organizationId);
	const memberSettings = await getOrganizationMemberSettings(
		payload.userId,
		payload.organizationId
	);

	if (!organization || !memberSettings) {
		return {
			status: 'invalid' as const
		};
	}

	if (!memberSettings.receiveRestaurantSuggestionEmails) {
		return {
			status: 'already_unsubscribed' as const,
			organizationName: organization.name
		};
	}

	await updateOrganizationMemberEmailPreferences(payload.userId, payload.organizationId, false);

	return {
		status: 'success' as const,
		organizationName: organization.name
	};
};
