import { optIn, member, user } from '../../../drizzle/schema';
import { db } from './db';
import { formatInTimeZone } from 'date-fns-tz';
import { and, eq, inArray, notInArray, sql } from 'drizzle-orm';

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
		const userOrgs = await db
			.select({ organizationId: member.organizationId })
			.from(member)
			.where(eq(member.userId, userId));

		// Insert opt-in records for each organization
		if (userOrgs.length > 0) {
			const values = userOrgs.map((org) => ({
				id: crypto.randomUUID(),
				userId,
				organizationId: org.organizationId,
				optInDate: date,
				createdAt: sql`NOW()`,
				updatedAt: sql`NOW()`
			}));

			await db.insert(optIn).values(values).onConflictDoNothing();
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
		await db.delete(optIn).where(and(eq(optIn.userId, userId), eq(optIn.optInDate, date)));

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
		// Get admin's organization IDs
		const adminOrgIdsResult = await db
			.select({ organizationId: member.organizationId })
			.from(member)
			.where(eq(member.userId, adminUserId));

		const adminOrgIds = adminOrgIdsResult.map((r) => r.organizationId);

		if (adminOrgIds.length === 0) {
			return [];
		}

		const users = await db
			.selectDistinct({
				id: user.id,
				email: user.email,
				name: user.name,
				createdAt: optIn.createdAt,
				organizationId: optIn.organizationId
			})
			.from(optIn)
			.innerJoin(user, eq(user.id, optIn.userId))
			.where(and(eq(optIn.optInDate, date), inArray(optIn.organizationId, adminOrgIds)))
			.orderBy(sql`${optIn.createdAt} DESC`);

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
		// Get admin's organization IDs
		const adminOrgIdsResult = await db
			.select({ organizationId: member.organizationId })
			.from(member)
			.where(eq(member.userId, adminUserId));

		const adminOrgIds = adminOrgIdsResult.map((r) => r.organizationId);

		if (adminOrgIds.length === 0) {
			return [];
		}

		// Get users who are opted in for this date in admin's orgs
		const optedInUserIdsResult = await db
			.select({ userId: optIn.userId })
			.from(optIn)
			.where(and(eq(optIn.optInDate, date), inArray(optIn.organizationId, adminOrgIds)));

		const optedInUserIds = optedInUserIdsResult.map((r) => r.userId);

		// Get all users in admin's orgs who are NOT opted in
		const users = await db
			.selectDistinct({
				id: user.id,
				email: user.email,
				name: user.name
			})
			.from(user)
			.innerJoin(member, eq(member.userId, user.id))
			.where(
				optedInUserIds.length > 0
					? and(inArray(member.organizationId, adminOrgIds), notInArray(user.id, optedInUserIds))
					: inArray(member.organizationId, adminOrgIds)
			)
			.orderBy(user.name);

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
		const result = await db
			.select({
				id: optIn.id,
				createdAt: optIn.createdAt
			})
			.from(optIn)
			.where(and(eq(optIn.userId, userId), eq(optIn.optInDate, date)))
			.limit(1);

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
