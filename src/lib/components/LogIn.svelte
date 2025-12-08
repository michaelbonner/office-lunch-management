<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button/index.js';

	const session = authClient.useSession();
</script>

<div>
	{#if $session.data}
		<div>
			<p>
				{$session.data.user.name}
			</p>
			<Button
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
						provider: 'github'
					})
				).data;
			}}
		>
			Continue with Github
		</Button>
	{/if}
</div>
