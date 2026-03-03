import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Page from './+page.svelte';

const baseLoggedInData = {
	isLoggedIn: true,
	isAdmin: false,
	isSystemAdmin: false,
	todayDate: '2026-03-03'
};

describe('/+page.svelte', () => {
	it('should render h1', async () => {
		render(Page);

		const heading = page.getByRole('heading', { level: 1 });
		await expect.element(heading).toBeInTheDocument();
	});

	describe('opt-in time display', () => {
		it('shows opt-in time when user is opted in with a timestamp', async () => {
			render(Page, {
				data: {
					...baseLoggedInData,
					optInStatus: { optedIn: true, timestamp: new Date('2026-03-03T17:30:00.000Z') }
				}
			});

			await expect.element(page.getByText(/Opted in at/)).toBeInTheDocument();
		});

		it('does not show opt-in time when user is not opted in', async () => {
			render(Page, {
				data: {
					...baseLoggedInData,
					optInStatus: { optedIn: false, timestamp: null }
				}
			});

			await expect.element(page.getByText(/Opted in at/)).not.toBeInTheDocument();
		});

		it('does not show opt-in time when opted in but timestamp is null', async () => {
			render(Page, {
				data: {
					...baseLoggedInData,
					optInStatus: { optedIn: true, timestamp: null }
				}
			});

			await expect.element(page.getByText(/Opted in at/)).not.toBeInTheDocument();
		});
	});
});
