import { building } from '$app/environment';
import { auth } from '$lib/auth';
import { getUserOrganizations } from '$lib/server/organization';
import { getActiveOrganizationId } from '$lib/server/organization-context';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export async function handle({ event, resolve }) {
	// Fetch current session from Better Auth
	const sessionData = (await auth.api.getSession({
		headers: event.request.headers
	})) as typeof auth.$Infer.Session | null;

	// Make session and user available on server
	if (sessionData) {
		event.locals.session = sessionData.session;
		event.locals.user = sessionData.user;

		// Add organization context
		try {
			const userOrgs = await getUserOrganizations(sessionData.user.id);
			event.locals.userOrganizations = userOrgs;

			// Only set active org if user has organizations
			if (userOrgs.length > 0) {
				const activeOrgId = await getActiveOrganizationId(
					sessionData.session.id,
					sessionData.user.id
				);
				event.locals.activeOrganizationId = activeOrgId;
			}
		} catch (error) {
			console.error('Error loading organization context:', error);
			// Continue without organization context rather than failing
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
}
