<script lang="ts">
	let { label, description }: { label: string; description: string } = $props();
</script>

<div class="rounded-[18px] border border-gray-950/8 bg-white/85 p-5">
	<p class="mb-1 font-semibold">{label}</p>
	<p class="text-[0.95rem] text-[#4b5053]">{description}</p>
</div>
