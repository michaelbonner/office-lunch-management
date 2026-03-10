<svelte:head>
	<title>Pricing – Office Lunch Management</title>
	<meta
		name="description"
		content="Simple, flat pricing. $5/month for unlimited users, restaurants, orders, and opt-ins."
	/>
</svelte:head>

<div
	class="relative overflow-hidden [background:radial-gradient(circle_at_top_left,#fef1d1_0%,#faf7f2_45%,#f3f7f8_100%)]"
>
	<!-- Ambient glow decorations -->
	<div
		class="pointer-events-none absolute -right-[120px] -top-[120px] size-[380px] rounded-full opacity-80 blur-[60px] [background:radial-gradient(circle,rgba(247,195,114,0.8),rgba(255,255,255,0))]"
		style="animation: float 14s ease-in-out infinite;"
	></div>
	<div
		class="pointer-events-none absolute -bottom-[120px] -left-[160px] size-[420px] rounded-full opacity-80 blur-[60px] [background:radial-gradient(circle,rgba(146,198,197,0.75),rgba(255,255,255,0))]"
		style="animation: float 16s ease-in-out infinite;"
	></div>

	<main class="relative mx-auto max-w-4xl px-6 py-16 lg:py-24">
		<!-- Header -->
		<section class="text-center">
			<p class="text-sm font-medium uppercase tracking-wider text-yellow-900/80">Pricing</p>
			<h1 class="mt-3 text-5xl font-extrabold! leading-[1.1]! tracking-tight lg:text-6xl">
				One plan. Everything included.
			</h1>
			<p class="mx-auto mt-5 max-w-xl text-lg text-gray-600">
				No per-seat fees. No tier confusion. Just a flat monthly rate so your whole office can
				coordinate lunch without restrictions.
			</p>
		</section>

		<!-- Pricing card -->
		<section class="mt-14 flex justify-center">
			<div
				class="surface w-full max-w-md border border-gray-950/8 text-center shadow-[0_20px_60px_rgba(35,35,35,0.10)]"
			>
				<p class="text-sm font-medium uppercase tracking-widest text-yellow-900/70">Team Plan</p>

				<div class="mt-5 flex items-end justify-center gap-1">
					<span class="text-6xl font-extrabold tracking-tight">$5</span>
					<span class="mb-2 text-xl text-gray-500">/month</span>
				</div>

				<p class="mt-3 text-[#3f4447]">Everything you need to run office lunch, forever flat.</p>

				<ul class="mt-8 space-y-3 text-left">
					{#each ['Unlimited users', 'Unlimited restaurants', 'Unlimited orders', 'Unlimited opt-ins', 'Multi-organization support', 'Role-based access (owner, admin, member)', 'API token access', 'Admin dashboards & order views'] as feature (feature)}
						<li class="flex items-center gap-3">
							<span
								class="flex size-5 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-[0.7rem] font-bold text-[#9e5b27]"
								>✓</span
							>
							<span class="text-[#3b3f42]">{feature}</span>
						</li>
					{/each}
				</ul>

				<a
					href="/sign-in"
					class="mt-10 block rounded-xl bg-[#9e5b27] px-6 py-3.5 text-center text-[0.95rem] font-semibold text-white transition-colors hover:bg-[#7d4820]"
				>
					Get started
				</a>

				<p class="mt-4 text-xs text-gray-500">No contracts. Cancel anytime.</p>
			</div>
		</section>

		<!-- FAQ / reassurance section -->
		<section class="mt-20">
			<h2 class="text-center text-3xl font-bold tracking-tight">Common questions</h2>
			<div class="mt-10 grid gap-6 sm:grid-cols-2">
				{#each [{ q: 'What counts as a user?', a: "Anyone with an account in your organization. Invite as many teammates as you need — there's no per-seat charge." }, { q: 'Can I manage multiple organizations?', a: 'Yes. One subscription covers all the organizations tied to your account, with full role-based access for each.' }, { q: 'Is there a free trial?', a: "Sign up and start using the app immediately. Billing begins when you're ready to keep going." }, { q: 'Can I cancel at any time?', a: "Absolutely. No contracts, no lock-in. Cancel from your account settings and you won't be charged again." }] as item (item.q)}
					<div
						class="rounded-[20px] border border-gray-950/8 bg-white/55 px-6 py-6 shadow-[0_12px_30px_rgba(35,35,35,0.06)]"
					>
						<h3 class="mb-2 font-semibold text-[#141d1e]">{item.q}</h3>
						<p class="text-[#3f4447]">{item.a}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- Bottom CTA -->
		<section class="surface mt-20 bg-[rgba(20,32,30,0.85)] text-center text-[#f8f4ee]">
			<h2 class="text-2xl font-semibold">Ready to simplify office lunch?</h2>
			<p class="mt-3 text-[rgba(248,244,238,0.75)]">
				Get your whole team set up in minutes. $5/month, no surprises.
			</p>
			<a
				href="/sign-in"
				class="mt-6 inline-block rounded-xl border border-[rgba(248,244,238,0.2)] bg-[rgba(248,244,238,0.1)] px-8 py-3 text-sm font-semibold text-[#f8f4ee] transition-colors hover:bg-[rgba(248,244,238,0.2)]"
			>
				Get started for $5/month
			</a>
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
</style>
