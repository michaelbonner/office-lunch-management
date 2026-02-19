import { error, json } from '@sveltejs/kit';
import { createApiToken, getUserTokens } from '$lib/server/api-token';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { name, expiresInDays } = body;

	if (!name || typeof name !== 'string' || name.trim().length === 0) {
		throw error(400, 'Token name is required');
	}

	if (name.trim().length > 100) {
		throw error(400, 'Token name must be 100 characters or less');
	}

	// Calculate expiration date if provided
	let expiresAt: Date | undefined;
	if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
		expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + expiresInDays);
	}

	const newToken = await createApiToken({
		userId: user.id,
		name: name.trim(),
		expiresAt
	});

	return json(newToken, { status: 201 });
};

export const GET: RequestHandler = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const tokens = await getUserTokens(user.id);

	return json(tokens);
};
