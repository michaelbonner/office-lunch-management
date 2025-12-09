import { db } from '$lib/server/db';
import { addUserToOrganization, getUserOrganizations, getUsersInSameOrganizations, isUserAdmin } from '$lib/server/organization';
import { error, json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;

	// Check if user is authenticated and is an admin
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	const body = await request.json();
	const { email, name, role } = body;

	if (!email) {
		throw error(400, 'Email is required');
	}

	if (!name) {
		throw error(400, 'Name is required');
	}

	try {
		// Get admin's organizations
		const adminOrgs = await getUserOrganizations(user.id);

		if (adminOrgs.length === 0) {
			throw error(500, 'Admin does not belong to any organization');
		}

		// Use the first organization the admin belongs to
		const adminOrgId = adminOrgs[0].id;
		const userRole = role && (role === 'admin' || role === 'user') ? role : 'user';

		// Check if user already exists
		const existingUsers = await db.execute<{
			id: string;
			email: string;
			name: string;
			role: string | null;
		}>(sql`
			SELECT id, email, name, role
			FROM "user"
			WHERE email = ${email}
			LIMIT 1
		`);

		let userId: string;
		let message: string;

		if (existingUsers.length > 0) {
			// User exists, check if they're already in this organization
			const existingUser = existingUsers[0];
			userId = existingUser.id;

			const existingMembership = await db.execute<{
				id: string;
			}>(sql`
				SELECT id
				FROM member
				WHERE "userId" = ${userId} AND "organizationId" = ${adminOrgId}
				LIMIT 1
			`);

			if (existingMembership.length > 0) {
				throw error(400, 'User is already a member of your organization');
			}

			// Add user to admin's organization
			await addUserToOrganization(userId, adminOrgId, userRole === 'admin' ? 'admin' : 'member');
			message = 'User added to organization successfully';
		} else {
			// Create new user
			userId = crypto.randomUUID();

			await db.execute(sql`
				INSERT INTO "user" (id, email, name, role, "emailVerified", "createdAt", "updatedAt")
				VALUES (${userId}, ${email}, ${name}, 'user', false, NOW(), NOW())
			`);

			// Add user to admin's organization
			await addUserToOrganization(userId, adminOrgId, userRole === 'admin' ? 'admin' : 'member');
			message = 'User created successfully';
		}

		return json({
			success: true,
			message,
			user: { id: userId, email, name, role: userRole }
		});
	} catch (err) {
		console.error('Error creating/adding user:', err);
		const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
		throw error(500, errorMessage);
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	// Check if user is authenticated and is an admin
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const isAdmin = await isUserAdmin(user.id);
	if (!isAdmin) {
		throw error(403, 'Forbidden - Admin access required');
	}

	try {
		// Get users in the same organization(s) as the admin
		const users = await getUsersInSameOrganizations(user.id);

		return json({ users });
	} catch (err) {
		console.error('Error listing users:', err);
		throw error(500, 'Failed to list users');
	}
};
