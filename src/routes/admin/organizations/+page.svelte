<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import { ChevronDown } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let { data = $bindable() }: { data: PageData } = $props();

	let organizations = $derived(data.organizations);
	let expandedOrgs = new SvelteSet<string>();

	function toggleOrganization(orgId: string) {
		if (expandedOrgs.has(orgId)) {
			expandedOrgs.delete(orgId);
		} else {
			expandedOrgs.add(orgId);
		}
	}
</script>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">All Organizations</h1>
			<p class="mt-2 text-muted-foreground">
				View all organizations and their members across the system
			</p>
		</div>
		<Button variant="outline" href="/">← Back to Home</Button>
	</div>

	{#if organizations.length === 0}
		<div class="rounded-lg border bg-card p-12 text-center">
			<p class="text-lg text-muted-foreground">No organizations found</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each organizations as org (org.id)}
				<div class="overflow-hidden rounded-lg border bg-card">
					<!-- Organization Header -->
					<button
						onclick={() => toggleOrganization(org.id)}
						class="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/50"
					>
						<div class="flex-1">
							<h2 class="text-xl font-semibold">{org.name}</h2>
							<div class="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
								<span>Slug: {org.slug}</span>
								<span>•</span>
								<span>{org.members.length} {org.members.length === 1 ? 'member' : 'members'}</span>
							</div>
						</div>
						<div class="ml-4">
							<ChevronDown />
						</div>
					</button>

					<!-- Members List (Collapsible) -->
					{#if expandedOrgs.has(org.id)}
						<div class="border-t bg-muted/20">
							{#if org.members.length === 0}
								<div class="p-6 text-center text-muted-foreground">
									No members in this organization
								</div>
							{:else}
								<div class="divide-y">
									{#each org.members as member (member.memberId)}
										<div class="flex items-center justify-between p-4 hover:bg-muted/30">
											<div class="flex-1">
												<div class="font-medium">{member.userName}</div>
												<div class="text-sm text-muted-foreground">{member.userEmail}</div>
											</div>
											<div class="flex items-center gap-3">
												{#if member.userRole === 'admin'}
													<span
														class="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
													>
														System Admin
													</span>
												{/if}
												<span
													class="rounded-full px-2.5 py-1 text-xs font-medium {member.memberRole ===
													'owner'
														? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
														: member.memberRole === 'admin'
															? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
															: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}"
												>
													{member.memberRole}
												</span>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>
