<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Order = {
		id: string;
		userId: string;
		restaurantId: string;
		orderDetails: string;
		createdAt: Date;
		updatedAt: Date;
		restaurant: {
			id: string;
			name: string;
			menuLink: string;
		};
	};

	let selectedUserId = $state<string>('');
	let orders = $state<Order[]>([]);
	let loading = $state(false);
	let error = $state('');
	let editingOrderId = $state<string | null>(null);
	let editingOrderDetails = $state('');
	let showAddOrderForm = $state(false);
	let newOrderRestaurantId = $state('');
	let newOrderDetails = $state('');

	async function loadOrders() {
		if (!selectedUserId) return;

		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/admin/user-orders?userId=${selectedUserId}`);

			if (!response.ok) {
				throw new Error('Failed to load orders');
			}

			orders = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			orders = [];
		} finally {
			loading = false;
		}
	}

	function startEditing(order: Order) {
		editingOrderId = order.id;
		editingOrderDetails = order.orderDetails;
	}

	function cancelEditing() {
		editingOrderId = null;
		editingOrderDetails = '';
	}

	async function saveOrder(orderId: string) {
		if (!editingOrderDetails.trim()) {
			error = 'Order details cannot be empty';
			return;
		}

		try {
			const response = await fetch(`/api/admin/orders/${orderId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ orderDetails: editingOrderDetails })
			});

			if (!response.ok) {
				throw new Error('Failed to update order');
			}

			// Update the local order
			orders = orders.map((order) =>
				order.id === orderId ? { ...order, orderDetails: editingOrderDetails } : order
			);

			editingOrderId = null;
			editingOrderDetails = '';
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update order';
		}
	}

	async function deleteOrder(orderId: string) {
		if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/orders/${orderId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete order');
			}

			// Remove from local state
			orders = orders.filter((order) => order.id !== orderId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete order';
		}
	}

	function startAddingOrder() {
		showAddOrderForm = true;
		newOrderRestaurantId = '';
		newOrderDetails = '';
		error = '';
	}

	function cancelAddingOrder() {
		showAddOrderForm = false;
		newOrderRestaurantId = '';
		newOrderDetails = '';
	}

	async function createNewOrder() {
		if (!newOrderRestaurantId || !newOrderDetails.trim()) {
			error = 'Please select a restaurant and enter order details';
			return;
		}

		try {
			const response = await fetch('/api/admin/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId: selectedUserId,
					restaurantId: newOrderRestaurantId,
					orderDetails: newOrderDetails
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create order');
			}

			const result = await response.json();
			const restaurant = data.restaurants.find((r) => r.id === newOrderRestaurantId);

			// Add the new order to the local state
			orders = [
				{
					...result.order,
					restaurant: {
						id: newOrderRestaurantId,
						name: restaurant?.name || '',
						menuLink: restaurant?.menuLink || ''
					}
				},
				...orders
			];

			showAddOrderForm = false;
			newOrderRestaurantId = '';
			newOrderDetails = '';
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create order';
		}
	}

	let selectedUser = $derived(
		data.users.find((u) => u.id === selectedUserId)
	);

	// Filter out restaurants that already have orders
	let availableRestaurants = $derived(
		data.restaurants.filter((restaurant) => {
			return !orders.some((order) => order.restaurantId === restaurant.id);
		})
	);

	// Initialize from URL parameter
	$effect(() => {
		const userIdFromUrl = $page.url.searchParams.get('userId');
		if (userIdFromUrl && !selectedUserId) {
			selectedUserId = userIdFromUrl;
		}
	});

	// Auto-load orders when user selection changes
	$effect(() => {
		if (selectedUserId) {
			loadOrders();
		} else {
			orders = [];
		}
		// Reset add order form when switching users
		showAddOrderForm = false;
		newOrderRestaurantId = '';
		newOrderDetails = '';
	});
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">User Order Management</h1>
		<p class="text-muted-foreground">View and manage all orders for a specific user</p>
	</div>

	<div class="mb-6">
		<label for="user-select" class="block text-sm font-medium mb-2">
			Select User
		</label>
		<select
			id="user-select"
			bind:value={selectedUserId}
			class="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
			disabled={loading}
		>
			<option value="">-- Choose a user --</option>
			{#each data.users as user (user.id)}
				<option value={user.id}>
					{user.name} ({user.email})
				</option>
			{/each}
		</select>
		{#if loading}
			<p class="text-sm text-muted-foreground mt-2">Loading orders...</p>
		{/if}
	</div>

	{#if error}
		<div class="p-4 rounded-md bg-destructive/10 text-destructive mb-6">
			{error}
		</div>
	{/if}

	{#if selectedUser}
		<div class="mb-6">
			<Button
				onclick={startAddingOrder}
				disabled={showAddOrderForm || availableRestaurants.length === 0}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="mr-2"
				>
					<path d="M5 12h14" />
					<path d="M12 5v14" />
				</svg>
				Add New Order
			</Button>
			{#if availableRestaurants.length === 0 && orders.length > 0}
				<p class="text-sm text-muted-foreground mt-2">
					All restaurants already have orders for this user
				</p>
			{/if}
		</div>

		{#if showAddOrderForm}
			<div class="border rounded-lg bg-card p-6 mb-6">
				<h3 class="text-lg font-semibold mb-4">Add New Order for {selectedUser.name}</h3>
				<div class="space-y-4">
					<div>
						<label for="restaurant-select" class="block text-sm font-medium mb-2">
							Restaurant
						</label>
						<select
							id="restaurant-select"
							bind:value={newOrderRestaurantId}
							class="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option value="">-- Select a restaurant --</option>
							{#each availableRestaurants as restaurant}
								<option value={restaurant.id}>{restaurant.name}</option>
							{/each}
						</select>
						{#if availableRestaurants.length === 0}
							<p class="text-sm text-muted-foreground mt-1">
								No available restaurants (all have existing orders)
							</p>
						{/if}
					</div>

					{#if newOrderRestaurantId}
						{@const selectedRestaurant = data.restaurants.find((r) => r.id === newOrderRestaurantId)}
						{#if selectedRestaurant}
							<a
								href={selectedRestaurant.menuLink}
								target="_blank"
								rel="noopener noreferrer"
								class="text-sm text-primary hover:underline inline-block"
							>
								View Menu →
							</a>
						{/if}
					{/if}

					<div>
						<label for="order-details" class="block text-sm font-medium mb-2">
							Order Details
						</label>
						<textarea
							id="order-details"
							bind:value={newOrderDetails}
							class="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[120px]"
							placeholder="Enter order details..."
						></textarea>
					</div>

					<div class="flex gap-2">
						<Button onclick={createNewOrder}>Save Order</Button>
						<Button variant="outline" onclick={cancelAddingOrder}>Cancel</Button>
					</div>
				</div>
			</div>
		{/if}

		{#if orders.length > 0}
			<div class="border rounded-lg bg-card">
				<div class="p-4 border-b">
					<h2 class="text-xl font-semibold">{selectedUser.name}'s Orders</h2>
					<p class="text-sm text-muted-foreground">{orders.length} order(s)</p>
				</div>

			<div class="divide-y">
				{#each orders as order (order.id)}
					<div class="p-4">
						{#if editingOrderId === order.id}
							<!-- Edit Mode -->
							<div class="space-y-3">
								<div class="flex items-center justify-between">
									<div>
										<div class="font-medium">{order.restaurant.name}</div>
										<a
											href={order.restaurant.menuLink}
											target="_blank"
											rel="noopener noreferrer"
											class="text-xs text-primary hover:underline"
										>
											View Menu →
										</a>
									</div>
									<span class="text-xs text-muted-foreground">
										{new Date(order.createdAt).toLocaleDateString()}
									</span>
								</div>
								<textarea
									bind:value={editingOrderDetails}
									class="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
									placeholder="Enter order details..."
								></textarea>
								<div class="flex gap-2">
									<Button size="sm" onclick={() => saveOrder(order.id)}>Save</Button>
									<Button size="sm" variant="outline" onclick={cancelEditing}>Cancel</Button>
								</div>
							</div>
						{:else}
							<!-- View Mode -->
							<div class="space-y-3">
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="font-medium">{order.restaurant.name}</div>
										<a
											href={order.restaurant.menuLink}
											target="_blank"
											rel="noopener noreferrer"
											class="text-xs text-primary hover:underline"
										>
											View Menu →
										</a>
										<div class="text-sm text-muted-foreground mt-2 whitespace-pre-wrap break-words">
											{order.orderDetails}
										</div>
									</div>
									<span class="text-xs text-muted-foreground shrink-0 ml-4">
										{new Date(order.createdAt).toLocaleDateString()}
									</span>
								</div>
								<div class="flex gap-2">
									<Button
										size="sm"
										variant="outline"
										onclick={() => startEditing(order)}
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
											class="mr-1"
										>
											<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
											<path d="m15 5 4 4" />
										</svg>
										Edit
									</Button>
									<Button
										size="sm"
										variant="outline"
										onclick={() => deleteOrder(order.id)}
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
											class="mr-1"
										>
											<path d="M3 6h18" />
											<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
											<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
										</svg>
										Delete
									</Button>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
		{:else if !loading}
			<div class="border rounded-lg p-8 bg-card text-center text-muted-foreground">
				{selectedUser.name} has no orders yet
			</div>
		{/if}
	{/if}

	<div class="mt-8">
		<Button variant="outline" href="/admin">
			← Back to Admin Dashboard
		</Button>
	</div>
</div>
