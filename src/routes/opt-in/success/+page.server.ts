import { formatInTimeZone } from 'date-fns-tz';
import { getUserOptInStatus } from '$lib/server/opt-in';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		return { optInTime: null };
	}

	const status = await getUserOptInStatus(user.id);

	if (!status.optedIn || !status.timestamp) {
		return { optInTime: null };
	}

	const optInTime = formatInTimeZone(new Date(status.timestamp), 'America/Denver', 'h:mm a');

	return { optInTime };
};
