# MAXYWALK — DATABASE ENTITY RELATIONSHIPS

```mermaid
erDiagram
    CUSTOMERS ||--o{ ORDERS : "places (user_email = email)"
    PRODUCTS ||--o{ ORDER_ITEMS : "referenced in (items.productId = id)"
    ORDERS ||--|{ ORDER_ITEMS : "contains (embedded in items JSONB)"

    CUSTOMERS {
        string id PK
        uuid uid "Supabase Auth UID"
        string email UK "Case-insensitive unique email"
        string name "Customer Full Name"
        string phone "WhatsApp Contact"
        timestamptz created_at
    }

    PRODUCTS {
        string id PK "Product identifier (mwjcr-01)"
        string name "Product title"
        string category "slippers / sandals / belts / wallets"
        numeric price "Selling price"
        numeric original_price "MRP strikethrough"
        jsonb sizes "Supported shoe sizes"
        jsonb colors "Supported color finishes"
        jsonb images "Product gallery images"
        int stock "Available inventory"
        boolean featured "Featured showcase flag"
        timestamptz created_at
    }

    ORDERS {
        string id PK "order-<timestamp>"
        string order_id UK "MW-XXXXXX-XXX"
        string user_email FK "References CUSTOMERS(email)"
        jsonb items "Array of ordered products"
        numeric total "Total order amount"
        string status "placed | confirmed | crafting | dispatched | delivered"
        jsonb shipping_address "Delivery address & expected delivery date"
        string payment_method "cod"
        timestamptz created_at
    }
```

## Relational Characteristics
1. **Denormalized Order Items**:
   - In accordance with modern e-commerce best practices, line items are stored as a JSONB array inside `orders.items`. This preserves immutable historical snapshots of product title, size, color, unit price, and image at the exact time of purchase, preventing historical order corruption if a product's price or description changes later.
2. **Denormalized Shipping Address**:
   - `orders.shipping_address` contains customer delivery details including street, city, state, pincode, phone number, and `expected_delivery_date`.
3. **Customer to Order Relationship**:
   - Joined via `orders.user_email = customers.email`.
   - Supports both authenticated customer orders and guest checkouts seamlessly.
