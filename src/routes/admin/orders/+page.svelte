<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import { SvelteSet } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	type Order = {
		id: string;
		userId: string;
		restaurantId: string;
		orderDetails: string;
		createdAt: Date;
		user: {
			id: string;
			name: string | null;
			email: string;
		} | null;
	};

	type UserWithOrder = {
		id: string;
		name: string;
		email: string;
		order: Order | null;
	};

	let selectedRestaurantId = $state<string>('');
	let orders = $state<Order[]>([]);
	let checkedOrders = new SvelteSet<string>();
	let loading = $state(false);
	let error = $state('');
	let editingOrderId = $state<string | null>(null);
	let editingOrderDetails = $state('');
	let creatingOrderForUserId = $state<string | null>(null);
	let creatingOrderDetails = $state('');

	// Merge users with their orders
	let usersWithOrders = $derived(
		selectedRestaurantId
			? data.users.map((user) => {
					const order = orders.find((o) => o.userId === user.id);
					return {
						id: user.id,
						name: user.name,
						email: user.email,
						order: order || null
					};
				})
			: []
	);

	async function loadOrders() {
		if (!selectedRestaurantId) return;

		loading = true;
		error = '';
		checkedOrders.clear(); // Reset checked orders when loading new restaurant

		try {
			const response = await fetch(`/api/admin/orders?restaurantId=${selectedRestaurantId}`);

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

	function toggleOrder(orderId: string) {
		if (checkedOrders.has(orderId)) {
			checkedOrders.delete(orderId);
		} else {
			checkedOrders.add(orderId);
		}
	}

	function resetChecks() {
		checkedOrders.clear();
	}

	function removeOrder(orderId: string) {
		orders = orders.filter((order) => order.id !== orderId);
		checkedOrders.delete(orderId);
	}

	function startEditing(order: Order) {
		editingOrderId = order.id;
		editingOrderDetails = order.orderDetails;
	}

	function cancelEditing() {
		editingOrderId = null;
		editingOrderDetails = '';
	}

	function startCreatingOrder(userId: string) {
		creatingOrderForUserId = userId;
		creatingOrderDetails = '';
	}

	function cancelCreatingOrder() {
		creatingOrderForUserId = null;
		creatingOrderDetails = '';
	}

	async function createOrder(userId: string) {
		if (!creatingOrderDetails.trim()) {
			error = 'Order details cannot be empty';
			return;
		}

		try {
			const response = await fetch('/api/admin/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId,
					restaurantId: selectedRestaurantId,
					orderDetails: creatingOrderDetails
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to create order');
			}

			const result = await response.json();

			// Add the new order to the local state
			orders = [
				...orders,
				{
					...result.order,
					user: {
						id: userId,
						name: data.users.find((u) => u.id === userId)?.name || null,
						email: data.users.find((u) => u.id === userId)?.email || ''
					}
				}
			];

			creatingOrderForUserId = null;
			creatingOrderDetails = '';
			error = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create order';
		}
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

	let selectedRestaurant = $derived(
		data.restaurants.find((r) => r.id === selectedRestaurantId)
	);

	let progressText = $derived.by(() => {
		const ordersCount = usersWithOrders.filter((u) => u.order).length;
		return ordersCount > 0 ? `${checkedOrders.size} of ${ordersCount} entered` : '';
	});

	// Initialize from URL parameter
	$effect(() => {
		const restaurantIdFromUrl = $page.url.searchParams.get('restaurantId');
		if (restaurantIdFromUrl && !selectedRestaurantId) {
			selectedRestaurantId = restaurantIdFromUrl;
		}
	});

	// Auto-load orders when restaurant selection changes
	$effect(() => {
		if (selectedRestaurantId) {
			loadOrders();
		} else {
			orders = [];
			checkedOrders.clear();
		}
	});
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-8">
		<h1 class="text-3xl font-bold mb-2">Order Management</h1>
		<p class="text-muted-foreground">Track orders as you enter them on restaurant sites</p>
	</div>

	<div class="mb-6">
		<label for="restaurant-select" class="block text-sm font-medium mb-2">
			Select Restaurant
		</label>
		<select
			id="restaurant-select"
			bind:value={selectedRestaurantId}
			class="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
			disabled={loading}
		>
			<option value="">-- Choose a restaurant --</option>
			{#each data.restaurants as restaurant (restaurant.id)}
				<option value={restaurant.id}>{restaurant.name}</option>
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

	{#if selectedRestaurant && usersWithOrders.length > 0}
		<div class="border rounded-lg bg-card">
			<div class="p-4 border-b flex items-center justify-between">
				<div>
					<h2 class="text-xl font-semibold">{selectedRestaurant.name}</h2>
					<a
						href={resolve(selectedRestaurant.menuLink)}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-primary hover:underline"
					>
						Open Menu →
					</a>
				</div>
				<div class="flex items-center gap-4">
					<span class="text-sm font-medium">{progressText}</span>
					<Button variant="outline" size="sm" onclick={resetChecks}>
						Reset
					</Button>
				</div>
			</div>

			<div class="divide-y">
				{#each usersWithOrders as userWithOrder (userWithOrder.id)}
					<div class="flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors">
						{#if userWithOrder.order && editingOrderId === userWithOrder.order.id}
							<!-- Edit Mode -->
							<div class="flex-1 min-w-0 space-y-3">
								<div class="font-medium">
									{userWithOrder.name}
								</div>
								<textarea
									bind:value={editingOrderDetails}
									class="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
									placeholder="Enter order details..."
								></textarea>
								<div class="flex gap-2">
									<Button size="sm" onclick={() => saveOrder(userWithOrder.order.id)}>Save</Button>
									<Button size="sm" variant="outline" onclick={cancelEditing}>Cancel</Button>
								</div>
							</div>
						{:else if userWithOrder.order}
							<!-- View Mode with Order -->
							<label class="flex items-start gap-3 flex-1 min-w-0 cursor-pointer">
								<input
									type="checkbox"
									checked={checkedOrders.has(userWithOrder.order.id)}
									onchange={() => toggleOrder(userWithOrder.order.id)}
									class="mt-1 h-5 w-5 rounded border-gray-300 cursor-pointer"
								/>
								<div class="flex-1 min-w-0">
									<div class="font-medium">
										{userWithOrder.name}
									</div>
									<div class="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">
										{userWithOrder.order.orderDetails}
									</div>
								</div>
							</label>
							<div class="flex gap-1 shrink-0">
								<Button
									variant="ghost"
									size="sm"
									onclick={(e) => {
										e.preventDefault();
										startEditing(userWithOrder.order);
									}}
									class="text-muted-foreground hover:text-primary"
								>
									<span class="sr-only">Edit order</span>
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
									>
										<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
										<path d="m15 5 4 4" />
									</svg>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={(e) => {
										e.preventDefault();
										removeOrder(userWithOrder.order.id);
									}}
									class="text-muted-foreground hover:text-destructive"
								>
									<span class="sr-only">Remove order</span>
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
									>
										<path d="M18 6 6 18" />
										<path d="m6 6 12 12" />
									</svg>
								</Button>
							</div>
						{:else if creatingOrderForUserId === userWithOrder.id}
							<!-- Create Order Mode -->
							<div class="flex-1 min-w-0 space-y-3">
								<div class="font-medium">
									{userWithOrder.name}
								</div>
								<textarea
									bind:value={creatingOrderDetails}
									class="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
									placeholder="Enter order details..."
								></textarea>
								<div class="flex gap-2">
									<Button size="sm" onclick={() => createOrder(userWithOrder.id)}>Save</Button>
									<Button size="sm" variant="outline" onclick={cancelCreatingOrder}>Cancel</Button>
								</div>
							</div>
						{:else}
							<!-- No Order Yet -->
							<div class="flex items-start justify-between gap-3 flex-1">
								<div class="flex-1 min-w-0">
									<div class="font-medium text-muted-foreground">
										{userWithOrder.name}
									</div>
									<div class="text-sm text-muted-foreground/70 mt-1 italic">
										No order yet
									</div>
								</div>
								<Button
									size="sm"
									variant="outline"
									onclick={() => startCreatingOrder(userWithOrder.id)}
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
										<path d="M5 12h14" />
										<path d="M12 5v14" />
									</svg>
									Add Order
								</Button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mt-8">
		<Button variant="outline" href="/admin">
			← Back to Admin Dashboard
		</Button>
	</div>
</div>
