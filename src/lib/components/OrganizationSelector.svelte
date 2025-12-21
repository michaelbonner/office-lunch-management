<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	interface Props {
		organizations: Array<{ id: string; name: string; slug: string; role: string }>;
		activeOrganizationId?: string;
	}

	let { organizations, activeOrganizationId }: Props = $props();

	let switching = $state(false);
	let error = $state('');

	async function switchOrganization(organizationId: string) {
		if (organizationId === activeOrganizationId) return;

		switching = true;
		error = '';

		try {
			const response = await fetch('/api/organization/switch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ organizationId })
			});

			if (!response.ok) {
				throw new Error('Failed to switch organization');
			}

			// Invalidate all data to refetch with new organization context
			await invalidateAll();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to switch organization';
		} finally {
			switching = false;
		}
	}

	// Only show if user has multiple organizations
	let shouldShow = $derived(organizations.length > 1);
</script>

{#if shouldShow}
	<div class="flex items-center gap-2">
		<label for="org-selector" class="text-sm font-medium text-muted-foreground">
			Organization:
		</label>
		<select
			id="org-selector"
			disabled={switching}
			value={activeOrganizationId}
			onchange={(e) => switchOrganization(e.currentTarget.value)}
			class="rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
		>
			{#each organizations as org (org.id)}
				<option value={org.id}>
					{org.name} ({org.role})
				</option>
			{/each}
		</select>
	</div>

	{#if error}
		<div class="text-sm text-destructive">
			{error}
		</div>
	{/if}
{/if}
