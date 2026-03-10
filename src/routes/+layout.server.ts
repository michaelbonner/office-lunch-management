import { isUserAdmin, isUserSystemAdmin } from '$lib/server/organization';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user ?? null;

	let isAdmin = false;
	let isSystemAdmin = false;

	if (user) {
		[isAdmin, isSystemAdmin] = await Promise.all([
			isUserAdmin(user.id),
			isUserSystemAdmin(user.id)
		]);
	}

	return {
		user: user ? { id: user.id, name: user.name, email: user.email } : null,
		isAdmin,
		isSystemAdmin
	};
};
