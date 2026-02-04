import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
	const key = env.TOKEN_ENCRYPTION_KEY;
	if (!key) {
		throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required');
	}
	// Key should be 32 bytes (256 bits) for AES-256
	// If provided key is not 32 bytes, hash it to get consistent length
	if (Buffer.from(key, 'hex').length === 32) {
		return Buffer.from(key, 'hex');
	}
	// If key is provided as string, use it directly (padded/truncated to 32 bytes)
	const keyBuffer = Buffer.alloc(32);
	Buffer.from(key).copy(keyBuffer);
	return keyBuffer;
}

export function encrypt(text: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(16);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	const authTag = cipher.getAuthTag();

	// Return iv:authTag:encrypted
	return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
	const key = getEncryptionKey();
	const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

	if (!ivHex || !authTagHex || !encrypted) {
		throw new Error('Invalid encrypted data format');
	}

	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}
