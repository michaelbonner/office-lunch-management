import { getRequestEvent } from '$app/server';
import { DATABASE_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
import { APIError, betterAuth } from 'better-auth';
import { admin, createAuthMiddleware } from 'better-auth/plugins';
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
		})
	},
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID ?? '',
			clientSecret: GITHUB_CLIENT_SECRET ?? ''
		}
	},
	plugins: [admin(), sveltekitCookies(getRequestEvent)] // make sure sveltekitCookies is the last plugin in the array
});
