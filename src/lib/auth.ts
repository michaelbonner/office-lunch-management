import { getRequestEvent } from '$app/server';
import {
	DATABASE_URL,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from '$env/static/private';
import {
	addUserToOrganization,
	createOrganizationForUser,
	getOrganizationsByWorkEmailDomain,
	getUserOrganizations
} from './server/organization';
import { APIError, betterAuth } from 'better-auth';
import { admin, createAuthMiddleware, organization } from 'better-auth/plugins';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { Pool } from 'pg';

export const auth = betterAuth({
	database: new Pool({
		connectionString: DATABASE_URL ?? ''
	}),
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			// Only apply this hook to the sign-up email route
			if (ctx.path !== '/sign-up/email') {
				return;
			}

			const allowedDomains = ['bootpackdigital.com', 'blackthornsoftware.com'];

			// Extract the domain from the user's email
			const userEmail = ctx.body?.email;
			if (!userEmail) {
				throw new APIError('BAD_REQUEST', { message: 'Email is required.' });
			}

			const emailParts = userEmail.split('@');
			if (emailParts.length !== 2) {
				throw new APIError('BAD_REQUEST', { message: 'Invalid email format.' });
			}
			const userDomain = emailParts[1];

			// Check if the user's domain is in the allowed list
			if (!allowedDomains.includes(userDomain)) {
				throw new APIError('BAD_REQUEST', {
					message: `Sign-up restricted to specific domains. Your email domain '${userDomain}' is not allowed.`
				});
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			// Run organization logic for sign-up, callback, and sign-in
			// This allows both new user org creation and auto-join for existing users
			if (
				!ctx.path ||
				(!ctx.path.includes('/sign-up') &&
					!ctx.path.includes('/callback') &&
					!ctx.path.includes('/sign-in'))
			) {
				return;
			}

			// Process user data from auth response
			if (ctx.body && typeof ctx.body === 'object' && 'user' in ctx.body) {
				const user = ctx.body.user as { id: string; email: string; name: string };
				if (user?.id && user?.email) {
					try {
						// Check if user already has an organization
						const existingOrgs = await getUserOrganizations(user.id);

						// Only create new organization for users without any organizations (new users)
						if (existingOrgs.length === 0) {
							await createOrganizationForUser(user.id, user.email, user.name || 'User');
						}

						// Auto-join organizations that have a matching work email domain
						// This runs for both new and existing users on every sign-in
						const emailParts = user.email.split('@');
						const emailDomain = emailParts.length === 2 ? emailParts[1] : null;
						if (emailDomain) {
							const matchingOrgs = await getOrganizationsByWorkEmailDomain(emailDomain);
							for (const org of matchingOrgs) {
								// onConflictDoNothing in addUserToOrganization prevents duplicates
								await addUserToOrganization(user.id, org.id, 'member');
							}
						}
					} catch (error) {
						console.error('Failed to process organization logic for user:', error);
						// Don't fail the auth flow if organization operations fail
					}
				}
			}
		})
	},
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID ?? '',
			clientSecret: GITHUB_CLIENT_SECRET ?? ''
		},
		google: {
			clientId: GOOGLE_CLIENT_ID ?? '',
			clientSecret: GOOGLE_CLIENT_SECRET ?? ''
		}
	},
	plugins: [admin(), organization(), sveltekitCookies(getRequestEvent)] // make sure sveltekitCookies is the last plugin in the array
});
