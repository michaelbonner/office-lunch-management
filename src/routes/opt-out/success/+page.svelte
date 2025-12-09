<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { page } from '$app/stores';
	import { Check } from '@lucide/svelte';

	const action = $page.url.searchParams.get('action');
	const isOptOut = action === 'out';
</script>

<div class="container mx-auto max-w-2xl px-4 py-16">
	<div class="rounded-lg border bg-card p-8 text-center">
		<div class="mb-4 flex justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
				<Check class="h-8 w-8 text-primary" />
			</div>
		</div>

		<h1 class="mb-2 text-2xl font-bold">
			{isOptOut ? 'Opted Out Successfully' : 'Opted Back In Successfully'}
		</h1>

		<p class="mb-6 text-muted-foreground">
			{#if isOptOut}
				You have been opted out of lunch for today. You will not appear in the ordering list.
			{:else}
				You have been opted back in for lunch today. You will appear in the ordering list.
			{/if}
		</p>

		{#if isOptOut}
			<p>
				If this was a mistake, you can opt back in by clicking the button below.
				<Button variant="outline" href="/api/opt-out?action=in">Opt Back In</Button>
			</p>
		{/if}

		<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
			<Button href="/orders">View My Orders</Button>
			<Button variant="outline" href="/">Back to Home</Button>
		</div>
	</div>
</div>
