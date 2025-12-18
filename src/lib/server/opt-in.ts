import { optIn } from '../../../drizzle/schema';
import { db } from './db';
import { formatInTimeZone } from 'date-fns-tz';
import { and, eq, sql } from 'drizzle-orm';

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
export function getTodayDate(timezone: string = 'America/Denver'): string {
	return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
}

/**
 * Opt a user in for a specific date across all their organizations
 */
export async function optUserIn(userId: string, date: string = getTodayDate()) {
	try {
		// Get all organizations the user belongs to
		const userOrgs = await db.execute<{ organizationId: string }>(sql`
			SELECT "organizationId"
			FROM member
			WHERE "userId" = ${userId}
		`);

		// Insert opt-in records for each organization
		for (const org of userOrgs) {
			await db.execute(sql`
				INSERT INTO opt_in (id, user_id, organization_id, opt_in_date, created_at, updated_at)
				VALUES (gen_random_uuid(), ${userId}, ${org.organizationId}, ${date}, NOW(), NOW())
				ON CONFLICT (user_id, organization_id, opt_in_date) DO NOTHING
			`);
		}

		return { success: true, organizationsCount: userOrgs.length };
	} catch (error) {
		console.error('Error opting user in:', error);
		throw error;
	}
}

/**
 * Opt a user out for a specific date (removes opt-in records)
 */
export async function optUserOut(userId: string, date: string = getTodayDate()) {
	try {
		await db.execute(sql`
			DELETE FROM opt_in
			WHERE user_id = ${userId} AND opt_in_date = ${date}
		`);

		return { success: true };
	} catch (error) {
		console.error('Error opting user out:', error);
		throw error;
	}
}

/**
 * Check if a user is opted in for a specific date
 */
export async function isUserOptedIn(
	userId: string,
	date: string = getTodayDate()
): Promise<boolean> {
	const result = await db
		.select({ id: optIn.id })
		.from(optIn)
		.where(and(eq(optIn.userId, userId), eq(optIn.optInDate, date)))
		.limit(1);

	return result.length > 0;
}

/**
 * Get all users opted in for a specific date in the given organization(s)
 */
export async function getOptedInUsers(adminUserId: string, date: string = getTodayDate()) {
	try {
		const users = await db.execute<{
			id: string;
			email: string;
			name: string;
			createdAt: Date;
			organizationId: string;
		}>(sql`
			SELECT DISTINCT u.id, u.email, u.name, o.created_at as "createdAt", o.organization_id as "organizationId"
			FROM opt_in o
			INNER JOIN "user" u ON u.id = o.user_id
			WHERE o.opt_in_date = ${date}
				AND o.organization_id IN (
					SELECT m."organizationId"
					FROM member m
					WHERE m."userId" = ${adminUserId}
				)
			ORDER BY o.created_at DESC
		`);

		return users;
	} catch (error) {
		console.error('Error getting opted in users:', error);
		throw error;
	}
}

/**
 * Get users who are NOT opted in for a specific date in the given organization(s)
 */
export async function getNotOptedInUsers(adminUserId: string, date: string = getTodayDate()) {
	try {
		const users = await db.execute<{
			id: string;
			email: string;
			name: string;
		}>(sql`
			SELECT DISTINCT u.id, u.email, u.name
			FROM "user" u
			INNER JOIN member m ON m."userId" = u.id
			WHERE m."organizationId" IN (
				SELECT "organizationId"
				FROM member
				WHERE "userId" = ${adminUserId}
			)
			AND u.id NOT IN (
				SELECT user_id
				FROM opt_in
				WHERE opt_in_date = ${date}
					AND organization_id IN (
						SELECT "organizationId"
						FROM member
						WHERE "userId" = ${adminUserId}
					)
			)
			ORDER BY u.name
		`);

		return users;
	} catch (error) {
		console.error('Error getting not opted in users:', error);
		throw error;
	}
}

/**
 * Get opt-in status for a user with timestamp
 */
export async function getUserOptInStatus(userId: string, date: string = getTodayDate()) {
	try {
		const result = await db.execute<{
			id: string;
			createdAt: Date;
		}>(sql`
			SELECT id, created_at as "createdAt"
			FROM opt_in
			WHERE user_id = ${userId} AND opt_in_date = ${date}
			LIMIT 1
		`);

		if (result.length === 0) {
			return { optedIn: false, timestamp: null };
		}

		return { optedIn: true, timestamp: result[0].createdAt };
	} catch (error) {
		console.error('Error getting user opt-in status:', error);
		throw error;
	}
}

/**
 * Admin function to opt in a user on their behalf
 */
export async function adminOptUserIn(
	adminUserId: string,
	targetUserId: string,
	date: string = getTodayDate()
) {
	try {
		// Verify admin has access
		const { isUserAdmin } = await import('./organization');
		const isAdmin = await isUserAdmin(adminUserId);

		if (!isAdmin) {
			throw new Error('Unauthorized: Admin access required');
		}

		// Opt the user in
		return await optUserIn(targetUserId, date);
	} catch (error) {
		console.error('Error admin opting user in:', error);
		throw error;
	}
}

/**
 * Admin function to opt out a user on their behalf (remove opt-in)
 */
export async function adminOptUserOut(
	adminUserId: string,
	targetUserId: string,
	date: string = getTodayDate()
) {
	try {
		// Verify admin has access
		const { isUserAdmin } = await import('./organization');
		const isAdmin = await isUserAdmin(adminUserId);

		if (!isAdmin) {
			throw new Error('Unauthorized: Admin access required');
		}

		// Opt the user out (remove opt-in)
		return await optUserOut(targetUserId, date);
	} catch (error) {
		console.error('Error admin opting user out:', error);
		throw error;
	}
}
