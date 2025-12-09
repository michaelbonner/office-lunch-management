import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';

export async function handle({ event, resolve }) {
	// Fetch current session from Better Auth
	const sessionData = (await auth.api.getSession({
		headers: event.request.headers
	})) as typeof auth.$Infer.Session | null;

	// Make session and user available on server
	if (sessionData) {
		event.locals.session = sessionData.session;
		event.locals.user = sessionData.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
}
