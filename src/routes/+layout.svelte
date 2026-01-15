<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import '../app.css';
	import './layout.css';
	import '@fontsource-variable/inter/wght.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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
