import { isUserOrgAdmin, updateOrganizationWorkEmailDomain } from '$lib/server/organization';
import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const user = locals.user;

	// Check if user is authenticated
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const organizationId = params.id;

	if (!organizationId) {
		throw error(400, 'Organization ID is required');
	}

	// Check if user is an admin/owner of this organization
	const isOrgAdmin = await isUserOrgAdmin(user.id, organizationId);
	if (!isOrgAdmin) {
		throw error(403, 'Forbidden - You must be an admin or owner of this organization');
	}

	try {
		const body = await request.json();
		const { workEmailDomain } = body;

		// Validate workEmailDomain if provided
		if (workEmailDomain !== null && workEmailDomain !== undefined) {
			if (typeof workEmailDomain !== 'string') {
				throw error(400, 'Work email domain must be a string');
			}

			// Domain validation if not empty
			if (workEmailDomain.trim()) {
				const domain = workEmailDomain.trim().toLowerCase();

				// Check minimum length
				if (domain.length < 4) {
					throw error(400, 'Domain must be at least 4 characters (e.g., a.co)');
				}

				// More robust domain validation using regex
				// Allows valid domain names like example.com, sub.example.com, etc.
				const domainRegex =
					/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;

				if (!domainRegex.test(domain)) {
					throw error(
						400,
						'Invalid domain format. Must be a valid domain name (e.g., example.com)'
					);
				}

				// Additional checks
				if (domain.includes('@')) {
					throw error(400, 'Domain should not include @ symbol');
				}
				if (domain.includes(' ')) {
					throw error(400, 'Domain should not include spaces');
				}
			}
		}

		// Update the work email domain
		await updateOrganizationWorkEmailDomain(organizationId, workEmailDomain?.trim() || null);

		return json({
			success: true,
			message: 'Organization settings updated successfully'
		});
	} catch (err) {
		console.error('Error updating organization settings:', err);
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		const errorMessage =
			err instanceof Error ? err.message : 'Failed to update organization settings';
		throw error(500, errorMessage);
	}
};
