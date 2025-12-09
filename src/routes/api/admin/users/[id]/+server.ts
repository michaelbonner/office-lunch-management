import { isUserAdmin, removeUserFromSharedOrganizations, getUsersInSameOrganizations } from '$lib/server/organization';
import { db } from '$lib/server/db';
import { error, json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
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

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
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

	const body = await request.json();
	const { name } = body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		throw error(400, 'Valid name is required');
	}

	try {
		// Verify the target user is in the same organization(s) as the admin
		const usersInOrg = await getUsersInSameOrganizations(user.id);
		const targetUser = usersInOrg.find((u) => u.id === targetUserId);

		if (!targetUser) {
			throw error(404, 'User not found in your organization');
		}

		// Update the user's name
		await db.execute(sql`
			UPDATE "user"
			SET name = ${name.trim()}, "updatedAt" = NOW()
			WHERE id = ${targetUserId}
		`);

		return json({
			success: true,
			message: 'User name updated successfully',
			user: { id: targetUserId, name: name.trim() }
		});
	} catch (err) {
		console.error('Error updating user name:', err);
		const errorMessage = err instanceof Error ? err.message : 'Failed to update user name';
		throw error(500, errorMessage);
	}
};
