# MAXYWALK — AUTHENTICATION INVENTORY & DEPENDENCY REPORT

## 1. Executive Summary
- **Current Auth Engine**: Supabase Auth (GoTrue server)
- **Supabase Project ID**: `xivorcuooskcqhvevphp`
- **Total Registered Customers in Database**: 13 customer accounts
- **Critical Architectural Note**: **Neon is a pure serverless PostgreSQL database** and does **NOT** provide a built-in authentication engine, OAuth handler, JWT signing service, or user management API. Migrating the PostgreSQL data layer to Neon requires deliberately decoupling or migrating the authentication layer.

---

## 2. Authentication Methods Currently Implemented

### A. Email & Password Authentication
- **Implementation**: [`client/src/pages/Login.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/pages/Login.jsx) & [`client/src/pages/Register.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/pages/Register.jsx)
- **Method**: `supabase.auth.signInWithPassword({ email, password })` and `supabase.auth.signUp({ email, password, options: { data: { name } } })`
- **Storage**: User credentials (hashed passwords, salt, email confirmation status) reside in the protected `auth.users` schema managed by Supabase GoTrue.

### B. Google OAuth
- **Implementation**: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })`
- **Handling**: Client-side OAuth flow managed via Supabase callback.

### C. Demo / Emergency Admin Bypass
- **Implementation**: In [`Login.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/pages/Login.jsx#L21) and [`authStore.js`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/store/authStore.js#L107):
  - Pre-configured login credentials (`admin@maxywalk.com` / `admin123`) invoke `loginAsDemoAdmin()` directly in the client Zustand store without sending network auth requests.

---

## 3. User Identity & Profile Relationship Model

```
                    ┌────────────────────────────┐
                    │     auth.users (UUID)      │
                    │  (Supabase Auth Internal)  │
                    └──────────────┬─────────────┘
                                   │
                           uid (1-to-1 / 1-to-0)
                                   │
                                   ▼
                    ┌────────────────────────────┐
                    │     public.customers       │
                    │  id: 'cust-<timestamp>'    │
                    │  uid: UUID                 │
                    │  email: unique string      │
                    │  name, phone, created_at   │
                    └──────────────┬─────────────┘
                                   │
                                   │ user_email (Logical FK)
                                   ▼
                    ┌────────────────────────────┐
                    │       public.orders        │
                    │  id: 'order-<timestamp>'   │
                    │  user_email                │
                    │  items, total, status      │
                    └────────────────────────────┘
```

1. **`auth.users.id` vs `customers.id`**:
   - `customers.id` uses client-generated string IDs (`cust-1790272615080`).
   - `customers.uid` stores the Supabase Auth UUID (`6c3a8e0b-d85b-4951-a691-50aec50048c6`).
   - The primary joining key across the client application is **`email`** (`user_email`).
2. **Current Registered Customer Profiles (13 Records Extracted)**:
   - `Rajesh .k` (`k.rajesh13042006@gmail.com`)
   - `Zabbro` (`zabbrotechnologies@gmail.com`)
   - `NARESH KUMAR M` (`nareshkumarm583225243063@nprcolleges.org`)
   - `Gokul Nath` (`gokul392005@gmail.com`)
   - `SANJAY S` (`s.sanjay.01.03.2006@gmail.com`, Phone: `8248957918`)
   - `Sanjay S` (`s.sanjayeffort@gmail.com`, Phone: `8248957918`)
   - `Ver Host` (`info.verhost@gmail.com`)
   - `muthu vel` (`muthuvelv3032@gmail.com`)
   - `prabhu prabu` (`prabhujake@gmail.com`)
   - `Adhithyan` (`adhithyanj07@gmail.com`, Phone: `+91 98765 43210`)
   - `Gowshigan V` (`gowshigan20805@gmail.com`)
   - `V. Kowshik` (`sathyakalasathyakala112@gmail.com`, Phone: `+91 98765 43210`)
   - `Sanjay .S` (`sanjaysamsung001@gmail.com`)

---

## 4. Role Authorization & Session Handling

- **Role Differentiation**:
  - The application uses client-evaluated role checks:
    ```javascript
    const isAdmin = storeIsAdmin || (user?.email && user.email.toLowerCase().includes('admin'));
    ```
  - Route guards: [`AdminRoute.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/components/AdminRoute.jsx) guards `/admin/*`, redirecting non-admins to `/`.
  - [`ProtectedRoute.jsx`](file:///c:/Users/TUF/Documents/client-project/maxywalk/client/src/components/ProtectedRoute.jsx) guards `/account`.
- **Client Session Persistence**:
  - Managed by Zustand `persist` middleware in `localStorage` under keys:
    - `maxywalk-auth`: user identity and profile
    - `maxywalk-user-carts`: user shopping bag items
    - `maxywalk-user-wishlists`: user wishlist items

---

## 5. Neon Migration Recommendations for Authentication

When migrating PostgreSQL database tables to Neon, choose one of the following architectural paths:

| Migration Option | Architecture | Pros | Migration Effort |
| :--- | :--- | :--- | :--- |
| **Option A (Recommended)** | **Keep Supabase Auth Standalone + Point DB to Neon** | Zero user password resets; Google OAuth keeps working instantly; `customers` table in Neon stores data. | Very Low |
| **Option B** | **Auth.js / NextAuth / Better-Auth on Vercel Backend** | 100% independent of Supabase; user credentials stored directly in Neon (`users`, `accounts`, `sessions` tables). | Moderate (Requires adding small API route backend on Vercel) |
| **Option C** | **Clerk / Firebase Auth** | Hosted auth service, pre-built components, drop-in React hooks. | Low-Moderate |
