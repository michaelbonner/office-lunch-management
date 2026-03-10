import { error, json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { sendEmail } from '$lib/server/email';
import { getOrganizationById, isUserOrgAdmin } from '$lib/server/organization';
import { restaurant, restaurantSuggestion, user } from '../../../../../../drizzle/schema';
import type { RequestHandler } from './$types';

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const currentUser = locals.user;
	const suggestionId = params.id;

	if (!currentUser) {
		throw error(401, 'Unauthorized');
	}

	if (!suggestionId) {
		throw error(400, 'Suggestion ID is required');
	}

	const body = await request.json();
	const action = body.action === 'approve' || body.action === 'reject' ? body.action : null;
	const reviewerNotes = typeof body.reviewerNotes === 'string' ? body.reviewerNotes.trim() : '';

	if (!action) {
		throw error(400, 'Action must be approve or reject');
	}

	if (reviewerNotes.length > 1000) {
		throw error(400, 'Reviewer notes must be 1,000 characters or less');
	}

	const existing = await db
		.select({
			id: restaurantSuggestion.id,
			organizationId: restaurantSuggestion.organizationId,
			name: restaurantSuggestion.name,
			menuLink: restaurantSuggestion.menuLink,
			notes: restaurantSuggestion.notes,
			status: restaurantSuggestion.status,
			requestedByUserId: restaurantSuggestion.requestedByUserId,
			requestedByName: user.name,
			requestedByEmail: user.email
		})
		.from(restaurantSuggestion)
		.innerJoin(user, eq(user.id, restaurantSuggestion.requestedByUserId))
		.where(eq(restaurantSuggestion.id, suggestionId))
		.limit(1);

	const suggestion = existing[0];

	if (!suggestion) {
		throw error(404, 'Suggestion not found');
	}

	const canAdminister = await isUserOrgAdmin(currentUser.id, suggestion.organizationId);
	if (!canAdminister) {
		throw error(403, 'Forbidden - Admin access required');
	}

	if (suggestion.status !== 'pending') {
		throw error(400, 'This request has already been reviewed');
	}

	const organization = await getOrganizationById(suggestion.organizationId);
	if (!organization) {
		throw error(404, 'Organization not found');
	}

	const reviewedAt = new Date().toISOString();

	const updatedSuggestion = await db.transaction(async (tx) => {
		let createdRestaurantId: string | null = null;

		if (action === 'approve') {
			const [createdRestaurant] = await tx
				.insert(restaurant)
				.values({
					id: crypto.randomUUID(),
					name: suggestion.name,
					menuLink: suggestion.menuLink,
					organizationId: suggestion.organizationId
				})
				.returning({ id: restaurant.id });

			createdRestaurantId = createdRestaurant.id;
		}

		const [updated] = await tx
			.update(restaurantSuggestion)
			.set({
				status: action === 'approve' ? 'approved' : 'rejected',
				reviewerNotes: reviewerNotes || null,
				reviewedByUserId: currentUser.id,
				reviewedAt,
				updatedAt: reviewedAt,
				restaurantId: createdRestaurantId
			})
			.where(
				and(eq(restaurantSuggestion.id, suggestionId), eq(restaurantSuggestion.status, 'pending'))
			)
			.returning({
				id: restaurantSuggestion.id,
				status: restaurantSuggestion.status,
				reviewerNotes: restaurantSuggestion.reviewerNotes,
				reviewedAt: restaurantSuggestion.reviewedAt,
				restaurantId: restaurantSuggestion.restaurantId
			});

		if (!updated) {
			throw error(409, 'Suggestion was already updated');
		}

		return updated;
	});

	if (suggestion.requestedByEmail) {
		const safeName = escapeHtml(suggestion.name);
		const safeReviewerNotes = reviewerNotes ? escapeHtml(reviewerNotes).replace(/\n/g, '<br>') : '';
		const safeOrgName = escapeHtml(organization.name);

		try {
			await sendEmail({
				to: suggestion.requestedByEmail,
				subject:
					action === 'approve'
						? `Your restaurant suggestion was approved: ${suggestion.name}`
						: `Your restaurant suggestion was not approved: ${suggestion.name}`,
				text: [
					`Your restaurant suggestion for ${organization.name} has been ${action === 'approve' ? 'approved' : 'rejected'}.`,
					'',
					`Restaurant: ${suggestion.name}`,
					`Status: ${action === 'approve' ? 'Approved' : 'Rejected'}`,
					reviewerNotes ? `Admin note: ${reviewerNotes}` : 'Admin note: None provided'
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
          <h1 style="margin:8px 0 0;font-size:22px;color:#f8f4ee;">Restaurant suggestion ${action === 'approve' ? 'approved' : 'updated'}</h1>
        </td></tr>
        <tr><td style="background:#ffffff;padding:32px;">
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3b3f42;">
            Your restaurant suggestion for <strong>${safeOrgName}</strong> has been <strong>${action === 'approve' ? 'approved' : 'rejected'}</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:13px;font-weight:700;color:#9e5b27;width:160px;">Restaurant</td>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:14px;color:#141d1e;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:13px;font-weight:700;color:#9e5b27;">Status</td>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:14px;color:#141d1e;">${action === 'approve' ? 'Approved' : 'Rejected'}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:13px;font-weight:700;color:#9e5b27;vertical-align:top;">Admin note</td>
              <td style="padding:10px 0;border-top:1px solid #e8e3dc;font-size:14px;line-height:1.6;color:#141d1e;">${safeReviewerNotes || 'None provided'}</td>
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
			console.error('Failed to send requester review email for restaurant suggestion:', emailError);
		}
	}

	return json({ success: true, suggestion: updatedSuggestion });
};
