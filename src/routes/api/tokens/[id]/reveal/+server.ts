import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { apiToken } from '../../../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { decryptToken } from '$lib/server/api-token';

export const GET: RequestHandler = async ({ params, locals }) => {
	const user = locals.user;

	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const tokenId = params.id;

	// Get the token and verify ownership
	const [tokenRecord] = await db
		.select({
			id: apiToken.id,
			encryptedToken: apiToken.encryptedToken,
			userId: apiToken.userId
		})
		.from(apiToken)
		.where(and(eq(apiToken.id, tokenId), eq(apiToken.userId, user.id)))
		.limit(1);

	if (!tokenRecord) {
		return json({ error: 'Token not found' }, { status: 404 });
	}

	if (!tokenRecord.encryptedToken) {
		return json(
			{ error: 'Token was created before encryption was enabled. Please create a new token.' },
			{ status: 400 }
		);
	}

	try {
		const plainToken = decryptToken(tokenRecord.encryptedToken);
		return json({ token: plainToken });
	} catch (error) {
		console.error('Failed to decrypt token:', error);
		return json({ error: 'Failed to decrypt token' }, { status: 500 });
	}
};
