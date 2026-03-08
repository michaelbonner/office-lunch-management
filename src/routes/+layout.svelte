<script lang="ts">
	import '@fontsource-variable/inter/wght.css';
	import type { Snippet } from 'svelte';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import '../app.css';
	import type { LayoutData } from './$types';
	import './layout.css';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<script
		async
		src="https://easycustomerfeedback.com/widget/921a77faad114c21a5ae2766a541cb87/embed"
		data-label="Send feedback"
		data-position="right"
		data-color="#b87745"
		data-name={data.user?.name ?? undefined}
		data-email={data.user?.email ?? undefined}
		data-user-id={data.user?.id ?? undefined}
	></script>
</svelte:head>

<Toaster />

<main
	class="min-h-screen [background:radial-gradient(circle_at_top_left,#fef1d1_0%,#faf7f2_45%,#f3f7f8_100%)]"
>
	{@render children?.()}
</main>

<style>
	:global(body) {
		font-family: 'Inter Variable', sans-serif;
		margin: 0;
	}

	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Inter Variable', sans-serif;
		font-weight: 600;
	}
</style>
