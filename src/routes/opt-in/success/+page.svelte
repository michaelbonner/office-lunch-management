<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import { Check } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const action = $page.url.searchParams.get('action');
	const isOptIn = action === 'in';
</script>

<div class="container mx-auto max-w-2xl px-4 py-16">
	<div
		class="rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm p-8 text-center"
	>
		<div class="mb-4 flex justify-center">
			<div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
				<Check class="h-8 w-8 text-primary" />
			</div>
		</div>

		<h1 class="mb-2 text-2xl font-bold">
			{isOptIn ? 'Opted In Successfully' : 'Opted Out Successfully'}
		</h1>

		<p class="mb-6 text-muted-foreground">
			{#if isOptIn}
				You have opted in for lunch today. You will appear in the ordering list and can place your
				order.
			{:else}
				You have opted out of lunch for today. You will not appear in the ordering list.
			{/if}
		</p>

		{#if isOptIn && data.optInTime}
			<p class="text-sm text-muted-foreground">
				You first opted in at <span class="font-medium text-foreground">{data.optInTime}</span>.
			</p>
		{/if}

		<div class="my-8 flex flex-col gap-2">
			{#if isOptIn}
				<p>If you need to opt out, you can do so by clicking the button below.</p>
				<p>
					<Button variant="outline" href="/api/opt-in?action=out">Opt Out</Button>
				</p>
			{:else}
				<p>If this was a mistake, you can opt back in by clicking the button below.</p>
				<p>
					<Button variant="outline" href="/api/opt-in?action=in">Opt Back In</Button>
				</p>
			{/if}
		</div>

		<div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
			<Button href="/orders">View My Order Preferences</Button>
			<Button variant="outline" href="/">Back to Home</Button>
		</div>
	</div>
</div>
