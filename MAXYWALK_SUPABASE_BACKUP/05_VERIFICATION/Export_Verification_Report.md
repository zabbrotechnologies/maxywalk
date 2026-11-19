# MAXYWALK — EXPORT VERIFICATION & INTEGRITY REPORT

## 1. Verification Summary
- **Verification Timestamp**: 2026-11-19
- **Extraction Protocol**: Read-only extraction via Supabase API and PostgreSQL client
- **Discrepancy Count**: **0 (Zero)**
- **Integrity Status**: **100% RECONCILED & VERIFIED**

---

## 2. Table-by-Table Reconciliation

| Table Name | Live Supabase Count | Exported JSON Count | Exported Excel Rows | Exported SQL INSERTs | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`products`** | 25 | 25 | 25 | 25 | **MATCH** |
| **`orders`** | 31 | 31 | 31 | 31 | **MATCH** |
| **`customers`** | 13 | 13 | 13 | 13 | **MATCH** |
| **TOTAL** | **69** | **69** | **69** | **69** | **100% MATCH** |

---

## 3. Data Integrity Checks Performed

1. **Primary Key Uniqueness**:
   - `products.id`: 25 unique IDs, 0 duplicates (`mwjcr-01` to `mwjcr-25`).
   - `customers.id`: 13 unique IDs, 0 duplicates.
   - `customers.email`: 13 unique emails, 0 duplicates.
   - `orders.id`: 31 unique internal IDs, 0 duplicates.
   - `orders.order_id`: 31 unique customer order codes (`MW-*`), 0 duplicates.

2. **Foreign Key & Relational Consistency**:
   - Every order has a valid `user_email`. Registered customers match their respective accounts; guest checkout orders are recorded with the checkout email address.
   - Every item in `orders.items` contains product identifiers, size selection, item pricing, and quantity.

3. **Complex Data Types & Payloads**:
   - All JSONB arrays (`products.sizes`, `products.colors`, `products.images`, `orders.items`, `orders.shipping_address`) were parsed, validated, and serialized without syntax errors or truncation.
   - Base64 images stored in `products.images` preserved exact byte lengths (verified uncorrupted).

4. **Timestamps & Timezones**:
   - All `created_at` timestamps preserve ISO-8601 formatting and UTC offsets (`+00:00`).
