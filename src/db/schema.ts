import { integer, pgTable, serial, text, timestamp, jsonb, numeric, boolean } from 'drizzle-orm/pg-core';

// Users table with Firebase Auth uid
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').default('customer'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Products table
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull(),
  barcode: text('barcode'),
  category: text('category').notNull(),
  collection: text('collection'),
  price: numeric('price').notNull(),
  costPrice: numeric('cost_price'),
  stock: integer('stock').notNull().default(0),
  lowStockThreshold: integer('low_stock_threshold').default(3),
  sizes: jsonb('sizes'),
  colors: jsonb('colors'),
  images: jsonb('images'),
  description: text('description'),
  fabric: text('fabric'),
  careInstructions: text('care_instructions'),
  isFeatured: boolean('is_featured').default(false),
  rating: numeric('rating').default('5.0'),
  reviewsCount: integer('reviews_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  source: text('source').notNull().default('online'),
  items: jsonb('items').notNull(),
  subtotal: numeric('subtotal').notNull(),
  discount: numeric('discount').default('0'),
  tax: numeric('tax').default('0'),
  shippingFee: numeric('shipping_fee').default('0'),
  total: numeric('total').notNull(),
  customer: jsonb('customer').notNull(),
  payment: jsonb('payment').notNull(),
  status: text('status').notNull().default('confirmed'),
  cashierName: text('cashier_name'),
  createdAt: timestamp('created_at').defaultNow(),
});
