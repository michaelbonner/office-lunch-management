import { error, json } from '@sveltejs/kit';
import { setActiveOrganizationId } from '$lib/server/organization-context';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, request }) => {
	const user = locals.user;
	const session = locals.session;

	if (!user || !session) {
		throw error(401, 'Unauthorized');
	}

	const { organizationId } = await request.json();

	if (!organizationId || typeof organizationId !== 'string') {
		throw error(400, 'Organization ID is required');
	}

	try {
		await setActiveOrganizationId(session.id, organizationId, user.id);
		return json({ success: true, organizationId });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to switch organization';
		throw error(403, message);
	}
};
