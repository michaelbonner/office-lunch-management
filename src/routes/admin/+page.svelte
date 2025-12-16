<script lang="ts">
	import RestaurantForm from '$lib/components/RestaurantForm.svelte';
	import UserForm from '$lib/components/UserForm.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import { Utensils, Check, List, Pencil, Trash, X, Search, Building, Users } from '@lucide/svelte';

	let { data = $bindable() }: { data: PageData } = $props();

	// State
	let activeTab = $state<'restaurants' | 'users'>('restaurants');
	let restaurantSearch = $state('');
	let userSearch = $state('');

	// Data
	let users = $state<any[]>([]);
	let restaurants = $state(data.restaurants);
	let loadingUsers = $state(false);

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

	let filteredUsers = $derived(
		users.filter(
			(u) =>
				u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
				u.email?.toLowerCase().includes(userSearch.toLowerCase())
		)
	);

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
</script>

<div class="container mx-auto max-w-5xl px-4 py-8">
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
			<p class="text-muted-foreground">Manage your organization's restaurants and users.</p>
		</div>
		<Button variant="outline" href="/" class="gap-2">← Back to Home</Button>
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
					<div class="rounded-lg border bg-card p-6 shadow-sm">
						<RestaurantForm onSuccess={refreshRestaurants} />
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
								class="group relative rounded-lg border bg-card p-4 transition-all hover:shadow-md"
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
	{:else if activeTab === 'users'}
		<div class="grid gap-8 md:grid-cols-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
			<!-- Left Column: Create Form -->
			<div class="md:col-span-12 lg:col-span-4">
				<div class="lg:sticky lg:top-8">
					<div class="mb-4">
						<h2 class="text-lg font-semibold">Add New User</h2>
						<p class="text-sm text-muted-foreground">Invite a new member to your organization.</p>
					</div>
					<div class="rounded-lg border bg-card p-6 shadow-sm">
						<UserForm onSuccess={loadUsers} />
					</div>
				</div>
			</div>

			<!-- Right Column: List -->
			<div class="md:col-span-12 lg:col-span-8">
				<div class="mb-4 flex items-center justify-between gap-4">
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
								class="group relative rounded-lg border bg-card p-4 transition-all hover:shadow-md"
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
