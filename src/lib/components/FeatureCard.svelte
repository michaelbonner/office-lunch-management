<script lang="ts">
	let { title, description }: { title: string; description: string } = $props();
</script>

<div
	class="rounded-[20px] border border-gray-950/8 bg-white/55 px-6 py-6 shadow-[0_12px_30px_rgba(35,35,35,0.06)]"
>
	<h3 class="mb-2 text-xl">{title}</h3>
	<p class="text-[#3f4447]">{description}</p>
</div>
