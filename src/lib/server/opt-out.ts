import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayDate(): string {
	const now = new Date();
	return now.toISOString().split('T')[0];
}

/**
 * Opt a user out for a specific date across all their organizations
 */
export async function optUserOut(userId: string, date: string = getTodayDate()) {
	try {
		// Get all organizations the user belongs to
		const userOrgs = await db.execute<{ organizationId: string }>(sql`
			SELECT "organizationId"
			FROM member
			WHERE "userId" = ${userId}
		`);

		// Insert opt-out records for each organization
		for (const org of userOrgs) {
			await db.execute(sql`
				INSERT INTO opt_out (id, user_id, organization_id, opt_out_date, created_at, updated_at)
				VALUES (gen_random_uuid(), ${userId}, ${org.organizationId}, ${date}, NOW(), NOW())
				ON CONFLICT (user_id, organization_id, opt_out_date) DO NOTHING
			`);
		}

		return { success: true, organizationsCount: userOrgs.length };
	} catch (error) {
		console.error('Error opting user out:', error);
		throw error;
	}
}

/**
 * Opt a user back in for a specific date (removes opt-out records)
 */
export async function optUserIn(userId: string, date: string = getTodayDate()) {
	try {
		await db.execute(sql`
			DELETE FROM opt_out
			WHERE user_id = ${userId} AND opt_out_date = ${date}
		`);

		return { success: true };
	} catch (error) {
		console.error('Error opting user in:', error);
		throw error;
	}
}

/**
 * Check if a user is opted out for a specific date
 */
export async function isUserOptedOut(
	userId: string,
	date: string = getTodayDate()
): Promise<boolean> {
	try {
		const result = await db.execute<{ id: string }>(sql`
			SELECT id
			FROM opt_out
			WHERE user_id = ${userId} AND opt_out_date = ${date}
			LIMIT 1
		`);

		return result.length > 0;
	} catch (error) {
		console.error('Error checking if user is opted out:', error);
		throw error;
	}
}

/**
 * Get all users opted out for a specific date in the given organization(s)
 */
export async function getOptedOutUsers(adminUserId: string, date: string = getTodayDate()) {
	try {
		const users = await db.execute<{
			id: string;
			email: string;
			name: string;
			createdAt: Date;
			organizationId: string;
		}>(sql`
			SELECT DISTINCT u.id, u.email, u.name, o.created_at as "createdAt", o.organization_id as "organizationId"
			FROM opt_out o
			INNER JOIN "user" u ON u.id = o.user_id
			WHERE o.opt_out_date = ${date}
				AND o.organization_id IN (
					SELECT m."organizationId"
					FROM member m
					WHERE m."userId" = ${adminUserId}
				)
			ORDER BY o.created_at DESC
		`);

		return users;
	} catch (error) {
		console.error('Error getting opted out users:', error);
		throw error;
	}
}

/**
 * Get opt-out status for a user with timestamp
 */
export async function getUserOptOutStatus(userId: string, date: string = getTodayDate()) {
	try {
		const result = await db.execute<{
			id: string;
			createdAt: Date;
		}>(sql`
			SELECT id, created_at as "createdAt"
			FROM opt_out
			WHERE user_id = ${userId} AND opt_out_date = ${date}
			LIMIT 1
		`);

		if (result.length === 0) {
			return { optedOut: false, timestamp: null };
		}

		return { optedOut: true, timestamp: result[0].createdAt };
	} catch (error) {
		console.error('Error getting user opt-out status:', error);
		throw error;
	}
}
