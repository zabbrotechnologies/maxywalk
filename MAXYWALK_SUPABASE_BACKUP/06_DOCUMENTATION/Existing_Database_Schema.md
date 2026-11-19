# MAXYWALK — EXISTING SUPABASE DATABASE SCHEMA SPECIFICATION

## 1. Overview
The MaxyWalk e-commerce database on Supabase consists of three primary application tables under the `public` schema:
1. `public.products` (Product Catalog)
2. `public.customers` (Customer Profiles & Auth Mapping)
3. `public.orders` (Order Fulfillment & Tracking)

---

## 2. Detailed Table Definitions

### Table: `public.products`
Stores footwear products, pricing, inventory, variants, ratings, and media.

| Column | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `VARCHAR(255)` | NO | Primary Key | Product slug or identifier (e.g. `mwjcr-01`) |
| `name` | `TEXT` | NO | — | Display product name (e.g. `MWJCR 01`) |
| `description` | `TEXT` | YES | — | Detailed handcrafted leather description |
| `category` | `VARCHAR(100)` | YES | `'slippers'` | Category (`slippers`, `sandals`, `belts`, `wallets`) |
| `price` | `NUMERIC(10,2)` | NO | — | Current selling price in INR |
| `original_price` | `NUMERIC(10,2)` | YES | NULL | Strikethrough / original MRP |
| `sizes` | `JSONB` | YES | `'[]'::jsonb` | Array of available sizes (e.g. `['6','7','8','9','10','11']`) |
| `colors` | `JSONB` | YES | `'[]'::jsonb` | Array of available color options |
| `images` | `JSONB` | YES | `'[]'::jsonb` | Array of image URLs or compressed JPEG base64 strings |
| `stock` | `INTEGER` | YES | `10` | Available stock inventory |
| `featured` | `BOOLEAN` | YES | `FALSE` | Featured collection display flag |
| `material` | `VARCHAR(100)` | YES | `'Full-Grain Leather'` | Leather type specification |
| `badge` | `VARCHAR(100)` | YES | NULL | Promotional badge (`Handcrafted`, `Limited Edition`) |
| `rating` | `NUMERIC(3,2)` | YES | `5.00` | Average star rating |
| `review_count` | `INTEGER` | YES | `0` | Number of verified customer reviews |
| `created_at` | `TIMESTAMPTZ` | YES | `NOW()` | Timestamp of creation |

### Table: `public.customers`
Stores customer profile records linked to Supabase Auth users.

| Column | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `VARCHAR(255)` | NO | Primary Key | Internal customer ID (e.g. `cust-1790272615080`) |
| `uid` | `UUID` | YES | NULL | Supabase Auth `auth.users.id` foreign reference |
| `name` | `TEXT` | NO | — | Customer full name |
| `email` | `VARCHAR(255)` | NO | UNIQUE | Customer email address (case-insensitive) |
| `phone` | `VARCHAR(50)` | YES | NULL | WhatsApp / mobile contact number |
| `created_at` | `TIMESTAMPTZ` | YES | `NOW()` | Registration timestamp |

### Table: `public.orders`
Stores order records, line items, recipient details, and fulfillment tracking status.

| Column | PostgreSQL Type | Nullable | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `VARCHAR(255)` | NO | Primary Key | Internal order ID (e.g. `order-1789113417027`) |
| `order_id` | `VARCHAR(100)` | NO | UNIQUE | Public customer order code (e.g. `MW-417027-52P`) |
| `user_email` | `VARCHAR(255)` | NO | — | Customer email matching `customers.email` |
| `items` | `JSONB` | NO | `'[]'::jsonb` | Line items array (`productId`, `name`, `price`, `qty`, `size`, `color`, `image`) |
| `total` | `NUMERIC(10,2)` | NO | `0.00` | Final payable amount |
| `status` | `VARCHAR(50)` | NO | `'pending'` | Status (`placed`, `confirmed`, `crafting`, `dispatched`, `delivered`, `cancelled`) |
| `shipping_address` | `JSONB` | NO | `'{}'::jsonb` | Address payload (`firstName`, `lastName`, `address`, `city`, `state`, `pincode`, `phone`, `expected_delivery_date`) |
| `payment_method` | `VARCHAR(50)` | NO | `'cod'` | Payment mode (`cod`) |
| `created_at` | `TIMESTAMPTZ` | YES | `NOW()` | Order placement timestamp |
