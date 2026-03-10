import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sendEmail } from '$lib/server/email';
import {
	getOrganizationById,
	getOrganizationAdminUsers,
	getUserOrganizations
} from '$lib/server/organization';
import { restaurantSuggestion } from '../../../../drizzle/schema';
import type { RequestHandler } from './$types';

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	const activeOrganizationId = locals.activeOrganizationId;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	if (!activeOrganizationId) {
		throw error(400, 'No active organization selected');
	}

	const userOrganizations = await getUserOrganizations(user.id);
	const activeOrganization = userOrganizations.find((org) => org.id === activeOrganizationId);

	if (!activeOrganization) {
		throw error(403, 'Forbidden');
	}

	const body = await request.json();
	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const menuLink = typeof body.menuLink === 'string' ? body.menuLink.trim() : '';
	const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

	if (!name) {
		throw error(400, 'Restaurant name is required');
	}

	if (name.length > 120) {
		throw error(400, 'Restaurant name must be 120 characters or less');
	}

	if (!menuLink) {
		throw error(400, 'Menu link is required');
	}

	try {
		new URL(menuLink);
	} catch {
		throw error(400, 'Menu link must be a valid URL');
	}

	if (notes.length > 1000) {
		throw error(400, 'Notes must be 1,000 characters or less');
	}

	const organization = await getOrganizationById(activeOrganizationId);
	if (!organization) {
		throw error(404, 'Organization not found');
	}

	const admins = await getOrganizationAdminUsers(activeOrganizationId);
	const recipientEmails = admins.map((admin) => admin.email).filter(Boolean);

	if (recipientEmails.length === 0) {
		throw error(500, 'No admin recipients found for this organization');
	}

	const safeName = escapeHtml(name);
	const safeMenuLink = menuLink ? escapeHtml(menuLink) : '';
	const safeNotes = notes ? escapeHtml(notes).replace(/\n/g, '<br>') : '';
	const safeUserName = escapeHtml(user.name || 'Unknown user');
	const safeUserEmail = escapeHtml(user.email || '');
	const safeOrganizationName = escapeHtml(organization.name);
	const adminRequestsUrl = `${env.APP_URL || 'https://officelunch.app'}/admin?tab=requests`;
	const safeAdminRequestsUrl = escapeHtml(adminRequestsUrl);

	const [suggestion] = await db
		.insert(restaurantSuggestion)
		.values({
			id: crypto.randomUUID(),
			organizationId: activeOrganizationId,
			requestedByUserId: user.id,
			name,
			menuLink,
			notes: notes || null,
			status: 'pending'
		})
		.returning({ id: restaurantSuggestion.id });

	try {
		await sendEmail({
			to: recipientEmails.join(', '),
			subject: `Restaurant suggestion for ${organization.name}: ${name}`,
			replyTo: user.email || undefined,
			text: [
				`${user.name || 'A user'} requested that admins add a restaurant.`,
				'',
				`Request ID: ${suggestion.id}`,
				`Review request: ${adminRequestsUrl}`,
				`Organization: ${organization.name}`,
				`Requested by: ${user.name || 'Unknown user'}${user.email ? ` (${user.email})` : ''}`,
				`Restaurant name: ${name}`,
				`Menu link: ${menuLink}`,
				notes ? `Notes: ${notes}` : 'Notes: None provided'
			].join('\n'),
			html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f7f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">
        <tr><td style="background:#141d1e;border-radius:16px 16px 0 0;padding:28px 32px;">
          <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(248,244,238,0.6);">Office Lunch Management</p>
          <h1 style="margin:8px 0 0;font-size:22px;color:#f8f4ee;">New restaurant suggestion</h1>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px;">
	          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3b3f42;">
	            ${safeUserName} requested that admins add a restaurant for <strong>${safeOrganizationName}</strong>.
	          </p>
	          <p style="margin:0 0 24px;">
	            <a href="${safeAdminRequestsUrl}" style="display:inline-block;border-radius:999px;background:#9e5b27;color:#ffffff;padding:12px 18px;font-size:14px;font-weight:700;text-decoration:none;">Review requests</a>
	          </p>
	          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
	            <tr>
	              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:13px;font-weight:700;color:#9e5b27;width:160px;">Request ID</td>
	              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:14px;color:#141d1e;">${suggestion.id}</td>
	            </tr>
	            <tr>
	              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:13px;font-weight:700;color:#9e5b27;width:160px;">Requested by</td>
	              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:14px;color:#141d1e;">${safeUserName}${safeUserEmail ? ` (${safeUserEmail})` : ''}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:13px;font-weight:700;color:#9e5b27;">Restaurant</td>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:14px;color:#141d1e;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:13px;font-weight:700;color:#9e5b27;">Menu link</td>
	              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:14px;color:#141d1e;"><a href="${safeMenuLink}" style="color:#9e5b27;text-decoration:none;">${safeMenuLink}</a></td>
	            </tr>
            <tr>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:13px;font-weight:700;color:#9e5b27;vertical-align:top;">Notes</td>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:14px;line-height:1.6;color:#141d1e;">${safeNotes || 'None provided'}</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
		});
	} catch (emailError) {
		console.error('Failed to send admin notification for restaurant suggestion:', emailError);
	}

	return json({ success: true });
};
