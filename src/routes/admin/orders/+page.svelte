<script lang="ts">
	import { Pencil, Plus, Trash } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';

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

	type OptedInUser = {
		id: string;
		email: string;
		name: string;
		createdAt: Date;
	};

	type NotOptedInUser = {
		id: string;
		email: string;
		name: string;
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
	let sortBy = $state<'name' | 'optInTime'>('name');

	function getCheckedOrdersKey(restaurantId: string): string {
		const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' });
		return `checkedOrders-${today}-${restaurantId}`;
	}

	function saveCheckedOrders() {
		if (!selectedRestaurantId) return;
		localStorage.setItem(
			getCheckedOrdersKey(selectedRestaurantId),
			JSON.stringify([...checkedOrders])
		);
	}

	function restoreCheckedOrders() {
		checkedOrders.clear();
		if (!selectedRestaurantId) return;
		const stored = localStorage.getItem(getCheckedOrdersKey(selectedRestaurantId));
		if (stored) {
			try {
				const ids: string[] = JSON.parse(stored);
				ids.forEach((id) => checkedOrders.add(id));
			} catch {
				// ignore invalid data
			}
		}
	}

	// Create Set of opted-in user IDs for fast lookup
	let optedInUserIds = $derived(new Set(data.optedInUsers.map((u) => u.id)));

	// Map of user ID → opt-in createdAt for sorting by opt-in time
	let optInTimeByUserId = $derived(new Map(data.optedInUsers.map((u) => [u.id, u.createdAt])));

	function sortUsers<T extends { name: string; id: string }>(users: T[]): T[] {
		return [...users].sort((a, b) => {
			if (sortBy === 'name') {
				return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
			}
			const timeA = optInTimeByUserId.get(a.id) ?? '';
			const timeB = optInTimeByUserId.get(b.id) ?? '';
			if (timeA < timeB) return -1;
			if (timeA > timeB) return 1;
			return 0;
		});
	}

	// Only show users who are opted in
	let optedInUsersWithOrders = $derived(
		selectedRestaurantId
			? data.users
					.filter((user) => optedInUserIds.has(user.id))
					.map((user) => {
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

	// Split opted-in users into those with and without orders, then sort
	let usersWithOrders = $derived(sortUsers(optedInUsersWithOrders.filter((u) => !!u.order)));
	let usersWithoutOrders = $derived(sortUsers(optedInUsersWithOrders.filter((u) => !u.order)));

	// Users who haven't opted in yet
	let notOptedInUsersList = $derived(
		selectedRestaurantId
			? data.notOptedInUsers.map((user) => ({
					id: user.id,
					name: user.name,
					email: user.email
				}))
			: []
	);

	async function loadOrders() {
		if (!selectedRestaurantId) return;

		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/admin/orders?restaurantId=${selectedRestaurantId}`);

			if (!response.ok) {
				throw new Error('Failed to load orders');
			}

			orders = await response.json();
			restoreCheckedOrders();
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
		saveCheckedOrders();
	}

	function resetChecks() {
		checkedOrders.clear();
		saveCheckedOrders();
	}

	function removeOrder(orderId: string) {
		orders = orders.filter((order) => order.id !== orderId);
		checkedOrders.delete(orderId);
		saveCheckedOrders();
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

	async function optInUser(userId: string) {
		try {
			const response = await fetch('/api/admin/opt-ins', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId,
					action: 'in'
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to opt in user');
			}

			// Reload the page to refresh the user lists
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to opt in user';
		}
	}

	async function optOutUser(userId: string) {
		try {
			const response = await fetch('/api/admin/opt-ins', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					userId,
					action: 'out'
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to opt out user');
			}

			// Reload the page to refresh the user lists
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to opt out user';
		}
	}

	let selectedRestaurant = $derived(data.restaurants.find((r) => r.id === selectedRestaurantId));

	let progressText = $derived.by(() => {
		const ordersCount = usersWithOrders.length;
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
			// Don't save to localStorage here — clearing is just UI cleanup when deselecting
		}
	});
</script>

<div class="container mx-auto max-w-5xl px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">Order Management</h1>
		<p class="text-muted-foreground">Track orders as you enter them on restaurant sites</p>
	</div>

	<div class="mb-6">
		<label for="restaurant-select" class="mb-2 block text-sm font-medium">
			Select Restaurant
		</label>
		<select
			id="restaurant-select"
			bind:value={selectedRestaurantId}
			class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
			disabled={loading}
		>
			<option value="">-- Choose a restaurant --</option>
			{#each data.restaurants as restaurant (restaurant.id)}
				<option value={restaurant.id}>{restaurant.name}</option>
			{/each}
		</select>
		{#if loading}
			<p class="mt-2 text-sm text-muted-foreground">Loading orders...</p>
		{/if}
	</div>

	{#if selectedRestaurantId}
		<div class="mb-6 flex items-center gap-2">
			<span class="text-sm font-medium text-muted-foreground">Sort by:</span>
			<Button
				size="sm"
				variant={sortBy === 'name' ? 'default' : 'outline'}
				onclick={() => (sortBy = 'name')}
			>
				Name
			</Button>
			<Button
				size="sm"
				variant={sortBy === 'optInTime' ? 'default' : 'outline'}
				onclick={() => (sortBy = 'optInTime')}
			>
				Opt-In Time
			</Button>
		</div>
	{/if}

	{#if error}
		<div class="mb-6 rounded-md bg-destructive/10 p-4 text-destructive">
			{error}
		</div>
	{/if}

	<!-- Users WITHOUT Orders -->
	{#if selectedRestaurant && usersWithoutOrders.length > 0}
		<div class="mb-8 rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm">
			<div class="border-b bg-muted/50 p-4">
				<h3 class="text-lg font-semibold">
					Opted In - Without Orders ({usersWithoutOrders.length})
				</h3>
				<p class="text-sm text-muted-foreground">
					These users opted in for lunch but haven't placed orders yet
				</p>
			</div>

			<div class="divide-y">
				{#each usersWithoutOrders as userWithOrder (userWithOrder.id)}
					<div class="flex items-start gap-3 p-4 transition-colors hover:bg-accent/50">
						{#if creatingOrderForUserId === userWithOrder.id}
							<!-- Create Order Mode -->
							<div class="min-w-0 flex-1 space-y-3">
								<div class="font-medium">
									{userWithOrder.name}
								</div>
								<textarea
									bind:value={creatingOrderDetails}
									class="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
									placeholder="Enter order details..."
								></textarea>
								<div class="flex gap-2">
									<Button size="sm" onclick={() => createOrder(userWithOrder.id)}>Save</Button>
									<Button size="sm" variant="outline" onclick={cancelCreatingOrder}>Cancel</Button>
								</div>
							</div>
						{:else}
							<!-- No Order Yet -->
							<div class="flex flex-1 items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<div class="font-medium">
										{userWithOrder.name}
									</div>
									<div class="text-sm text-muted-foreground">{userWithOrder.email}</div>
								</div>
								<Button
									size="sm"
									variant="default"
									onclick={() => startCreatingOrder(userWithOrder.id)}
								>
									<Plus />
									Add Order
								</Button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Users WITH Orders -->
	{#if selectedRestaurant && usersWithOrders.length > 0}
		<div class="rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm">
			<div class="flex items-center justify-between border-b p-4">
				<div>
					<h2 class="text-xl font-semibold">{selectedRestaurant.name}</h2>
					<p class="text-sm text-muted-foreground">Opted in with orders</p>
					<a
						href={selectedRestaurant.menuLink}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-primary hover:underline"
					>
						Open Menu →
					</a>
				</div>
				<div class="flex items-center gap-4">
					<span class="text-sm font-medium">{progressText}</span>
					<Button variant="outline" size="sm" onclick={resetChecks}>Reset</Button>
				</div>
			</div>

			<div class="divide-y">
				{#each usersWithOrders as userWithOrder (userWithOrder.id)}
					<div class="flex items-start gap-3 p-4 transition-colors hover:bg-accent/50">
						{#if editingOrderId === userWithOrder.order!.id}
							<!-- Edit Mode -->
							<div class="min-w-0 flex-1 space-y-3">
								<div class="font-medium">
									{userWithOrder.name}
								</div>
								<textarea
									bind:value={editingOrderDetails}
									class="min-h-[100px] w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none"
									placeholder="Enter order details..."
								></textarea>
								<div class="flex gap-2">
									<Button size="sm" onclick={() => saveOrder(userWithOrder.order!.id)}>Save</Button>
									<Button size="sm" variant="outline" onclick={cancelEditing}>Cancel</Button>
								</div>
							</div>
						{:else}
							<!-- View Mode with Order -->
							<label class="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
								<input
									type="checkbox"
									checked={checkedOrders.has(userWithOrder.order!.id)}
									onchange={() => toggleOrder(userWithOrder.order!.id)}
									class="mt-1 h-5 w-5 cursor-pointer rounded border-gray-300"
								/>
								<div class="min-w-0 flex-1">
									<div class="font-medium">
										{userWithOrder.name}
									</div>
									<div
										class="mt-1 text-sm wrap-break-word whitespace-pre-wrap text-muted-foreground"
									>
										{userWithOrder.order!.orderDetails}
									</div>
								</div>
							</label>
							<div class="flex shrink-0 gap-1">
								<Button
									variant="ghost"
									size="sm"
									onclick={(e) => {
										e.preventDefault();
										startEditing(userWithOrder.order!);
									}}
									class="text-muted-foreground hover:text-primary"
								>
									<span class="sr-only">Edit order</span>
									<Pencil />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={(e) => {
										e.preventDefault();
										removeOrder(userWithOrder.order!.id);
									}}
									class="text-muted-foreground hover:text-destructive"
								>
									<span class="sr-only">Remove order</span>
									<Trash />
								</Button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Not Opted In Section -->
	{#if notOptedInUsersList.length > 0}
		<div class="mt-8 rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm">
			<div class="border-b bg-muted/50 p-4">
				<h3 class="font-semibold text-muted-foreground">
					Not Opted In Today ({notOptedInUsersList.length})
				</h3>
				<p class="text-sm text-muted-foreground">These users have not opted in for lunch today</p>
			</div>
			<div class="divide-y">
				{#each notOptedInUsersList as user (user.id)}
					<div class="flex items-center justify-between p-4">
						<div>
							<div class="font-medium">{user.name}</div>
							<div class="text-sm text-muted-foreground">{user.email}</div>
						</div>
						<Button size="sm" variant="outline" onclick={() => optInUser(user.id)}>
							Opt In for Lunch
						</Button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div class="mt-8">
		<Button variant="outline" href="/admin">← Back to Admin Dashboard</Button>
	</div>
</div>
