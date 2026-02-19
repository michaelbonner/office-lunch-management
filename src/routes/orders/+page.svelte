<script lang="ts">
	import { Utensils } from '@lucide/svelte';
	import OrderForm from '$lib/components/OrderForm.svelte';
	import OrganizationSelector from '$lib/components/OrganizationSelector.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';

	let { data = $bindable() }: { data: PageData } = $props();

	async function refreshOrders() {
		const response = await fetch('/api/orders');
		if (response.ok) {
			const orders = await response.json();
			data.orders = new Map(orders.map((o: any) => [o.restaurantId, o.orderDetails]));
		}
	}
</script>

<div class="container mx-auto max-w-5xl px-4 py-8">
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
		<div>
			<h1 class="mb-2 text-3xl font-bold">My Lunch Order Preferences</h1>
			<p class="text-muted-foreground">
				Save your preferred lunch orders for each restaurant. View the menu first to decide what you
				want!
			</p>
		</div>
		<OrganizationSelector
			organizations={data.userOrganizations || []}
			activeOrganizationId={data.activeOrganizationId}
		/>
	</div>

	{#if data.restaurants.length === 0}
		<div
			class="rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm p-8 text-center"
		>
			<p class="mb-4 text-muted-foreground">No restaurants available yet.</p>
			<p class="text-sm text-muted-foreground">
				Ask an admin to add some restaurants to get started!
			</p>
		</div>
	{:else}
		<div class="space-y-4 lg:grid lg:grid-cols-3 lg:gap-4">
			{#each data.restaurants as restaurant}
				<div class="space-y-2">
					<OrderForm
						restaurantId={restaurant.id}
						restaurantName={restaurant.name}
						restaurantMenuLink={restaurant.menuLink}
						existingOrder={data.orders.get(restaurant.id) || ''}
						onSuccess={refreshOrders}
					/>
				</div>
			{/each}
		</div>
	{/if}

	<div class="mt-8">
		<Button variant="outline" href="/">
			{#snippet children()}
				← Back to Home
			{/snippet}
		</Button>
	</div>
</div>
