<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import Logo from './Logo.svelte';

	let {
		user = null,
		isAdmin = false,
		isSystemAdmin = false
	}: {
		user?: { name: string | null; email: string } | null;
		isAdmin?: boolean;
		isSystemAdmin?: boolean;
	} = $props();

	const session = authClient.useSession();

	// Prefer server-rendered user prop to avoid SSR flash; fall back to live session
	const isLoggedIn = $derived(user !== null || !!$session.data);
	const displayName = $derived(
		$session.data?.user.name || $session.data?.user.email || user?.name || user?.email || ''
	);

	const navLinks = $derived([
		...(!isLoggedIn ? [{ href: '/pricing', label: 'Pricing' }] : []),
		{ href: '/contact', label: 'Contact' },
		...(isLoggedIn
			? [
					{ href: '/vote', label: 'Vote' },
					{ href: '/orders', label: 'My Order' },
					{ href: '/tokens', label: 'API Tokens' },
					...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
					...(isSystemAdmin ? [{ href: '/admin/organizations', label: 'Organizations' }] : [])
				]
			: [])
	]);

	let mobileOpen = $state(false);

	// Close mobile menu on any navigation
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		page.url.pathname;
		mobileOpen = false;
	});

	async function signOut() {
		try {
			await authClient.signOut();
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
			<Logo size={28} />
			<span>OfficeLunch</span>
		</a>

		<!-- Desktop nav -->
		<nav aria-label="Main" class="hidden items-center gap-1 md:flex">
			{#each navLinks as link (link.href)}
				<a
					href={link.href}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}
					class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-[#141d1e] aria-[current=page]:bg-[#9e5b27]/10 aria-[current=page]:font-medium aria-[current=page]:text-[#9e5b27]"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<!-- Desktop auth -->
		<div class="hidden items-center gap-3 md:flex">
			{#if isLoggedIn}
				<span class="max-w-[140px] truncate text-sm text-gray-500">{displayName}</span>
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
			aria-expanded={mobileOpen}
			aria-controls="mobile-menu"
			class="flex size-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
		>
			{#if mobileOpen}
				<svg
					aria-hidden="true"
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
					aria-hidden="true"
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
		<div
			id="mobile-menu"
			class="border-t border-gray-950/8 bg-[rgba(250,247,242,0.97)] px-6 py-4 md:hidden"
		>
			<nav aria-label="Mobile" class="flex flex-col gap-1">
				{#each navLinks as link (link.href)}
					<a
						href={link.href}
						aria-current={page.url.pathname === link.href ? 'page' : undefined}
						class="rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 aria-[current=page]:bg-[#9e5b27]/10 aria-[current=page]:font-medium aria-[current=page]:text-[#9e5b27]"
					>
						{link.label}
					</a>
				{/each}

				<hr class="my-2 border-gray-100" />

				{#if isLoggedIn}
					<div class="flex items-center justify-between px-3 py-1">
						<span class="truncate text-sm text-gray-500">{displayName}</span>
						<button onclick={signOut} class="text-sm font-medium text-[#9e5b27] hover:underline">
							Sign out
						</button>
					</div>
				{:else}
					<a
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
