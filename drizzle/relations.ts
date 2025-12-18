import { relations } from "drizzle-orm/relations";
import { user, optIn, session, account, restaurant, order, organization, member, invitation } from "./schema";

export const optInRelations = relations(optIn, ({one}) => ({
	user: one(user, {
		fields: [optIn.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	optIns: many(optIn),
	sessions: many(session),
	accounts: many(account),
	members: many(member),
	invitations: many(invitation),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
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

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	members: many(member),
	invitations: many(invitation),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
}));