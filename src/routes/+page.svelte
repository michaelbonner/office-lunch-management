<script lang="ts">
	import LogIn from '$lib/components/LogIn.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Office Lunch Management</title>
</svelte:head>

<div class="landing relative overflow-hidden">
	<div class="ambient glow-one"></div>
	<div class="ambient glow-two"></div>
	<div class="ambient glow-grid"></div>

	<main class="relative mx-auto max-w-6xl px-6 py-16 lg:py-24">
		<section class="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
			<div class="space-y-6">
				<p class="text-sm uppercase tracking-wider font-medium text-yellow-900/80">
					Office Lunch Management
				</p>
				<h1 class="text-5xl lg:text-7xl font-extrabold! leading-tighter! tracking-tight">
					Make lunch coordination feel effortless, even across multiple teams.
				</h1>
				<p class="text-lg text-gray-600">
					Collect opt-ins, organize orders, and keep every organization in sync. Built for busy
					admins who want fewer follow-ups and a smoother Friday lunch.
				</p>
				<div class="flex flex-wrap gap-3">
					<span class="pill">Opt-in tracking</span>
					<span class="pill">Multi-organization support</span>
					<span class="pill">Admin dashboards</span>
					<span class="pill">API tokens</span>
				</div>
			</div>

			<div class="card surface">
				<div class="space-y-4">
					<h2 class="card-title">Start coordinating today</h2>
					<p class="card-copy">
						Sign in to manage your lunch preferences, view token access, or jump into admin tools.
					</p>
					<div class="card-actions">
						<LogIn isAdmin={data?.isAdmin} isSystemAdmin={data?.isSystemAdmin} />
					</div>
				</div>
				<div class="mt-8 grid gap-4 sm:grid-cols-2">
					<div class="mini-card">
						<p class="mini-label">Smart opt-ins</p>
						<p class="mini-copy">Users must opt in by date to appear in lunch ordering.</p>
					</div>
					<div class="mini-card">
						<p class="mini-label">Admin visibility</p>
						<p class="mini-copy">See orders across restaurants and export in seconds.</p>
					</div>
				</div>
			</div>
		</section>

		<section class="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div class="feature-card">
				<h3>One hub for every organization</h3>
				<p>Manage multiple organizations from one account, with clear role-based access.</p>
			</div>
			<div class="feature-card">
				<h3>Restaurant & order control</h3>
				<p>Admins can add restaurants, see all orders, and track user-level details.</p>
			</div>
			<div class="feature-card">
				<h3>Tokenized API access</h3>
				<p>Create API tokens for programmatic opt-ins and integrations.</p>
			</div>
			<div class="feature-card">
				<h3>Built-in guardrails</h3>
				<p>Domain-restricted signup and role checks keep the system tidy.</p>
			</div>
			<div class="feature-card">
				<h3>Fast scheduling</h3>
				<p>Date-based opt-ins keep lunch lists accurate for each day.</p>
			</div>
			<div class="feature-card">
				<h3>Production-ready stack</h3>
				<p>SvelteKit, Better Auth, and Drizzle bring speed and reliability.</p>
			</div>
		</section>

		<section class="mt-20 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
			<div class="surface steps">
				<h2 class="card-title">How the flow works</h2>
				<ol class="mt-6 space-y-5">
					<li>
						<span class="step-num">01</span>
						<span class="step-copy">Team members opt in for a specific lunch date.</span>
					</li>
					<li>
						<span class="step-num">02</span>
						<span class="step-copy">Admins collect orders and manage restaurants.</span>
					</li>
					<li>
						<span class="step-num">03</span>
						<span class="step-copy">Export or share order lists with zero back-and-forth.</span>
					</li>
				</ol>
			</div>

			<div class="grid gap-6">
				<div class="surface highlight">
					<h2 class="card-title">Designed for admins</h2>
					<p class="card-copy">
						Admin views highlight who opted in, who ordered, and which organization they belong to.
					</p>
				</div>
				<div class="surface highlight">
					<h2 class="card-title">Simple for employees</h2>
					<p class="card-copy">
						One tap to opt in, one place to store a standing order, and no extra emails.
					</p>
				</div>
			</div>
		</section>

		<section class="mt-20 surface summary">
			<h2 class="card-title">Everything you need for lunch day</h2>
			<div class="mt-6 grid gap-4 md:grid-cols-3">
				<div>
					<p class="summary-label">Roles</p>
					<p class="summary-copy">Owner, admin, and member permissions per organization.</p>
				</div>
				<div>
					<p class="summary-label">Integrations</p>
					<p class="summary-copy">API tokens with expiration and last-used tracking.</p>
				</div>
				<div>
					<p class="summary-label">Confidence</p>
					<p class="summary-copy">Explicit opt-in keeps lists accurate and auditable.</p>
				</div>
			</div>
		</section>
	</main>
</div>

<style>
	.landing {
		background: radial-gradient(circle at top left, #fef1d1 0%, #faf7f2 45%, #f3f7f8 100%);
	}

	.card {
		border: 1px solid rgba(55, 62, 65, 0.08);
	}

	.card-title {
		font-size: 1.6rem;
		font-weight: 600;
		margin-bottom: 0.4rem;
	}

	.card-copy {
		color: #3f4447;
		line-height: 1.6;
	}

	.card-actions :global(button) {
		width: 100%;
		justify-content: center;
	}

	.pill {
		border: 1px solid rgba(47, 52, 56, 0.12);
		padding: 0.4rem 0.8rem;
		border-radius: 999px;
		font-size: 0.85rem;
		background: rgba(255, 255, 255, 0.6);
	}

	.feature-card {
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.55);
		padding: 1.6rem;
		border: 1px solid rgba(30, 30, 30, 0.08);
		box-shadow: 0 12px 30px rgba(35, 35, 35, 0.06);
	}

	.feature-card h3 {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
	}

	.feature-card p {
		color: #3f4447;
	}

	.mini-card {
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.85);
		padding: 1.2rem;
		border: 1px solid rgba(33, 33, 33, 0.08);
	}

	.mini-label {
		font-weight: 600;
		margin-bottom: 0.3rem;
	}

	.mini-copy {
		color: #4b5053;
		font-size: 0.95rem;
	}

	.steps li {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.step-num {
		font-size: 1.1rem;
		font-weight: 700;
		color: #9e5b27;
	}

	.step-copy {
		color: #3b3f42;
		font-size: 1.02rem;
	}

	.highlight {
		padding: 2rem;
	}

	.summary {
		background: rgba(20, 32, 30, 0.85);
		color: #f8f4ee;
	}

	.summary .summary-label {
		font-size: 0.85rem;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		margin-bottom: 0.4rem;
	}

	.summary .summary-copy {
		font-size: 1rem;
		color: rgba(248, 244, 238, 0.8);
	}

	.ambient {
		position: absolute;
		border-radius: 999px;
		filter: blur(60px);
		opacity: 0.8;
		pointer-events: none;
	}

	.glow-one {
		top: -120px;
		right: -120px;
		width: 380px;
		height: 380px;
		background: radial-gradient(circle, rgba(247, 195, 114, 0.8), rgba(255, 255, 255, 0));
		animation: float 14s ease-in-out infinite;
	}

	.glow-two {
		bottom: -120px;
		left: -160px;
		width: 420px;
		height: 420px;
		background: radial-gradient(circle, rgba(146, 198, 197, 0.75), rgba(255, 255, 255, 0));
		animation: float 16s ease-in-out infinite;
	}

	.glow-grid {
		top: 20%;
		left: 40%;
		width: 220px;
		height: 220px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0));
		opacity: 0.4;
		animation: pulse 8s ease-in-out infinite;
	}

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

	@media (prefers-reduced-motion: reduce) {
		.glow-one,
		.glow-two,
		.glow-grid {
			animation: none;
		}
	}
</style>
