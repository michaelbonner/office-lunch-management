import { session, organization, member } from '../../../drizzle/schema';
import { db } from './db';
import { getUserOrganizations } from './organization';
import { eq, and } from 'drizzle-orm';

/**
 * Get active organization ID from session or return user's first organization
 */
export async function getActiveOrganizationId(
	sessionId: string | undefined,
	userId: string
): Promise<string> {
	// Try to get from session first
	if (sessionId) {
		const sessions = await db
			.select({
				activeOrganizationId: session.activeOrganizationId
			})
			.from(session)
			.where(eq(session.id, sessionId))
			.limit(1);

		if (sessions.length > 0 && sessions[0].activeOrganizationId) {
			// Verify user still has access to this org
			const userOrgs = await getUserOrganizations(userId);
			const hasAccess = userOrgs.some((org) => org.id === sessions[0].activeOrganizationId);

			if (hasAccess) {
				return sessions[0].activeOrganizationId;
			}
		}
	}

	// Fallback: get user's first organization
	const userOrgs = await getUserOrganizations(userId);

	if (userOrgs.length === 0) {
		throw new Error('User has no organizations');
	}

	// Set the first org as active in session if we have a sessionId
	if (sessionId) {
		await setActiveOrganizationId(sessionId, userOrgs[0].id, userId);
	}

	return userOrgs[0].id;
}

/**
 * Set active organization in session
 */
export async function setActiveOrganizationId(
	sessionId: string,
	organizationId: string,
	userId: string
): Promise<void> {
	// Verify user has access to this organization
	const userOrgs = await getUserOrganizations(userId);
	const hasAccess = userOrgs.some((org) => org.id === organizationId);

	if (!hasAccess) {
		throw new Error('User does not have access to this organization');
	}

	await db
		.update(session)
		.set({ activeOrganizationId: organizationId })
		.where(eq(session.id, sessionId));
}

/**
 * Get active organization details with verification
 */
export async function getActiveOrganization(sessionId: string | undefined, userId: string) {
	const orgId = await getActiveOrganizationId(sessionId, userId);

	const orgs = await db
		.select({
			id: organization.id,
			name: organization.name,
			slug: organization.slug,
			role: member.role
		})
		.from(organization)
		.innerJoin(member, eq(member.organizationId, organization.id))
		.where(and(eq(organization.id, orgId), eq(member.userId, userId)));

	if (orgs.length === 0) {
		throw new Error('Organization not found or user has no access');
	}

	return orgs[0];
}
