<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Utensils } from '@lucide/svelte';

	interface Props {
		restaurantId: string;
		restaurantName: string;
		restaurantMenuLink: string;
		existingOrder?: string;
		onSuccess?: () => void;
	}

	let {
		restaurantId,
		restaurantName,
		restaurantMenuLink,
		existingOrder = '',
		onSuccess
	}: Props = $props();

	let orderDetails = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	$effect(() => {
		orderDetails = existingOrder;
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		success = false;

		try {
			const response = await fetch('/api/orders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ restaurantId, orderDetails })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to save order');
			}

			success = true;
			setTimeout(() => {
				success = false;
			}, 3000);

			if (onSuccess) {
				onSuccess();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		if (!confirm('Are you sure you want to delete this order?')) {
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch(`/api/orders?restaurantId=${restaurantId}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to delete order');
			}

			orderDetails = '';
			success = true;
			setTimeout(() => {
				success = false;
			}, 3000);

			if (onSuccess) {
				onSuccess();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="rounded-lg bg-white/70 backdrop-blur-sm p-4 border-2 border-yellow-900/20">
	<div class="flex items-center justify-between gap-3 mb-6">
		<h3 class="font-medium">{restaurantName}</h3>
		<Button
			href={restaurantMenuLink}
			target="_blank"
			rel="noopener noreferrer"
			variant="outline"
			size="sm"
		>
			<Utensils size={16} />
			<span> View Menu </span>
		</Button>
	</div>

	<form onsubmit={handleSubmit} class="space-y-3">
		<div>
			<label for="order-{restaurantId}" class="mb-1.5 block text-sm font-medium">
				Your Order
			</label>
			<textarea
				id="order-{restaurantId}"
				bind:value={orderDetails}
				required
				disabled={loading}
				rows="3"
				class="w-full resize-y rounded-md bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50 border-gray-400/50 min-h-[140px]"
				placeholder="Enter your lunch order..."
			></textarea>
		</div>

		{#if error}
			<div class="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
				{error}
			</div>
		{/if}

		{#if success}
			<div class="rounded-md bg-green-500/10 p-2 text-sm text-green-600">
				Order saved successfully!
			</div>
		{/if}

		<div class="flex gap-2">
			<Button type="submit" disabled={loading} size="sm">
				{#snippet children()}
					{loading ? 'Saving...' : existingOrder ? 'Update Order' : 'Save Order'}
				{/snippet}
			</Button>

			{#if existingOrder}
				<Button
					type="button"
					variant="destructive"
					size="sm"
					disabled={loading}
					onclick={handleDelete}
				>
					{#snippet children()}
						Delete
					{/snippet}
				</Button>
			{/if}
		</div>
	</form>
</div>
