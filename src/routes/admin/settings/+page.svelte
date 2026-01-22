<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import { Settings, Building, Mail } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let workEmailDomain = $state(data.organization.workEmailDomain || '');
	let saving = $state(false);
	let error = $state('');
	let success = $state('');

	async function saveWorkEmailDomain() {
		saving = true;
		error = '';
		success = '';

		try {
			const response = await fetch(`/api/admin/organizations/${data.organization.id}/settings`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					workEmailDomain: workEmailDomain.trim() || null
				})
			});

			if (!response.ok) {
				const responseData = await response.json();
				throw new Error(responseData.message || 'Failed to update settings');
			}

			success = 'Work email domain updated successfully';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update settings';
		} finally {
			saving = false;
		}
	}

	function clearWorkEmailDomain() {
		workEmailDomain = '';
	}
</script>

<div class="container mx-auto max-w-3xl px-4 py-8">
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Organization Settings</h1>
			<p class="text-muted-foreground">
				Configure settings for <span class="font-medium">{data.organization.name}</span>
			</p>
		</div>
		<Button variant="outline" href="/admin" class="gap-2">
			<Settings size={16} />
			Back to Admin
		</Button>
	</div>

	<div class="space-y-6">
		<!-- Work Email Domain Section -->
		<div class="rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm p-6">
			<div class="flex items-start gap-4">
				<div class="rounded-lg bg-primary/10 p-3">
					<Mail size={24} class="text-primary" />
				</div>
				<div class="flex-1">
					<h2 class="text-lg font-semibold">Work Email Domain</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						When a new user signs up with an email address from this domain, they will automatically
						be added to this organization as a member.
					</p>

					<div class="mt-4 space-y-4">
						<div>
							<label for="work-email-domain" class="mb-1.5 block text-sm font-medium">
								Email Domain
							</label>
							<div class="flex gap-2">
								<div class="relative flex-1">
									<span
										class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
										>@</span
									>
									<input
										id="work-email-domain"
										type="text"
										bind:value={workEmailDomain}
										placeholder="example.com"
										class="w-full rounded-md border bg-background pl-8 pr-4 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
									/>
								</div>
								{#if workEmailDomain}
									<Button variant="ghost" size="sm" onclick={clearWorkEmailDomain}>Clear</Button>
								{/if}
							</div>
							<p class="mt-1.5 text-xs text-muted-foreground">
								Enter the domain without the @ symbol (e.g., "company.com")
							</p>
						</div>

						{#if error}
							<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						{/if}

						{#if success}
							<div class="rounded-md bg-green-100 p-3 text-sm text-green-700">
								{success}
							</div>
						{/if}

						<div class="flex justify-end">
							<Button onclick={saveWorkEmailDomain} disabled={saving}>
								{saving ? 'Saving...' : 'Save Changes'}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Organization Info Section -->
		<div class="rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm p-6">
			<div class="flex items-start gap-4">
				<div class="rounded-lg bg-primary/10 p-3">
					<Building size={24} class="text-primary" />
				</div>
				<div class="flex-1">
					<h2 class="text-lg font-semibold">Organization Info</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Basic information about this organization.
					</p>

					<dl class="mt-4 space-y-3">
						<div>
							<dt class="text-sm font-medium text-muted-foreground">Name</dt>
							<dd class="mt-0.5">{data.organization.name}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-muted-foreground">Slug</dt>
							<dd class="mt-0.5 font-mono text-sm">{data.organization.slug}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-muted-foreground">Created</dt>
							<dd class="mt-0.5">
								{new Date(data.organization.createdAt).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'long',
									day: 'numeric'
								})}
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>
	</div>
</div>
