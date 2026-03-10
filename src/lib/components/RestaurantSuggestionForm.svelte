<script lang="ts">
	import { X } from '@lucide/svelte';
	import { tick } from 'svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	interface Props {
		organizationName?: string;
	}

	let { organizationName }: Props = $props();

	let dialogElement = $state<HTMLDialogElement | null>(null);
	let nameInput = $state<HTMLInputElement | null>(null);
	let name = $state('');
	let menuLink = $state('');
	let notes = $state('');
	let loading = $state(false);
	let error = $state('');
	let successMessage = $state('');

	async function openDialog() {
		error = '';
		if (!dialogElement?.open) {
			dialogElement?.showModal();
		}
		await tick();
		nameInput?.focus();
	}

	function closeDialog() {
		dialogElement?.close();
		loading = false;
		error = '';
	}

	function handleDialogClick(event: MouseEvent) {
		if (event.target === dialogElement && !loading) {
			closeDialog();
		}
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		loading = true;
		error = '';
		successMessage = '';

		try {
			const response = await fetch('/api/restaurant-suggestions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name,
					menuLink,
					notes
				})
			});

			if (!response.ok) {
				const data = await response.json().catch(() => null);
				throw new Error(data?.message || 'Failed to send suggestion');
			}

			name = '';
			menuLink = '';
			notes = '';
			successMessage = 'Suggestion sent to the admins.';
			closeDialog();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to send suggestion';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex flex-col items-start gap-3">
	<div>
		<h2 class="text-lg font-semibold">Suggest a Restaurant</h2>
		<p class="text-sm text-muted-foreground">
			Send a restaurant request to the admins{organizationName ? ` for ${organizationName}` : ''}.
		</p>
	</div>

	<Button variant="outline" onclick={openDialog}>Suggest a Restaurant</Button>

	{#if successMessage}
		<div class="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600">
			{successMessage}
		</div>
	{/if}

	<dialog
		bind:this={dialogElement}
		class="backdrop:bg-black/60 backdrop:backdrop-blur-sm m-auto w-[min(calc(100%-2rem),32rem)] max-w-none rounded-xl border border-border bg-background p-0 text-foreground shadow-xl"
		onclick={handleDialogClick}
		onclose={() => {
			error = '';
		}}
	>
		<div class="border-b px-6 py-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h3 class="text-lg font-semibold">Suggest a Restaurant</h3>
					<p class="mt-1 text-sm text-muted-foreground">
						Include a menu link so admins can review and approve it quickly
						{organizationName ? ` for ${organizationName}` : ''}.
					</p>
				</div>
				<button
					type="button"
					onclick={closeDialog}
					class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					aria-label="Close dialog"
				>
					<X size={16} />
				</button>
			</div>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4 px-6 py-5">
			<div>
				<label for="suggestion-name" class="mb-1.5 block text-sm font-medium">
					Restaurant Name
				</label>
				<input
					id="suggestion-name"
					bind:this={nameInput}
					type="text"
					bind:value={name}
					required
					disabled={loading}
					maxlength="120"
					class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
					placeholder="Enter the restaurant name"
				/>
			</div>

			<div>
				<label for="suggestion-menu-link" class="mb-1.5 block text-sm font-medium">
					Menu Link
				</label>
				<input
					id="suggestion-menu-link"
					type="url"
					bind:value={menuLink}
					required
					disabled={loading}
					class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
					placeholder="https://example.com/menu"
				/>
			</div>

			<div>
				<label for="suggestion-notes" class="mb-1.5 block text-sm font-medium">
					Notes for Admins
				</label>
				<textarea
					id="suggestion-notes"
					bind:value={notes}
					disabled={loading}
					maxlength="1000"
					rows="4"
					class="w-full rounded-md border bg-background px-3 py-2 focus:ring-2 focus:ring-ring focus:outline-none disabled:opacity-50"
					placeholder="Optional details like cuisine, location, or popular dishes"
				></textarea>
			</div>

			{#if error}
				<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			{/if}

			<div class="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
				<Button type="button" variant="outline" onclick={closeDialog} disabled={loading}>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? 'Sending...' : 'Send Suggestion'}
				</Button>
			</div>
		</form>
	</dialog>
</div>
