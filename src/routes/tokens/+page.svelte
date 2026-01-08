<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import { CheckCircle2, Copy, Key, Plus, Trash2 } from '@lucide/svelte';

	let { data = $bindable() }: { data: PageData } = $props();

	let showCreateForm = $state(false);
	let tokenName = $state('');
	let expiresInDays = $state('');
	let isCreating = $state(false);
	let newlyCreatedToken = $state<{ token: string; name: string } | null>(null);
	let copied = $state(false);

	// JSON examples for API documentation
	const optInRequest = '{"action": "in"}';
	const optOutRequest = '{"action": "out"}';
	const optInRequestWithDate = '{"action": "in", "date": "2024-01-15"}';

	async function createToken() {
		if (!tokenName.trim()) {
			alert('Please enter a token name');
			return;
		}

		isCreating = true;
		try {
			const response = await fetch('/api/tokens', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: tokenName.trim(),
					expiresInDays: expiresInDays ? parseInt(expiresInDays) : null
				})
			});

			if (response.ok) {
				const token = await response.json();
				newlyCreatedToken = { token: token.token, name: token.name };

				// Refresh tokens list
				await refreshTokens();

				// Reset form
				tokenName = '';
				expiresInDays = '';
				showCreateForm = false;
			} else {
				const error = await response.text();
				alert(`Error creating token: ${error}`);
			}
		} catch (err) {
			alert('Failed to create token');
		} finally {
			isCreating = false;
		}
	}

	async function deleteToken(tokenId: string, tokenName: string) {
		if (
			!confirm(
				`Are you sure you want to delete the token "${tokenName}"? This action cannot be undone.`
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/api/tokens/${tokenId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await refreshTokens();
			} else {
				alert('Failed to delete token');
			}
		} catch (err) {
			alert('Failed to delete token');
		}
	}

	async function refreshTokens() {
		const response = await fetch('/api/tokens');
		if (response.ok) {
			const tokens = await response.json();
			// Ensure reactivity by creating a new array reference
			data.tokens = [...tokens];
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	function formatDate(dateString: string | null) {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleDateString();
	}

	function isExpired(dateString: string | null) {
		if (!dateString) return false;
		return new Date(dateString) < new Date();
	}
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">API Tokens</h1>
		<p class="text-muted-foreground">
			Generate API tokens to authenticate with the API and manage your opt-in status
			programmatically.
		</p>
	</div>

	{#if newlyCreatedToken}
		<div
			class="mb-6 overflow-hidden rounded-lg border border-green-200 bg-linear-to-br from-green-50 to-emerald-50 shadow-sm"
		>
			<div class="border-b border-green-200 bg-green-100/50 px-5 py-4">
				<div class="flex items-center gap-3">
					<div class="rounded-full bg-green-500 p-1.5">
						<CheckCircle2 class="text-white" size={20} />
					</div>
					<div>
						<h3 class="text-lg font-semibold text-green-900">Token Created Successfully</h3>
						<p class="mt-0.5 text-sm text-green-700">
							Copy your token now - this is the only time you'll see it!
						</p>
					</div>
				</div>
			</div>

			<div class="space-y-4 p-5">
				<div>
					<p class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-green-700">
						Token Name
					</p>
					<p class="font-medium text-green-900">{newlyCreatedToken.name}</p>
				</div>

				<div>
					<p class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-green-700">
						Your API Token
					</p>
					<div class="flex gap-2">
						<div class="flex-1 overflow-hidden rounded-lg border border-green-200 bg-white">
							<code class="block break-all px-4 py-3 text-sm font-mono text-green-900">
								{newlyCreatedToken.token}
							</code>
						</div>
						<Button
							variant={copied ? 'default' : 'outline'}
							class={copied ? 'bg-green-600 hover:bg-green-700' : ''}
							onclick={() => copyToClipboard(newlyCreatedToken!.token)}
						>
							{#snippet children()}
								{#if copied}
									<CheckCircle2 size={16} class="mr-1.5" />
									Copied!
								{:else}
									<Copy size={16} class="mr-1.5" />
									Copy
								{/if}
							{/snippet}
						</Button>
					</div>
				</div>

				<div class="flex justify-end pt-2">
					<Button
						variant="ghost"
						size="sm"
						class="text-green-700 hover:bg-green-100 hover:text-green-900"
						onclick={() => (newlyCreatedToken = null)}
					>
						{#snippet children()}
							Got it, dismiss
						{/snippet}
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<div class="mb-6">
		{#if !showCreateForm}
			<Button onclick={() => (showCreateForm = true)}>
				{#snippet children()}
					<Plus size={16} />
					Create New Token
				{/snippet}
			</Button>
		{:else}
			<div class="rounded-lg border bg-card p-4">
				<h3 class="mb-4 font-semibold">Create New Token</h3>
				<div class="space-y-4">
					<div>
						<label for="tokenName" class="mb-1 block text-sm font-medium">
							Token Name <span class="text-destructive">*</span>
						</label>
						<input
							id="tokenName"
							type="text"
							bind:value={tokenName}
							placeholder="e.g., My Automation Script"
							class="w-full rounded-md border bg-background px-3 py-2 text-sm"
							maxlength="100"
						/>
						<p class="mt-1 text-xs text-muted-foreground">
							Give your token a descriptive name to remember what it's used for
						</p>
					</div>
					<div>
						<label for="expiresInDays" class="mb-1 block text-sm font-medium">
							Expires In (days)
						</label>
						<input
							id="expiresInDays"
							type="number"
							bind:value={expiresInDays}
							placeholder="Leave empty for no expiration"
							class="w-full rounded-md border bg-background px-3 py-2 text-sm"
							min="1"
						/>
						<p class="mt-1 text-xs text-muted-foreground">
							Optional: Set an expiration date for enhanced security
						</p>
					</div>
					<div class="flex gap-2">
						<Button onclick={createToken} disabled={isCreating}>
							{#snippet children()}
								{isCreating ? 'Creating...' : 'Create Token'}
							{/snippet}
						</Button>
						<Button
							variant="outline"
							onclick={() => {
								showCreateForm = false;
								tokenName = '';
								expiresInDays = '';
							}}
						>
							{#snippet children()}
								Cancel
							{/snippet}
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div>
		<h2 class="mb-4 text-xl font-semibold">Your Tokens</h2>
		{#if data.tokens.length === 0}
			<div class="rounded-lg border bg-card p-8 text-center">
				<Key class="mx-auto mb-3 text-muted-foreground" size={48} />
				<p class="mb-2 font-medium">No tokens yet</p>
				<p class="text-sm text-muted-foreground">
					Create your first API token to get started with programmatic access
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.tokens as token}
					<div class="flex items-center justify-between rounded-lg border bg-card p-4">
						<div class="flex-1">
							<div class="mb-1 flex items-center gap-2">
								<h3 class="font-medium">{token.name}</h3>
								{#if token.expiresAt && isExpired(token.expiresAt)}
									<span class="rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
										Expired
									</span>
								{/if}
							</div>
							<div class="flex flex-wrap gap-3 text-sm text-muted-foreground">
								<span>Created: {formatDate(token.createdAt)}</span>
								{#if token.lastUsedAt}
									<span>Last used: {formatDate(token.lastUsedAt)}</span>
								{:else}
									<span>Never used</span>
								{/if}
								{#if token.expiresAt}
									<span>Expires: {formatDate(token.expiresAt)}</span>
								{:else}
									<span>No expiration</span>
								{/if}
							</div>
						</div>
						<Button variant="ghost" size="sm" onclick={() => deleteToken(token.id, token.name)}>
							{#snippet children()}
								<Trash2 size={16} />
							{/snippet}
						</Button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<div class="mt-12">
		<h2 class="mb-4 text-xl font-semibold">API Documentation</h2>
		<div class="space-y-6 rounded-lg border bg-card p-6">
			<div>
				<h3 class="mb-2 text-lg font-medium">Authentication</h3>
				<p class="mb-2 text-sm text-muted-foreground">
					Include your token in the Authorization header of your requests:
				</p>
				<code class="block rounded bg-muted px-3 py-2 text-sm">
					Authorization: Bearer olm_your_token_here
				</code>
			</div>

			<div>
				<h3 class="mb-3 text-lg font-medium">Available Endpoints</h3>

				<div class="space-y-6">
					<!-- Check Opt-In Status -->
					<div class="rounded-lg border p-4">
						<div class="mb-2 flex items-center gap-2">
							<span class="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
								GET
							</span>
							<code class="text-sm font-medium">/api/v1/opt-in</code>
						</div>
						<p class="mb-3 text-sm text-muted-foreground">
							Check if you're opted in for a specific date.
						</p>

						<div class="mb-3">
							<p class="mb-1 text-sm font-medium">Query Parameters:</p>
							<ul class="ml-4 list-disc text-sm text-muted-foreground">
								<li><code>date</code> (optional): Date in YYYY-MM-DD format. Defaults to today.</li>
							</ul>
						</div>

						<div class="mb-3">
							<p class="mb-1 text-sm font-medium">Example Request:</p>
							<code class="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
								curl -X GET "https://your-domain.com/api/v1/opt-in?date=2024-01-15" \<br />
								&nbsp;&nbsp;-H "Authorization: Bearer olm_your_token_here"
							</code>
						</div>

						<div>
							<p class="mb-1 text-sm font-medium">Example Response:</p>
							<code class="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
								{JSON.stringify({ userId: 'user_123', date: '2024-01-15', optedIn: true }, null, 2)}
							</code>
						</div>
					</div>

					<!-- Opt In -->
					<div class="rounded-lg border p-4">
						<div class="mb-2 flex items-center gap-2">
							<span class="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
								POST
							</span>
							<code class="text-sm font-medium">/api/v1/opt-in</code>
						</div>
						<p class="mb-3 text-sm text-muted-foreground">Opt in or out for a specific date.</p>

						<div class="mb-3">
							<p class="mb-1 text-sm font-medium">Request Body:</p>
							<code class="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
								{JSON.stringify({ action: 'in', date: '2024-01-15' }, null, 2)}
							</code>
							<p class="mt-1 text-xs text-muted-foreground">
								• <code>action</code>: "in" or "out" (required)<br />
								• <code>date</code>: YYYY-MM-DD format (optional, defaults to today)
							</p>
						</div>

						<div class="mb-3">
							<p class="mb-1 text-sm font-medium">Example Request (Opt In):</p>
							<code class="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
								curl -X POST "https://your-domain.com/api/v1/opt-in" \<br />
								&nbsp;&nbsp;-H "Authorization: Bearer olm_your_token_here" \<br />
								&nbsp;&nbsp;-H "Content-Type: application/json" \<br />
								&nbsp;&nbsp;-d '{optInRequest}'
							</code>
						</div>

						<div class="mb-3">
							<p class="mb-1 text-sm font-medium">Example Request (Opt Out):</p>
							<code class="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
								curl -X POST "https://your-domain.com/api/v1/opt-in" \<br />
								&nbsp;&nbsp;-H "Authorization: Bearer olm_your_token_here" \<br />
								&nbsp;&nbsp;-H "Content-Type: application/json" \<br />
								&nbsp;&nbsp;-d '{optOutRequest}'
							</code>
						</div>

						<div>
							<p class="mb-1 text-sm font-medium">Example Response:</p>
							<code class="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
								{JSON.stringify(
									{
										success: true,
										message: 'Successfully opted in',
										userId: 'user_123',
										date: '2024-01-15',
										optedIn: true
									},
									null,
									2
								)}
							</code>
						</div>
					</div>
				</div>
			</div>

			<div>
				<h3 class="mb-2 text-lg font-medium">Quick Examples</h3>

				<div class="space-y-4">
					<!-- Bash Example -->
					<div>
						<p class="mb-2 text-sm font-medium">Bash/Shell:</p>
						<code class="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
							#!/bin/bash<br />
							TOKEN="olm_your_token_here"<br />
							API_URL="https://your-domain.com"<br />
							<br />
							# Check opt-in status<br />
							curl -X GET "${'${'}API_URL}/api/v1/opt-in" \<br />
							&nbsp;&nbsp;-H "Authorization: Bearer ${'${'}TOKEN}"<br />
							<br />
							# Opt in for today<br />
							curl -X POST "${'${'}API_URL}/api/v1/opt-in" \<br />
							&nbsp;&nbsp;-H "Authorization: Bearer ${'${'}TOKEN}" \<br />
							&nbsp;&nbsp;-H "Content-Type: application/json" \<br />
							&nbsp;&nbsp;-d '{optInRequest}'
						</code>
					</div>

					<!-- Python Example -->
					<div>
						<p class="mb-2 text-sm font-medium">Python:</p>
						<pre class="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs"><code
								>{`import requests

TOKEN = "olm_your_token_here"
API_URL = "https://your-domain.com"
headers = {"Authorization": f"Bearer {TOKEN}"}

# Check opt-in status
response = requests.get(f"{API_URL}/api/v1/opt-in", headers=headers)
print(response.json())

# Opt in for today
response = requests.post(
    f"{API_URL}/api/v1/opt-in",
    headers={**headers, "Content-Type": "application/json"},
    json={"action": "in"}
)
print(response.json())`}</code
							></pre>
					</div>

					<!-- JavaScript Example -->
					<div>
						<p class="mb-2 text-sm font-medium">JavaScript/Node.js:</p>
						<pre class="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs"><code
								>{`const TOKEN = 'olm_your_token_here';
const API_URL = 'https://your-domain.com';
const headers = { Authorization: \`Bearer \${TOKEN}\` };

// Check opt-in status
const status = await fetch(\`\${API_URL}/api/v1/opt-in\`, { headers });
console.log(await status.json());

// Opt in for today
const result = await fetch(\`\${API_URL}/api/v1/opt-in\`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'in' })
});
console.log(await result.json());`}</code
							></pre>
					</div>
				</div>
			</div>

			<div class="rounded-lg bg-muted p-4">
				<h3 class="mb-2 text-sm font-semibold">Best Practices</h3>
				<ul class="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
					<li>Keep your tokens secure - never commit them to version control</li>
					<li>Use descriptive names to remember what each token is for</li>
					<li>Set expiration dates for enhanced security</li>
					<li>Delete tokens you're no longer using</li>
					<li>Rotate tokens regularly for production use</li>
				</ul>
			</div>
		</div>
	</div>

	<div class="mt-8">
		<Button variant="outline" href="/">
			{#snippet children()}
				← Back to Home
			{/snippet}
		</Button>
	</div>
</div>
