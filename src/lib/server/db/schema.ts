import { pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

export const restaurant = pgTable('restaurant', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	menuLink: text('menu_link').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const order = pgTable(
	'order',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('user_id').notNull(),
		restaurantId: text('restaurant_id')
			.notNull()
			.references(() => restaurant.id, { onDelete: 'cascade' }),
		orderDetails: text('order_details').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => ({
		userRestaurantUnique: unique().on(table.userId, table.restaurantId)
	})
);
