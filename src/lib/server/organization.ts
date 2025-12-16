import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Create a new organization for a user
 */
export async function createOrganizationForUser(
	userId: string,
	userEmail: string,
	userName: string
) {
	try {
		// Extract domain from email for org slug
		const emailDomain = userEmail.split('@')[1] || 'org';
		const slug = `${emailDomain}-${userId.slice(0, 8)}`.toLowerCase();
		const name = `${userName}'s Organization`;

		// Create organization
		const newOrgs = await db.execute<{
			id: string;
			name: string;
			slug: string;
		}>(sql`
			INSERT INTO organization (id, name, slug, "createdAt", metadata)
			VALUES (gen_random_uuid(), ${name}, ${slug}, NOW(), '{}')
			RETURNING id, name, slug
		`);

		const org = newOrgs[0];

		// Add user as owner
		await db.execute(sql`
			INSERT INTO member (id, "organizationId", "userId", role, "createdAt")
			VALUES (gen_random_uuid(), ${org.id}, ${userId}, 'owner', NOW())
		`);

		return org;
	} catch (error) {
		console.error('Error creating organization for user:', error);
		throw error;
	}
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations(userId: string) {
	try {
		const orgs = await db.execute<{
			id: string;
			name: string;
			slug: string;
			role: string;
		}>(sql`
			SELECT o.id, o.name, o.slug, m.role
			FROM organization o
			JOIN member m ON m."organizationId" = o.id
			WHERE m."userId" = ${userId}
		`);

		return orgs;
	} catch (error) {
		console.error('Error getting user organizations:', error);
		throw error;
	}
}

/**
 * Add a user to an organization
 */
export async function addUserToOrganization(
	userId: string,
	organizationId: string,
	role: 'owner' | 'admin' | 'member' = 'member'
) {
	try {
		// Check if user is already a member
		const existingMember = await db.execute<{
			id: string;
		}>(sql`
			SELECT id
			FROM member
			WHERE "userId" = ${userId} AND "organizationId" = ${organizationId}
			LIMIT 1
		`);

		if (existingMember.length > 0) {
			return; // User already a member
		}

		// Add user as member
		await db.execute(sql`
			INSERT INTO member (id, "organizationId", "userId", role, "createdAt")
			VALUES (gen_random_uuid(), ${organizationId}, ${userId}, ${role}, NOW())
		`);
	} catch (error) {
		console.error('Error adding user to organization:', error);
		throw error;
	}
}

/**
 * Get all users that share at least one organization with the given user
 */
export async function getUsersInSameOrganizations(userId: string) {
	try {
		const users = await db.execute<{
			id: string;
			email: string;
			name: string;
			role: string | null;
			memberRole: string | null;
			createdAt: Date;
		}>(sql`
			SELECT DISTINCT u.id, u.email, u.name, u.role, u."createdAt", m1.role as "memberRole"
			FROM "user" u
			INNER JOIN member m1 ON m1."userId" = u.id
			WHERE m1."organizationId" IN (
				SELECT m2."organizationId"
				FROM member m2
				WHERE m2."userId" = ${userId}
			)
			ORDER BY u.name ASC
		`);

		return users;
	} catch (error) {
		console.error('Error getting users in same organizations:', error);
		throw error;
	}
}

/**
 * Check if a user is an admin in any of their organizations
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
	try {
		const adminMemberships = await db.execute<{
			id: string;
		}>(sql`
			SELECT id
			FROM member
			WHERE "userId" = ${userId} AND role IN ('admin', 'owner')
			LIMIT 1
		`);

		return adminMemberships.length > 0;
	} catch (error) {
		console.error('Error checking if user is admin:', error);
		throw error;
	}
}

/**
 * Check if a user is a system admin (has admin role in user table)
 */
export async function isUserSystemAdmin(userId: string): Promise<boolean> {
	try {
		const users = await db.execute<{
			id: string;
			role: string | null;
		}>(sql`
			SELECT id, role
			FROM "user"
			WHERE id = ${userId}
			LIMIT 1
		`);

		return users.length > 0 && users[0].role === 'admin';
	} catch (error) {
		console.error('Error checking if user is system admin:', error);
		throw error;
	}
}

/**
 * Remove a user from organizations that the admin has access to
 */
export async function removeUserFromSharedOrganizations(
	adminUserId: string,
	targetUserId: string
): Promise<number> {
	try {
		// Get organizations that both the admin and target user belong to
		const sharedOrgs = await db.execute<{
			organizationId: string;
		}>(sql`
			SELECT DISTINCT m1."organizationId"
			FROM member m1
			WHERE m1."organizationId" IN (
				SELECT m2."organizationId"
				FROM member m2
				WHERE m2."userId" = ${adminUserId}
			)
			AND m1."userId" = ${targetUserId}
		`);

		if (sharedOrgs.length === 0) {
			return 0;
		}

		// Remove the user from all shared organizations
		const orgIds = sharedOrgs.map((org) => org.organizationId);

		for (const orgId of orgIds) {
			await db.execute(sql`
				DELETE FROM member
				WHERE "userId" = ${targetUserId} AND "organizationId" = ${orgId}
			`);
		}

		return orgIds.length;
	} catch (error) {
		console.error('Error removing user from shared organizations:', error);
		throw error;
	}
}

/**
 * Get all organizations with their members (admin only)
 */
export async function getAllOrganizationsWithMembers() {
	try {
		const result = await db.execute<{
			organizationId: string;
			organizationName: string;
			organizationSlug: string;
			organizationCreatedAt: Date;
			memberId: string | null;
			userId: string | null;
			userName: string | null;
			userEmail: string | null;
			userRole: string | null;
			memberRole: string | null;
			memberCreatedAt: Date | null;
		}>(sql`
			SELECT
				o.id as "organizationId",
				o.name as "organizationName",
				o.slug as "organizationSlug",
				o."createdAt" as "organizationCreatedAt",
				m.id as "memberId",
				u.id as "userId",
				u.name as "userName",
				u.email as "userEmail",
				u.role as "userRole",
				m.role as "memberRole",
				m."createdAt" as "memberCreatedAt"
			FROM organization o
			LEFT JOIN member m ON m."organizationId" = o.id
			LEFT JOIN "user" u ON u.id = m."userId"
			ORDER BY o.name ASC, u.name ASC
		`);

		// Group by organization
		const organizationsMap = new Map<
			string,
			{
				id: string;
				name: string;
				slug: string;
				createdAt: Date;
				members: Array<{
					memberId: string;
					userId: string;
					userName: string;
					userEmail: string;
					userRole: string | null;
					memberRole: string;
					memberCreatedAt: Date;
				}>;
			}
		>();

		for (const row of result) {
			if (!organizationsMap.has(row.organizationId)) {
				organizationsMap.set(row.organizationId, {
					id: row.organizationId,
					name: row.organizationName,
					slug: row.organizationSlug,
					createdAt: row.organizationCreatedAt,
					members: []
				});
			}

			const org = organizationsMap.get(row.organizationId)!;

			// Add member if exists (LEFT JOIN might return null members)
			if (row.userId && row.memberId) {
				org.members.push({
					memberId: row.memberId,
					userId: row.userId,
					userName: row.userName || 'Unknown',
					userEmail: row.userEmail || '',
					userRole: row.userRole,
					memberRole: row.memberRole || 'member',
					memberCreatedAt: row.memberCreatedAt || new Date()
				});
			}
		}

		return Array.from(organizationsMap.values());
	} catch (error) {
		console.error('Error getting all organizations with members:', error);
		throw error;
	}
}

/**
 * Update a user's role in organizations shared with the admin
 */
export async function updateUserRoleInSharedOrganizations(
	adminUserId: string,
	targetUserId: string,
	newRole: 'admin' | 'member'
): Promise<number> {
	try {
		// Get organizations where admin is admin/owner AND target user is a member
		const sharedOrgs = await db.execute<{
			organizationId: string;
		}>(sql`
			SELECT DISTINCT m1."organizationId"
			FROM member m1
			JOIN member m2 ON m2."organizationId" = m1."organizationId"
			WHERE m1."userId" = ${targetUserId}
			AND m2."userId" = ${adminUserId}
			AND m2.role IN ('admin', 'owner')
		`);

		if (sharedOrgs.length === 0) {
			return 0;
		}

		const orgIds = sharedOrgs.map((org) => org.organizationId);

		// Update role in these organizations
		// Don't update if the user is the owner (unless specific logic required, but usually owners are special)
		// For now, let's assume we update any non-owner role, or allow updating admins.
		// Safe bet: don't downgrade an owner.

		let updatedCount = 0;

		for (const orgId of orgIds) {
			// Check if target is owner in this org
			const targetMember = await db.execute<{ role: string }>(sql`
                SELECT role FROM member WHERE "userId" = ${targetUserId} AND "organizationId" = ${orgId}
            `);

			if (targetMember.length > 0 && targetMember[0].role === 'owner') {
				continue; // Skip updating owner
			}

			await db.execute(sql`
				UPDATE member
				SET role = ${newRole}
				WHERE "userId" = ${targetUserId} AND "organizationId" = ${orgId}
			`);
			updatedCount++;
		}

		return updatedCount;
	} catch (error) {
		console.error('Error updating user role in shared organizations:', error);
		throw error;
	}
}
