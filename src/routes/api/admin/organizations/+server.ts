import { getAllOrganizationsWithMembers, isUserSystemAdmin } from '$lib/server/organization';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	// Check if user is authenticated
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	// Check if user is a system admin
	const isSystemAdmin = await isUserSystemAdmin(user.id);
	if (!isSystemAdmin) {
		throw error(403, 'Forbidden - System admin access required');
	}

	try {
		// Get all organizations with their members
		const organizations = await getAllOrganizationsWithMembers();

		return json({ organizations });
	} catch (err) {
		console.error('Error fetching organizations:', err);
		throw error(500, 'Failed to fetch organizations');
	}
};
