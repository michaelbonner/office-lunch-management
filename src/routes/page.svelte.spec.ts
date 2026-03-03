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
			const optInStatus = {
				status: 'opted-in' as const,
				optedIn: true,
				optedOut: false,
				timestamp: '2026-03-03T17:30:00.000Z',
				optedOutTimestamp: null
			};

			render(Page, {
				data: {
					...baseLoggedInData,
					optInStatus
				}
			});

			const expectedTime = new Date(optInStatus.timestamp).toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit'
			});
			await expect.element(page.getByText(`Opted in at ${expectedTime}`)).toBeInTheDocument();
		});

		it('does not show opt-in time when user is not opted in', async () => {
			render(Page, {
				data: {
					...baseLoggedInData,
					optInStatus: {
						status: 'no-response',
						optedIn: false,
						optedOut: false,
						timestamp: null,
						optedOutTimestamp: null
					}
				}
			});

			await expect.element(page.getByText(/Opted in at/)).not.toBeInTheDocument();
		});

		it('does not show opt-in time when user is opted out', async () => {
			render(Page, {
				data: {
					...baseLoggedInData,
					optInStatus: {
						status: 'opted-out',
						optedIn: false,
						optedOut: true,
						timestamp: null,
						optedOutTimestamp: '2026-03-03T18:00:00.000Z'
					}
				}
			});

			await expect.element(page.getByText(/Opted in at/)).not.toBeInTheDocument();
		});
	});
});
