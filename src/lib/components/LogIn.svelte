<script lang="ts">
	import { authClient } from '$lib/auth-client';

	const session = authClient.useSession();
</script>

<div>
	{#if $session.data}
		<div>
			<p>
				{$session.data.user.name}
			</p>
			<button
				on:click={async () => {
					await authClient.signOut();
				}}
			>
				Sign Out
			</button>
		</div>
	{:else}
		<button
			class="cursor-pointer"
			on:click={async () => {
				const data = await authClient.signIn.social({
					provider: 'github'
				});
			}}
		>
			Continue with Github
		</button>
	{/if}
</div>
