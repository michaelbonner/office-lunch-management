<script lang="ts">
	import {
		Check,
		Clock3,
		List,
		Pencil,
		Search,
		Settings,
		Trash,
		Users,
		Utensils,
		UtensilsCrossed,
		X
	} from '@lucide/svelte';
	import { page } from '$app/state';
	import OrganizationSelector from '$lib/components/OrganizationSelector.svelte';
	import RestaurantForm from '$lib/components/RestaurantForm.svelte';
	import UserForm from '$lib/components/UserForm.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';

	let { data = $bindable() }: { data: PageData } = $props();

	// State
	type AdminTab = 'restaurants' | 'users' | 'requests';

	function getTabFromUrl(): AdminTab {
		const tab = page.url.searchParams.get('tab');
		return tab === 'users' || tab === 'requests' ? tab : 'restaurants';
	}

	let activeTab = $state<AdminTab>(getTabFromUrl());
	let restaurantSearch = $state('');
	let suggestionFilter = $state<'all' | 'pending' | 'reviewed'>('pending');
	let userSearch = $state('');
	let userOptInFilter = $state<'all' | 'opted-in' | 'opted-out' | 'no-response'>('all');

	// Data
	let users = $state<any[]>([]);
	let restaurants = $state(data.restaurants);
	let suggestions = $state(data.suggestions);
	let loadingUsers = $state(false);
	let suggestionError = $state('');
	let processingSuggestionId = $state<string | null>(null);
	let reviewerNotesById = $state<Record<string, string>>({});

	// Editing State - Restaurants
	let editingRestaurantId = $state<string | null>(null);
	let editingRestaurantName = $state('');
	let editingRestaurantMenuLink = $state('');
	let restaurantError = $state('');

	// Editing State - Users
	let editingUserId = $state<string | null>(null);
	let editingUserName = $state('');
	let editingUserRole = $state('member');
	let userError = $state('');

	// Derived
	let filteredRestaurants = $derived(
		restaurants.filter((r) => r.name.toLowerCase().includes(restaurantSearch.toLowerCase()))
	);
	let filteredSuggestions = $derived(
		suggestions.filter((suggestion) => {
			if (suggestionFilter === 'pending') return suggestion.status === 'pending';
			if (suggestionFilter === 'reviewed') return suggestion.status !== 'pending';
			return true;
		})
	);
	let pendingSuggestionsCount = $derived(
		suggestions.filter((suggestion) => suggestion.status === 'pending').length
	);

	let filteredUsers = $derived(
		users.filter((u) => {
			const matchesSearch =
				u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
				u.email?.toLowerCase().includes(userSearch.toLowerCase());

			if (!matchesSearch) return false;

			if (userOptInFilter === 'opted-in') return u.optStatusToday === 'opted-in';
			if (userOptInFilter === 'opted-out') return u.optStatusToday === 'opted-out';
			if (userOptInFilter === 'no-response') return u.optStatusToday === 'no-response';
			return true;
		})
	);

	let optedInCount = $derived(users.filter((u) => u.optStatusToday === 'opted-in').length);
	let optedOutCount = $derived(users.filter((u) => u.optStatusToday === 'opted-out').length);
	let noResponseCount = $derived(users.filter((u) => u.optStatusToday === 'no-response').length);

	async function refreshRestaurants() {
		const response = await fetch('/api/restaurants');
		if (response.ok) {
			restaurants = await response.json();
		}
	}

	function setReviewerNotes(suggestionId: string, value: string) {
		reviewerNotesById = {
			...reviewerNotesById,
			[suggestionId]: value
		};
	}

	async function reviewSuggestion(suggestionId: string, action: 'approve' | 'reject') {
		processingSuggestionId = suggestionId;
		suggestionError = '';

		try {
			const response = await fetch(`/api/admin/restaurant-suggestions/${suggestionId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					action,
					reviewerNotes: reviewerNotesById[suggestionId] || ''
				})
			});

			if (!response.ok) {
				const payload = await response.json().catch(() => null);
				throw new Error(payload?.message || `Failed to ${action} request`);
			}

			const payload = await response.json();
			suggestions = suggestions.map((suggestion) =>
				suggestion.id === suggestionId
					? {
							...suggestion,
							status: payload.suggestion.status,
							reviewerNotes: payload.suggestion.reviewerNotes,
							reviewedAt: payload.suggestion.reviewedAt,
							restaurantId: payload.suggestion.restaurantId
						}
					: suggestion
			);

			if (action === 'approve') {
				await refreshRestaurants();
			}
		} catch (err) {
			suggestionError = err instanceof Error ? err.message : `Failed to ${action} request`;
		} finally {
			processingSuggestionId = null;
		}
	}

	function startEditingRestaurant(restaurant: any) {
		editingRestaurantId = restaurant.id;
		editingRestaurantName = restaurant.name;
		editingRestaurantMenuLink = restaurant.menuLink;
		restaurantError = '';
	}

	function cancelEditingRestaurant() {
		editingRestaurantId = null;
		editingRestaurantName = '';
		editingRestaurantMenuLink = '';
		restaurantError = '';
	}

	async function saveRestaurant(restaurantId: string) {
		if (!editingRestaurantName.trim() || !editingRestaurantMenuLink.trim()) {
			restaurantError = 'Name and menu link are required';
			return;
		}

		try {
			const response = await fetch(`/api/restaurants/${restaurantId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: editingRestaurantName,
					menuLink: editingRestaurantMenuLink
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to update restaurant');
			}

			// Update the local restaurant
			restaurants = restaurants.map((r) =>
				r.id === restaurantId
					? { ...r, name: editingRestaurantName, menuLink: editingRestaurantMenuLink }
					: r
			);

			editingRestaurantId = null;
			editingRestaurantName = '';
			editingRestaurantMenuLink = '';
			restaurantError = '';
		} catch (err) {
			restaurantError = err instanceof Error ? err.message : 'Failed to update restaurant';
		}
	}

	async function deleteRestaurant(restaurantId: string, restaurantName: string) {
		if (
			!confirm(
				`Are you sure you want to delete "${restaurantName}"? This will also delete all orders for this restaurant. This action cannot be undone.`
			)
		) {
			return;
		}

		try {
			const response = await fetch(`/api/restaurants/${restaurantId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to delete restaurant');
			}

			// Remove from local state
			restaurants = restaurants.filter((r) => r.id !== restaurantId);
		} catch (err) {
			restaurantError = err instanceof Error ? err.message : 'Failed to delete restaurant';
		}
	}

	async function loadUsers() {
		loadingUsers = true;
		userError = '';
		try {
			const response = await fetch('/api/admin/users');
			if (response.ok) {
				const data = await response.json();
				users = data.users || [];
			}
		} catch (err) {
			console.error('Failed to load users:', err);
			userError = 'Failed to load users';
		} finally {
			loadingUsers = false;
		}
	}

	async function removeUser(userId: string, userName: string) {
		if (!confirm(`Are you sure you want to remove "${userName}" from your organization?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to remove user');
			}

			// Remove from local state
			users = users.filter((u) => u.id !== userId);
		} catch (err) {
			userError = err instanceof Error ? err.message : 'Failed to remove user';
		}
	}

	function startEditingUser(user: any) {
		editingUserId = user.id;
		editingUserName = user.name;
		editingUserRole = user.memberRole || 'member';
		userError = '';
	}

	function cancelEditingUser() {
		editingUserId = null;
		editingUserName = '';
		editingUserRole = 'member';
		userError = '';
	}

	async function saveUser(userId: string) {
		if (!editingUserName.trim()) {
			userError = 'Name is required';
			return;
		}

		try {
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: editingUserName,
					role: editingUserRole
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to update user');
			}

			// Update the local user
			users = users.map((u) =>
				u.id === userId ? { ...u, name: editingUserName, memberRole: editingUserRole } : u
			);

			editingUserId = null;
			editingUserName = '';
			editingUserRole = 'member';
			userError = '';
		} catch (err) {
			userError = err instanceof Error ? err.message : 'Failed to update user';
		}
	}

	// Load users on mount
	$effect(() => {
		loadUsers();
	});

	// Sync restaurants with data changes
	$effect(() => {
		restaurants = data.restaurants;
	});

	$effect(() => {
		suggestions = data.suggestions;
	});

	$effect(() => {
		activeTab = getTabFromUrl();
	});
</script>

<div class="container mx-auto max-w-5xl px-4 py-8">
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
			<p class="text-muted-foreground">Manage your organization's restaurants and users.</p>
		</div>
		<div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
			<OrganizationSelector
				organizations={data.userOrganizations || []}
				activeOrganizationId={data.activeOrganizationId}
			/>
			<Button variant="outline" href="/admin/settings" class="gap-2">
				<Settings size={16} />
				Settings
			</Button>
			<Button variant="outline" href="/" class="gap-2">← Back to Home</Button>
		</div>
	</div>

	<!-- Tabs Navigation -->
	<div class="mb-8 border-b">
		<div class="flex gap-6">
			<button
				onclick={() => (activeTab = 'restaurants')}
				class="flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors hover:text-foreground {activeTab ===
				'restaurants'
					? 'border-primary text-foreground'
					: 'border-transparent text-muted-foreground'}"
			>
				<Utensils size={18} />
				Restaurants
			</button>
			<button
				onclick={() => (activeTab = 'requests')}
				class="flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors hover:text-foreground {activeTab ===
				'requests'
					? 'border-primary text-foreground'
					: 'border-transparent text-muted-foreground'}"
			>
				<Clock3 size={18} />
				Requests
				{#if pendingSuggestionsCount > 0}
					<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
						{pendingSuggestionsCount}
					</span>
				{/if}
			</button>
			<button
				onclick={() => (activeTab = 'users')}
				class="flex items-center gap-2 border-b-2 px-1 pb-4 text-sm font-medium transition-colors hover:text-foreground {activeTab ===
				'users'
					? 'border-primary text-foreground'
					: 'border-transparent text-muted-foreground'}"
			>
				<Users size={18} />
				Users
			</button>
		</div>
	</div>

	{#if activeTab === 'restaurants'}
		<div class="grid gap-8 md:grid-cols-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
			<!-- Left Column: Create Form -->
			<div class="md:col-span-12 lg:col-span-4">
				<div class="lg:sticky lg:top-8">
					<div class="mb-4">
						<h2 class="text-lg font-semibold">Add New Restaurant</h2>
						<p class="text-sm text-muted-foreground">
							Add a new place for your team to order from.
						</p>
					</div>
					<div
						class="rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm p-6 shadow-sm"
					>
						<RestaurantForm
							onSuccess={refreshRestaurants}
							organizations={data.userOrganizations || []}
							activeOrganizationId={data.activeOrganizationId}
						/>
					</div>
				</div>
			</div>

			<!-- Right Column: List -->
			<div class="md:col-span-12 lg:col-span-8">
				<div class="mb-4 flex items-center justify-between gap-4">
					<h2 class="text-lg font-semibold">All Restaurants ({restaurants.length})</h2>
					<div class="relative w-full max-w-xs">
						<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search restaurants..."
							bind:value={restaurantSearch}
							class="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
						/>
					</div>
				</div>

				<div class="space-y-3">
					{#if filteredRestaurants.length === 0}
						<div
							class="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground"
						>
							<Utensils class="mb-4 h-10 w-10 opacity-20" />
							{#if restaurantSearch}
								<p>No restaurants found matching "{restaurantSearch}"</p>
							{:else}
								<p>No restaurants yet. Create one to get started!</p>
							{/if}
						</div>
					{:else}
						{#each filteredRestaurants as restaurant (restaurant.id)}
							<div
								class="group relative rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm p-4 transition-all hover:shadow-md"
							>
								{#if editingRestaurantId === restaurant.id}
									<!-- Edit Mode -->
									<div class="space-y-3">
										<div>
											<label
												for="edit-name-{restaurant.id}"
												class="mb-1.5 block text-sm font-medium"
											>
												Restaurant Name
											</label>
											<input
												id="edit-name-{restaurant.id}"
												type="text"
												bind:value={editingRestaurantName}
												class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
												placeholder="Enter restaurant name"
											/>
										</div>
										<div>
											<label
												for="edit-menu-link-{restaurant.id}"
												class="mb-1.5 block text-sm font-medium"
											>
												Menu Link
											</label>
											<input
												id="edit-menu-link-{restaurant.id}"
												type="url"
												bind:value={editingRestaurantMenuLink}
												class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
												placeholder="https://example.com/menu"
											/>
										</div>
										{#if restaurantError}
											<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
												{restaurantError}
											</div>
										{/if}
										<div class="flex gap-2">
											<Button size="sm" onclick={() => saveRestaurant(restaurant.id)}>Save</Button>
											<Button size="sm" variant="outline" onclick={cancelEditingRestaurant}>
												Cancel
											</Button>
										</div>
									</div>
								{:else}
									<!-- View Mode -->
									<div class="space-y-3">
										<div class="flex items-start justify-between gap-3">
											<div class="min-w-0 flex-1 justify-start">
												<h3 class="font-medium text-lg leading-none mb-2">{restaurant.name}</h3>
												<a
													href={restaurant.menuLink}
													target="_blank"
													rel="noopener noreferrer"
													class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
												>
													<List size={14} />
													<span class="truncate">View Menu</span>
												</a>
											</div>
											<div
												class="flex shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
											>
												<Button
													size="icon"
													variant="ghost"
													onclick={() => startEditingRestaurant(restaurant)}
													class="h-8 w-8"
												>
													<Pencil size={14} />
													<span class="sr-only">Edit restaurant</span>
												</Button>
												<Button
													size="icon"
													variant="ghost"
													onclick={() => deleteRestaurant(restaurant.id, restaurant.name)}
													class="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
												>
													<Trash size={14} />
													<span class="sr-only">Delete restaurant</span>
												</Button>
											</div>
										</div>
										<div class="pt-2 flex justify-end">
											<Button
												size="sm"
												variant="secondary"
												href="/admin/orders?restaurantId={restaurant.id}"
												class="w-full sm:w-auto"
											>
												Make Order
											</Button>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{:else if activeTab === 'requests'}
		<div class="animate-in fade-in slide-in-from-bottom-2 duration-300">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-lg font-semibold">Restaurant Requests ({suggestions.length})</h2>
					<p class="text-sm text-muted-foreground">
						Approve requests to create restaurants, or reject them with an optional note.
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<button
						onclick={() => (suggestionFilter = 'pending')}
						class="rounded-full px-3 py-1 text-sm font-medium transition-colors {suggestionFilter ===
						'pending'
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					>
						Pending ({pendingSuggestionsCount})
					</button>
					<button
						onclick={() => (suggestionFilter = 'reviewed')}
						class="rounded-full px-3 py-1 text-sm font-medium transition-colors {suggestionFilter ===
						'reviewed'
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					>
						Reviewed ({suggestions.length - pendingSuggestionsCount})
					</button>
					<button
						onclick={() => (suggestionFilter = 'all')}
						class="rounded-full px-3 py-1 text-sm font-medium transition-colors {suggestionFilter ===
						'all'
							? 'bg-primary text-primary-foreground'
							: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
					>
						All ({suggestions.length})
					</button>
				</div>
			</div>

			{#if suggestionError}
				<div class="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{suggestionError}
				</div>
			{/if}

			<div class="space-y-3">
				{#if filteredSuggestions.length === 0}
					<div
						class="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground"
					>
						<Clock3 class="mb-4 h-10 w-10 opacity-20" />
						<p>No restaurant requests in this view.</p>
					</div>
				{:else}
					{#each filteredSuggestions as suggestion (suggestion.id)}
						<div class="rounded-lg border-2 border-yellow-900/20 bg-white/70 p-5 shadow-sm">
							<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
								<div class="min-w-0 flex-1 space-y-3">
									<div class="flex flex-wrap items-center gap-2">
										<h3 class="text-lg font-semibold">{suggestion.name}</h3>
										<span
											class="rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide {suggestion.status ===
											'pending'
												? 'bg-amber-100 text-amber-800'
												: suggestion.status === 'approved'
													? 'bg-green-100 text-green-700'
													: 'bg-red-100 text-red-700'}"
										>
											{suggestion.status}
										</span>
									</div>

									<div class="space-y-1 text-sm text-muted-foreground">
										<p>
											Requested by {suggestion.requestedByName} ({suggestion.requestedByEmail})
										</p>
										<p>Submitted {new Date(suggestion.createdAt).toLocaleString()}</p>
										<p>Organization: {suggestion.organizationName}</p>
									</div>

									<a
										href={suggestion.menuLink}
										target="_blank"
										rel="noopener noreferrer"
										class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
									>
										<List size={14} />
										View Menu
									</a>

									{#if suggestion.notes}
										<div class="rounded-md bg-muted/50 p-3 text-sm text-foreground">
											<p class="mb-1 font-medium">Requester notes</p>
											<p class="whitespace-pre-wrap">{suggestion.notes}</p>
										</div>
									{/if}

									{#if suggestion.status === 'pending'}
										<div>
											<label
												for="reviewer-notes-{suggestion.id}"
												class="mb-1.5 block text-sm font-medium"
											>
												Admin note for requester
											</label>
											<textarea
												id="reviewer-notes-{suggestion.id}"
												value={reviewerNotesById[suggestion.id] || ''}
												oninput={(event) =>
													setReviewerNotes(
														suggestion.id,
														(event.currentTarget as HTMLTextAreaElement).value
													)}
												rows="3"
												maxlength="1000"
												class="w-full rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
												placeholder="Optional note to include in the approval or rejection email"
											></textarea>
										</div>
									{:else if suggestion.reviewerNotes}
										<div class="rounded-md bg-muted/50 p-3 text-sm text-foreground">
											<p class="mb-1 font-medium">Admin note sent to requester</p>
											<p class="whitespace-pre-wrap">{suggestion.reviewerNotes}</p>
										</div>
									{/if}
								</div>

								<div class="flex shrink-0 flex-col gap-2 lg:w-44">
									{#if suggestion.status === 'pending'}
										<Button
											onclick={() => reviewSuggestion(suggestion.id, 'approve')}
											disabled={processingSuggestionId === suggestion.id}
										>
											{processingSuggestionId === suggestion.id ? 'Saving...' : 'Approve and Add'}
										</Button>
										<Button
											variant="outline"
											onclick={() => reviewSuggestion(suggestion.id, 'reject')}
											disabled={processingSuggestionId === suggestion.id}
										>
											Reject
										</Button>
									{:else}
										<div
											class="rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground"
										>
											Reviewed {suggestion.reviewedAt
												? new Date(suggestion.reviewedAt).toLocaleString()
												: 'recently'}
										</div>
										{#if suggestion.status === 'approved' && suggestion.restaurantId}
											<div class="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700">
												Restaurant created
											</div>
										{/if}
									{/if}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{:else if activeTab === 'users'}
		<div class="grid gap-8 md:grid-cols-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
			<!-- Left Column: Create Form -->
			<div class="md:col-span-12 lg:col-span-4">
				<div class="lg:sticky lg:top-8">
					<div class="mb-4">
						<h2 class="text-lg font-semibold">Add New User</h2>
						<p class="text-sm text-muted-foreground">Invite a new member to your organization.</p>
					</div>
					<div
						class="rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm p-6 shadow-sm"
					>
						<UserForm onSuccess={loadUsers} />
					</div>
				</div>
			</div>

			<!-- Right Column: List -->
			<div class="md:col-span-12 lg:col-span-8">
				<div class="mb-4 space-y-3">
					<div class="flex items-center justify-between gap-4">
						<h2 class="text-lg font-semibold">All Users ({users.length})</h2>
						<div class="relative w-full max-w-xs">
							<Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<input
								type="text"
								placeholder="Search users..."
								bind:value={userSearch}
								class="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
							/>
						</div>
					</div>
					<!-- Opt-in filter buttons -->
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-sm text-muted-foreground">Today's lunch:</span>
						<button
							onclick={() => (userOptInFilter = 'all')}
							class="rounded-full px-3 py-1 text-sm font-medium transition-colors {userOptInFilter ===
							'all'
								? 'bg-primary text-primary-foreground'
								: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
						>
							All ({users.length})
						</button>
						<button
							onclick={() => (userOptInFilter = 'opted-in')}
							class="rounded-full px-3 py-1 text-sm font-medium transition-colors {userOptInFilter ===
							'opted-in'
								? 'bg-green-600 text-white'
								: 'bg-green-100 text-green-700 hover:bg-green-200'}"
						>
							<span class="inline-flex items-center gap-1">
								<UtensilsCrossed size={14} />
								Opted In ({optedInCount})
							</span>
						</button>
						<button
							onclick={() => (userOptInFilter = 'opted-out')}
							class="rounded-full px-3 py-1 text-sm font-medium transition-colors {userOptInFilter ===
							'opted-out'
								? 'bg-red-600 text-white'
								: 'bg-red-100 text-red-700 hover:bg-red-200'}"
						>
							Opted Out ({optedOutCount})
						</button>
						<button
							onclick={() => (userOptInFilter = 'no-response')}
							class="rounded-full px-3 py-1 text-sm font-medium transition-colors {userOptInFilter ===
							'no-response'
								? 'bg-gray-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
						>
							No Response ({noResponseCount})
						</button>
					</div>
				</div>

				<div class="space-y-3">
					{#if loadingUsers}
						<div
							class="flex flex-col items-center justify-center p-12 text-center text-muted-foreground"
						>
							Loading users...
						</div>
					{:else if filteredUsers.length === 0}
						<div
							class="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground"
						>
							<Users class="mb-4 h-10 w-10 opacity-20" />
							{#if userSearch}
								<p>No users found matching "{userSearch}"</p>
							{:else}
								<p>No users found.</p>
							{/if}
						</div>
					{:else}
						{#if userError}
							<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
								{userError}
							</div>
						{/if}

						{#each filteredUsers as user (user.id)}
							<div
								class="group relative rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm p-4 transition-all hover:shadow-md"
							>
								{#if editingUserId === user.id}
									<!-- Edit mode -->
									<div class="space-y-3">
										<div class="flex items-center gap-2">
											<input
												type="text"
												bind:value={editingUserName}
												class="flex-1 rounded-md border px-3 py-2 text-sm"
												placeholder="Name"
											/>
											<select
												bind:value={editingUserRole}
												class="h-9 rounded-md border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
											>
												<option value="member">Member</option>
												<option value="admin">Admin</option>
											</select>
										</div>
										<p class="text-sm text-muted-foreground">{user.email}</p>
										<div class="flex gap-2">
											<Button size="sm" onclick={() => saveUser(user.id)} class="flex-1">
												<Check size={16} class="mr-1" />
												Save
											</Button>
											<Button
												size="sm"
												variant="outline"
												onclick={cancelEditingUser}
												class="flex-1"
											>
												<X size={16} class="mr-1" />
												Cancel
											</Button>
										</div>
									</div>
								{:else}
									<!-- View mode -->
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2 mb-1">
												<h4 class="font-medium">{user.name}</h4>
												<span
													class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide {user.memberRole ===
													'admin'
														? 'bg-primary/10 text-primary'
														: 'bg-muted text-muted-foreground'}"
												>
													{user.memberRole || 'member'}
												</span>
												{#if user.optStatusToday === 'opted-in'}
													<span
														class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700"
														title="Opted in for lunch today"
													>
														<UtensilsCrossed size={10} />
														Lunch
													</span>
												{:else if user.optStatusToday === 'opted-out'}
													<span
														class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700"
														title="Explicitly opted out of lunch today"
													>
														Opted Out
													</span>
												{:else}
													<span
														class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700"
														title="No lunch response recorded for today"
													>
														No Response
													</span>
												{/if}
											</div>
											<p class="text-sm text-muted-foreground truncate">{user.email}</p>
										</div>
										<div
											class="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
										>
											<Button
												size="icon"
												variant="ghost"
												onclick={() => startEditingUser(user)}
												class="h-8 w-8"
											>
												<Pencil size={14} />
												<span class="sr-only">Edit {user.name}</span>
											</Button>
											<Button
												size="icon"
												variant="ghost"
												href="/admin/user-orders?userId={user.id}"
												class="h-8 w-8"
											>
												<List size={14} />
												<span class="sr-only">View {user.name}'s orders</span>
											</Button>
											<Button
												size="icon"
												variant="ghost"
												onclick={() => removeUser(user.id, user.name)}
												class="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
											>
												<Trash size={14} />
												<span class="sr-only">Remove {user.name}</span>
											</Button>
										</div>
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
