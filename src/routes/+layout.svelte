<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import '../app.css';
	import './layout.css';
	import '@fontsource-variable/inter/wght.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster />

{@render children?.()}

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
