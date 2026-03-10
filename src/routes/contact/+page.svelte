<script lang="ts">
	import { PUBLIC_TURNSTILE_SITEKEY } from '$env/static/public';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Contact – Office Lunch Management</title>
	<meta name="description" content="Get in touch with the Office Lunch Management team." />
	<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
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

	<main class="relative mx-auto max-w-2xl px-6 py-16 lg:py-24">
		<section class="text-center">
			<p class="text-sm font-medium uppercase tracking-wider text-yellow-900/80">Contact</p>
			<h1 class="mt-3 text-5xl font-extrabold! leading-[1.1]! tracking-tight">Get in touch</h1>
			<p class="mx-auto mt-5 max-w-md text-lg text-gray-600">
				Have a question or want to learn more? Send us a message and we'll get back to you.
			</p>
		</section>

		<section class="mt-12">
			{#if form?.success}
				<div class="surface border border-green-200 bg-green-50/80 text-center">
					<p class="text-2xl">✓</p>
					<h2 class="mt-2 text-xl font-semibold text-green-800">Message sent!</h2>
					<p class="mt-2 text-green-700">Thanks for reaching out. We'll be in touch soon.</p>
					<a
						href={resolve('/')}
						class="mt-6 inline-block rounded-xl bg-[#9e5b27] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#7d4820]"
					>
						Back to home
					</a>
				</div>
			{:else}
				<div class="surface border border-gray-950/8">
					{#if form?.error}
						<div
							class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
						>
							{form.error}
						</div>
					{/if}

					<form
						method="POST"
						use:enhance={() => {
							submitting = true;
							return async ({ result, update }) => {
								submitting = false;
								if (result.type === 'failure') {
									// Reset the widget so the user can get a fresh token
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									(window as any).turnstile?.reset();
								}
								await update();
							};
						}}
						class="space-y-5"
					>
						<div>
							<label for="name" class="mb-1.5 block text-sm font-medium text-[#3b3f42]">Name</label>
							<input
								id="name"
								name="name"
								type="text"
								required
								autocomplete="name"
								value={form?.name ?? ''}
								placeholder="Your name"
								class="w-full rounded-xl border border-gray-950/12 bg-white/70 px-4 py-3 text-sm text-[#3b3f42] placeholder-gray-400 outline-none transition focus:border-[#9e5b27] focus:ring-2 focus:ring-[#9e5b27]/20"
							/>
						</div>

						<div>
							<label for="email" class="mb-1.5 block text-sm font-medium text-[#3b3f42]"
								>Email</label
							>
							<input
								id="email"
								name="email"
								type="email"
								required
								autocomplete="email"
								value={form?.email ?? ''}
								placeholder="you@example.com"
								class="w-full rounded-xl border border-gray-950/12 bg-white/70 px-4 py-3 text-sm text-[#3b3f42] placeholder-gray-400 outline-none transition focus:border-[#9e5b27] focus:ring-2 focus:ring-[#9e5b27]/20"
							/>
						</div>

						<div>
							<label for="message" class="mb-1.5 block text-sm font-medium text-[#3b3f42]"
								>Message</label
							>
							<textarea
								id="message"
								name="message"
								required
								rows="6"
								maxlength="5000"
								placeholder="How can we help?"
								class="w-full resize-y rounded-xl border border-gray-950/12 bg-white/70 px-4 py-3 text-sm text-[#3b3f42] placeholder-gray-400 outline-none transition focus:border-[#9e5b27] focus:ring-2 focus:ring-[#9e5b27]/20"
								>{form?.message ?? ''}</textarea
							>
						</div>

						<div
							class="cf-turnstile"
							data-sitekey={PUBLIC_TURNSTILE_SITEKEY}
							data-theme="light"
						></div>

						<button
							type="submit"
							disabled={submitting}
							class="w-full rounded-xl bg-[#9e5b27] px-6 py-3.5 text-[0.95rem] font-semibold text-white transition-colors hover:bg-[#7d4820] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{submitting ? 'Sending…' : 'Send message'}
						</button>
					</form>
				</div>
			{/if}
		</section>

		<section class="mt-12">
			<h2 class="text-2xl font-semibold">Contact Us</h2>
			<p class="mt-2 text-gray-600">
				We're here to help. If you have questions, feedback, or suggestions, send us a message and
				we'll get back to you as soon as possible.
			</p>
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
