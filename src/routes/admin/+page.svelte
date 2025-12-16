<script lang="ts">
	import RestaurantForm from '$lib/components/RestaurantForm.svelte';
	import UserForm from '$lib/components/UserForm.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import { Utensils, Check, List, Pencil, Trash, X } from '@lucide/svelte';

	let { data = $bindable() }: { data: PageData } = $props();

	let users = $state<any[]>([]);
	let restaurants = $state(data.restaurants);
	let loadingUsers = $state(false);
	let editingRestaurantId = $state<string | null>(null);
	let editingRestaurantName = $state('');
	let editingRestaurantMenuLink = $state('');
	let editingUserId = $state<string | null>(null);
	let editingUserName = $state('');
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

	function startEditingUser(user: any) {
		editingUserId = user.id;
		editingUserName = user.name;
		userError = '';
	}

	function cancelEditingUser() {
		editingUserId = null;
		editingUserName = '';
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
					name: editingUserName
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to update user');
			}

			// Update the local user
			users = users.map((u) => (u.id === userId ? { ...u, name: editingUserName } : u));

			editingUserId = null;
			editingUserName = '';
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
			<h2 class="mb-4 text-xl font-semibold">Existing Restaurants ({restaurants.length})</h2>
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
										<div class="min-w-0 flex-1 justify-start">
											<h3 class="mb-2 font-medium">{restaurant.name}</h3>
											<a
												href={restaurant.menuLink}
												target="_blank"
												rel="noopener noreferrer"
												class="text-sm break-all text-primary hover:underline flex items-center gap-1"
											>
												<Utensils size={16} />
												<span> View Menu </span>
											</a>
										</div>
										<div class="flex shrink-0 gap-1">
											<Button
												size="sm"
												variant="ghost"
												onclick={() => startEditingRestaurant(restaurant)}
											>
												<Pencil />
												<span class="sr-only">Edit restaurant</span>
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onclick={() => deleteRestaurant(restaurant.id, restaurant.name)}
												class="text-destructive hover:bg-destructive/10"
											>
												<Trash color="currentColor" />
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
				<h3 class="mb-4 text-xl font-semibold">Existing Users ({users.length})</h3>
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
											<span
												class="rounded-full px-2 py-1 text-xs {user.memberRole === 'admin'
													? 'bg-primary/10 text-primary'
													: 'bg-muted text-muted-foreground'}"
											>
												{user.role || 'user'}
											</span>
										</div>
										<p class="text-sm text-muted-foreground">{user.email}</p>
										<div class="flex gap-2">
											<Button size="sm" onclick={() => saveUser(user.id)} class="flex-1">
												<Check />
												Save
											</Button>
											<Button
												size="sm"
												variant="outline"
												onclick={cancelEditingUser}
												class="flex-1"
											>
												<X />
												Cancel
											</Button>
										</div>
									</div>
								{:else}
									<!-- View mode -->
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0 flex-1">
											<h4 class="font-medium">{user.name}</h4>
											<p class="text-sm text-muted-foreground">{user.email}</p>
										</div>
										<div class="flex shrink-0 items-center gap-2">
											<span
												class="rounded-full px-2 py-1 text-xs {user.memberRole === 'admin'
													? 'bg-primary/10 text-primary'
													: 'bg-muted text-muted-foreground'}"
											>
												{user.role || 'user'}
											</span>
											<Button
												size="sm"
												variant="ghost"
												onclick={() => startEditingUser(user)}
												class="h-8 px-2"
											>
												<Pencil />
												<span class="sr-only">Edit {user.name}</span>
											</Button>
											<Button
												size="sm"
												variant="ghost"
												href="/admin/user-orders?userId={user.id}"
												class="h-8 px-2"
											>
												<List />
												<span class="sr-only">View {user.name}'s orders</span>
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onclick={() => removeUser(user.id, user.name)}
												class="h-8 px-2 text-destructive hover:bg-destructive/10"
											>
												<Trash color="currentColor" />
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
	</div>

	<div class="mt-8">
		<Button variant="outline" href="/">
			{#snippet children()}
				← Back to Home
			{/snippet}
		</Button>
	</div>
</div>
