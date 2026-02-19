import { createHash, randomBytes } from 'crypto';
import { and, eq, gt, isNull, lt, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { apiToken } from '../../../drizzle/schema';
import { db } from './db';

/**
 * Generate a secure random API token
 * Format: olm_<random_string> (olm = office lunch management)
 */
export function generateToken(): string {
	const randomString = randomBytes(32).toString('base64url');
	return `olm_${randomString}`;
}

/**
 * Hash a token for secure storage in the database
 */
export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new API token for a user
 */
export async function createApiToken(params: {
	userId: string;
	name: string;
	expiresAt?: Date;
}): Promise<{ id: string; token: string; name: string; createdAt: string }> {
	const token = generateToken();
	const hashedToken = hashToken(token);

	const [newToken] = await db
		.insert(apiToken)
		.values({
			id: nanoid(),
			userId: params.userId,
			token: hashedToken,
			name: params.name,
			expiresAt: params.expiresAt?.toISOString()
		})
		.returning();

	// Return the unhashed token only once - user must save it
	return {
		id: newToken.id,
		token, // Plain text token (only time it's exposed)
		name: newToken.name,
		createdAt: newToken.createdAt
	};
}

/**
 * Validate a token and return the associated user ID
 * Returns null if token is invalid, expired, or doesn't exist
 */
export async function validateToken(token: string): Promise<string | null> {
	const hashedToken = hashToken(token);

	const [tokenRecord] = await db
		.select()
		.from(apiToken)
		.where(
			and(
				eq(apiToken.token, hashedToken),
				// Token must either have no expiration or be in the future
				or(isNull(apiToken.expiresAt), gt(apiToken.expiresAt, new Date().toISOString()))
			)
		)
		.limit(1);

	if (!tokenRecord) {
		// Check if it's expired
		const [expiredToken] = await db
			.select()
			.from(apiToken)
			.where(eq(apiToken.token, hashedToken))
			.limit(1);

		if (expiredToken && expiredToken.expiresAt) {
			const expiresAt = new Date(expiredToken.expiresAt);
			if (expiresAt < new Date()) {
				return null; // Expired token
			}
		}
		return null; // Token not found
	}

	// Update last used timestamp
	await db
		.update(apiToken)
		.set({
			lastUsedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		})
		.where(eq(apiToken.id, tokenRecord.id));

	return tokenRecord.userId;
}

/**
 * Get all tokens for a user (without the actual token values)
 */
export async function getUserTokens(userId: string) {
	return db
		.select({
			id: apiToken.id,
			name: apiToken.name,
			lastUsedAt: apiToken.lastUsedAt,
			expiresAt: apiToken.expiresAt,
			createdAt: apiToken.createdAt
		})
		.from(apiToken)
		.where(eq(apiToken.userId, userId))
		.orderBy(apiToken.createdAt);
}

/**
 * Delete a specific token
 */
export async function deleteToken(tokenId: string, userId: string): Promise<boolean> {
	const result = await db
		.delete(apiToken)
		.where(and(eq(apiToken.id, tokenId), eq(apiToken.userId, userId)))
		.returning();

	return result.length > 0;
}

/**
 * Delete all tokens for a user
 */
export async function deleteAllUserTokens(userId: string): Promise<number> {
	const result = await db.delete(apiToken).where(eq(apiToken.userId, userId)).returning();

	return result.length;
}

/**
 * Clean up expired tokens (can be called periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
	const result = await db
		.delete(apiToken)
		.where(lt(apiToken.expiresAt, new Date().toISOString()))
		.returning();

	return result.length;
}
