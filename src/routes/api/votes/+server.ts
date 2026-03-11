import { json } from '@sveltejs/kit';
import { removeVote, submitVote } from '$lib/server/voting';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const orgId = locals.activeOrganizationId;
	if (!orgId) return json({ error: 'No active organization' }, { status: 400 });

	const body = await request.json();
	const { restaurantId, voteType } = body;

	if (!restaurantId || !['up', 'down'].includes(voteType)) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	await submitVote(user.id, restaurantId, orgId, voteType);
	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	const orgId = locals.activeOrganizationId;
	if (!orgId) return json({ error: 'No active organization' }, { status: 400 });

	const body = await request.json();
	const { restaurantId } = body;

	if (!restaurantId) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	await removeVote(user.id, restaurantId, orgId);
	return json({ success: true });
};
