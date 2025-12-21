<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';

	interface Props {
		onSuccess?: () => void;
		organizations: Array<{ id: string; name: string; role: string }>;
		activeOrganizationId?: string;
	}

	let { onSuccess, organizations, activeOrganizationId }: Props = $props();

	let name = $state('');
	let menuLink = $state('');
	let organizationId = $state(activeOrganizationId || (organizations[0]?.id ?? ''));
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	// Update organizationId when activeOrganizationId changes
	$effect(() => {
		if (activeOrganizationId) {
			organizationId = activeOrganizationId;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		success = false;

		try {
			const response = await fetch('/api/restaurants', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, menuLink, organizationId })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create restaurant');
			}

			success = true;
			name = '';
			menuLink = '';

			if (onSuccess) {
				onSuccess();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<!-- Organization Selector (only show if multiple orgs) -->
	{#if organizations.length > 1}
		<div>
			<label for="organization" class="mb-1.5 block text-sm font-medium"> Organization </label>
			<select
				id="organization"
				bind:value={organizationId}
				required
				disabled={loading}
				class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
			>
				{#each organizations as org (org.id)}
					<option value={org.id}>{org.name}</option>
				{/each}
			</select>
		</div>
	{/if}

	<div>
		<label for="name" class="mb-1.5 block text-sm font-medium"> Restaurant Name </label>
		<input
			id="name"
			type="text"
			bind:value={name}
			required
			disabled={loading}
			class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
			placeholder="Enter restaurant name"
		/>
	</div>

	<div>
		<label for="menuLink" class="mb-1.5 block text-sm font-medium"> Menu Link </label>
		<input
			id="menuLink"
			type="url"
			bind:value={menuLink}
			required
			disabled={loading}
			class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
			placeholder="https://example.com/menu"
		/>
	</div>

	{#if error}
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
			Restaurant created successfully!
		</div>
	{/if}

	<Button type="submit" disabled={loading}>
		{#snippet children()}
			{loading ? 'Creating...' : 'Create Restaurant'}
		{/snippet}
	</Button>
</form>
