<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { authClient } from '$lib/auth-client';

	let {
		isAdmin = false,
		isSystemAdmin = false
	}: {
		isAdmin?: boolean;
		isSystemAdmin?: boolean;
	} = $props();

	const session = authClient.useSession();

	let mobileOpen = $state(false);

	async function signOut() {
		try {
			await authClient.signOut();
			mobileOpen = false;
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Unknown error';
			toast.error(`Error signing out: ${msg}`);
		}
	}
</script>

<header
	class="sticky top-0 z-50 border-b border-gray-950/8 bg-[rgba(250,247,242,0.85)] backdrop-blur-md"
>
	<div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 font-semibold text-[#141d1e]">
			<span class="text-[#9e5b27]">🥪</span>
			<span class="hidden sm:inline">Office Lunch</span>
		</a>

		<!-- Desktop nav -->
		<nav class="hidden items-center gap-1 md:flex">
			<a
				href="/pricing"
				class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#141d1e]"
				>Pricing</a
			>
			<a
				href="/contact"
				class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#141d1e]"
				>Contact</a
			>

			{#if $session.data}
				<span class="mx-1 h-4 w-px bg-gray-200"></span>
				<a
					href="/orders"
					class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#141d1e]"
					>My Order</a
				>
				<a
					href="/tokens"
					class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#141d1e]"
					>API Tokens</a
				>
				{#if isAdmin}
					<a
						href="/admin"
						class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#141d1e]"
						>Admin</a
					>
				{/if}
				{#if isSystemAdmin}
					<a
						href="/admin/organizations"
						class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#141d1e]"
						>Organizations</a
					>
				{/if}
			{/if}
		</nav>

		<!-- Desktop auth -->
		<div class="hidden items-center gap-3 md:flex">
			{#if $session.data}
				<span class="max-w-[140px] truncate text-sm text-gray-500">{$session.data.user.name}</span>
				<button
					onclick={signOut}
					class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
				>
					Sign out
				</button>
			{:else}
				<a
					href="/sign-in"
					class="rounded-lg bg-[#9e5b27] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#7d4820]"
				>
					Sign in
				</a>
			{/if}
		</div>

		<!-- Mobile hamburger -->
		<button
			onclick={() => (mobileOpen = !mobileOpen)}
			aria-label="Toggle menu"
			class="flex size-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
		>
			{#if mobileOpen}
				<svg
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<line x1="2" y1="2" x2="16" y2="16" /><line x1="16" y1="2" x2="2" y2="16" />
				</svg>
			{:else}
				<svg
					width="18"
					height="18"
					viewBox="0 0 18 18"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<line x1="2" y1="4" x2="16" y2="4" /><line x1="2" y1="9" x2="16" y2="9" /><line
						x1="2"
						y1="14"
						x2="16"
						y2="14"
					/>
				</svg>
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileOpen}
		<div class="border-t border-gray-950/8 bg-[rgba(250,247,242,0.97)] px-6 py-4 md:hidden">
			<nav class="flex flex-col gap-1">
				<a
					onclick={() => (mobileOpen = false)}
					href="/pricing"
					class="rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
					>Pricing</a
				>
				<a
					onclick={() => (mobileOpen = false)}
					href="/contact"
					class="rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
					>Contact</a
				>

				{#if $session.data}
					<hr class="my-2 border-gray-100" />
					<a
						onclick={() => (mobileOpen = false)}
						href="/orders"
						class="rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
						>My Order</a
					>
					<a
						onclick={() => (mobileOpen = false)}
						href="/tokens"
						class="rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
						>API Tokens</a
					>
					{#if isAdmin}
						<a
							onclick={() => (mobileOpen = false)}
							href="/admin"
							class="rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
							>Admin</a
						>
					{/if}
					{#if isSystemAdmin}
						<a
							onclick={() => (mobileOpen = false)}
							href="/admin/organizations"
							class="rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
							>Organizations</a
						>
					{/if}
					<hr class="my-2 border-gray-100" />
					<div class="flex items-center justify-between px-3 py-1">
						<span class="truncate text-sm text-gray-500">{$session.data.user.name}</span>
						<button onclick={signOut} class="text-sm font-medium text-[#9e5b27] hover:underline">
							Sign out
						</button>
					</div>
				{:else}
					<hr class="my-2 border-gray-100" />
					<a
						onclick={() => (mobileOpen = false)}
						href="/sign-in"
						class="rounded-lg bg-[#9e5b27] px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[#7d4820]"
					>
						Sign in
					</a>
				{/if}
			</nav>
		</div>
	{/if}
</header>
