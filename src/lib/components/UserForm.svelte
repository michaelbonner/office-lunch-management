<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';

	interface Props {
		onSuccess?: () => void;
	}

	let { onSuccess }: Props = $props();

	let name = $state('');
	let email = $state('');
	let role = $state<'member' | 'admin'>('member');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		success = false;

		try {
			const response = await fetch('/api/admin/users', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email, role })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create user');
			}

			success = true;
			name = '';
			email = '';
			role = 'member';

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
	<div>
		<label for="name" class="mb-1.5 block text-sm font-medium"> Name </label>
		<input
			id="name"
			type="text"
			bind:value={name}
			required
			disabled={loading}
			class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
			placeholder="Enter user's full name"
		/>
	</div>

	<div>
		<label for="email" class="mb-1.5 block text-sm font-medium"> Email </label>
		<input
			id="email"
			type="email"
			bind:value={email}
			required
			disabled={loading}
			class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
			placeholder="user@example.com"
		/>
		<p class="mt-1 text-xs text-muted-foreground">User will log in using OAuth</p>
	</div>

	<div>
		<label for="role" class="mb-1.5 block text-sm font-medium"> Role </label>
		<select
			id="role"
			bind:value={role}
			disabled={loading}
			class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
		>
			<option value="member">Member</option>
			<option value="admin">Admin</option>
		</select>
	</div>

	{#if error}
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
	{/if}

	{#if success}
		<div class="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
			User created successfully!
		</div>
	{/if}

	<Button type="submit" disabled={loading}>
		{#snippet children()}
			{loading ? 'Creating...' : 'Create User'}
		{/snippet}
	</Button>
</form>
