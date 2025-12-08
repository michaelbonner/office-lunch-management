import { getAllOrganizationsWithMembers, isUserSystemAdmin } from '$lib/server/organization';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Redirect to home if not authenticated
	if (!user) {
		throw redirect(303, '/');
	}

	// Redirect to home if not a system admin
	const isSystemAdmin = await isUserSystemAdmin(user.id);
	if (!isSystemAdmin) {
		throw redirect(303, '/');
	}

	// Load all organizations with their members
	const organizations = await getAllOrganizationsWithMembers();

	return {
		organizations,
		user
	};
};
