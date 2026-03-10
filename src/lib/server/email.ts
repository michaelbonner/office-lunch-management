import { env } from '$env/dynamic/private';
import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import nodemailer from 'nodemailer';

interface SendEmailOptions {
	to: string;
	subject: string;
	text: string;
	html?: string;
	replyTo?: string;
}

function createTransporter() {
	if (process.env.NODE_ENV !== 'production') {
		return nodemailer.createTransport({
			host: env.SMTP_HOST || 'localhost',
			port: parseInt(env.SMTP_PORT || '1025'),
			secure: false
		});
	}

	const ses = new SESClient({
		region: env.AWS_REGION || 'us-east-1',
		credentials: {
			accessKeyId: env.AWS_ACCESS_KEY,
			secretAccessKey: env.AWS_SECRET_ACCESS_KEY
		}
	});

	return nodemailer.createTransport({
		SES: { ses, aws: { SendRawEmailCommand } }
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any);
}

export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailOptions) {
	const transporter = createTransporter();

	await transporter.sendMail({
		from: env.MAIL_FROM || 'noreply@officelunch.app',
		to,
		subject,
		text,
		html,
		...(replyTo ? { replyTo } : {})
	});
}
