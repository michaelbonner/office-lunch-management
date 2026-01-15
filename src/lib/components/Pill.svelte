<script lang="ts">
	let { children }: { children: any } = $props();
</script>

<span
	class="inline-block rounded-full border border-gray-950/12 bg-white/60 px-3 py-1.5 text-[0.85rem]"
>
	{@render children()}
</span>
