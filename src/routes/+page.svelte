<script lang="ts">
	import LogIn from '$lib/components/LogIn.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="prose mx-4 my-8 max-w-3xl lg:mx-auto">
	<h1>Office Lunch Management</h1>
	<p>A tool to help manage office lunches.</p>
	<LogIn isAdmin={data?.isAdmin} isSystemAdmin={data?.isSystemAdmin} />
</div>
