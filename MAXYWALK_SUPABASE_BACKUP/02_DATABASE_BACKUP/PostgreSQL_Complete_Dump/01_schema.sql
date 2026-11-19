-- =============================================================================
-- MAXYWALK E-COMMERCE — PRODUCTION DATABASE SCHEMA DUMP
-- SOURCE: Supabase PostgreSQL (Project ID: xivorcuooskcqhvevphp)
-- TARGET: Neon Serverless PostgreSQL / Standard PostgreSQL 14+
-- GENERATED: 2026-11-19
-- =============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- TABLE: products
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'slippers',
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    sizes JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    stock INTEGER DEFAULT 10,
    featured BOOLEAN DEFAULT FALSE,
    material VARCHAR(100) DEFAULT 'Full-Grain Leather',
    badge VARCHAR(100),
    rating NUMERIC(3, 2) DEFAULT 5.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products (featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products (created_at DESC);

-- -----------------------------------------------------------------------------
-- TABLE: customers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id VARCHAR(255) PRIMARY KEY,
    uid UUID,
    name TEXT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);
CREATE INDEX IF NOT EXISTS idx_customers_uid ON public.customers (uid);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers (created_at DESC);

-- -----------------------------------------------------------------------------
-- TABLE: orders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(100) UNIQUE NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
    payment_method VARCHAR(50) DEFAULT 'cod',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders (order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders (user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
