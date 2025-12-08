import { isUserAdmin, removeUserFromSharedOrganizations } from '$lib/server/organization';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const user = locals.user;

	// Check if user is authenticated and is an admin
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	const targetUserId = params.id;

	if (!targetUserId) {
		throw error(400, 'User ID is required');
	}

	// Prevent admin from removing themselves
	if (targetUserId === user.id) {
		throw error(400, 'You cannot remove yourself from the organization');
	}

	try {
		// Remove the user from all organizations shared with the admin
		const removedCount = await removeUserFromSharedOrganizations(user.id, targetUserId);

		if (removedCount === 0) {
			throw error(404, 'User not found in your organization');
		}

		return json({
			success: true,
			message: `User removed from ${removedCount} organization(s)`
		});
	} catch (err) {
		console.error('Error removing user from organization:', err);
		const errorMessage = err instanceof Error ? err.message : 'Failed to remove user';
		throw error(500, errorMessage);
	}
};
