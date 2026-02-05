<script lang="ts">
	let { status, error } = $props();

	const isNotFound = status === 404;
	const title = isNotFound
		? 'This lunch order went to the wrong address.'
		: 'Something went wrong.';
	const message = isNotFound
		? "The page you're looking for isn't on today's menu. Try a fresh route or head back home."
		: "We couldn't load this page. Please try again or return home.";
</script>

<svelte:head>
	<title>{status} | Office Lunch Management</title>
</svelte:head>

<div
	class="relative min-h-screen overflow-hidden [background:radial-gradient(circle_at_top_left,#fde6b6_0%,#f9f5ee_40%,#eef6f8_100%)]"
>
	<div
		class="pointer-events-none absolute -right-[140px] -top-[140px] size-[420px] animate-[float_14s_ease-in-out_infinite] rounded-full opacity-80 blur-[70px] [background:radial-gradient(circle,rgba(245,183,94,0.8),rgba(255,255,255,0))]"
		style="animation: float 14s ease-in-out infinite;"
	></div>
	<div
		class="pointer-events-none absolute -bottom-[160px] -left-[160px] size-[460px] animate-[float_18s_ease-in-out_infinite] rounded-full opacity-70 blur-[70px] [background:radial-gradient(circle,rgba(126,198,196,0.75),rgba(255,255,255,0))]"
		style="animation: float 18s ease-in-out infinite;"
	></div>
	<div
		class="pointer-events-none absolute left-[38%] top-[22%] size-[240px] animate-[pulse_8s_ease-in-out_infinite] rounded-full opacity-40 blur-[70px] [background:radial-gradient(circle,rgba(255,255,255,0.6),rgba(255,255,255,0))]"
		style="animation: pulse 8s ease-in-out infinite;"
	></div>

	<main class="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
		<div class="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
			<section class="space-y-6">
				<p class="text-sm font-medium uppercase tracking-wider text-yellow-900/80">
					Office Lunch Management
				</p>
				<h1 class="text-5xl font-extrabold! leading-[1.05]! tracking-tight lg:text-6xl">
					{title}
				</h1>
				<p class="text-lg text-gray-600">{message}</p>
				{#if error?.message && !isNotFound}
					<p class="rounded-lg border border-gray-200 bg-white/70 px-4 py-3 text-sm text-gray-600">
						<span class="font-medium text-gray-700">Details:</span>
						{error.message}
					</p>
				{/if}
				<div class="flex flex-wrap gap-3">
					<a
						href="/"
						class="inline-flex items-center justify-center rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-yellow-700"
					>
						Back to home
					</a>
					<a
						href="/opt-in"
						class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
					>
						Check opt-in
					</a>
					<a
						href="/admin"
						class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
					>
						Go to admin
					</a>
				</div>
			</section>

			<section class="surface border border-gray-950/8">
				<div class="space-y-6">
					<div class="flex items-center justify-between">
						<span class="text-sm font-semibold uppercase tracking-wide text-gray-500">
							Status code
						</span>
						<span class="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
							{status}
						</span>
					</div>
					<div class="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6">
						<div class="flex items-baseline justify-between">
							<span class="text-6xl font-extrabold text-gray-900">{status}</span>
							<span class="text-sm font-semibold uppercase tracking-widest text-gray-500">
								{isNotFound ? 'Not Found' : 'Error'}
							</span>
						</div>
						<p class="mt-3 text-sm text-gray-600">
							This happens when a link is outdated or a lunch day has moved.
						</p>
					</div>
					<div class="grid gap-3 sm:grid-cols-2">
						<div class="rounded-xl border border-gray-200 bg-white/80 p-4">
							<p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
								Suggested action
							</p>
							<p class="mt-2 text-sm font-medium text-gray-800">
								Return home and pick the right path.
							</p>
						</div>
						<div class="rounded-xl border border-gray-200 bg-white/80 p-4">
							<p class="text-xs font-semibold uppercase tracking-wide text-gray-500">Need help?</p>
							<p class="mt-2 text-sm font-medium text-gray-800">Ask an admin to resend the link.</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	</main>
</div>
