<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Tally = (typeof data.tallies)[number];
	type Selection = typeof data.selection;

	const tallies = $derived(data.tallies);
	let selection = $state<Selection>(null);

	$effect(() => {
		selection = data.selection;
	});
	let isSelecting = $state<string | null>(null);
	let isClearing = $state(false);
	let error = $state<string | null>(null);

	const sortedTallies = $derived(
		[...tallies].sort((a, b) => b.upVotes - b.downVotes - (a.upVotes - a.downVotes))
	);

	function formatDate(dateStr: string) {
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		});
	}

	async function selectWinner(restaurantId: string) {
		isSelecting = restaurantId;
		error = null;

		try {
			const res = await fetch('/api/admin/lunch-selection', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ restaurantId })
			});
			if (!res.ok) throw new Error();

			const chosen = tallies.find((t) => t.restaurantId === restaurantId);
			if (chosen) {
				selection = {
					restaurantId: chosen.restaurantId,
					restaurantName: chosen.restaurantName,
					menuLink: chosen.menuLink
				};
			}
		} catch {
			error = 'Failed to set winner. Please try again.';
		} finally {
			isSelecting = null;
		}
	}

	async function clearWinner() {
		isClearing = true;
		error = null;

		try {
			const res = await fetch('/api/admin/lunch-selection', { method: 'DELETE' });
			if (!res.ok) throw new Error();
			selection = null;
		} catch {
			error = 'Failed to clear selection. Please try again.';
		} finally {
			isClearing = false;
		}
	}
</script>

<svelte:head>
	<title>Voting Results · Admin · Office Lunch</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8">
	<!-- Header -->
	<div class="mb-6 flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Voting Results</h1>
			<p class="mt-1 text-sm text-gray-500">{formatDate(data.todayDate)}</p>
		</div>
		<div class="flex shrink-0 gap-2">
			<a
				href="/vote"
				class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
			>
				← Vote
			</a>
			<a
				href="/admin"
				class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
			>
				Admin
			</a>
		</div>
	</div>

	<!-- Today's winner banner -->
	{#if selection}
		<div class="mb-6 rounded-xl border-2 border-green-400 bg-green-50 p-4">
			<div class="flex items-center justify-between gap-4">
				<div>
					<p class="text-xs font-semibold uppercase tracking-wider text-green-700">
						🎉 Today's Winner
					</p>
					<p class="mt-0.5 text-xl font-bold text-green-900">{selection.restaurantName}</p>
					<a
						href={selection.menuLink}
						target="_blank"
						rel="noopener noreferrer"
						class="text-sm text-green-700 underline underline-offset-2 hover:text-green-900"
					>
						View Menu →
					</a>
				</div>
				<button
					onclick={clearWinner}
					disabled={isClearing}
					class="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
				>
					{isClearing ? 'Clearing…' : 'Clear'}
				</button>
			</div>
		</div>
	{/if}

	{#if error}
		<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{error}
		</div>
	{/if}

	{#if tallies.length === 0}
		<div class="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">
			<p class="text-4xl">🍽️</p>
			<p class="mt-3 font-medium">No restaurants available.</p>
			<p class="mt-1 text-sm">
				<a href="/admin" class="text-[#9e5b27] hover:underline">Add some from the admin dashboard</a
				>.
			</p>
		</div>
	{:else}
		<!-- Vote summary stats -->
		{@const totalVotesAll = tallies.reduce((s, t) => s + t.upVotes + t.downVotes, 0)}
		<div class="mb-4 flex gap-4 text-sm text-gray-500">
			<span>{tallies.length} restaurants</span>
			<span>·</span>
			<span>{totalVotesAll} total votes</span>
		</div>

		<!-- Restaurant list sorted by net score -->
		<div class="space-y-3">
			{#each sortedTallies as tally, i (tally.restaurantId)}
				{@const isWinner = selection?.restaurantId === tally.restaurantId}
				{@const netScore = tally.upVotes - tally.downVotes}
				{@const total = tally.upVotes + tally.downVotes}
				{@const upPct = total > 0 ? (tally.upVotes / total) * 100 : 0}

				<div
					class="rounded-xl border p-4 transition-all {isWinner
						? 'border-green-400 bg-green-50 shadow-sm'
						: 'border-gray-200 bg-white'}"
				>
					<div class="flex items-center gap-3">
						<!-- Rank -->
						<div
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold {i ===
								0 && netScore > 0
								? 'bg-yellow-100 text-yellow-700'
								: 'bg-gray-100 text-gray-400'}"
						>
							{i + 1}
						</div>

						<!-- Info -->
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<p class="truncate font-semibold text-gray-900">{tally.restaurantName}</p>
								{#if isWinner}
									<span
										class="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
										>Winner ✓</span
									>
								{/if}
							</div>

							<div class="mt-1 flex items-center gap-3 text-sm">
								<span class="flex items-center gap-1 text-green-700">
									<span>👍</span>
									<span class="font-medium">{tally.upVotes}</span>
								</span>
								<span class="flex items-center gap-1 text-red-500">
									<span>👎</span>
									<span class="font-medium">{tally.downVotes}</span>
								</span>
								<span
									class="font-semibold {netScore > 0
										? 'text-green-700'
										: netScore < 0
											? 'text-red-600'
											: 'text-gray-400'}"
								>
									{netScore > 0 ? '+' : ''}{netScore}
								</span>
								{#if total > 0}
									<span class="text-gray-400">{total} vote{total !== 1 ? 's' : ''}</span>
								{:else}
									<span class="text-gray-400">No votes yet</span>
								{/if}
							</div>

							<!-- Up-vote progress bar -->
							{#if total > 0}
								<div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-red-100">
									<div
										class="h-full rounded-full bg-green-400 transition-all"
										style="width: {upPct}%"
									></div>
								</div>
							{/if}
						</div>

						<!-- Actions -->
						<div class="flex shrink-0 flex-col items-end gap-2">
							{#if tally.menuLink}
								<a
									href={tally.menuLink}
									target="_blank"
									rel="noopener noreferrer"
									class="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
								>
									Menu
								</a>
							{/if}
							<button
								onclick={() => selectWinner(tally.restaurantId)}
								disabled={!!isSelecting || isWinner}
								class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {isWinner
									? 'cursor-default bg-green-200 text-green-800'
									: 'bg-[#9e5b27] text-white hover:bg-[#7d4820] disabled:opacity-50'}"
							>
								{isSelecting === tally.restaurantId
									? 'Selecting…'
									: isWinner
										? '✓ Selected'
										: 'Select Winner'}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
