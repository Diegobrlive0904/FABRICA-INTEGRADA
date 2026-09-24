-- =====================================================================
-- FLIND INDÚSTRIA & DISTRIBUIÇÃO - SEED DE DADOS INICIAIS
-- =====================================================================

-- 1. FORNECEDORES HOMOLOGADOS
INSERT INTO suppliers (id, name, trade_name, tax_id, state_registration, contact_name, phone, whatsapp, email, category, lead_time_days, city, state, payment_terms, status, notes)
VALUES
('supp-01', 'Fibras & Não-Tecidos Brasil S/A', 'TNT Brasil Matérias-Primas', '12.345.678/0001-90', '112.345.678.910', 'Carlos Eduardo Mendes', '+55 11 3245-8800', '+55 11 98765-4321', 'vendas@tntbrasil.com.br', 'Tecidos Não-Tecidos (TNT SMS, Spunbond, Meltblown)', 3, 'Paulínia', 'SP', 'Boleto 30/60 DDL', 'HOMOLOGATED', 'Fornecedor homologado ISO 9001. Fornece bobinas para aventais e máscaras.'),
('supp-02', 'Klabin Embalagens Industriais S/A', 'Klabin Papel & Embalagens', '89.012.345/0001-12', '987.654.321.000', 'Mariana Alencar', '+55 11 3890-4400', '+55 11 97123-5566', 'mariana.alencar@klabin.com.br', 'Caixas de Papelão e Embalagens Secundárias', 4, 'Jundiaí', 'SP', 'Boleto 28 DDL', 'HOMOLOGATED', 'Caixas com certificação FSC e alta resistência à compressão.'),
('supp-03', 'Elásticos Cirúrgicos Santa Cruz Ltda', 'ElastCruz Fitas & Elásticos', '45.678.901/0001-23', '456.789.012.345', 'Roberto Siqueira', '+55 19 3876-1122', '+55 19 99876-1100', 'comercial@elastcruz.com.br', 'Elásticos Termosseláveis e Tiras Cirúrgicas', 2, 'Americana', 'SP', 'Boleto 14/28 DDL', 'HOMOLOGATED', 'Elásticos anatômicos de alta flexibilidade para toucas e máscaras.'),
('supp-04', 'Injetados & Polímeros Médicos do Brasil', 'Polimed Insumos Descartáveis', '78.901.234/0001-56', '789.012.345.678', 'Juliana Portela', '+55 41 3320-7799', '+55 41 98844-3322', 'juliana.portela@polimed.ind.br', 'Polímeros Médicos e Gel Superabsorvente', 5, 'Curitiba', 'PR', 'Boleto 30 DDL', 'HOMOLOGATED', 'Insumos de absorção para toaletes descartáveis.');

-- 2. PRODUTOS E CATÁLOGO FLIND
INSERT INTO products (id, sku, name, category, packaging_unit, units_per_package, unit_weight_kg, weight_per_package_kg, manufacture_date, expiry_date, shelf_life_months, lot_number, current_stock_packages, current_stock_units, min_stock_packages, min_stock_units, reorder_quantity_packages, supplier_id, supplier_name, supplier_phone, cost_price, sale_price, location, status, auto_reorder_enabled, barcode, material, technical_specs, dimensions, grammage, anvisa_registration, packaging_dimensions, stacking_max, storage_conditions, flind_catalog_url)
VALUES
('prod-01', 'FLIND-AVT-CIR-50', 'Avental Cirúrgico Estéril 50g TNT SMS G/GG', 'Hospitalar & Cirúrgico', 'Caixa (CX)', 50, 0.080, 4.00, '2026-08-10', '2028-08-10', 24, 'L-2026-0881', 120, 6000, 30, 1500, 80, 'supp-01', 'TNT Brasil Matérias-Primas', '+55 11 98765-4321', 185.00, 310.00, 'Rua A - Prateleira 01', 'NORMAL', TRUE, '7898956000101', 'TNT SMS 100% Polipropileno Tripla Camada', 'Tecido não-tecido cirúrgico hidrorrepelente, atóxico, barreira BFE >= 99%.', '1,40m x 1,60m', '50 g/m²', 'Registro ANVISA 80123450001', '60 x 40 x 35 cm', 6, 'Local seco e arejado', 'https://www.flind.com.br/produtos/avental-cirurgico-50g'),
('prod-02', 'FLIND-MSC-TRIP-TIR', 'Máscara Cirúrgica Tripla Proteção com Tiras', 'Hospitalar & Cirúrgico', 'Caixa (CX)', 500, 0.004, 2.00, '2026-09-01', '2029-09-01', 36, 'L-2026-0902', 85, 42500, 20, 10000, 50, 'supp-01', 'TNT Brasil Matérias-Primas', '+55 11 98765-4321', 95.00, 160.00, 'Rua A - Prateleira 02', 'NORMAL', TRUE, '7898956000102', 'TNT Triplo com Filtro Meltblown BFE >= 95%', 'Máscara cirúrgica odontológica e hospitalar tripla camada. Norma ABNT NBR 14853.', '17,5cm x 9,5cm', '20+20+25 g/m²', 'Registro ANVISA 80123450002', '50 x 38 x 42 cm', 8, 'Armazenar em ambiente estéril', 'https://www.flind.com.br/produtos/mascara-tripla-hospitalar'),
('prod-03', 'FLIND-LNC-HOSP-SMS', 'Lençol Descartável Hospitalar com Elástico SMS', 'Hospitalar & Cirúrgico', 'Caixa (CX)', 100, 0.060, 6.00, '2026-08-20', '2028-08-20', 24, 'L-2026-0820', 14, 1400, 25, 2500, 60, 'supp-01', 'TNT Brasil Matérias-Primas', '+55 11 98765-4321', 220.00, 390.00, 'Rua B - Prateleira 01', 'LOW', TRUE, '7898956000103', 'TNT SMS Hospitalar com Elástico Termosselado', 'Lençol para macas hospitalares com excelente elasticidade e cobertura.', '2,20m x 0,90m', '30 g/m²', 'Registro ANVISA 80123450003', '65 x 45 x 30 cm', 5, 'Conservar longe de calor excessivo', 'https://www.flind.com.br/produtos/lencol-hospitalar-elastico'),
('prod-04', 'FLIND-TOAL-GEL-DESC', 'Toalete Descartável Sanitário com Gel Superabsorvente', 'Hospitalar & Cirúrgico', 'Caixa (CX)', 200, 0.050, 10.00, '2026-07-15', '2028-07-15', 24, 'L-2026-0715', 5, 1000, 20, 4000, 40, 'supp-04', 'Polimed Insumos Descartáveis', '+55 41 98844-3322', 170.00, 290.00, 'Rua C - Prateleira 01', 'CRITICAL', TRUE, '7898956000104', 'Camada quádrupla absorvente com barreira impermeável 25u', 'Toalete descartável e absorvente para higienização e leitos.', '80cm x 60cm', 'Gel absorvente', 'Registro ANVISA 80123450004', '55 x 45 x 30 cm', 6, 'Longe de umidade', 'https://www.flind.com.br/produtos/toalete-descartavel-gel-superabsorvente');

-- 3. CLIENTES HOMOLOGADOS
INSERT INTO customers (id, external_id, flind_web_id, flind_origin, name, trade_name, segment, tax_id, state_registration, email, phone, contact_person)
VALUES
('cust-01', 'ERP-001', 'WEB-1010', 'FLIND_ECOMMERCE_WEB', 'Hospital e Maternidade São Lucas S/A', 'Hospital São Lucas', 'Hospitalar & Cirúrgico', '04.567.890/0001-44', '110.223.344.555', 'compras@saolucashospital.com.br', '+55 11 3100-2000', 'Dra. Beatriz Fontana'),
('cust-02', 'ERP-002', 'WEB-1020', 'DIRETO_B2B', 'Rede ClinEstética Avançada Ltda', 'ClinEstética Prime', 'Estética & Spas', '15.987.654/0001-33', '115.889.900.111', 'suprimentos@clinestetica.com.br', '+55 11 99887-1234', 'Thiago Meirelles');

-- 4. ENDEREÇOS DOS CLIENTES
INSERT INTO customer_addresses (id, customer_id, type, street, number, complement, neighborhood, city, state, zip_code, is_default)
VALUES
('addr-01', 'cust-01', 'DELIVERY', 'Av. Paulista', '1842', 'Torre Sul - Doca 3', 'Bela Vista', 'São Paulo', 'SP', '01310-200', TRUE),
('addr-02', 'cust-02', 'DELIVERY', 'Rua Oscar Freire', '920', 'Conjunto 42', 'Cerqueira César', 'São Paulo', 'SP', '01426-001', TRUE);

-- 5. REGRAS DE ENTREGA
INSERT INTO delivery_rules (id, customer_id, address_id, allowed_time_start, allowed_time_end, allowed_weekdays, requires_scheduling, max_weight_kg, vehicle_type_allowed, entry_gate, contact_name, contact_phone, requires_documentation, notes, active)
VALUES
('rule-01', 'cust-01', 'addr-01', '07:00', '15:00', '{1,2,3,4,5}', TRUE, 5000.00, 'VUC', 'Doca Hospitalar 02', 'Recepção de Mercadorias', '+55 11 3100-2050', TRUE, 'Agendamento prévio com 24h de antecedência.', TRUE);

-- 6. CONFIGURAÇÕES AUTOMÁTICAS
INSERT INTO auto_settings (key, value)
VALUES
('system', '{"autoWhatsAppExpedition": true, "autoWhatsAppCollection": true, "autoWhatsAppLowStock": true}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
