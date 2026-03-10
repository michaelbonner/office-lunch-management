import { isUserAdmin } from '$lib/server/organization';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user ?? null;

	return {
		user: user ? { id: user.id, name: user.name, email: user.email } : null,
		isAdmin: user ? await isUserAdmin(user.id) : false,
		isSystemAdmin: user?.role === 'admin'
	};
};
