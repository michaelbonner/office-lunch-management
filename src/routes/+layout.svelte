<script lang="ts">
	import '@fontsource-variable/inter/wght.css';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import Header from '$lib/components/Header.svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import '../app.css';
	import type { LayoutData } from './$types';
	import './layout.css';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const canonicalBase = 'https://officelunch.app';
</script>

<svelte:head>
	<link rel="canonical" href="{canonicalBase}{page.url.pathname}" />
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<script
		async
		src="https://easycustomerfeedback.com/widget/2b3bd5a9efa34975991466c1a1fffeda/embed"
		data-label="Send feedback"
		data-position="right"
		data-color="#b87745"
		data-name={data.user?.name ?? undefined}
		data-email={data.user?.email ?? undefined}
		data-user-id={data.user?.id ?? undefined}
	></script>
</svelte:head>

<Toaster />

<Header isAdmin={data.isAdmin} isSystemAdmin={data.isSystemAdmin} />

<main class="flex-1">
	{@render children?.()}
</main>

<footer class="border-t border-gray-950/8 bg-[#141d1e] px-6 py-10 text-[rgba(248,244,238,0.6)]">
	<div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
		<div class="text-sm">
			<p class="font-semibold text-[#f8f4ee]">Office Lunch Management</p>
			<p class="mt-1">$5/month · Unlimited everything</p>
		</div>
		<nav class="flex flex-wrap justify-center gap-6 text-sm">
			<a href="/" class="transition-colors hover:text-[#f8f4ee]">Home</a>
			<a href="/pricing" class="transition-colors hover:text-[#f8f4ee]">Pricing</a>
			<a href="/contact" class="transition-colors hover:text-[#f8f4ee]">Contact</a>
			<a href="/sign-in" class="transition-colors hover:text-[#f8f4ee]">Sign in</a>
		</nav>
		<p class="text-xs">© {new Date().getFullYear()} Office Lunch Management</p>
	</div>
</footer>

<style>
	:global(body) {
		font-family: 'Inter Variable', sans-serif;
		margin: 0;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background: radial-gradient(circle at top left, #fef1d1 0%, #faf7f2 45%, #f3f7f8 100%);
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Inter Variable', sans-serif;
		font-weight: 600;
	}
</style>
