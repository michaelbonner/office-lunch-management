import { and, count, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { lunchSelection, restaurant, restaurantVote } from '../../../drizzle/schema';
import { getTodayDate } from './opt-in';

export type VoteType = 'up' | 'down';

export async function submitVote(
	userId: string,
	restaurantId: string,
	organizationId: string,
	voteType: VoteType,
	date?: string
): Promise<void> {
	const voteDate = date ?? getTodayDate();
	const id = crypto.randomUUID();

	await db
		.insert(restaurantVote)
		.values({ id, userId, restaurantId, organizationId, voteDate, voteType })
		.onConflictDoUpdate({
			target: [
				restaurantVote.userId,
				restaurantVote.restaurantId,
				restaurantVote.organizationId,
				restaurantVote.voteDate
			],
			set: { voteType, updatedAt: new Date().toISOString() }
		});
}

export async function removeVote(
	userId: string,
	restaurantId: string,
	organizationId: string,
	date?: string
): Promise<void> {
	const voteDate = date ?? getTodayDate();
	await db
		.delete(restaurantVote)
		.where(
			and(
				eq(restaurantVote.userId, userId),
				eq(restaurantVote.restaurantId, restaurantId),
				eq(restaurantVote.organizationId, organizationId),
				eq(restaurantVote.voteDate, voteDate)
			)
		);
}

export async function getUserVotesForDate(
	userId: string,
	organizationId: string,
	date?: string
): Promise<{ restaurantId: string; voteType: VoteType }[]> {
	const voteDate = date ?? getTodayDate();
	const votes = await db
		.select({ restaurantId: restaurantVote.restaurantId, voteType: restaurantVote.voteType })
		.from(restaurantVote)
		.where(
			and(
				eq(restaurantVote.userId, userId),
				eq(restaurantVote.organizationId, organizationId),
				eq(restaurantVote.voteDate, voteDate)
			)
		);
	return votes as { restaurantId: string; voteType: VoteType }[];
}

export async function getVoteTalliesForDate(
	organizationId: string,
	date?: string
): Promise<
	{
		restaurantId: string;
		restaurantName: string;
		menuLink: string;
		upVotes: number;
		downVotes: number;
	}[]
> {
	const voteDate = date ?? getTodayDate();

	const restaurants = await db
		.select({ id: restaurant.id, name: restaurant.name, menuLink: restaurant.menuLink })
		.from(restaurant)
		.where(eq(restaurant.organizationId, organizationId))
		.orderBy(restaurant.name);

	if (restaurants.length === 0) return [];

	const tallies = await db
		.select({
			restaurantId: restaurantVote.restaurantId,
			voteType: restaurantVote.voteType,
			voteCount: count()
		})
		.from(restaurantVote)
		.where(
			and(eq(restaurantVote.organizationId, organizationId), eq(restaurantVote.voteDate, voteDate))
		)
		.groupBy(restaurantVote.restaurantId, restaurantVote.voteType);

	return restaurants.map((r) => {
		const up = tallies.find((t) => t.restaurantId === r.id && t.voteType === 'up')?.voteCount ?? 0;
		const down =
			tallies.find((t) => t.restaurantId === r.id && t.voteType === 'down')?.voteCount ?? 0;
		return {
			restaurantId: r.id,
			restaurantName: r.name,
			menuLink: r.menuLink,
			upVotes: Number(up),
			downVotes: Number(down)
		};
	});
}

export async function getLunchSelection(
	organizationId: string,
	date?: string
): Promise<{ restaurantId: string; restaurantName: string; menuLink: string } | null> {
	const selectionDate = date ?? getTodayDate();
	const result = await db
		.select({
			restaurantId: lunchSelection.restaurantId,
			restaurantName: restaurant.name,
			menuLink: restaurant.menuLink
		})
		.from(lunchSelection)
		.innerJoin(restaurant, eq(restaurant.id, lunchSelection.restaurantId))
		.where(
			and(
				eq(lunchSelection.organizationId, organizationId),
				eq(lunchSelection.selectionDate, selectionDate)
			)
		)
		.limit(1);
	return result[0] ?? null;
}

export async function setLunchSelection(
	selectedByUserId: string,
	organizationId: string,
	restaurantId: string,
	date?: string
): Promise<void> {
	const selectionDate = date ?? getTodayDate();
	const id = crypto.randomUUID();
	await db
		.insert(lunchSelection)
		.values({ id, organizationId, restaurantId, selectionDate, selectedByUserId })
		.onConflictDoUpdate({
			target: [lunchSelection.organizationId, lunchSelection.selectionDate],
			set: { restaurantId, selectedByUserId, updatedAt: new Date().toISOString() }
		});
}

export async function clearLunchSelection(organizationId: string, date?: string): Promise<void> {
	const selectionDate = date ?? getTodayDate();
	await db
		.delete(lunchSelection)
		.where(
			and(
				eq(lunchSelection.organizationId, organizationId),
				eq(lunchSelection.selectionDate, selectionDate)
			)
		);
}
