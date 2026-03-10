<script lang="ts">
	let { size = 28 }: { size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 32 32"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
	role="img"
>
	<!-- Box body -->
	<path d="M6 12L26 12L24 26L8 26Z" fill="#F4E6D0" stroke="#8A5A3C" stroke-width="1.2" />

	<!-- Front fold line -->
	<path d="M16 12L16 26" stroke="#D4BDA3" stroke-width="0.8" />

	<!-- Top flaps -->
	<path d="M6 12L11 7L21 7L26 12" fill="#FFF6E9" stroke="#8A5A3C" stroke-width="1.2" />

	<!-- Flap creases -->
	<path d="M11 7L16 12" stroke="#D4BDA3" stroke-width="0.8" />
	<path d="M21 7L16 12" stroke="#D4BDA3" stroke-width="0.8" />

	<!-- Metal handle -->
	<path d="M11 17C11 14 21 14 21 17" stroke="#6E6E6E" stroke-width="1.2" fill="none" />
	<circle cx="11" cy="17" r="0.7" fill="#6E6E6E" />
	<circle cx="21" cy="17" r="0.7" fill="#6E6E6E" />

	<!-- Chopsticks -->
	<path d="M12 6L13 5L25 13L24 14Z" fill="#B76E3A" stroke="#8A5A3C" stroke-width="0.5" />
	<path d="M14 6L15 5L27 13L26 14Z" fill="#C98347" stroke="#8A5A3C" stroke-width="0.5" />
</svg>
