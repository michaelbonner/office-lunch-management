<script lang="ts">
	import OrderForm from '$lib/components/OrderForm.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';
	import { Utensils } from '@lucide/svelte';

	let { data = $bindable() }: { data: PageData } = $props();

	async function refreshOrders() {
		const response = await fetch('/api/orders');
		if (response.ok) {
			const orders = await response.json();
			data.orders = new Map(orders.map((o: any) => [o.restaurantId, o.orderDetails]));
		}
	}
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold">My Lunch Order Preferences</h1>
		<p class="text-muted-foreground">
			Save your preferred lunch orders for each restaurant. View the menu first to decide what you
			want!
		</p>
	</div>

	{#if data.restaurants.length === 0}
		<div class="rounded-lg border bg-card p-8 text-center">
			<p class="mb-4 text-muted-foreground">No restaurants available yet.</p>
			<p class="text-sm text-muted-foreground">
				Ask an admin to add some restaurants to get started!
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.restaurants as restaurant}
				<div class="space-y-2">
					<div class="flex items-center justify-start gap-3">
						<h3 class="font-medium">{restaurant.name}</h3>
						<a
							href={restaurant.menuLink}
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm text-primary hover:underline flex items-center gap-1"
						>
							<Utensils size={16} />
							<span> View Menu </span>
						</a>
					</div>
					<OrderForm
						restaurantId={restaurant.id}
						restaurantName={restaurant.name}
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
