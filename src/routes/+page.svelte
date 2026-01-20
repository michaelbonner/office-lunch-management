<script lang="ts">
	import FeatureCard from '$lib/components/FeatureCard.svelte';
	import LogIn from '$lib/components/LogIn.svelte';
	import MiniCard from '$lib/components/MiniCard.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Office Lunch Management</title>
</svelte:head>

<div
	class="relative overflow-hidden [background:radial-gradient(circle_at_top_left,#fef1d1_0%,#faf7f2_45%,#f3f7f8_100%)]"
>
	<!-- Ambient glow decorations -->
	<div
		class="pointer-events-none absolute -right-[120px] -top-[120px] size-[380px] animate-[float_14s_ease-in-out_infinite] rounded-full opacity-80 blur-[60px] [background:radial-gradient(circle,rgba(247,195,114,0.8),rgba(255,255,255,0))]"
		style="animation: float 14s ease-in-out infinite;"
	></div>
	<div
		class="pointer-events-none absolute -bottom-[120px] -left-[160px] size-[420px] animate-[float_16s_ease-in-out_infinite] rounded-full opacity-80 blur-[60px] [background:radial-gradient(circle,rgba(146,198,197,0.75),rgba(255,255,255,0))]"
		style="animation: float 16s ease-in-out infinite;"
	></div>
	<div
		class="pointer-events-none absolute left-[40%] top-[20%] size-[220px] animate-[pulse_8s_ease-in-out_infinite] rounded-full opacity-40 blur-[60px] [background:radial-gradient(circle,rgba(255,255,255,0.6),rgba(255,255,255,0))]"
		style="animation: pulse 8s ease-in-out infinite;"
	></div>

	<main class="relative mx-auto max-w-6xl px-6 py-16 lg:py-24">
		<section class="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="space-y-6">
				<p class="text-sm font-medium uppercase tracking-wider text-yellow-900/80">
					Office Lunch Management
				</p>
				<h1 class="text-5xl font-extrabold! leading-[1.1]! tracking-tight lg:text-7xl">
					Make lunch coordination feel effortless, even across multiple teams.
				</h1>
				<p class="text-lg text-gray-600">
					Collect opt-ins, organize orders, and keep every organization in sync. Built for busy
					admins who want fewer follow-ups and a smoother Friday lunch.
				</p>
				<div class="flex flex-wrap gap-3">
					<Pill>Opt-in tracking</Pill>
					<Pill>Multi-organization support</Pill>
					<Pill>Admin dashboards</Pill>
					<Pill>API tokens</Pill>
				</div>
			</div>

			<div class="surface border border-gray-950/8">
				<div class="space-y-4">
					<h2 class="mb-1.5 text-[1.6rem] font-semibold">Start coordinating today</h2>
					<p class="leading-relaxed text-[#3f4447]">
						Sign in to manage your lunch preferences, view token access, or jump into admin tools.
					</p>
					<div class="[&_button]:w-full [&_button]:justify-center">
						<LogIn isAdmin={data?.isAdmin} isSystemAdmin={data?.isSystemAdmin} />
					</div>
				</div>
				{#if !data?.isLoggedIn}
					<div class="mt-8 grid gap-4 sm:grid-cols-2">
						<MiniCard
							label="Smart opt-ins"
							description="Users must opt in by date to appear in lunch ordering."
						/>
						<MiniCard
							label="Admin visibility"
							description="See orders across restaurants and export in seconds."
						/>
					</div>
				{/if}
			</div>
		</section>

		<section class="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<FeatureCard
				title="One hub for every organization"
				description="Manage multiple organizations from one account, with clear role-based access."
			/>
			<FeatureCard
				title="Restaurant & order control"
				description="Admins can add restaurants, see all orders, and track user-level details."
			/>
			<FeatureCard
				title="Tokenized API access"
				description="Create API tokens for programmatic opt-ins and integrations."
			/>
			<FeatureCard
				title="Built-in guardrails"
				description="Domain-restricted signup and role checks keep the system tidy."
			/>
			<FeatureCard
				title="Fast scheduling"
				description="Date-based opt-ins keep lunch lists accurate for each day."
			/>
			<FeatureCard
				title="Production-ready stack"
				description="SvelteKit, Better Auth, and Drizzle bring speed and reliability."
			/>
		</section>

		<section class="mt-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
			<div class="surface">
				<h2 class="mb-1.5 text-[1.6rem] font-semibold">How the flow works</h2>
				<ol class="mt-6 space-y-5">
					<li class="flex items-start gap-4">
						<span class="text-[1.1rem] font-bold text-[#9e5b27]">01</span>
						<span class="text-[1.02rem] text-[#3b3f42]"
							>Team members opt in for a specific lunch date.</span
						>
					</li>
					<li class="flex items-start gap-4">
						<span class="text-[1.1rem] font-bold text-[#9e5b27]">02</span>
						<span class="text-[1.02rem] text-[#3b3f42]"
							>Admins collect orders and manage restaurants.</span
						>
					</li>
					<li class="flex items-start gap-4">
						<span class="text-[1.1rem] font-bold text-[#9e5b27]">03</span>
						<span class="text-[1.02rem] text-[#3b3f42]"
							>Export or share order lists with zero back-and-forth.</span
						>
					</li>
				</ol>
			</div>

			<div class="grid gap-6">
				<div class="surface p-8">
					<h2 class="mb-1.5 text-[1.6rem] font-semibold">Designed for admins</h2>
					<p class="leading-relaxed text-[#3f4447]">
						Admin views highlight who opted in, who ordered, and which organization they belong to.
					</p>
				</div>
				<div class="surface p-8">
					<h2 class="mb-1.5 text-[1.6rem] font-semibold">Simple for employees</h2>
					<p class="leading-relaxed text-[#3f4447]">
						One tap to opt in, one place to store a standing order, and no extra emails.
					</p>
				</div>
			</div>
		</section>

		<section class="surface mt-20 bg-[rgba(20,32,30,0.85)] text-[#f8f4ee]">
			<h2 class="mb-1.5 text-[1.6rem] font-semibold">Everything you need for lunch day</h2>
			<div class="mt-6 grid gap-4 md:grid-cols-3">
				<div>
					<p class="mb-1.5 text-[0.85rem] uppercase tracking-[0.2em]">Roles</p>
					<p class="text-[rgba(248,244,238,0.8)]">
						Owner, admin, and member permissions per organization.
					</p>
				</div>
				<div>
					<p class="mb-1.5 text-[0.85rem] uppercase tracking-[0.2em]">Integrations</p>
					<p class="text-[rgba(248,244,238,0.8)]">
						API tokens with expiration and last-used tracking.
					</p>
				</div>
				<div>
					<p class="mb-1.5 text-[0.85rem] uppercase tracking-[0.2em]">Confidence</p>
					<p class="text-[rgba(248,244,238,0.8)]">
						Explicit opt-in keeps lists accurate and auditable.
					</p>
				</div>
			</div>
		</section>
	</main>
</div>

<style>
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(20px);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.4;
		}
		50% {
			transform: scale(1.1);
			opacity: 0.7;
		}
	}
</style>
