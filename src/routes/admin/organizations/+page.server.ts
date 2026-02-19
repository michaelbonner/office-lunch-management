import { redirect } from '@sveltejs/kit';
import {
	getAllOrganizationsWithMembers,
	getUsersWithoutOrganizations,
	isUserSystemAdmin
} from '$lib/server/organization';
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
	const usersWithoutOrganizations = await getUsersWithoutOrganizations();

	return {
		organizations,
		usersWithoutOrganizations,
		user
	};
};
