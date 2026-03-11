import { json } from '@sveltejs/kit';
import { removeVote, submitVote } from '$lib/server/voting';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const { restaurantId, organizationId, voteType } = body;

	if (!restaurantId || !organizationId || !['up', 'down'].includes(voteType)) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	await submitVote(user.id, restaurantId, organizationId, voteType);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const body = await request.json();
	const { restaurantId, organizationId } = body;

	if (!restaurantId || !organizationId) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	await removeVote(user.id, restaurantId, organizationId);
	return json({ success: true });
};
