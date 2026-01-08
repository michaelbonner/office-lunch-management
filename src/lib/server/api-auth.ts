import { user } from '../../../drizzle/schema';
import { validateToken } from './api-token';
import { db } from './db';
import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

/**
 * Extract API token from Authorization header
 * Supports formats:
 * - Bearer <token>
 * - <token>
 */
function extractTokenFromHeader(authHeader: string | null): string | null {
	if (!authHeader) {
		return null;
	}

	// Handle "Bearer <token>" format
	if (authHeader.startsWith('Bearer ')) {
		return authHeader.substring(7);
	}

	// Handle raw token
	return authHeader;
}

/**
 * Authenticate a request using either session or API token
 * Returns the authenticated user or throws an error
 */
export async function authenticateRequest(event: RequestEvent) {
	// First, check if user is already authenticated via session
	if (event.locals.user) {
		return event.locals.user;
	}

	// Try to authenticate with API token
	const authHeader = event.request.headers.get('Authorization');
	const token = extractTokenFromHeader(authHeader);

	if (!token) {
		throw error(401, 'Unauthorized: No authentication provided');
	}

	// Validate the token
	const userId = await validateToken(token);

	if (!userId) {
		throw error(401, 'Unauthorized: Invalid or expired token');
	}

	// Fetch the user
	const [authenticatedUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (!authenticatedUser) {
		throw error(401, 'Unauthorized: User not found');
	}

	// Check if user is banned
	if (authenticatedUser.banned) {
		if (authenticatedUser.banExpires) {
			const banExpiresDate = new Date(authenticatedUser.banExpires);
			if (banExpiresDate < new Date()) {
				// Ban has expired, user can proceed
			} else {
				throw error(
					403,
					`Forbidden: Account is banned until ${banExpiresDate.toLocaleDateString()}`
				);
			}
		} else {
			// Permanent ban
			throw error(403, 'Forbidden: Account is permanently banned');
		}
	}

	return authenticatedUser;
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 * Does not throw errors
 */
export async function optionalAuthentication(event: RequestEvent) {
	// First, check if user is already authenticated via session
	if (event.locals.user) {
		return event.locals.user;
	}

	// Try to authenticate with API token
	const authHeader = event.request.headers.get('Authorization');
	const token = extractTokenFromHeader(authHeader);

	if (!token) {
		return null;
	}

	// Validate the token
	const userId = await validateToken(token);

	if (!userId) {
		return null;
	}

	// Fetch the user
	const [authenticatedUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (!authenticatedUser) {
		return null;
	}

	// Check if user is banned
	if (authenticatedUser.banned) {
		if (authenticatedUser.banExpires) {
			const banExpiresDate = new Date(authenticatedUser.banExpires);
			if (banExpiresDate >= new Date()) {
				return null; // Still banned
			}
		} else {
			return null; // Permanently banned
		}
	}

	return authenticatedUser;
}
