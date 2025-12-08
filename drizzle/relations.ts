import { relations } from "drizzle-orm/relations";
import { user, session, account, restaurant, order } from "./schema";

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const orderRelations = relations(order, ({one}) => ({
	restaurant: one(restaurant, {
		fields: [order.restaurantId],
		references: [restaurant.id]
	}),
}));

export const restaurantRelations = relations(restaurant, ({many}) => ({
	orders: many(order),
}));