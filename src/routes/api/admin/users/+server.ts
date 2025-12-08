import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { error, json } from '@sveltejs/kit';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;

	// Check if user is authenticated and is an admin
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	if (user.role !== 'admin') {
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
		// Create user directly in the database (no password needed for OAuth users)
		const userId = crypto.randomUUID();
		const userRole = role && (role === 'admin' || role === 'user') ? role : 'user';

		await db.execute(sql`
			INSERT INTO "user" (id, email, name, role, "emailVerified", "createdAt", "updatedAt")
			VALUES (${userId}, ${email}, ${name}, ${userRole}, false, NOW(), NOW())
		`);

		return json({
			success: true,
			message: 'User created successfully',
			user: { id: userId, email, name, role: userRole }
		});
	} catch (err) {
		console.error('Error creating user:', err);
		const errorMessage = err instanceof Error ? err.message : 'Failed to create user';

		// Check for unique constraint violation (duplicate email)
		if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
			throw error(400, 'A user with this email already exists');
		}

		throw error(500, errorMessage);
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	// Check if user is authenticated and is an admin
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	if (user.role !== 'admin') {
		throw error(403, 'Forbidden - Admin access required');
	}

	try {
		// Query users directly from the database
		const users = await db.execute<{
			id: string;
			email: string;
			name: string;
			role: string | null;
			createdAt: Date;
		}>(sql`
			SELECT id, email, name, role, "createdAt"
			FROM "user"
			ORDER BY "createdAt" DESC
		`);

		return json({ users });
	} catch (err) {
		console.error('Error listing users:', err);
		throw error(500, 'Failed to list users');
	}
};
