import { sql } from 'drizzle-orm';
import { pgTable, foreignKey, unique, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';

export const optIn = pgTable(
	'opt_in',
	{
		id: text().primaryKey().notNull(),
		userId: text('user_id').notNull(),
		organizationId: text('organization_id').notNull(),
		optInDate: text('opt_in_date').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'opt_in_userId_fkey'
		}).onDelete('cascade'),
		unique('opt_in_user_id_organization_id_opt_in_date_unique').on(
			table.userId,
			table.organizationId,
			table.optInDate
		)
	]
);

export const session = pgTable(
	'session',
	{
		id: text().primaryKey().notNull(),
		expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
		token: text().notNull(),
		createdAt: timestamp({ withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
		ipAddress: text(),
		userAgent: text(),
		userId: text().notNull(),
		impersonatedBy: text(),
		activeOrganizationId: text()
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'session_userId_fkey'
		}).onDelete('cascade'),
		unique('session_token_key').on(table.token)
	]
);

export const account = pgTable(
	'account',
	{
		id: text().primaryKey().notNull(),
		accountId: text().notNull(),
		providerId: text().notNull(),
		userId: text().notNull(),
		accessToken: text(),
		refreshToken: text(),
		idToken: text(),
		accessTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
		refreshTokenExpiresAt: timestamp({ withTimezone: true, mode: 'string' }),
		scope: text(),
		password: text(),
		createdAt: timestamp({ withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ withTimezone: true, mode: 'string' }).notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'account_userId_fkey'
		}).onDelete('cascade')
	]
);

export const verification = pgTable('verification', {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp({ withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp({ withTimezone: true, mode: 'string' })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull()
});

export const user = pgTable(
	'user',
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		email: text().notNull(),
		emailVerified: boolean().notNull(),
		image: text(),
		createdAt: timestamp({ withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		role: text(),
		banned: boolean(),
		banReason: text(),
		banExpires: timestamp({ withTimezone: true, mode: 'string' })
	},
	(table) => [unique('user_email_key').on(table.email)]
);

export const restaurant = pgTable(
	'restaurant',
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		menuLink: text('menu_link').notNull(),
		organizationId: text('organization_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: 'restaurant_organization_id_fkey'
		}).onDelete('cascade'),
		index('restaurant_organizationId_idx').using(
			'btree',
			table.organizationId.asc().nullsLast().op('text_ops')
		)
	]
);

export const order = pgTable(
	'order',
	{
		id: text().primaryKey().notNull(),
		userId: text('user_id').notNull(),
		restaurantId: text('restaurant_id').notNull(),
		orderDetails: text('order_details').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: 'order_restaurant_id_restaurant_id_fk'
		}).onDelete('cascade'),
		unique('order_user_id_restaurant_id_unique').on(table.userId, table.restaurantId)
	]
);

export const organization = pgTable(
	'organization',
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		slug: text().notNull(),
		logo: text(),
		createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull().defaultNow(),
		metadata: text(),
		workEmailDomain: text('work_email_domain')
	},
	(table) => [
		unique('organization_slug_key').on(table.slug),
		index('organization_work_email_domain_idx').using(
			'btree',
			table.workEmailDomain.asc().nullsLast().op('text_ops')
		)
	]
);

export const member = pgTable(
	'member',
	{
		id: text().primaryKey().notNull(),
		organizationId: text().notNull(),
		userId: text().notNull(),
		role: text().notNull(),
		createdAt: timestamp({ withTimezone: true, mode: 'string' }).notNull().defaultNow()
	},
	(table) => [
		unique('member_user_org_unique').on(table.userId, table.organizationId),
		index('member_organizationId_idx').using(
			'btree',
			table.organizationId.asc().nullsLast().op('text_ops')
		),
		index('member_userId_idx').using('btree', table.userId.asc().nullsLast().op('text_ops')),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: 'member_organizationId_fkey'
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'member_userId_fkey'
		}).onDelete('cascade')
	]
);

export const invitation = pgTable(
	'invitation',
	{
		id: text().primaryKey().notNull(),
		organizationId: text().notNull(),
		email: text().notNull(),
		role: text(),
		status: text().notNull(),
		expiresAt: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
		createdAt: timestamp({ withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		inviterId: text().notNull()
	},
	(table) => [
		index('invitation_email_idx').using('btree', table.email.asc().nullsLast().op('text_ops')),
		index('invitation_organizationId_idx').using(
			'btree',
			table.organizationId.asc().nullsLast().op('text_ops')
		),
		foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organization.id],
			name: 'invitation_organizationId_fkey'
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.inviterId],
			foreignColumns: [user.id],
			name: 'invitation_inviterId_fkey'
		}).onDelete('cascade')
	]
);

export const apiToken = pgTable(
	'api_token',
	{
		id: text().primaryKey().notNull(),
		userId: text('user_id').notNull(),
		token: text().notNull(),
		encryptedToken: text('encrypted_token'),
		tokenPreview: text('token_preview'),
		name: text().notNull(),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true, mode: 'string' }),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: 'api_token_userId_fkey'
		}).onDelete('cascade'),
		unique('api_token_token_key').on(table.token),
		index('api_token_userId_idx').using('btree', table.userId.asc().nullsLast().op('text_ops'))
	]
);
