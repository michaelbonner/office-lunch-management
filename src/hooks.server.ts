import { building } from '$app/environment';
import { auth } from '$lib/auth';
import {
	addUserToOrganization,
	getOrganizationsByWorkEmailDomain,
	getUserOrganizations
} from '$lib/server/organization';
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

		// Auto-join organizations based on work email domain
		// This runs on every authenticated request but is efficient due to:
		// 1. Fast database query that only returns matching orgs
		// 2. onConflictDoNothing makes duplicate attempts very fast
		try {
			const userEmail = sessionData.user.email;
			if (userEmail) {
				const emailParts = userEmail.split('@');
				const emailDomain = emailParts.length === 2 ? emailParts[1] : null;

				if (emailDomain) {
					const matchingOrgs = await getOrganizationsByWorkEmailDomain(emailDomain);
					if (matchingOrgs.length > 0) {
						console.log(
							`[AUTO-JOIN] Found ${matchingOrgs.length} org(s) with domain ${emailDomain} for user ${userEmail}`
						);

						for (const org of matchingOrgs) {
							await addUserToOrganization(sessionData.user.id, org.id, 'member');
							console.log(`[AUTO-JOIN] Added user ${userEmail} to org ${org.name}`);
						}
					}
				}
			}
		} catch (error) {
			console.error('Error during auto-join:', error);
			// Continue without auto-join rather than failing the request
		}

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
