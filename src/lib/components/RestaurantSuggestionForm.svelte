<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';

	interface Props {
		organizationName?: string;
	}

	let { organizationName }: Props = $props();

	let name = $state('');
	let menuLink = $state('');
	let notes = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleSubmit(event: Event) {
		event.preventDefault();
		loading = true;
		error = '';
		success = false;

		try {
			const response = await fetch('/api/restaurant-suggestions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name,
					menuLink,
					notes
				})
			});

			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error(data?.message || 'Failed to send suggestion');
			}

			name = '';
			menuLink = '';
			notes = '';
			success = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send suggestion';
		} finally {
			loading = false;
		}
	}
</script>

<div class="rounded-xl border bg-card/80 p-6 shadow-sm">
	<div class="mb-4">
		<h2 class="text-lg font-semibold">Suggest a Restaurant</h2>
		<p class="text-sm text-muted-foreground">
			Send a restaurant request to the admins{organizationName ? ` for ${organizationName}` : ''}.
			Include a menu link so they can approve it directly.
		</p>
	</div>

	<form onsubmit={handleSubmit} class="space-y-4">
		<div>
			<label for="suggestion-name" class="mb-1.5 block text-sm font-medium">Restaurant Name</label>
			<input
				id="suggestion-name"
				type="text"
				bind:value={name}
				required
				disabled={loading}
				maxlength="120"
				class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
				placeholder="Enter the restaurant name"
			/>
		</div>

		<div>
			<label for="suggestion-menu-link" class="mb-1.5 block text-sm font-medium"> Menu Link </label>
			<input
				id="suggestion-menu-link"
				type="url"
				bind:value={menuLink}
				required
				disabled={loading}
				class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
				placeholder="https://example.com/menu"
			/>
		</div>

		<div>
			<label for="suggestion-notes" class="mb-1.5 block text-sm font-medium">
				Notes for Admins
			</label>
			<textarea
				id="suggestion-notes"
				bind:value={notes}
				disabled={loading}
				maxlength="1000"
				rows="4"
				class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
				placeholder="Optional details like cuisine, location, or popular dishes"
			></textarea>
		</div>

		{#if error}
			<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
				Suggestion sent to the admins.
			</div>
		{/if}

		<Button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Suggestion'}</Button>
	</form>
</div>
