<script lang="ts">
	import RestaurantForm from '$lib/components/RestaurantForm.svelte';
	import UserForm from '$lib/components/UserForm.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';

	let { data = $bindable() }: { data: PageData } = $props();

	let users = $state<any[]>([]);
	let restaurants = $state(data.restaurants);
	let loadingUsers = $state(false);
	let editingRestaurantId = $state<string | null>(null);
	let editingRestaurantName = $state('');
	let editingRestaurantMenuLink = $state('');
	let restaurantError = $state('');
	let userError = $state('');

	async function refreshRestaurants() {
		const response = await fetch('/api/restaurants');
		if (response.ok) {
			restaurants = await response.json();
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

	// Load users on mount
	$effect(() => {
		loadUsers();
	});

	// Sync restaurants with data changes
	$effect(() => {
		restaurants = data.restaurants;
	});
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="grid gap-8 md:grid-cols-2">
		<div>
			<h2 class="mb-4 text-xl font-semibold">Create New Restaurant</h2>
			<div class="rounded-lg border bg-card p-6">
				<RestaurantForm onSuccess={refreshRestaurants} />
			</div>
		</div>

		<div>
			<h2 class="mb-4 text-xl font-semibold">Existing Restaurants</h2>
			<div class="max-h-[420px] space-y-3 overflow-y-auto">
				{#if restaurants.length === 0}
					<div class="rounded-lg border bg-card p-6 text-center text-muted-foreground">
						No restaurants yet. Create one to get started!
					</div>
				{:else}
					{#each restaurants as restaurant}
						<div class="rounded-lg border bg-card p-4">
							{#if editingRestaurantId === restaurant.id}
								<!-- Edit Mode -->
								<div class="space-y-3">
									<div>
										<label for="edit-name" class="mb-1.5 block text-sm font-medium">
											Restaurant Name
										</label>
										<input
											id="edit-name"
											type="text"
											bind:value={editingRestaurantName}
											class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
											placeholder="Enter restaurant name"
										/>
									</div>
									<div>
										<label for="edit-menu-link" class="mb-1.5 block text-sm font-medium">
											Menu Link
										</label>
										<input
											id="edit-menu-link"
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
										<div class="min-w-0 flex-1">
											<h3 class="mb-2 font-medium">{restaurant.name}</h3>
											<a
												href={restaurant.menuLink}
												target="_blank"
												rel="noopener noreferrer"
												class="text-sm break-all text-primary hover:underline"
											>
												View Menu →
											</a>
										</div>
										<div class="flex shrink-0 gap-1">
											<Button
												size="sm"
												variant="ghost"
												onclick={() => startEditingRestaurant(restaurant)}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path
														d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
													/>
													<path d="m15 5 4 4" />
												</svg>
												<span class="sr-only">Edit restaurant</span>
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onclick={() => deleteRestaurant(restaurant.id, restaurant.name)}
												class="text-destructive hover:bg-destructive/10"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												>
													<path d="M3 6h18" />
													<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
													<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
												</svg>
												<span class="sr-only">Delete restaurant</span>
											</Button>
										</div>
									</div>
									<Button
										size="sm"
										href="/admin/orders?restaurantId={restaurant.id}"
										class="w-full"
									>
										Make Order
									</Button>
								</div>
							{/if}
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>

	<div class="mt-12 border-t pt-12">
		<h2 class="mb-6 text-2xl font-bold">User Management</h2>
		<div class="grid gap-8 md:grid-cols-2">
			<div>
				<h3 class="mb-4 text-xl font-semibold">Create New User</h3>
				<div class="rounded-lg border bg-card p-6">
					<UserForm onSuccess={loadUsers} />
				</div>
			</div>

			<div>
				<h3 class="mb-4 text-xl font-semibold">Existing Users</h3>
				<div class="max-h-[420px] space-y-3 overflow-y-auto">
					{#if loadingUsers}
						<div class="rounded-lg border bg-card p-6 text-center text-muted-foreground">
							Loading users...
						</div>
					{:else if users.length === 0}
						<div class="rounded-lg border bg-card p-6 text-center text-muted-foreground">
							No users found.
						</div>
					{:else}
						{#if userError}
							<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{userError}
							</div>
						{/if}
						{#each users as user}
							<div class="rounded-lg border bg-card p-4">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0 flex-1">
										<h4 class="font-medium">{user.name}</h4>
										<p class="text-sm text-muted-foreground">{user.email}</p>
									</div>
									<div class="flex shrink-0 items-center gap-2">
										<span
											class="rounded-full px-2 py-1 text-xs {user.role === 'admin'
												? 'bg-primary/10 text-primary'
												: 'bg-muted text-muted-foreground'}"
										>
											{user.role || 'user'}
										</span>
										<Button
											size="sm"
											variant="ghost"
											href="/admin/user-orders?userId={user.id}"
											class="h-8 px-2"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path
													d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
												/>
												<path d="m15 5 4 4" />
											</svg>
											<span class="sr-only">Manage {user.name}'s orders</span>
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onclick={() => removeUser(user.id, user.name)}
											class="h-8 px-2 text-destructive hover:bg-destructive/10"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M3 6h18" />
												<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
												<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
											</svg>
											<span class="sr-only">Remove {user.name}</span>
										</Button>
									</div>
								</div>
							</div>
						{/each}
					{/if}
				</div>
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
