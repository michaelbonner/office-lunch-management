import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user as userTable } from '../../../../drizzle/schema';
import type { RequestHandler } from './$types';

function normalizeOptionalText(value: unknown, fieldName: string): string | null {
	if (typeof value !== 'string') {
		throw error(400, `${fieldName} must be a string`);
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const currentUser = locals.user;

	if (!currentUser) {
		throw error(401, 'Unauthorized');
	}

	const body = await request.json();
	const dietaryPreferences = normalizeOptionalText(
		body.dietaryPreferences ?? '',
		'Dietary preferences'
	);
	const allergyNotes = normalizeOptionalText(body.allergyNotes ?? '', 'Allergy notes');

	if (dietaryPreferences && dietaryPreferences.length > 500) {
		throw error(400, 'Dietary preferences must be 500 characters or less');
	}

	if (allergyNotes && allergyNotes.length > 1000) {
		throw error(400, 'Allergy notes must be 1000 characters or less');
	}

	const updatedUsers = await db
		.update(userTable)
		.set({
			dietaryPreferences,
			allergyNotes
		})
		.where(eq(userTable.id, currentUser.id))
		.returning({
			id: userTable.id,
			dietaryPreferences: userTable.dietaryPreferences,
			allergyNotes: userTable.allergyNotes
		});

	return json({
		success: true,
		user: updatedUsers[0]
	});
};
