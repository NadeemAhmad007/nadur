import { pgTable, uuid, text, timestamp, integer, boolean, doublePrecision, json, uniqueIndex, index } from 'drizzle-orm/pg-core';
import type { Tariffs, HouseboatDetails, ShikaraDetails, ArtisanDetails } from '@/types';

export const operators = pgTable('operators', {
  id: uuid('id').defaultRandom().primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  user_id: uuid('user_id'),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: text('category', { enum: ['houseboat', 'shikara', 'artisan', 'guide', 'vendor'] }).notNull(),
  short_desc: text('short_desc'),
  long_desc: text('long_desc'),
  whatsapp: text('whatsapp').notNull(),
  email: text('email'),
  pricing_note: text('pricing_note'),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'suspended'] }).default('pending'),
  verified: boolean('verified').default(false),
  plan: text('plan', { enum: ['free', 'pro'] }).default('free'),
  lead_month: integer('lead_month').default(0),
  photos: text('photos').array(),
  tariffs: json('tariffs').$type<Tariffs | null>(),
  houseboat_details: json('houseboat_details').$type<HouseboatDetails | null>(),
  shikara_details: json('shikara_details').$type<ShikaraDetails | null>(),
  artisan_details: json('artisan_details').$type<ArtisanDetails | null>(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
}, (table) => [
  index('operators_category_status_idx').on(table.category, table.status),
  uniqueIndex('operators_slug_idx').on(table.slug),
]);

export const leads = pgTable('leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  operator_id: uuid('operator_id').notNull().references(() => operators.id, { onDelete: 'cascade' }),
  session_id: text('session_id').notNull(),
  source: text('source', { enum: ['profile', 'qr', 'search'] }).default('profile'),
}, (table) => [
  index('leads_operator_created_idx').on(table.operator_id, table.created_at),
]);

export const favorites = pgTable('favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  operator_id: uuid('operator_id').notNull().references(() => operators.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  otp: text('otp').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').default(0),
  verified: boolean('verified').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const phoneVerifications = pgTable('phone_verifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull(),
  otp: text('otp').notNull(),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').default(0),
  verified: boolean('verified').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const categories = pgTable('categories', {
  slug: text('slug').primaryKey(),
  label: text('label').notNull(),
  label_hi: text('label_hi'),
  icon: text('icon'),
  active: boolean('active').default(true),
  sort_order: integer('sort_order').default(0),
});
