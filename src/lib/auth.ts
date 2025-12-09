import { getRequestEvent } from '$app/server';
import {
	DATABASE_URL,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from '$env/static/private';
import { createOrganizationForUser, getUserOrganizations } from './server/organization';
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
			// Create organization for new users
			if (ctx.body && typeof ctx.body === 'object' && 'user' in ctx.body) {
				const user = ctx.body.user as { id: string; email: string; name: string };
				if (user?.id && user?.email) {
					try {
						// Check if user already has an organization
						const existingOrgs = await getUserOrganizations(user.id);

						if (existingOrgs.length === 0) {
							// Create new organization for this user
							await createOrganizationForUser(user.id, user.email, user.name || 'User');
						}
					} catch (error) {
						console.error('Failed to create organization for user:', error);
						// Don't fail the auth flow if organization creation fails
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
