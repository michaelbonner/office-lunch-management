import { redirect } from '@sveltejs/kit';
import { getOrganizationById, isUserOrgAdmin } from '$lib/server/organization';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect to home if not authenticated
	if (!user) {
		throw redirect(303, '/');
	}

	const activeOrgId = locals.activeOrganizationId;

	// Redirect to home if no active organization
	if (!activeOrgId) {
		throw redirect(303, '/');
	}

	// Redirect to home if not admin/owner of this organization
	const isOrgAdmin = await isUserOrgAdmin(user.id, activeOrgId);
	if (!isOrgAdmin) {
		throw redirect(303, '/');
	}

	// Load organization details
	const organization = await getOrganizationById(activeOrgId);

	if (!organization) {
		throw redirect(303, '/');
	}

	return {
		organization,
		user
	};
};
