<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import { ChevronDown } from '@lucide/svelte';
	import clsx from 'clsx';
	import { SvelteSet } from 'svelte/reactivity';

	let { data = $bindable() }: { data: PageData } = $props();

	let organizations = $derived(data.organizations);
	let usersWithoutOrganizations = $derived(data.usersWithoutOrganizations);
	let expandedOrgs = new SvelteSet<string>();
	let showUsersWithoutOrg = $state(false);

	function toggleOrganization(orgId: string) {
		if (expandedOrgs.has(orgId)) {
			expandedOrgs.delete(orgId);
		} else {
			expandedOrgs.add(orgId);
		}
	}

	function toggleUsersWithoutOrg() {
		showUsersWithoutOrg = !showUsersWithoutOrg;
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
														class="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
													>
														System Admin
													</span>
												{/if}
												<span
													class="rounded-full px-2.5 py-1 text-xs font-medium {member.memberRole ===
													'owner'
														? 'bg-purple-100 text-purple-700'
														: member.memberRole === 'admin'
															? 'bg-blue-100 text-blue-700'
															: 'bg-gray-100 text-gray-700'}"
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

		<!-- Users without Organizations Section -->
		<div class="mt-8 overflow-hidden rounded-lg border bg-card">
			<!-- Section Header -->
			<button
				onclick={toggleUsersWithoutOrg}
				class={clsx(
					'flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-muted/50',
					usersWithoutOrganizations.length === 0 && 'opacity-50 cursor-not-allowed'
				)}
				disabled={usersWithoutOrganizations.length === 0}
			>
				<div class="flex-1">
					<h2 class="text-xl font-semibold">Users Without an Organization</h2>
					<div class="mt-1 text-sm text-muted-foreground">
						<span
							>{usersWithoutOrganizations.length}
							{usersWithoutOrganizations.length === 1 ? 'user' : 'users'} not in any organization</span
						>
					</div>
				</div>
				<div class="ml-4">
					<ChevronDown
						class={showUsersWithoutOrg ? 'rotate-180 transition-transform' : 'transition-transform'}
					/>
				</div>
			</button>

			<!-- Users List (Collapsible) -->
			{#if showUsersWithoutOrg}
				<div class="border-t bg-muted/20">
					<div class="divide-y">
						{#each usersWithoutOrganizations as user (user.id)}
							<div class="flex items-center justify-between p-4 hover:bg-muted/30">
								<div class="flex-1">
									<div class="font-medium">{user.name}</div>
									<div class="text-sm text-muted-foreground">{user.email}</div>
								</div>
								<div class="flex items-center gap-3">
									{#if user.role === 'admin'}
										<span
											class="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700"
										>
											System Admin
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
