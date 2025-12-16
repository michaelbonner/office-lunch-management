<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';

	let { isAdmin = false, isSystemAdmin = false }: { isAdmin?: boolean; isSystemAdmin?: boolean } =
		$props();

	const session = authClient.useSession();
</script>

<div>
	{#if $session.data}
		<div class="space-y-3">
			<div>
				<Button variant="link" href="/orders" size="lg">My Lunch Order Preferences</Button>
				{#if isAdmin}
					<Button variant="link" href="/admin" size="lg">Admin Dashboard</Button>
				{/if}
				{#if isSystemAdmin}
					<Button variant="link" href="/admin/organizations" size="lg"
						>All Organizations & Members</Button
					>
				{/if}
			</div>
			<Button
				variant="outline"
				onclick={async () => {
					try {
						await authClient.signOut();
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : 'Unknown error';
						toast.error(`Error signing out: ${errorMessage}`);
					}
				}}
			>
				Sign Out
			</Button>
		</div>
	{:else}
		<Button
			class="cursor-pointer"
			onclick={async () => {
				try {
					return (
						await authClient.signIn.social({
							provider: 'google'
						})
					).data;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					toast.error(`Error signing in with Google: ${errorMessage}`);
				}
			}}
		>
			Continue with Google
		</Button>
	{/if}
</div>
