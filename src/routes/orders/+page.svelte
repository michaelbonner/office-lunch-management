<script lang="ts">
	import OrderForm from '$lib/components/OrderForm.svelte';
	import OrganizationSelector from '$lib/components/OrganizationSelector.svelte';
	import RestaurantSuggestionForm from '$lib/components/RestaurantSuggestionForm.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import type { PageData } from './$types';

	let { data = $bindable() }: { data: PageData } = $props();
	let activeOrganization = $derived(
		data.userOrganizations?.find((org) => org.id === data.activeOrganizationId) ?? null
	);
	let dietaryPreferences = $state(data.userProfile?.dietaryPreferences ?? '');
	let allergyNotes = $state(data.userProfile?.allergyNotes ?? '');
	let profileLoading = $state(false);
	let profileError = $state('');
	let profileSuccess = $state(false);

	async function refreshOrders() {
		const response = await fetch('/api/orders');
		if (response.ok) {
			const orders = (await response.json()) as Array<{
				restaurantId: string;
				orderDetails: string;
			}>;
			data.orders = new Map(orders.map((order) => [order.restaurantId, order.orderDetails]));
		}
	}

	async function saveDietaryProfile(event: Event) {
		event.preventDefault();
		profileLoading = true;
		profileError = '';
		profileSuccess = false;

		try {
			const response = await fetch('/api/user', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					dietaryPreferences,
					allergyNotes
				})
			});

			if (!response.ok) {
				const result = await response.json();
				throw new Error(result.message || 'Failed to save dietary profile');
			}

			data.userProfile = {
				dietaryPreferences: dietaryPreferences.trim() || null,
				allergyNotes: allergyNotes.trim() || null
			};
			profileSuccess = true;
			setTimeout(() => {
				profileSuccess = false;
			}, 3000);
		} catch (err) {
			profileError = err instanceof Error ? err.message : 'Failed to save dietary profile';
		} finally {
			profileLoading = false;
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
			<div class="mt-4">
				<RestaurantSuggestionForm organizationName={activeOrganization?.name} />
			</div>
		</div>
		<OrganizationSelector
			organizations={data.userOrganizations || []}
			activeOrganizationId={data.activeOrganizationId}
		/>
	</div>

	<details class="mb-8 rounded-lg border-2 border-yellow-900/20 bg-white/70 backdrop-blur-sm">
		<summary class="cursor-pointer list-none p-6">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h2 class="text-xl font-semibold">Dietary Profile</h2>
					<p class="text-sm text-muted-foreground">
						Save dietary preferences and allergies once so admins can see them whenever lunch is
						ordered.
					</p>
				</div>
				<span class="text-sm font-medium text-muted-foreground">Expand</span>
			</div>
		</summary>

		<div class="border-t border-yellow-900/10 px-6 pb-6">
			<form onsubmit={saveDietaryProfile} class="space-y-4 pt-4">
				<div>
					<label for="dietary-preferences" class="mb-1.5 block text-sm font-medium">
						Dietary preferences
					</label>
					<input
						id="dietary-preferences"
						bind:value={dietaryPreferences}
						disabled={profileLoading}
						maxlength="500"
						class="w-full rounded-md border border-gray-400/50 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
						placeholder="Vegan, vegetarian, gluten free, kosher, halal..."
					/>
				</div>

				<div>
					<label for="allergy-notes" class="mb-1.5 block text-sm font-medium">
						Allergies or ingredients to avoid
					</label>
					<textarea
						id="allergy-notes"
						bind:value={allergyNotes}
						disabled={profileLoading}
						rows="3"
						maxlength="1000"
						class="min-h-[110px] w-full resize-y rounded-md border border-gray-400/50 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
						placeholder="Peanuts, shellfish, beans, berries, dairy, cross-contact concerns..."
					></textarea>
				</div>

				{#if profileError}
					<div class="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
						{profileError}
					</div>
				{/if}

				{#if profileSuccess}
					<div class="rounded-md bg-green-500/10 p-2 text-sm text-green-600">
						Dietary profile saved.
					</div>
				{/if}

				<div class="flex justify-end">
					<Button type="submit" size="sm" disabled={profileLoading}>
						{profileLoading ? 'Saving...' : 'Save Dietary Profile'}
					</Button>
				</div>
			</form>
		</div>
	</details>

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
			{#each data.restaurants as restaurant (restaurant.id)}
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
		<Button variant="outline" href="/">← Back to Home</Button>
	</div>
</div>
