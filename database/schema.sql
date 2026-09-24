-- =====================================================================
-- FLIND INDÚSTRIA & DISTRIBUIÇÃO - ESQUEMA RELACIONAL DE BANCO DE DADOS
-- Compatibilidade: PostgreSQL 14+, Supabase, Neon, Vercel Postgres, AWS RDS
-- =====================================================================

-- Extensão para UUIDs (caso suportado)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE FORNECEDORES HOMOLOGADOS
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(30) NOT NULL UNIQUE,
    state_registration VARCHAR(50) DEFAULT 'Isento',
    contact_name VARCHAR(150),
    phone VARCHAR(30),
    whatsapp VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    category VARCHAR(100) NOT NULL,
    lead_time_days INT NOT NULL DEFAULT 3,
    city VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
    state VARCHAR(10) NOT NULL DEFAULT 'SP',
    payment_terms VARCHAR(100) DEFAULT '30 DDL',
    status VARCHAR(50) NOT NULL DEFAULT 'HOMOLOGATED', -- 'HOMOLOGATED', 'ACTIVE', 'AUDIT_PENDING'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE PRODUTOS & INVENTÁRIO (CATÁLOGO TÉCNICO FLIND)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(100) PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    packaging_unit VARCHAR(50) NOT NULL, -- 'Caixa (CX)', 'Fardo (FD)', 'Pacote (PCT)', 'Rolo (RL)'
    units_per_package INT NOT NULL DEFAULT 1,
    unit_weight_kg NUMERIC(10, 4) NOT NULL DEFAULT 0.1,
    weight_per_package_kg NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
    manufacture_date DATE,
    expiry_date DATE,
    shelf_life_months INT DEFAULT 24,
    lot_number VARCHAR(100),
    current_stock_packages INT NOT NULL DEFAULT 0,
    current_stock_units INT NOT NULL DEFAULT 0,
    min_stock_packages INT NOT NULL DEFAULT 10,
    min_stock_units INT NOT NULL DEFAULT 100,
    reorder_quantity_packages INT NOT NULL DEFAULT 50,
    supplier_id VARCHAR(100) REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255),
    supplier_phone VARCHAR(30),
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    location VARCHAR(100) DEFAULT 'Doca Central',
    status VARCHAR(50) NOT NULL DEFAULT 'NORMAL', -- 'NORMAL', 'LOW', 'CRITICAL', 'OUT_OF_STOCK'
    auto_reorder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_restock_at TIMESTAMP WITH TIME ZONE,
    barcode VARCHAR(50),
    material TEXT,
    technical_specs TEXT,
    dimensions VARCHAR(150),
    grammage VARCHAR(50),
    anvisa_registration VARCHAR(100),
    packaging_dimensions VARCHAR(100),
    stacking_max INT DEFAULT 6,
    storage_conditions TEXT,
    flind_catalog_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE CLIENTES (B2B, HOSPITAIS, CLÍNICAS, SALÕES E E-COMMERCE)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(100) PRIMARY KEY,
    external_id VARCHAR(100),
    flind_web_id VARCHAR(100),
    flind_web_profile_url VARCHAR(255),
    flind_origin VARCHAR(50) DEFAULT 'DIRETO_B2B', -- 'FLIND_ECOMMERCE_WEB', 'SINK_ERP', 'TRAY', 'DIRETO_B2B', 'BALCAO'
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    segment VARCHAR(100) DEFAULT 'Hospitalar & Cirúrgico',
    tax_id VARCHAR(30) NOT NULL,
    state_registration VARCHAR(50),
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    contact_person VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA DE ENDEREÇOS DOS CLIENTES
CREATE TABLE IF NOT EXISTS customer_addresses (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL DEFAULT 'DELIVERY', -- 'FISCAL', 'BILLING', 'DELIVERY'
    street VARCHAR(255) NOT NULL,
    number VARCHAR(30) NOT NULL,
    complement VARCHAR(150),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(10) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'Brasil',
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. REGRAS DE ENTREGA OPERACIONAIS
CREATE TABLE IF NOT EXISTS delivery_rules (
    id VARCHAR(100) PRIMARY KEY,
    customer_id VARCHAR(100) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    address_id VARCHAR(100) REFERENCES customer_addresses(id) ON DELETE CASCADE,
    allowed_time_start VARCHAR(10) DEFAULT '08:00',
    allowed_time_end VARCHAR(10) DEFAULT '17:00',
    allowed_weekdays INT[] DEFAULT '{1,2,3,4,5}',
    requires_scheduling BOOLEAN DEFAULT FALSE,
    max_weight_kg NUMERIC(10, 2),
    vehicle_type_allowed VARCHAR(30) DEFAULT 'QUALQUER',
    entry_gate VARCHAR(50),
    contact_name VARCHAR(150),
    contact_phone VARCHAR(30),
    requires_documentation BOOLEAN DEFAULT FALSE,
    notes TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- 6. TABELA DE PEDIDOS DE VENDA
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id VARCHAR(100) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    origin VARCHAR(50) NOT NULL DEFAULT 'DIRETO_B2B',
    status VARCHAR(50) NOT NULL DEFAULT 'NEW',
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    freight_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    weight_total_kg NUMERIC(10, 2) DEFAULT 0.00,
    packages_count INT DEFAULT 1,
    delivery_address_id VARCHAR(100) REFERENCES customer_addresses(id),
    carrier_name VARCHAR(150),
    tracking_code VARCHAR(100),
    nfe_number VARCHAR(50),
    nfe_key VARCHAR(100),
    sla_status VARCHAR(50) DEFAULT 'ON_TIME',
    sla_deadline TIMESTAMP WITH TIME ZONE,
    estimated_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ITENS DO PEDIDO DE VENDA
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(100) REFERENCES products(id),
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 8. ORDENS DE COMPRA / RESSUPRIMENTO ATIVAS (PURCHASE ORDERS)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(100) PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_id VARCHAR(100) NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_whatsapp VARCHAR(30) NOT NULL,
    product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity_packages INT NOT NULL DEFAULT 1,
    quantity_units INT NOT NULL DEFAULT 1,
    packaging_unit VARCHAR(50) NOT NULL,
    estimated_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    trigger_reason VARCHAR(50) NOT NULL DEFAULT 'MANUAL', -- 'AUTO_LOW_STOCK', 'MANUAL_REORDER', 'MANUAL'
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT_WHATSAPP', 'CONFIRMED', 'DELIVERED', 'CANCELLED'
    whatsapp_message_id VARCHAR(100),
    notes TEXT,
    expected_delivery_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. HISTÓRICO DE ORDENS DE COMPRA CANCELADAS (ARQUIVO HISTÓRICO)
CREATE TABLE IF NOT EXISTS cancelled_purchase_orders (
    id VARCHAR(100) PRIMARY KEY,
    order_number VARCHAR(100) NOT NULL,
    supplier_id VARCHAR(100) REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_whatsapp VARCHAR(30),
    product_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
    product_sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity_packages INT NOT NULL,
    quantity_units INT NOT NULL,
    packaging_unit VARCHAR(50) NOT NULL,
    estimated_cost NUMERIC(12, 2) NOT NULL,
    trigger_reason VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'CANCELLED',
    cancel_reason TEXT,
    notes TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE
);

-- 10. CONTAS A RECEBER E CONCILIAÇÃO BANCÁRIA
CREATE TABLE IF NOT EXISTS receivables (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) REFERENCES orders(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_tax_id VARCHAR(30),
    customer_phone VARCHAR(30),
    document_number VARCHAR(100) NOT NULL,
    installment INT NOT NULL DEFAULT 1,
    total_installments INT NOT NULL DEFAULT 1,
    due_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED'
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_amount NUMERIC(12, 2),
    barcode_or_pix VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. EXPEDIÇÃO E RASTREAMENTO DE CARGAS
CREATE TABLE IF NOT EXISTS shipments (
    id VARCHAR(100) PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    tracking_code VARCHAR(100) NOT NULL,
    carrier VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'POSTED',
    dispatched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    driver_name VARCHAR(100),
    vehicle_plate VARCHAR(20),
    notes TEXT
);

-- 12. LOGS DE WHATSAPP OPERACIONAIS
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
    id VARCHAR(100) PRIMARY KEY,
    to_phone VARCHAR(30) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    direction VARCHAR(20) DEFAULT 'OUTBOUND',
    status VARCHAR(30) DEFAULT 'SENT', -- 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'
    provider_message_id VARCHAR(100),
    parameters JSONB,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. AUDITORIA OPERACIONAL E TRILHA DE SEGURANÇA
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    origin VARCHAR(150) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    user_or_service VARCHAR(150) NOT NULL,
    correlation_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. CONFIGURAÇÕES DE AUTOMAÇÃO DO SISTEMA
CREATE TABLE IF NOT EXISTS auto_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices essenciais para consultas de alta performance
CREATE INDEX IF NOT EXISTS idx_suppliers_tax_id ON suppliers(tax_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status);
