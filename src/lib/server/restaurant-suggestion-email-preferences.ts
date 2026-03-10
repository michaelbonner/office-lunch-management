import { env } from '$env/dynamic/private';
import { createHmac, timingSafeEqual } from 'crypto';

const PURPOSE = 'restaurant-suggestion-unsubscribe';
const DEFAULT_EXPIRATION_MS = 1000 * 60 * 60 * 24 * 30;

type UnsubscribeTokenPayload = {
	purpose: typeof PURPOSE;
	userId: string;
	organizationId: string;
	expiresAt: number;
};

function getSigningSecret() {
	const secret = env.BETTER_AUTH_SECRET;
	if (!secret) {
		throw new Error('BETTER_AUTH_SECRET is required to generate unsubscribe tokens');
	}
	return secret;
}

function base64UrlEncode(value: string) {
	return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
	return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(encodedPayload: string) {
	return createHmac('sha256', getSigningSecret()).update(encodedPayload).digest('base64url');
}

export function createRestaurantSuggestionUnsubscribeToken(userId: string, organizationId: string) {
	const payload: UnsubscribeTokenPayload = {
		purpose: PURPOSE,
		userId,
		organizationId,
		expiresAt: Date.now() + DEFAULT_EXPIRATION_MS
	};

	const encodedPayload = base64UrlEncode(JSON.stringify(payload));
	return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyRestaurantSuggestionUnsubscribeToken(token: string) {
	const [encodedPayload, receivedSignature] = token.split('.');

	if (!encodedPayload || !receivedSignature) {
		return null;
	}

	const expectedSignature = sign(encodedPayload);
	const receivedBuffer = Buffer.from(receivedSignature);
	const expectedBuffer = Buffer.from(expectedSignature);

	if (
		receivedBuffer.length !== expectedBuffer.length ||
		!timingSafeEqual(receivedBuffer, expectedBuffer)
	) {
		return null;
	}

	try {
		const payload = JSON.parse(base64UrlDecode(encodedPayload)) as UnsubscribeTokenPayload;

		if (
			payload.purpose !== PURPOSE ||
			!payload.userId ||
			!payload.organizationId ||
			typeof payload.expiresAt !== 'number' ||
			payload.expiresAt < Date.now()
		) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}
