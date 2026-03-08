import { expect, test } from '@playwright/test';

test.describe('public pages', () => {
	test('homepage shows core marketing content for anonymous visitors', async ({ page }) => {
		await page.goto('/');

		await expect(
			page.getByRole('heading', {
				level: 1,
				name: 'Make lunch coordination feel effortless, even across multiple teams.'
			})
		).toBeVisible();
		await expect(page.getByText('Start coordinating today')).toBeVisible();
		await expect(page.getByText('One hub for every organization')).toBeVisible();
		await expect(page.getByText('Everything you need for lunch day')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
	});

	test('homepage includes the feedback widget without anonymous user attributes', async ({
		page
	}) => {
		await page.goto('/');

		const widget = page.locator(
			'script[src="https://easycustomerfeedback.com/widget/2b3bd5a9efa34975991466c1a1fffeda/embed"]'
		);

		await expect(widget).toHaveCount(1);
		await expect(widget).toHaveAttribute('data-label', 'Send feedback');
		await expect(widget).toHaveAttribute('data-position', 'right');
		await expect(widget).toHaveAttribute('data-color', '#b87745');
		await expect(widget).not.toHaveAttribute('data-name', /.+/);
		await expect(widget).not.toHaveAttribute('data-email', /.+/);
		await expect(widget).not.toHaveAttribute('data-user-id', /.+/);
	});

	test('sign-in page preserves callback URL and links back home', async ({ page }) => {
		await page.goto('/sign-in?callbackURL=%2Forders');

		await expect(page.getByRole('heading', { level: 1, name: 'Sign In' })).toBeVisible();
		await expect(page.getByText('Sign in to continue to Office Lunch Management')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();

		await page.getByRole('link', { name: /Back to Home/ }).click();
		await page.waitForURL('/');
		await expect(page).toHaveURL('/');
	});
});
