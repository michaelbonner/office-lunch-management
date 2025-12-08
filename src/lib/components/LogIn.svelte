<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';

	let { isAdmin = false }: { isAdmin?: boolean } = $props();

	const session = authClient.useSession();
</script>

<div>
	{#if $session.data}
		<div class="space-y-3">
			<div>
				<Button variant="link" href="/orders" size="lg">My Orders</Button>
				{#if isAdmin}
					<Button variant="link" href="/admin" size="lg">Admin Dashboard</Button>
				{/if}
			</div>
			<Button
				variant="outline"
				onclick={async () => {
					await authClient.signOut();
				}}
			>
				Sign Out
			</Button>
		</div>
	{:else}
		<Button
			class="cursor-pointer"
			onclick={async () => {
				return (
					await authClient.signIn.social({
						provider: 'google'
					})
				).data;
			}}
		>
			Continue with Google
		</Button>
	{/if}
</div>
