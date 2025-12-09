<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { Pencil, Plus, Trash } from '@lucide/svelte';

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

	let selectedUser = $derived(data.users.find((u) => u.id === selectedUserId));

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

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">User Order Management</h1>
		<p class="text-muted-foreground">View and manage all orders for a specific user</p>
	</div>

	<div class="mb-6">
		<label for="user-select" class="mb-2 block text-sm font-medium"> Select User </label>
		<select
			id="user-select"
			bind:value={selectedUserId}
			class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
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
			<p class="mt-2 text-sm text-muted-foreground">Loading orders...</p>
		{/if}
	</div>

	{#if error}
		<div class="mb-6 rounded-md bg-destructive/10 p-4 text-destructive">
			{error}
		</div>
	{/if}

	{#if selectedUser}
		<div class="mb-6">
			<Button
				onclick={startAddingOrder}
				disabled={showAddOrderForm || availableRestaurants.length === 0}
			>
				<Plus />
				Add New Order
			</Button>
			{#if availableRestaurants.length === 0 && orders.length > 0}
				<p class="mt-2 text-sm text-muted-foreground">
					All restaurants already have orders for this user
				</p>
			{/if}
		</div>

		{#if showAddOrderForm}
			<div class="mb-6 rounded-lg border bg-card p-6">
				<h3 class="mb-4 text-lg font-semibold">Add New Order for {selectedUser.name}</h3>
				<div class="space-y-4">
					<div>
						<label for="restaurant-select" class="mb-2 block text-sm font-medium">
							Restaurant
						</label>
						<select
							id="restaurant-select"
							bind:value={newOrderRestaurantId}
							class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
						>
							<option value="">-- Select a restaurant --</option>
							{#each availableRestaurants as restaurant}
								<option value={restaurant.id}>{restaurant.name}</option>
							{/each}
						</select>
						{#if availableRestaurants.length === 0}
							<p class="mt-1 text-sm text-muted-foreground">
								No available restaurants (all have existing orders)
							</p>
						{/if}
					</div>

					{#if newOrderRestaurantId}
						{@const selectedRestaurant = data.restaurants.find(
							(r) => r.id === newOrderRestaurantId
						)}
						{#if selectedRestaurant}
							<a
								href={selectedRestaurant.menuLink}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-block text-sm text-primary hover:underline"
							>
								View Menu →
							</a>
						{/if}
					{/if}

					<div>
						<label for="order-details" class="mb-2 block text-sm font-medium">
							Order Details
						</label>
						<textarea
							id="order-details"
							bind:value={newOrderDetails}
							class="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
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
			<div class="rounded-lg border bg-card">
				<div class="border-b p-4">
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
										class="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
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
											<div
												class="mt-2 text-sm wrap-break-word whitespace-pre-wrap text-muted-foreground"
											>
												{order.orderDetails}
											</div>
										</div>
										<span class="ml-4 shrink-0 text-xs text-muted-foreground">
											{new Date(order.createdAt).toLocaleDateString()}
										</span>
									</div>
									<div class="flex gap-2">
										<Button size="sm" variant="outline" onclick={() => startEditing(order)}>
											<Pencil />
											Edit
										</Button>
										<Button
											size="sm"
											variant="outline"
											onclick={() => deleteOrder(order.id)}
											class="text-destructive hover:bg-destructive/10"
										>
											<Trash />
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
			<div class="rounded-lg border bg-card p-8 text-center text-muted-foreground">
				{selectedUser.name} has no orders yet
			</div>
		{/if}
	{/if}

	<div class="mt-8">
		<Button variant="outline" href="/admin">← Back to Admin Dashboard</Button>
	</div>
</div>
