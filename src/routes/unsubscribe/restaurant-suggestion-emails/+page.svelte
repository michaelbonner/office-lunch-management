<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Restaurant Suggestion Emails – Office Lunch Management</title>
</svelte:head>

<div
	class="relative overflow-hidden [background:radial-gradient(circle_at_top_left,#fef1d1_0%,#faf7f2_45%,#f3f7f8_100%)]"
>
	<main class="relative mx-auto max-w-2xl px-6 py-16 lg:py-24">
		<div class="surface border border-gray-950/8 text-center">
			{#if data.status === 'success'}
				<p class="text-2xl">✓</p>
				<h1 class="mt-2 text-2xl font-semibold">Emails disabled</h1>
				<p class="mt-3 text-gray-600">
					You will no longer receive restaurant suggestion emails
					{data.organizationName ? ` for ${data.organizationName}` : ''}.
				</p>
			{:else if data.status === 'already_unsubscribed'}
				<p class="text-2xl">✓</p>
				<h1 class="mt-2 text-2xl font-semibold">Already unsubscribed</h1>
				<p class="mt-3 text-gray-600">
					Restaurant suggestion emails were already disabled
					{data.organizationName ? ` for ${data.organizationName}` : ''}.
				</p>
			{:else}
				<p class="text-2xl">!</p>
				<h1 class="mt-2 text-2xl font-semibold">Link unavailable</h1>
				<p class="mt-3 text-gray-600">This unsubscribe link is invalid or has expired.</p>
			{/if}

			<a
				href={resolve('/')}
				class="mt-6 inline-block rounded-xl bg-[#9e5b27] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7d4820]"
			>
				Back to home
			</a>
		</div>
	</main>
</div>
