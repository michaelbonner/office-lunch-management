// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { auth } from '$lib/auth';

type SessionData = typeof auth.$Infer.Session;

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: SessionData extends { session: infer S } ? S : null;
			user: SessionData extends { user: infer U } ? U : null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
