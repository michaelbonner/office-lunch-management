import { and, asc, eq, inArray, notExists } from 'drizzle-orm';
import { member, organization, user } from '../../../drizzle/schema';
import { db } from './db';

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
		const newOrgs = await db
			.insert(organization)
			.values({
				id: crypto.randomUUID(),
				name,
				slug,
				metadata: '{}'
			})
			.returning({
				id: organization.id,
				name: organization.name,
				slug: organization.slug
			});

		const org = newOrgs[0];

		// Add user as owner
		await db.insert(member).values({
			id: crypto.randomUUID(),
			organizationId: org.id,
			userId,
			role: 'owner',
			createdAt: new Date().toISOString()
		});

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
		const orgs = await db
			.select({
				id: organization.id,
				name: organization.name,
				slug: organization.slug,
				role: member.role
			})
			.from(organization)
			.innerJoin(member, eq(member.organizationId, organization.id))
			.where(eq(member.userId, userId));

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
		// Use onConflictDoNothing to handle race conditions atomically
		// The unique constraint on (userId, organizationId) prevents duplicates
		await db
			.insert(member)
			.values({
				id: crypto.randomUUID(),
				organizationId,
				userId,
				role,
				createdAt: new Date().toISOString()
			})
			.onConflictDoNothing();
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
		// Get organization IDs for the user
		const userOrgIdsResult = await db
			.select({ organizationId: member.organizationId })
			.from(member)
			.where(eq(member.userId, userId));

		const userOrgIds = userOrgIdsResult.map((r) => r.organizationId);

		if (userOrgIds.length === 0) {
			return [];
		}

		// Get all users in those organizations
		const users = await db
			.selectDistinct({
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				memberRole: member.role,
				createdAt: user.createdAt
			})
			.from(user)
			.innerJoin(member, eq(member.userId, user.id))
			.where(inArray(member.organizationId, userOrgIds))
			.orderBy(user.name);

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
		const adminMemberships = await db
			.select({ id: member.id })
			.from(member)
			.where(and(eq(member.userId, userId), inArray(member.role, ['admin', 'owner'])))
			.limit(1);

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
		const users = await db
			.select({
				id: user.id,
				role: user.role
			})
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

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
		// Get organizations that the admin belongs to
		const adminOrgIdsResult = await db
			.select({ organizationId: member.organizationId })
			.from(member)
			.where(eq(member.userId, adminUserId));

		const adminOrgIds = adminOrgIdsResult.map((r) => r.organizationId);

		if (adminOrgIds.length === 0) {
			return 0;
		}

		// Get organizations that both the admin and target user belong to
		const sharedOrgs = await db
			.selectDistinct({
				organizationId: member.organizationId
			})
			.from(member)
			.where(and(inArray(member.organizationId, adminOrgIds), eq(member.userId, targetUserId)));

		if (sharedOrgs.length === 0) {
			return 0;
		}

		// Remove the user from all shared organizations
		const orgIds = sharedOrgs.map((org) => org.organizationId);

		await db
			.delete(member)
			.where(and(eq(member.userId, targetUserId), inArray(member.organizationId, orgIds)));

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
		const result = await db
			.select({
				organizationId: organization.id,
				organizationName: organization.name,
				organizationSlug: organization.slug,
				organizationCreatedAt: organization.createdAt,
				memberId: member.id,
				userId: user.id,
				userName: user.name,
				userEmail: user.email,
				userRole: user.role,
				memberRole: member.role,
				memberCreatedAt: member.createdAt
			})
			.from(organization)
			.leftJoin(member, eq(member.organizationId, organization.id))
			.leftJoin(user, eq(user.id, member.userId))
			.orderBy(asc(organization.name), asc(user.name));

		// Group by organization
		const organizationsMap = new Map<
			string,
			{
				id: string;
				name: string;
				slug: string;
				createdAt: string;
				members: Array<{
					memberId: string;
					userId: string;
					userName: string;
					userEmail: string;
					userRole: string | null;
					memberRole: string;
					memberCreatedAt: string;
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
					memberCreatedAt: row.memberCreatedAt || new Date().toISOString()
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
		// Get admin's organizations where they are admin/owner
		const adminOrgIdsResult = await db
			.select({ organizationId: member.organizationId })
			.from(member)
			.where(and(eq(member.userId, adminUserId), inArray(member.role, ['admin', 'owner'])));

		const adminOrgIds = adminOrgIdsResult.map((r) => r.organizationId);

		if (adminOrgIds.length === 0) {
			return 0;
		}

		// Get organizations where admin is admin/owner AND target user is a member
		const sharedOrgs = await db
			.selectDistinct({
				organizationId: member.organizationId
			})
			.from(member)
			.where(and(eq(member.userId, targetUserId), inArray(member.organizationId, adminOrgIds)));

		if (sharedOrgs.length === 0) {
			return 0;
		}

		const orgIds = sharedOrgs.map((org) => org.organizationId);

		// Get all target user's memberships in these orgs to check for owner role
		const targetMemberships = await db
			.select({
				organizationId: member.organizationId,
				role: member.role
			})
			.from(member)
			.where(and(eq(member.userId, targetUserId), inArray(member.organizationId, orgIds)));

		// Filter out organizations where target is owner
		const orgsToUpdate = targetMemberships
			.filter((m) => m.role !== 'owner')
			.map((m) => m.organizationId);

		if (orgsToUpdate.length === 0) {
			return 0;
		}

		// Update role in these organizations
		await db
			.update(member)
			.set({ role: newRole })
			.where(and(eq(member.userId, targetUserId), inArray(member.organizationId, orgsToUpdate)));

		return orgsToUpdate.length;
	} catch (error) {
		console.error('Error updating user role in shared organizations:', error);
		throw error;
	}
}

/**
 * Get all users that are not in any organization
 */
export async function getUsersWithoutOrganizations() {
	try {
		const users = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				createdAt: user.createdAt
			})
			.from(user)
			.where(notExists(db.select({ id: member.id }).from(member).where(eq(member.userId, user.id))))
			.orderBy(user.name);

		return users;
	} catch (error) {
		console.error('Error getting users without organizations:', error);
		throw error;
	}
}

/**
 * Find organizations that have a matching work email domain
 */
export async function getOrganizationsByWorkEmailDomain(emailDomain: string) {
	try {
		const orgs = await db
			.select({
				id: organization.id,
				name: organization.name,
				slug: organization.slug
			})
			.from(organization)
			.where(eq(organization.workEmailDomain, emailDomain.toLowerCase()));

		return orgs;
	} catch (error) {
		console.error('Error finding organizations by work email domain:', error);
		throw error;
	}
}

/**
 * Update the work email domain for an organization
 */
export async function updateOrganizationWorkEmailDomain(
	organizationId: string,
	workEmailDomain: string | null
) {
	try {
		await db
			.update(organization)
			.set({
				workEmailDomain: workEmailDomain ? workEmailDomain.toLowerCase() : null
			})
			.where(eq(organization.id, organizationId));
	} catch (error) {
		console.error('Error updating organization work email domain:', error);
		throw error;
	}
}

/**
 * Get an organization by ID with its work email domain
 */
export async function getOrganizationById(organizationId: string) {
	try {
		const orgs = await db
			.select({
				id: organization.id,
				name: organization.name,
				slug: organization.slug,
				logo: organization.logo,
				workEmailDomain: organization.workEmailDomain,
				createdAt: organization.createdAt
			})
			.from(organization)
			.where(eq(organization.id, organizationId))
			.limit(1);

		return orgs[0] || null;
	} catch (error) {
		console.error('Error getting organization by ID:', error);
		throw error;
	}
}

/**
 * Check if a user is an admin/owner of a specific organization
 */
export async function isUserOrgAdmin(userId: string, organizationId: string): Promise<boolean> {
	try {
		const adminMemberships = await db
			.select({ id: member.id })
			.from(member)
			.where(
				and(
					eq(member.userId, userId),
					eq(member.organizationId, organizationId),
					inArray(member.role, ['admin', 'owner'])
				)
			)
			.limit(1);

		return adminMemberships.length > 0;
	} catch (error) {
		console.error('Error checking if user is org admin:', error);
		throw error;
	}
}
