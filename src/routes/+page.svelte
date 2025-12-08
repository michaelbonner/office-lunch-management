<script lang="ts">
	import LogIn from '$lib/components/LogIn.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="prose m-8 mx-auto max-w-3xl">
	<h1>Office Lunch Management</h1>
	<p>A tool to help manage office lunches.</p>
	<LogIn isAdmin={data.isAdmin} />
</div>
