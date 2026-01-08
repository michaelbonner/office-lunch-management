import { deleteToken } from '$lib/server/api-token';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const tokenId = params.id;

	if (!tokenId) {
		throw error(400, 'Token ID is required');
	}

	const deleted = await deleteToken(tokenId, user.id);

	if (!deleted) {
		throw error(404, 'Token not found or you do not have permission to delete it');
	}

	return json({ success: true });
};
