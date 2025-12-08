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
			createdAt: Date;
		}>(sql`
			SELECT DISTINCT u.id, u.email, u.name, u.role, u."createdAt"
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
