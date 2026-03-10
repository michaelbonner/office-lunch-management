import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { sendEmail } from '$lib/server/email';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const name = (data.get('name') as string)?.trim();
		const email = (data.get('email') as string)?.trim();
		const message = (data.get('message') as string)?.trim();

		if (!name) return fail(400, { name, email, message, error: 'Name is required.' });
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			return fail(400, { name, email, message, error: 'A valid email address is required.' });
		if (!message) return fail(400, { name, email, message, error: 'Message is required.' });
		if (message.length > 5000)
			return fail(400, {
				name,
				email,
				message,
				error: 'Message must be 5,000 characters or less.'
			});

		// Verify Turnstile token
		const token = (data.get('cf-turnstile-response') as string) ?? '';
		if (!token) {
			return fail(400, { name, email, message, error: 'Please complete the security challenge.' });
		}
		const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				secret: env.TURNSTILE_SECRET_KEY,
				response: token,
				remoteip: event.getClientAddress()
			})
		});
		const verification = (await verifyRes.json()) as { success: boolean };
		if (!verification.success) {
			return fail(400, {
				name,
				email,
				message,
				error: 'Security challenge failed. Please try again.'
			});
		}

		const to = env.CONTACT_FORM_MAIL_TO || env.MAIL_FROM || 'noreply@officelunch.app';

		const escapedMessage = message
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/\n/g, '<br>');
		const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f7f8;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f7f8;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:#141d1e;border-radius:16px 16px 0 0;padding:28px 36px;">
          <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(248,244,238,0.55);">Office Lunch Management</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#f8f4ee;">New contact message</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px 36px;">

          <!-- Sender row -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="width:50%;padding-right:12px;">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9e5b27;">From</p>
                <p style="margin:0;font-size:15px;font-weight:600;color:#141d1e;">${name}</p>
                <a href="mailto:${email}" style="font-size:13px;color:#9e5b27;text-decoration:none;">${email}</a>
              </td>
            </tr>
          </table>

          <hr style="border:none;border-top:1px solid #e8e3dc;margin:0 0 24px;">

          <!-- Message -->
          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#9e5b27;">Message</p>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#3b3f42;">${escapedMessage}</p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#faf7f2;border-radius:0 0 16px 16px;border-top:1px solid #e8e3dc;padding:20px 36px;">
          <p style="margin:0;font-size:12px;color:#9e9690;">
            Sent from the contact form at
            <a href="https://officelunch.app/contact" style="color:#9e5b27;text-decoration:none;">officelunch.app/contact</a>.
            Reply directly to this email to respond to ${name}.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

		try {
			await sendEmail({
				to,
				subject: `Contact form: ${name}`,
				replyTo: email,
				text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
				html
			});
		} catch (err) {
			console.error('Contact form email failed:', err);
			return fail(500, {
				name,
				email,
				message,
				error: 'Failed to send your message. Please try again later.'
			});
		}

		return { success: true };
	}
};
