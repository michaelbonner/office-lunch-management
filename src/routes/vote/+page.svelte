<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type VoteType = 'up' | 'down';

	// Initialize votes and position once from server data (not reactive — intentional snapshot)
	function buildInitialState() {
		const init: Record<string, VoteType | null> = {};
		for (const r of data.restaurants) init[r.id] = null;
		for (const v of data.userVotes) init[v.restaurantId] = v.voteType as VoteType;
		const firstUnvoted = data.restaurants.findIndex((r) => init[r.id] === null);
		return { init, startIndex: firstUnvoted === -1 ? data.restaurants.length : firstUnvoted };
	}

	const _initial = buildInitialState();
	let votes = $state<Record<string, VoteType | null>>(_initial.init);
	let currentIndex = $state(_initial.startIndex);
	let isDragging = $state(false);
	let dragX = $state(0);
	let dragStartX = $state(0);
	let exitDirection = $state<'left' | 'right' | null>(null);
	let isAnimating = $state(false);
	let error = $state<string | null>(null);
	const todaySelection = $derived(data.todaySelection);

	const SWIPE_THRESHOLD = 100;

	const allVoted = $derived(currentIndex >= data.restaurants.length);
	const currentRestaurant = $derived(!allVoted ? data.restaurants[currentIndex] : null);
	const nextRestaurant = $derived(
		currentIndex + 1 < data.restaurants.length ? data.restaurants[currentIndex + 1] : null
	);
	const rotation = $derived(isDragging ? dragX * 0.08 : 0);
	const overlayOpacity = $derived(Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1));

	// Card transform: slide out when exitDirection set, otherwise follow drag
	const cardTransform = $derived(
		exitDirection === 'left'
			? 'translateX(-150%) rotate(-22deg)'
			: exitDirection === 'right'
				? 'translateX(150%) rotate(22deg)'
				: `translateX(${dragX}px) rotate(${rotation}deg)`
	);
	const cardTransition = $derived(
		isDragging
			? 'none'
			: exitDirection
				? 'transform 0.35s ease-in, opacity 0.35s ease-in'
				: 'transform 0.2s ease-out'
	);
	const cardOpacity = $derived(exitDirection ? 0 : 1);

	function handlePointerDown(e: PointerEvent) {
		if (isAnimating || allVoted || !currentRestaurant) return;
		isDragging = true;
		dragStartX = e.clientX;
		dragX = 0;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		dragX = e.clientX - dragStartX;
	}

	function handlePointerUp() {
		if (!isDragging) return;
		isDragging = false;
		if (Math.abs(dragX) >= SWIPE_THRESHOLD) {
			commitVote(dragX > 0 ? 'up' : 'down');
		} else {
			dragX = 0;
		}
	}

	async function commitVote(voteType: VoteType) {
		if (!currentRestaurant || isAnimating) return;
		const restaurantId = currentRestaurant.id;

		isAnimating = true;
		exitDirection = voteType === 'up' ? 'right' : 'left';
		votes = { ...votes, [restaurantId]: voteType };

		try {
			const res = await fetch('/api/votes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ restaurantId, voteType })
			});
			if (!res.ok) throw new Error('Failed');
		} catch {
			error = 'Failed to save vote. Please try again.';
			votes = { ...votes, [restaurantId]: null };
			isAnimating = false;
			exitDirection = null;
			dragX = 0;
			return;
		}

		await new Promise((r) => setTimeout(r, 380));
		currentIndex++;
		// Skip restaurants already voted on (e.g. returning with a partial ballot)
		while (
			currentIndex < data.restaurants.length &&
			votes[data.restaurants[currentIndex].id] !== null
		) {
			currentIndex++;
		}
		exitDirection = null;
		dragX = 0;
		isAnimating = false;
	}

	async function changeVote(restaurantId: string, newVoteType: VoteType | null) {
		const prevVote = votes[restaurantId];
		votes = { ...votes, [restaurantId]: newVoteType };

		try {
			if (newVoteType === null) {
				const res = await fetch('/api/votes', {
					method: 'DELETE',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ restaurantId })
				});
				if (!res.ok) throw new Error();
			} else {
				const res = await fetch('/api/votes', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ restaurantId, voteType: newVoteType })
				});
				if (!res.ok) throw new Error();
			}
		} catch {
			votes = { ...votes, [restaurantId]: prevVote };
		}
	}
</script>

<svelte:head>
	<title>Vote for Lunch · Office Lunch</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-8">
	<!-- Today's winner banner -->
	{#if todaySelection}
		<div
			class="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4"
		>
			<div>
				<p class="text-xs font-semibold uppercase tracking-wider text-green-700">
					🎉 Today's Lunch
				</p>
				<p class="mt-0.5 text-xl font-bold text-green-900">{todaySelection.restaurantName}</p>
				<a
					href={todaySelection.menuLink}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-1 inline-block text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-900"
				>
					View Menu →
				</a>
			</div>
		</div>
	{/if}

	<div class="mb-6 flex items-end justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Vote for Lunch</h1>
			<p class="mt-1 text-sm text-gray-500">
				{#if data.restaurants.length === 0}
					No restaurants yet
				{:else if !allVoted}
					{currentIndex + 1} of {data.restaurants.length} · Swipe or tap to vote
				{:else}
					All done ·
					<span class="text-green-700"
						>{Object.values(votes).filter((v) => v === 'up').length} liked</span
					>,
					<span class="text-red-600"
						>{Object.values(votes).filter((v) => v === 'down').length} disliked</span
					>
				{/if}
			</p>
		</div>
		{#if data.isAdmin}
			<a
				href="/admin/voting"
				class="rounded-lg border border-[#9e5b27]/30 bg-[#9e5b27]/10 px-3 py-1.5 text-sm font-medium text-[#9e5b27] transition-colors hover:bg-[#9e5b27]/20"
			>
				Results
			</a>
		{/if}
	</div>

	{#if data.restaurants.length === 0}
		<div class="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">
			<p class="text-4xl">🍽️</p>
			<p class="mt-3 font-medium">No restaurants available for voting yet.</p>
			<p class="mt-1 text-sm">Ask your admin to add some.</p>
		</div>
	{:else if !allVoted}
		<!-- Progress bar -->
		<div class="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
			<div
				class="h-full rounded-full bg-[#9e5b27] transition-all duration-300"
				style="width: {(currentIndex / data.restaurants.length) * 100}%"
			></div>
		</div>

		<!-- Card stack -->
		<div class="relative mb-6 h-72">
			<!-- Background card (next restaurant) -->
			{#if nextRestaurant}
				<div
					class="absolute inset-0 rounded-2xl border border-gray-200 bg-white shadow-sm"
					style="transform: scale(0.95) translateY(10px)"
				></div>
			{/if}

			<!-- Current card -->
			<div
				class="absolute inset-0 cursor-grab select-none overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md active:cursor-grabbing"
				style="transform: {cardTransform}; transition: {cardTransition}; opacity: {cardOpacity};"
				onpointerdown={handlePointerDown}
				onpointermove={handlePointerMove}
				onpointerup={handlePointerUp}
				onpointercancel={handlePointerUp}
				role="none"
			>
				<!-- LIKE overlay -->
				{#if dragX > 10}
					<div
						class="pointer-events-none absolute left-5 top-5 rounded-xl border-4 border-green-500 px-3 py-1 text-xl font-black text-green-500"
						style="opacity: {overlayOpacity}; transform: rotate(-12deg)"
					>
						LIKE
					</div>
				{/if}

				<!-- NOPE overlay -->
				{#if dragX < -10}
					<div
						class="pointer-events-none absolute right-5 top-5 rounded-xl border-4 border-red-500 px-3 py-1 text-xl font-black text-red-500"
						style="opacity: {overlayOpacity}; transform: rotate(12deg)"
					>
						NOPE
					</div>
				{/if}

				<!-- Card content -->
				<div class="flex h-full flex-col items-center justify-center p-8 text-center">
					<div class="mb-4 text-6xl">🍽️</div>
					<h2 class="text-2xl font-bold text-gray-900">{currentRestaurant?.name}</h2>
					{#if currentRestaurant?.menuLink}
						<a
							href={currentRestaurant.menuLink}
							target="_blank"
							rel="noopener noreferrer"
							onclick={(e) => e.stopPropagation()}
							class="mt-2 text-sm font-medium text-[#9e5b27] underline underline-offset-2 hover:text-[#7d4820]"
						>
							View Menu
						</a>
					{/if}
				</div>
			</div>
		</div>

		{#if error}
			<p class="mb-3 text-center text-sm text-red-600">{error}</p>
		{/if}

		<!-- Vote buttons -->
		<div class="flex items-center justify-center gap-8">
			<button
				onclick={() => commitVote('down')}
				disabled={isAnimating}
				aria-label="Thumbs down — skip this restaurant"
				class="flex size-16 items-center justify-center rounded-full border-2 border-red-200 bg-white text-3xl shadow-sm transition-all hover:scale-110 hover:border-red-400 hover:bg-red-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
			>
				👎
			</button>
			<button
				onclick={() => commitVote('up')}
				disabled={isAnimating}
				aria-label="Thumbs up — like this restaurant"
				class="flex size-16 items-center justify-center rounded-full border-2 border-green-200 bg-white text-3xl shadow-sm transition-all hover:scale-110 hover:border-green-400 hover:bg-green-50 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
			>
				👍
			</button>
		</div>

		<p class="mt-4 text-center text-xs text-gray-400">Swipe right to like · Swipe left to skip</p>
	{:else}
		<!-- All voted summary -->
		<div class="rounded-xl border border-gray-200 bg-white shadow-sm">
			<div class="border-b border-gray-100 px-5 py-4">
				<p class="font-semibold text-gray-800">Your votes for today</p>
			</div>
			<ul class="divide-y divide-gray-50">
				{#each data.restaurants as r (r.id)}
					<li class="flex items-center gap-4 px-5 py-3.5">
						<div class="min-w-0 flex-1">
							<p class="truncate font-medium text-gray-800">{r.name}</p>
							{#if r.menuLink}
								<a
									href={r.menuLink}
									target="_blank"
									rel="noopener noreferrer"
									class="text-xs text-[#9e5b27] hover:underline"
								>
									View Menu
								</a>
							{/if}
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<button
								onclick={() => changeVote(r.id, votes[r.id] === 'up' ? null : 'up')}
								aria-label="Like {r.name}"
								class="flex size-9 items-center justify-center rounded-full border text-lg transition-all {votes[
									r.id
								] === 'up'
									? 'border-green-400 bg-green-50 shadow-sm'
									: 'border-gray-200 hover:border-green-300 hover:bg-green-50'}"
							>
								👍
							</button>
							<button
								onclick={() => changeVote(r.id, votes[r.id] === 'down' ? null : 'down')}
								aria-label="Dislike {r.name}"
								class="flex size-9 items-center justify-center rounded-full border text-lg transition-all {votes[
									r.id
								] === 'down'
									? 'border-red-400 bg-red-50 shadow-sm'
									: 'border-gray-200 hover:border-red-300 hover:bg-red-50'}"
							>
								👎
							</button>
						</div>
					</li>
				{/each}
			</ul>
		</div>

		{#if data.isAdmin}
			<div class="mt-5 text-center">
				<a
					href="/admin/voting"
					class="inline-block rounded-lg bg-[#9e5b27] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7d4820]"
				>
					View Results & Select Winner
				</a>
			</div>
		{/if}
	{/if}
</div>
