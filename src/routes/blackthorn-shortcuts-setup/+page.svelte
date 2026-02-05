<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { CircleCheck, Download, Key } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Apple Shortcuts Setup | Office Lunch</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">Apple Shortcuts Setup</h1>
		<p class="text-muted-foreground">
			Automatically opt in for lunch when you arrive at the Blackthorn office using Apple Shortcuts.
		</p>
	</div>

	<div class="space-y-8">
		<!-- Step 1: Generate Token -->
		<div class="rounded-lg border-2 border-yellow-900/20 bg-white/70 p-6 backdrop-blur-sm">
			<div class="mb-4 flex items-start gap-4">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-600 text-lg font-bold text-white"
				>
					1
				</div>
				<div>
					<h2 class="text-xl font-semibold">Generate Your API Token</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						You'll need an API token to authenticate the shortcut with Office Lunch.
					</p>
				</div>
			</div>

			<div class="ml-14 space-y-3">
				<ol class="list-decimal space-y-2 pl-5 text-sm">
					<li>
						Go to the <a href="/tokens" class="font-medium text-yellow-700 underline">API Tokens</a> page
					</li>
					<li>
						Click <strong>Create New Token</strong> and give it a name like "Apple Shortcut"
					</li>
					<li>
						Copy the token value (starts with <code class="rounded bg-muted px-1.5 py-0.5 text-xs"
							>olm_</code
						>) &mdash; you'll only see it once
					</li>
					<li>Keep this token handy for the next step</li>
				</ol>

				<div class="pt-2">
					<Button variant="outline" size="sm" href="/tokens">
						{#snippet children()}
							<Key size={16} />
							Go to Tokens Page
						{/snippet}
					</Button>
				</div>
			</div>
		</div>

		<!-- Step 2: Install Shortcut -->
		<div class="rounded-lg border-2 border-yellow-900/20 bg-white/70 p-6 backdrop-blur-sm">
			<div class="mb-4 flex items-start gap-4">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-600 text-lg font-bold text-white"
				>
					2
				</div>
				<div>
					<h2 class="text-xl font-semibold">Install the Shortcut</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Download and configure the Office Lunch shortcut on your iPhone.
					</p>
				</div>
			</div>

			<div class="ml-14 space-y-3">
				<ol class="list-decimal space-y-2 pl-5 text-sm">
					<li>
						Tap the button below on your iPhone to download and install the shortcut (or AirDrop it
						from your Mac)
					</li>
					<li>When prompted to add the shortcut, tap <strong>Add Shortcut</strong></li>
					<li>
						Open the <strong>Shortcuts</strong> app and find the <strong>Office Lunch</strong>
						shortcut
					</li>
					<li>
						Tap the <strong>&middot;&middot;&middot;</strong> (three dots) on the shortcut to edit it
					</li>
					<li>
						Find the <strong>Get Contents of URL</strong> action and expand the
						<strong>Headers</strong> section
					</li>
					<li>
						Replace the <code class="rounded bg-muted px-1.5 py-0.5 text-xs">Authorization</code>
						header value with:
						<code class="mt-1 block rounded bg-muted px-3 py-2 text-xs"
							>Bearer olm_your_token_here</code
						>
						<span class="mt-1 block text-xs text-muted-foreground"
							>Replace <code>olm_your_token_here</code> with the token you copied in Step 1</span
						>
					</li>
					<li>Tap <strong>Done</strong> to save</li>
				</ol>

				<div class="pt-2">
					<Button size="sm" href="/Office lunch.shortcut">
						{#snippet children()}
							<Download size={16} />
							Download Shortcut
						{/snippet}
					</Button>
				</div>

				<div class="rounded-lg bg-muted p-4">
					<p class="mb-1 text-sm font-medium">What does the shortcut do?</p>
					<p class="text-sm text-muted-foreground">
						When run, the shortcut asks "Do you want lunch ordered for today at the office?" If you
						tap <strong>Yes</strong>, it sends a request to opt you in for lunch. If you tap
						<strong>No</strong>, nothing happens.
					</p>
				</div>
			</div>
		</div>

		<!-- Step 3: Location Automation -->
		<div class="rounded-lg border-2 border-yellow-900/20 bg-white/70 p-6 backdrop-blur-sm">
			<div class="mb-4 flex items-start gap-4">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-600 text-lg font-bold text-white"
				>
					3
				</div>
				<div>
					<h2 class="text-xl font-semibold">Set Up Location Automation</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Trigger the shortcut automatically when you arrive at the Blackthorn office.
					</p>
				</div>
			</div>

			<div class="ml-14 space-y-3">
				<ol class="list-decimal space-y-2 pl-5 text-sm">
					<li>Open the <strong>Shortcuts</strong> app on your iPhone</li>
					<li>Tap the <strong>Automation</strong> tab at the bottom</li>
					<li>
						Tap the <strong>+</strong> button in the top-right corner to create a new automation
					</li>
					<li>
						Select <strong>Arrive</strong> under the Location section
					</li>
					<li>
						Search for and select the <strong>Blackthorn Software office</strong> address
					</li>
					<li>Set the location radius as needed (the default usually works well)</li>
					<li>Choose the time range if you want to limit it (e.g., weekday mornings only)</li>
					<li>Tap <strong>Next</strong></li>
					<li>
						Search for and select the <strong>Office Lunch</strong> shortcut you installed in Step 2
					</li>
				</ol>

				<div class="mt-4 rounded-lg bg-muted p-4">
					<p class="mb-1 text-sm font-medium">Tips</p>
					<ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
						<li>
							Location automations require the Shortcuts app to have <strong>Always</strong>
							location access. Go to
							<strong>Settings &gt; Privacy &gt; Location Services &gt; Shortcuts</strong> and
							select
							<strong>Always</strong>.
						</li>
						<li>
							The automation will prompt you with a notification when triggered &mdash; tap it to
							run the shortcut.
						</li>
						<li>
							You can test the shortcut manually anytime by opening the Shortcuts app and tapping
							<strong>Office Lunch</strong>.
						</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Success section -->
		<div class="rounded-lg border border-green-200 bg-green-50/50 p-6 text-center">
			<CircleCheck class="mx-auto mb-3 text-green-600" size={40} />
			<h3 class="mb-1 text-lg font-semibold text-green-900">You're All Set!</h3>
			<p class="text-sm text-green-700">
				Once configured, you'll be prompted to opt in for lunch every time you arrive at the office.
				No more forgetting to sign up!
			</p>
		</div>
	</div>

	<div class="mt-8">
		<Button variant="outline" href="/">
			{#snippet children()}
				&larr; Back to Home
			{/snippet}
		</Button>
	</div>
</div>
