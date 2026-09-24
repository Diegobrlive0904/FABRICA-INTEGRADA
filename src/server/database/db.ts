import fs from 'fs';
import path from 'path';
import {
  Customer,
  CustomerAddress,
  DeliveryRule,
  Order,
  SlaRule,
  Alert,
  Receivable,
  CollectionRule,
  WhatsAppMessageLog,
  Shipment,
  AuditLog,
  IntegrationSyncLog,
  TimelineEvent,
  ProductInventory,
  Supplier,
  PurchaseOrder,
  OpenPoDetail,
  MissingProductItem,
  MissingProductsDiagnostic,
  SupplierQuotationOffer,
  ProductQuotationComparison,
} from '../../types';

interface DatabaseSchema {
  version: number;
  customers: Customer[];
  addresses: CustomerAddress[];
  deliveryRules: DeliveryRule[];
  orders: Order[];
  slaRules: SlaRule[];
  alerts: Alert[];
  receivables: Receivable[];
  collectionRules: CollectionRule[];
  whatsappLogs: WhatsAppMessageLog[];
  shipments: Shipment[];
  auditLogs: AuditLog[];
  integrationLogs: IntegrationSyncLog[];
  products: ProductInventory[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  cancelledPurchaseOrders?: PurchaseOrder[];
  autoSettings: {
    autoWhatsAppExpedition: boolean;
    autoWhatsAppCollection: boolean;
    autoWhatsAppLowStock: boolean;
  };
}

function getDatabaseFilePaths(): { dir: string; file: string; isReadOnlyEnv: boolean } {
  const localDir = path.resolve(process.cwd(), 'data');
  const localFile = path.join(localDir, 'fabrica_integrada_db.json');

  // Detecta ambiente Vercel Serverless ou AWS Lambda onde o sistema de arquivos raiz é estritamente somente-leitura
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.join('/tmp', 'data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return { dir: tmpDir, file: path.join(tmpDir, 'fabrica_integrada_db.json'), isReadOnlyEnv: true };
    } catch {
      return { dir: tmpDir, file: path.join(tmpDir, 'fabrica_integrada_db.json'), isReadOnlyEnv: true };
    }
  }

  // Em desenvolvimento ou container Node.js comum, verifica se a pasta local tem permissão de escrita
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return { dir: localDir, file: localFile, isReadOnlyEnv: false };
  } catch {
    const tmpDir = path.join('/tmp', 'data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    return { dir: tmpDir, file: path.join(tmpDir, 'fabrica_integrada_db.json'), isReadOnlyEnv: true };
  }
}

const dbPaths = getDatabaseFilePaths();
const DATA_DIR = dbPaths.dir;
const DB_FILE = dbPaths.file;

// Initial realistic seed data for Fábrica Integrada
function getInitialSeed(): DatabaseSchema {
  const now = new Date('2026-09-22T10:00:00.000Z');
  const dAgo = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();
  const dFuture = (days: number) => new Date(now.getTime() + days * 86400000).toISOString().split('T')[0];
  const dPast = (days: number) => new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];

  const customers: Customer[] = [
    {
      id: 'cust-1',
      externalId: 'ERP-CUST-881',
      name: 'Rede Hospitalar São Camilo S/A',
      tradeName: 'Hospital São Camilo - CAF Central',
      segment: 'Hospitalar & Cirúrgico',
      taxId: '14.285.932/0001-44',
      email: 'compras.hospitalar@saocamilo.org.br',
      phone: '+55 11 98452-1100',
      flindOrigin: 'DIRETO_B2B',
      notes: 'Cliente Direto da Fábrica: Contrato corporativo hospitalar anual, televendas e faturamento direto via SINK ERP. Não possui conta no e-commerce.',
      createdAt: dAgo(720),
      updatedAt: dAgo(24),
    },
    {
      id: 'cust-2',
      externalId: 'TRAY-CUST-904',
      name: 'Rede Bella Pelle Estética Avançada & Spas Ltda',
      tradeName: 'Bella Pelle Estética & Laser',
      segment: 'Estética & Spas',
      taxId: '08.921.344/0002-19',
      email: 'suprimentos@bellapelleestetica.com.br',
      phone: '+55 19 97123-4567',
      flindOrigin: 'FLIND_ECOMMERCE_WEB',
      flindWebId: 'FW-48921',
      flindWebProfileUrl: 'https://www.flind.com.br/central-do-cliente',
      flindPortalSync: {
        isRegisteredOnFlindWeb: true,
        lastSyncedAt: dAgo(2),
        accountEmail: 'suprimentos@bellapelleestetica.com.br',
        totalFlindWebOrders: 6,
        flindTier: 'PRATA_CLINICAS',
        customerProfileUrl: 'https://www.flind.com.br/central-do-cliente',
        catalogInterest: ['Lençóis TNT para Macas', 'Luvas Pink Nitrílicas'],
      },
      createdAt: dAgo(480),
      updatedAt: dAgo(10),
    },
    {
      id: 'cust-3',
      externalId: 'TRAY-CUST-915',
      name: 'Rede de Salões Jacques Janine & Beauty Studio Ltda',
      tradeName: 'Jacques Janine Salões & Barbearias',
      segment: 'Salões & Barbearias',
      taxId: '32.198.765/0001-88',
      email: 'suprimentos@jacquesjanine.com.br',
      phone: '+55 31 99876-5432',
      flindOrigin: 'TRAY',
      flindWebId: 'FW-32198',
      flindWebProfileUrl: 'https://www.flind.com.br/central-do-cliente',
      flindPortalSync: {
        isRegisteredOnFlindWeb: true,
        lastSyncedAt: dAgo(1),
        accountEmail: 'suprimentos@jacquesjanine.com.br',
        totalFlindWebOrders: 4,
        flindTier: 'BRONZE_ESTETICA',
        customerProfileUrl: 'https://www.flind.com.br/central-do-cliente',
        catalogInterest: ['Capas de Corte Descartáveis', 'Golas Higiênicas'],
      },
      createdAt: dAgo(240),
      updatedAt: dAgo(5),
    },
    {
      id: 'cust-4',
      externalId: 'ERP-CUST-920',
      name: 'Santa Casa de Misericórdia de Santos',
      tradeName: 'Santa Casa de Santos - Farmácia Hospitalar',
      segment: 'Hospitalar & Cirúrgico',
      taxId: '58.194.205/0001-30',
      email: 'licitacoes@santacasasantos.org.br',
      phone: '+55 13 3202-0600',
      flindOrigin: 'DIRETO_B2B',
      notes: 'Cliente Direto da Fábrica: Fornecimento hospitalar por licitação pública e televendas direto com a indústria. Sem cadastro no site.',
      createdAt: dAgo(180),
      updatedAt: dAgo(12),
    },
  ];

  const addresses: CustomerAddress[] = [
    // Cliente 1 - São Camilo (Hospitalar: Sede Administrativa, Escritório Cobrança, Galpão CAF Guarulhos)
    {
      id: 'addr-1-fiscal',
      customerId: 'cust-1',
      type: 'FISCAL',
      street: 'Av. Paulista',
      number: '1842',
      complement: 'Conjunto 141 - Diretoria Administrativa',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-200',
      country: 'Brasil',
      isDefault: false,
      createdAt: dAgo(720),
    },
    {
      id: 'addr-1-billing',
      customerId: 'cust-1',
      type: 'BILLING',
      street: 'Av. Paulista',
      number: '1842',
      complement: 'Conjunto 142 - Auditoria Médica & Faturamento',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-200',
      country: 'Brasil',
      isDefault: false,
      createdAt: dAgo(720),
    },
    {
      id: 'addr-1-delivery',
      customerId: 'cust-1',
      type: 'DELIVERY',
      street: 'Rodovia Presidente Dutra',
      number: 'Km 218',
      complement: 'Galpão CAF - Central de Abastecimento Farmacêutico',
      neighborhood: 'Cumbica',
      city: 'Guarulhos',
      state: 'SP',
      zipCode: '07180-000',
      country: 'Brasil',
      isDefault: true,
      createdAt: dAgo(720),
    },
    // Cliente 2 - Bella Pelle (Estética & Spas: Sede Administrativa em Campinas e CD Regional das Clínicas)
    {
      id: 'addr-2-fiscal',
      customerId: 'cust-2',
      type: 'FISCAL',
      street: 'Rua Barão de Jaguara',
      number: '950',
      neighborhood: 'Cambuí',
      city: 'Campinas',
      state: 'SP',
      zipCode: '13015-001',
      country: 'Brasil',
      isDefault: false,
      createdAt: dAgo(480),
    },
    {
      id: 'addr-2-delivery',
      customerId: 'cust-2',
      type: 'DELIVERY',
      street: 'Av. Engenheiro Augusto Figueiredo',
      number: '2100',
      complement: 'Doca 3 - Central de Distribuição de Clínicas & Franquias de Estética',
      neighborhood: 'Vila Progresso',
      city: 'Campinas',
      state: 'SP',
      zipCode: '13045-500',
      country: 'Brasil',
      isDefault: true,
      createdAt: dAgo(480),
    },
    // Cliente 3 - Jacques Janine (Salões & Barbearias: Matriz e Central de Suprimentos para Cabeleireiros e Barbeiros)
    {
      id: 'addr-3-fiscal',
      customerId: 'cust-3',
      type: 'FISCAL',
      street: 'Rua dos Guajajaras',
      number: '650',
      complement: 'Conjunto 801 - Escritório Corporativo',
      neighborhood: 'Centro',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30180-100',
      country: 'Brasil',
      isDefault: false,
      createdAt: dAgo(240),
    },
    {
      id: 'addr-3-delivery',
      customerId: 'cust-3',
      type: 'DELIVERY',
      street: 'Rua dos Guajajaras',
      number: '650',
      complement: 'Térreo - Recepção de Suprimentos & Descartáveis para Salões e Barbearias',
      neighborhood: 'Centro',
      city: 'Belo Horizonte',
      state: 'MG',
      zipCode: '30180-100',
      country: 'Brasil',
      isDefault: true,
      createdAt: dAgo(240),
    },
  ];

  const deliveryRules: DeliveryRule[] = [
    {
      id: 'delrule-1',
      addressId: 'addr-1-delivery',
      customerId: 'cust-1',
      allowedTimeStart: '07:00',
      allowedTimeEnd: '16:00',
      allowedWeekdays: [1, 2, 3, 4, 5],
      requiresScheduling: false,
      maxWeightKg: 15000,
      vehicleTypeAllowed: 'TRUCK',
      entryGate: 'Doca 4B - Insumos e Materiais Hospitalares',
      contactName: 'Carlos Eduardo - Farmacêutico Responsável',
      contactPhone: '+55 11 98888-2233',
      requiresDocumentation: true,
      notes: 'Motorista deve portar calçado fechado, jaleco e laudo de lote/esterilidade dos descartáveis cirúrgicos.',
      active: true,
    },
    {
      id: 'delrule-2',
      addressId: 'addr-2-delivery',
      customerId: 'cust-2',
      allowedTimeStart: '08:30',
      allowedTimeEnd: '11:30',
      allowedWeekdays: [2, 3, 4], // Terça a Quinta
      requiresScheduling: true,
      maxWeightKg: 4000,
      vehicleTypeAllowed: 'VUC',
      entryGate: 'Doca 3 - Central de Distribuição Clínicas de Estética',
      contactName: 'Mariana Souza (Coord. Suprimentos Estética)',
      contactPhone: '+55 19 99777-6655',
      requiresDocumentation: true,
      notes: 'AGENDAMENTO OBRIGATÓRIO com 24h de antecedência. Entrada restrita a veículos VUC na Doca do CD das Clínicas de Estética.',
      active: true,
    },
    {
      id: 'delrule-3',
      addressId: 'addr-3-delivery',
      customerId: 'cust-3',
      allowedTimeStart: '09:00',
      allowedTimeEnd: '17:00',
      allowedWeekdays: [1, 2, 3, 4, 5],
      requiresScheduling: false,
      maxWeightKg: 2000,
      vehicleTypeAllowed: 'VUC',
      entryGate: 'Recepção de Mercadorias - Salões & Barbearias',
      contactName: 'Rodrigo Alcantara (Almoxarifado Salões)',
      contactPhone: '+55 31 98877-3322',
      requiresDocumentation: false,
      notes: 'Horário comercial. Entregas de capas descartáveis, golas de barbeiro e luvas para coloração.',
      active: true,
    },
  ];

  const slaRules: SlaRule[] = [
    {
      id: 'sla-1',
      name: 'Pedido Recebido → Integração ERP',
      fromStage: 'ORDER_RECEIVED',
      toStage: 'ERP_INTEGRATED',
      slaMinutes: 10,
      severity: 'WARNING',
      active: true,
      createdAt: dAgo(720),
    },
    {
      id: 'sla-2',
      name: 'Integração ERP → Separação Estoque',
      fromStage: 'ERP_INTEGRATED',
      toStage: 'SEPARATION',
      slaMinutes: 120, // 2 horas
      severity: 'WARNING',
      active: true,
      createdAt: dAgo(720),
    },
    {
      id: 'sla-3',
      name: 'Separação → Faturamento / NF-e',
      fromStage: 'SEPARATION',
      toStage: 'INVOICING',
      slaMinutes: 240, // 4 horas
      severity: 'CRITICAL',
      active: true,
      createdAt: dAgo(720),
    },
    {
      id: 'sla-4',
      name: 'Faturamento → Expedição / Etiquetagem',
      fromStage: 'NFE_ISSUED',
      toStage: 'EXPEDITION',
      slaMinutes: 480, // 8 horas
      severity: 'CRITICAL',
      active: true,
      createdAt: dAgo(720),
    },
    {
      id: 'sla-5',
      name: 'Expedição → Coleta Transportadora',
      fromStage: 'EXPEDITION',
      toStage: 'CARRIER_DISPATCH',
      slaMinutes: 360, // 6 horas
      severity: 'WARNING',
      active: true,
      createdAt: dAgo(720),
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord-1582',
      orderNumber: '#1582',
      externalId: 'TRAY-ORD-99412',
      source: 'TRAY',
      customerId: 'cust-1',
      deliveryAddressId: 'addr-1-delivery',
      status: 'BILLED',
      totalAmount: 18450.0,
      subtotal: 17800.0,
      shippingCost: 650.0,
      discount: 0,
      paymentMethod: 'BOLETO_BANCARIO_30D',
      paymentStatus: 'PAID',
      invoiceNumber: 'NF-004821',
      invoiceKey: '35260914285932000144550010000048211987654321',
      trackingToken: 'trc_1582_a8f9c10e',
      createdAt: dAgo(9),
      updatedAt: dAgo(1),
      items: [
        {
          id: 'item-1',
          orderId: 'ord-1582',
          productId: 'prod-101',
          sku: 'FLIND-AVT-CIR-50',
          title: 'Avental Cirúrgico Impermeável TNT 50g/m² Esterilizado - Cx 50 un',
          quantity: 40,
          unitPrice: 320.0,
          totalPrice: 12800.0,
          lotNumber: 'LOTE-FLIND-2026-A19',
          weightKg: 12,
        },
        {
          id: 'item-2',
          orderId: 'ord-1582',
          productId: 'prod-102',
          sku: 'FLIND-MSC-TRIP-TIR',
          title: 'Máscara Cirúrgica Tripla com Tiras BFE≥95% - Fardo c/ 40 cxs (2.000 un)',
          quantity: 20,
          unitPrice: 250.0,
          totalPrice: 5000.0,
          lotNumber: 'LOTE-FLIND-2026-B02',
          weightKg: 4.5,
        },
      ],
      timeline: [
        {
          id: 'tl-1',
          orderId: 'ord-1582',
          stage: 'ORDER_RECEIVED',
          stageLabel: 'Pedido Recebido',
          status: 'COMPLETED',
          startedAt: dAgo(9),
          completedAt: dAgo(8.9),
          durationMinutes: 6,
          expectedSlaMinutes: 10,
          responsible: 'Tray Webhook Sync',
          sourceSystem: 'TRAY',
          notes: 'Pedido importado automaticamente via Webhook Tray E-commerce.',
        },
        {
          id: 'tl-2',
          orderId: 'ord-1582',
          stage: 'ERP_INTEGRATED',
          stageLabel: 'Integrado ao ERP',
          status: 'COMPLETED',
          startedAt: dAgo(8.9),
          completedAt: dAgo(8.7),
          durationMinutes: 12,
          expectedSlaMinutes: 30,
          responsible: 'SINK ERP Provider',
          sourceSystem: 'SINK_ERP',
          notes: 'Pedido cadastrado no SINK ERP sob protocolo ERP-98124.',
        },
        {
          id: 'tl-3',
          orderId: 'ord-1582',
          stage: 'SEPARATION',
          stageLabel: 'Separação',
          status: 'COMPLETED',
          startedAt: dAgo(8.7),
          completedAt: dAgo(7),
          durationMinutes: 102,
          expectedSlaMinutes: 120,
          responsible: 'Operador Almoxarifado José M.',
          sourceSystem: 'FABRICA_INTEGRADA',
          notes: 'Lotes LOTE-FLIND-2026-A19 e LOTE-FLIND-2026-B02 conferidos com leitor óptico e laudo ANVISA validado.',
        },
        {
          id: 'tl-4',
          orderId: 'ord-1582',
          stage: 'INVOICING',
          stageLabel: 'Faturamento',
          status: 'DELAYED',
          startedAt: dAgo(7),
          completedAt: dAgo(1.5),
          durationMinutes: 330, // 5.5 horas vs SLA 4 horas (240m) -> ATRASADO 90m
          expectedSlaMinutes: 240,
          responsible: 'Faturamento / SINK ERP',
          sourceSystem: 'SINK_ERP',
          notes: 'Atraso na validação fiscal de alíquota interestadual pelo SINK ERP. SLA excedido em 1h30.',
        },
        {
          id: 'tl-5',
          orderId: 'ord-1582',
          stage: 'NFE_ISSUED',
          stageLabel: 'NF-e Emitida',
          status: 'COMPLETED',
          startedAt: dAgo(1.5),
          completedAt: dAgo(1.4),
          durationMinutes: 6,
          expectedSlaMinutes: 15,
          responsible: 'SEFAZ-SP / SINK ERP',
          sourceSystem: 'SINK_ERP',
          notes: 'NF-e 004821 autorizada pela SEFAZ.',
        },
        {
          id: 'tl-6',
          orderId: 'ord-1582',
          stage: 'EXPEDITION',
          stageLabel: 'Expedição & Etiquetagem',
          status: 'IN_PROGRESS',
          startedAt: dAgo(1.4),
          expectedSlaMinutes: 480,
          responsible: 'Equipe Expedição Doca 2',
          sourceSystem: 'FABRICA_INTEGRADA',
          notes: 'Aguardando conferência de volumes e impressão de etiqueta QR Code.',
        },
        {
          id: 'tl-7',
          orderId: 'ord-1582',
          stage: 'CARRIER_DISPATCH',
          stageLabel: 'Coleta Transportadora',
          status: 'PENDING',
          expectedSlaMinutes: 360,
          sourceSystem: 'TRANSPORTADORA',
          notes: 'Coleta programada com Braspress.',
        },
        {
          id: 'tl-8',
          orderId: 'ord-1582',
          stage: 'IN_TRANSIT',
          stageLabel: 'Em Trânsito',
          status: 'PENDING',
          expectedSlaMinutes: 1440,
          sourceSystem: 'TRANSPORTADORA',
        },
        {
          id: 'tl-9',
          orderId: 'ord-1582',
          stage: 'DELIVERED',
          stageLabel: 'Entregue ao Cliente',
          status: 'PENDING',
          expectedSlaMinutes: 2880,
          sourceSystem: 'TRANSPORTADORA',
        },
      ],
    },
    // Pedido 2 - Excedeu SLA e violou regra de entrega
    {
      id: 'ord-1583',
      orderNumber: '#1583',
      externalId: 'TRAY-ORD-99420',
      source: 'TRAY',
      customerId: 'cust-2',
      deliveryAddressId: 'addr-2-delivery',
      status: 'EXPEDITION',
      totalAmount: 32600.0,
      subtotal: 31900.0,
      shippingCost: 700.0,
      discount: 0,
      paymentMethod: 'BOLETO_BANCARIO_15D',
      paymentStatus: 'PAID',
      invoiceNumber: 'NF-004822',
      invoiceKey: '35260908921344000219550010000048221876543210',
      trackingToken: 'trc_1583_b7d2f4a1',
      createdAt: dAgo(18),
      updatedAt: dAgo(2),
      items: [
        {
          id: 'item-3a',
          orderId: 'ord-1583',
          productId: 'prod-201',
          sku: 'FLIND-LEN-TNT-70',
          title: 'Lençol Descartável em Rolo TNT 70cm x 50m (Macas Estética/Depilação) - Fardo c/ 10 rolos',
          quantity: 20,
          unitPrice: 800.0,
          totalPrice: 16000.0,
          lotNumber: 'LOTE-FLIND-2026-EST01',
          weightKg: 130, // 20 * 130 = 2600 kg
        },
        {
          id: 'item-3b',
          orderId: 'ord-1583',
          productId: 'prod-202',
          sku: 'FLIND-LUV-NIT-PINK',
          title: 'Luva Nitrílica Pink / Rosa Sem Pó Tam M (Especial Clínicas de Estética) - Fardo c/ 50 cxs (5.000 un)',
          quantity: 10,
          unitPrice: 1590.0,
          totalPrice: 15900.0,
          lotNumber: 'LOTE-FLIND-2026-EST02',
          weightKg: 200, // 10 * 200 = 2000 kg -> Total: 4600 kg (excede 4000 kg)
        },
      ],
      timeline: [
        {
          id: 'tl-10',
          orderId: 'ord-1583',
          stage: 'ORDER_RECEIVED',
          stageLabel: 'Pedido Recebido',
          status: 'COMPLETED',
          startedAt: dAgo(18),
          completedAt: dAgo(17.8),
          durationMinutes: 12,
          expectedSlaMinutes: 10,
          responsible: 'Tray Webhook Sync',
          sourceSystem: 'TRAY',
        },
        {
          id: 'tl-11',
          orderId: 'ord-1583',
          stage: 'ERP_INTEGRATED',
          stageLabel: 'Integrado ao ERP',
          status: 'COMPLETED',
          startedAt: dAgo(17.8),
          completedAt: dAgo(17.6),
          durationMinutes: 12,
          expectedSlaMinutes: 30,
          responsible: 'SINK ERP Provider',
          sourceSystem: 'SINK_ERP',
        },
        {
          id: 'tl-12',
          orderId: 'ord-1583',
          stage: 'SEPARATION',
          stageLabel: 'Separação',
          status: 'COMPLETED',
          startedAt: dAgo(17.6),
          completedAt: dAgo(15),
          durationMinutes: 156,
          expectedSlaMinutes: 120,
          responsible: 'Operador Almoxarifado Lúcio F.',
          sourceSystem: 'FABRICA_INTEGRADA',
        },
        {
          id: 'tl-13',
          orderId: 'ord-1583',
          stage: 'INVOICING',
          stageLabel: 'Faturamento',
          status: 'COMPLETED',
          startedAt: dAgo(15),
          completedAt: dAgo(12),
          durationMinutes: 180,
          expectedSlaMinutes: 240,
          responsible: 'SINK ERP',
          sourceSystem: 'SINK_ERP',
        },
        {
          id: 'tl-14',
          orderId: 'ord-1583',
          stage: 'NFE_ISSUED',
          stageLabel: 'NF-e Emitida',
          status: 'COMPLETED',
          startedAt: dAgo(12),
          completedAt: dAgo(11.8),
          durationMinutes: 12,
          expectedSlaMinutes: 15,
          responsible: 'SEFAZ-SP / SINK ERP',
          sourceSystem: 'SINK_ERP',
        },
        {
          id: 'tl-15',
          orderId: 'ord-1583',
          stage: 'EXPEDITION',
          stageLabel: 'Expedição & Etiquetagem',
          status: 'DELAYED',
          startedAt: dAgo(11.8),
          durationMinutes: 588, // 9.8 horas vs SLA 8h (480m) -> ATRASADO
          expectedSlaMinutes: 480,
          responsible: 'Doca de Carga 1',
          sourceSystem: 'FABRICA_INTEGRADA',
          notes: 'TRAVA OPERACIONAL ESTÉTICA: Carga consolidada de lençóis TNT para macas e luvas pink (4600 kg) excede o limite da Doca de Distribuição das Clínicas (4000 kg). Local exige agendamento prévio com 24h e veículo VUC.',
        },
        {
          id: 'tl-16',
          orderId: 'ord-1583',
          stage: 'CARRIER_DISPATCH',
          stageLabel: 'Coleta Transportadora',
          status: 'PENDING',
          expectedSlaMinutes: 360,
          sourceSystem: 'TRANSPORTADORA',
        },
        {
          id: 'tl-17',
          orderId: 'ord-1583',
          stage: 'IN_TRANSIT',
          stageLabel: 'Em Trânsito',
          status: 'PENDING',
          expectedSlaMinutes: 1440,
          sourceSystem: 'TRANSPORTADORA',
        },
        {
          id: 'tl-18',
          orderId: 'ord-1583',
          stage: 'DELIVERED',
          stageLabel: 'Entregue ao Cliente',
          status: 'PENDING',
          expectedSlaMinutes: 2880,
          sourceSystem: 'TRANSPORTADORA',
        },
      ],
    },
    // Pedido 3 - Novo, recebido agora (Salões e Barbearias)
    {
      id: 'ord-1584',
      orderNumber: '#1584',
      externalId: 'TRAY-ORD-99435',
      source: 'TRAY',
      customerId: 'cust-3',
      deliveryAddressId: 'addr-3-delivery',
      status: 'NEW',
      totalAmount: 4320.0,
      subtotal: 4100.0,
      shippingCost: 220.0,
      discount: 0,
      paymentMethod: 'PIX_AVISTA',
      paymentStatus: 'PAID',
      createdAt: dAgo(0.1),
      updatedAt: dAgo(0.1),
      items: [
        {
          id: 'item-4a',
          orderId: 'ord-1584',
          productId: 'prod-301',
          sku: 'FLIND-CAP-CORTE-50',
          title: 'Capa de Corte Descartável Transparente 120x150cm - Fardo c/ 20 pcts (1.000 un)',
          quantity: 4,
          unitPrice: 480.0,
          totalPrice: 1920.0,
          lotNumber: 'LOTE-FLIND-2026-SAL01',
          weightKg: 7,
        },
        {
          id: 'item-4b',
          orderId: 'ord-1584',
          productId: 'prod-302',
          sku: 'FLIND-GOL-BARB-100',
          title: 'Gola Higiênica Descartável para Barbearia e Salão (Neck Paper Rolo c/ 100 un) - Fardo c/ 50 rolos',
          quantity: 2,
          unitPrice: 450.0,
          totalPrice: 900.0,
          lotNumber: 'LOTE-FLIND-2026-SAL02',
          weightKg: 10,
        },
        {
          id: 'item-4c',
          orderId: 'ord-1584',
          productId: 'prod-303',
          sku: 'FLIND-TOU-SANF-BR',
          title: 'Touca Sanfonada Descartável TNT Branca 100% Polipropileno - Fardo c/ 20 pcts (2.000 un)',
          quantity: 2,
          unitPrice: 640.0,
          totalPrice: 1280.0,
          lotNumber: 'LOTE-FLIND-2026-SAL03',
          weightKg: 12,
        },
      ],
      timeline: [
        {
          id: 'tl-19',
          orderId: 'ord-1584',
          stage: 'ORDER_RECEIVED',
          stageLabel: 'Pedido Recebido',
          status: 'COMPLETED',
          startedAt: dAgo(0.1),
          completedAt: dAgo(0.08),
          durationMinutes: 1,
          expectedSlaMinutes: 10,
          responsible: 'Tray Webhook Sync',
          sourceSystem: 'TRAY',
          notes: 'Recebido via Tray E-commerce às 09:54.',
        },
        {
          id: 'tl-20',
          orderId: 'ord-1584',
          stage: 'ERP_INTEGRATED',
          stageLabel: 'Integrado ao ERP',
          status: 'IN_PROGRESS',
          startedAt: dAgo(0.08),
          expectedSlaMinutes: 10,
          responsible: 'SINK ERP Queue Worker',
          sourceSystem: 'SINK_ERP',
          notes: 'Fila de sincronização com SINK ERP aguardando handshake.',
        },
        {
          id: 'tl-21',
          orderId: 'ord-1584',
          stage: 'SEPARATION',
          stageLabel: 'Separação',
          status: 'PENDING',
          expectedSlaMinutes: 120,
          sourceSystem: 'FABRICA_INTEGRADA',
        },
        {
          id: 'tl-22',
          orderId: 'ord-1584',
          stage: 'INVOICING',
          stageLabel: 'Faturamento',
          status: 'PENDING',
          expectedSlaMinutes: 240,
          sourceSystem: 'SINK_ERP',
        },
        {
          id: 'tl-23',
          orderId: 'ord-1584',
          stage: 'NFE_ISSUED',
          stageLabel: 'NF-e Emitida',
          status: 'PENDING',
          expectedSlaMinutes: 15,
          sourceSystem: 'SINK_ERP',
        },
        {
          id: 'tl-24',
          orderId: 'ord-1584',
          stage: 'EXPEDITION',
          stageLabel: 'Expedição & Etiquetagem',
          status: 'PENDING',
          expectedSlaMinutes: 480,
          sourceSystem: 'FABRICA_INTEGRADA',
        },
        {
          id: 'tl-25',
          orderId: 'ord-1584',
          stage: 'CARRIER_DISPATCH',
          stageLabel: 'Coleta Transportadora',
          status: 'PENDING',
          expectedSlaMinutes: 360,
          sourceSystem: 'TRANSPORTADORA',
        },
        {
          id: 'tl-26',
          orderId: 'ord-1584',
          stage: 'IN_TRANSIT',
          stageLabel: 'Em Trânsito',
          status: 'PENDING',
          expectedSlaMinutes: 1440,
          sourceSystem: 'TRANSPORTADORA',
        },
        {
          id: 'tl-27',
          orderId: 'ord-1584',
          stage: 'DELIVERED',
          stageLabel: 'Entregue ao Cliente',
          status: 'PENDING',
          expectedSlaMinutes: 2880,
          sourceSystem: 'TRANSPORTADORA',
        },
      ],
    },
  ];

  const shipments: Shipment[] = [
    {
      id: 'ship-1',
      trackingToken: 'trc_1582_a8f9c10e',
      orderId: 'ord-1582',
      orderNumber: '#1582',
      invoiceNumber: 'NF-004821',
      invoiceKey: '35260914285932000144550010000048211987654321',
      carrierName: 'Braspress Logística Hospitalar & Farma',
      trackingCode: 'BP-SP-9923847',
      volumesCount: 3,
      totalWeightKg: 570.0,
      selectedVehicleType: 'TRUCK',
      status: 'WAITING_DISPATCH',
      notes: 'Palete 1 (Aventais Cirúrgicos Impermeáveis) + 2 caixas (Máscaras Triplas). Lotes com laudo de esterilidade aprovado e Registro ANVISA validado.',
      createdAt: dAgo(1.2),
    },
  ];

  const alerts: Alert[] = [
    {
      id: 'alt-1',
      severity: 'CRITICAL',
      type: 'SLA_BREACH',
      entityType: 'ORDER',
      entityId: 'ord-1582',
      message: 'Faturamento do Pedido #1582 ultrapassou SLA configurado de 4h (duração real: 5h30m). Atraso de 1h30m na homologação do lote ANVISA e laudo de esterilidade cirúrgica.',
      ruleResponsible: 'Separação → Faturamento / NF-e (SLA 240min)',
      responsible: 'Garantia da Qualidade & Fiscal / SINK ERP',
      status: 'PENDING',
      createdAt: dAgo(2),
    },
    {
      id: 'alt-2',
      severity: 'CRITICAL',
      type: 'DELIVERY_RULE_VIOLATION',
      entityType: 'ORDER',
      entityId: 'ord-1583',
      message: 'Regra de Entrega Violada: CD das Clínicas de Estética (Campinas) exige agendamento obrigatório com 24h e carga consolidada de lençóis TNT e luvas pink (4600kg) excede o limite da Doca (4000kg).',
      ruleResponsible: 'Regra de Entrega: Bella Pelle Estética (addr-2-delivery)',
      responsible: 'Logística de Distribuição / Expedição',
      status: 'PENDING',
      createdAt: dAgo(3),
    },
    {
      id: 'alt-3',
      severity: 'WARNING',
      type: 'OVERDUE_RECEIVABLE',
      entityType: 'RECEIVABLE',
      entityId: 'rec-102',
      message: 'Título NF-004750 (R$ 8.920,00) de Rede de Salões Jacques Janine & Beauty Studio Ltda está vencido há 5 dias. Automação de cobrança D+3 executada via WhatsApp.',
      ruleResponsible: 'Regra D+3: Alerta Financeiro e Cobrança WhatsApp',
      responsible: 'Financeiro / Contas a Receber',
      status: 'PENDING',
      createdAt: dAgo(12),
    },
  ];

  const receivables: Receivable[] = [
    {
      id: 'rec-101',
      customerId: 'cust-1',
      customerName: 'Rede Hospitalar São Camilo S/A',
      orderId: 'ord-1582',
      orderNumber: '#1582',
      documentNumber: 'DUP-4821-01',
      invoiceNumber: 'NF-004821',
      amount: 18450.0,
      dueDate: dFuture(18), // A vencer em 18 dias
      status: 'OPEN',
      paymentMethod: 'BOLETO',
      externalId: 'SINK-DUP-10492',
      source: 'SINK_ERP',
      barcode: '34191.79001 01043.510047 91020.150008 5 99420001845000',
      pixCode: '00020126580014br.gov.bcb.pix0136financeiro@flind.com.br520400005303986540818450.005802BR5920FLIND HOSPITALAR6009SAO PAULO62070503***6304ABCD',
      createdAt: dAgo(2),
      updatedAt: dAgo(2),
    },
    {
      id: 'rec-102',
      customerId: 'cust-3',
      customerName: 'Rede de Salões Jacques Janine & Beauty Studio Ltda',
      documentNumber: 'DUP-4750-01',
      invoiceNumber: 'NF-004750',
      amount: 8920.0,
      dueDate: dPast(5), // 5 dias atrasado (faixa 4-7 dias)
      status: 'OVERDUE',
      paymentMethod: 'BOLETO',
      externalId: 'SINK-DUP-10310',
      source: 'SINK_ERP',
      barcode: '34191.79001 01043.510047 91020.150008 5 99420000892000',
      createdAt: dPast(35),
      updatedAt: dAgo(12),
    },
    {
      id: 'rec-103',
      customerId: 'cust-2',
      customerName: 'Rede Bella Pelle Estética Avançada & Spas Ltda',
      documentNumber: 'DUP-4789-01',
      invoiceNumber: 'NF-004789',
      amount: 14200.0,
      dueDate: dPast(2), // 2 dias atrasado (faixa 1-3 dias)
      status: 'OVERDUE',
      paymentMethod: 'BOLETO',
      externalId: 'SINK-DUP-10388',
      source: 'SINK_ERP',
      createdAt: dPast(32),
      updatedAt: dAgo(24),
    },
    {
      id: 'rec-104',
      customerId: 'cust-3',
      customerName: 'Rede de Salões Jacques Janine & Beauty Studio Ltda',
      documentNumber: 'DUP-4620-01',
      invoiceNumber: 'NF-004620',
      amount: 5400.0,
      dueDate: dPast(15), // 15 dias atrasado (faixa 8-30 dias)
      status: 'OVERDUE',
      paymentMethod: 'BOLETO',
      externalId: 'SINK-DUP-10115',
      source: 'SINK_ERP',
      createdAt: dPast(45),
      updatedAt: dPast(15),
    },
    {
      id: 'rec-105',
      customerId: 'cust-3',
      customerName: 'Rede de Salões Jacques Janine & Beauty Studio Ltda',
      documentNumber: 'DUP-4500-01',
      invoiceNumber: 'NF-004500',
      amount: 6780.0,
      dueDate: dPast(42), // 42 dias atrasado (faixa +30 dias)
      status: 'OVERDUE',
      paymentMethod: 'BOLETO',
      externalId: 'SINK-DUP-9912',
      source: 'SINK_ERP',
      createdAt: dPast(72),
      updatedAt: dPast(42),
    },
    {
      id: 'rec-106',
      customerId: 'cust-1',
      customerName: 'Rede Hospitalar São Camilo S/A',
      documentNumber: 'DUP-4800-01',
      invoiceNumber: 'NF-004800',
      amount: 9800.0,
      dueDate: now.toISOString().split('T')[0], // Vence HOJE
      status: 'DUE_TODAY',
      paymentMethod: 'BOLETO',
      externalId: 'SINK-DUP-10420',
      source: 'SINK_ERP',
      createdAt: dPast(30),
      updatedAt: dAgo(1),
    },
    {
      id: 'rec-107',
      customerId: 'cust-2',
      customerName: 'Rede Bella Pelle Estética Avançada & Spas Ltda',
      documentNumber: 'DUP-4700-01',
      invoiceNumber: 'NF-004700',
      amount: 22150.0,
      dueDate: dPast(10),
      paymentDate: dPast(9),
      status: 'PAID',
      paymentMethod: 'PIX',
      externalId: 'SINK-DUP-10200',
      source: 'SINK_ERP',
      createdAt: dPast(40),
      updatedAt: dPast(9),
    },
    {
      id: 'rec-108',
      customerId: 'cust-1',
      customerName: 'Rede Hospitalar São Camilo S/A',
      documentNumber: 'DUP-4850-01',
      invoiceNumber: 'NF-004850',
      amount: 11200.0,
      dueDate: dFuture(10), // A vencer em 10 dias
      status: 'OPEN',
      paymentMethod: 'BOLETO',
      externalId: 'SINK-DUP-10512',
      source: 'SINK_ERP',
      createdAt: dAgo(1),
      updatedAt: dAgo(1),
    },
    {
      id: 'rec-109',
      customerId: 'cust-2',
      customerName: 'Rede Bella Pelle Estética Avançada & Spas Ltda',
      documentNumber: 'DUP-4860-01',
      invoiceNumber: 'NF-004860',
      amount: 7450.0,
      dueDate: dFuture(3), // Vencimento próximo D-3
      status: 'DUE_SOON',
      paymentMethod: 'BOLETO',
      externalId: 'SINK-DUP-10520',
      source: 'SINK_ERP',
      createdAt: dAgo(1),
      updatedAt: dAgo(1),
    },
  ];

  const collectionRules: CollectionRule[] = [
    {
      id: 'crule-d5',
      name: 'D-5: Alerta de Vencimento Próximo (5 Dias Antes)',
      daysOffset: -5,
      channel: 'WHATSAPP',
      templateName: 'alerta_vencimento_5dias',
      priority: 'MEDIUM',
      targetAudience: 'ALL',
      allowedTimeStart: '08:00',
      allowedTimeEnd: '18:00',
      active: true,
      createdAt: dAgo(720),
    },
    {
      id: 'crule-d0',
      name: 'D0: Lembrete de Vencimento no Dia',
      daysOffset: 0,
      channel: 'WHATSAPP',
      templateName: 'lembrete_vence_hoje',
      priority: 'HIGH',
      targetAudience: 'ALL',
      allowedTimeStart: '08:30',
      allowedTimeEnd: '17:30',
      active: true,
      createdAt: dAgo(720),
    },
    {
      id: 'crule-daily-overdue',
      name: 'Pós-Vencimento: Cobrança Diária Automática WhatsApp',
      daysOffset: 1,
      channel: 'WHATSAPP',
      templateName: 'cobranca_diaria_atraso',
      priority: 'HIGH',
      targetAudience: 'ALL',
      allowedTimeStart: '09:00',
      allowedTimeEnd: '18:00',
      active: true,
      createdAt: dAgo(720),
    },
  ];

  const whatsappLogs: WhatsAppMessageLog[] = [
    {
      id: 'wlog-1',
      recipientPhone: '+55 31 99876-5432',
      customerName: 'Rede de Salões Jacques Janine & Beauty Studio Ltda',
      receivableId: 'rec-102',
      templateName: 'cobranca_renegociacao_d3',
      parameters: {
        cliente: 'Rede de Salões Jacques Janine & Beauty Studio Ltda',
        numero: 'NF-004750 (DUP-4750-01)',
        valor: 'R$ 8.920,00',
        data: dPast(5),
        dados_pagamento: 'Chave PIX: financeiro@flind.com.br ou Linha Digitável do Boleto.',
      },
      status: 'READ',
      providerMessageId: 'wamid.HBgLNTUzMTk5ODc2NTQzMhUCMRIA',
      sentAt: dAgo(48),
      deliveredAt: dAgo(47.9),
      readAt: dAgo(40),
      direction: 'OUTBOUND',
      createdAt: dAgo(48),
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'aud-1',
      action: 'ORDER_IMPORTED_FROM_TRAY',
      origin: 'TrayWebhookHandler',
      entity: 'Order',
      entityId: 'ord-1582',
      newValue: { orderNumber: '#1582', totalAmount: 18450.0, externalId: 'TRAY-ORD-99412' },
      userOrService: 'System Integration Worker',
      correlationId: 'corr-tray-webhook-99412',
      createdAt: dAgo(9),
    },
    {
      id: 'aud-2',
      action: 'ORDER_SYNCED_TO_SINK_ERP',
      origin: 'SinkERPAdapter',
      entity: 'Order',
      entityId: 'ord-1582',
      newValue: { sinkErpProtocol: 'ERP-98124', status: 'INTEGRATED_ERP' },
      userOrService: 'ERP Integration Provider',
      correlationId: 'corr-tray-webhook-99412',
      createdAt: dAgo(8.7),
    },
    {
      id: 'aud-3',
      action: 'SLA_BREACH_DETECTED',
      origin: 'RuleEngine',
      entity: 'Order',
      entityId: 'ord-1582',
      newValue: { stage: 'INVOICING', realDuration: 330, expectedSla: 240, delay: 90 },
      userOrService: 'SlaWorkerDaemon',
      correlationId: 'corr-sla-daemon-check-001',
      createdAt: dAgo(2),
    },
    {
      id: 'aud-4',
      action: 'DELIVERY_RULE_VALIDATION_FAILED',
      origin: 'RuleEngine',
      entity: 'Order',
      entityId: 'ord-1583',
      newValue: {
        violations: [
          'Exige agendamento prévio com 24h de antecedência para recepção no CD de estética',
          'Peso total do pedido (4600 kg) excede capacidade da doca do centro de estética (4000 kg)',
        ],
      },
      userOrService: 'ExpeditionValidator',
      correlationId: 'corr-expedition-val-1583',
      createdAt: dAgo(3),
    },
  ];

  const integrationLogs: IntegrationSyncLog[] = [
    {
      id: 'intlog-1',
      integration: 'TRAY',
      eventType: 'order.created',
      externalId: '99412',
      idempotencyKey: 'tray:order:99412:created',
      status: 'SUCCESS',
      attempts: 1,
      payloadOriginal: { id: 99412, status: 'approved', total: 18450.0 },
      createdAt: dAgo(9),
      updatedAt: dAgo(9),
    },
    {
      id: 'intlog-2',
      integration: 'SINK_ERP',
      eventType: 'customer.sync',
      externalId: 'cust-1',
      idempotencyKey: 'sink:customer:cust-1:sync',
      status: 'SUCCESS',
      attempts: 1,
      createdAt: dAgo(8.9),
      updatedAt: dAgo(8.9),
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'supp-1',
      name: 'Fibras & Não-Tecidos Brasil S/A',
      tradeName: 'TNT Brasil Matérias-Primas',
      taxId: '28.192.401/0001-85',
      stateRegistration: '114.892.401.110',
      contactName: 'Marcos Vinicius (Diretor Comercial)',
      phone: '+55 19 3871-9900',
      whatsapp: '+55 19 99812-4400',
      email: 'comercial@tntbrasil.com.br',
      category: 'Tecidos Não-Tecidos (TNT SMS, Spunbond e Meltblown Hospitalar)',
      leadTimeDays: 3,
      city: 'Americana',
      state: 'SP',
      paymentTerms: 'Boleto 28 DDL',
      status: 'HOMOLOGATED',
      suppliedProductsCount: 4,
      createdAt: dAgo(1440),
    },
    {
      id: 'supp-2',
      name: 'Klabin Embalagens e Papelão Ondulado S/A',
      tradeName: 'Klabin Embalagens Hospitalares',
      taxId: '89.231.114/0004-92',
      stateRegistration: '342.112.909.118',
      contactName: 'Juliana Fontes (Key Account)',
      phone: '+55 11 4589-2200',
      whatsapp: '+55 11 98450-3321',
      email: 'juliana.fontes@klabin.com.br',
      category: 'Caixas de Papelão Ondulado Reforçadas e Divisórias Flind',
      leadTimeDays: 4,
      city: 'Jundiaí',
      state: 'SP',
      paymentTerms: 'Boleto 30/60 DDL',
      status: 'HOMOLOGATED',
      suppliedProductsCount: 6,
      createdAt: dAgo(1200),
    },
    {
      id: 'supp-3',
      name: 'SuperAbsorb Polímeros & Química Industrial Ltda',
      tradeName: 'SuperAbsorb Brasil',
      taxId: '19.822.409/0001-33',
      stateRegistration: '419.008.231.119',
      contactName: 'Dr. Roberto Campos (Químico Responsável)',
      phone: '+55 11 4547-1188',
      whatsapp: '+55 11 97233-8899',
      email: 'roberto.campos@superabsorb.com.br',
      category: 'Polímero Superabsorvente (SAP) e Fibras para Protetores Toalet',
      leadTimeDays: 5,
      city: 'Mauá',
      state: 'SP',
      paymentTerms: 'Boleto 30 DDL',
      status: 'HOMOLOGATED',
      suppliedProductsCount: 2,
      createdAt: dAgo(960),
    },
    {
      id: 'supp-4',
      name: 'ElastoTech Componentes Elásticos e Clips Ltda',
      tradeName: 'ElastoTech Brasil',
      taxId: '45.109.843/0001-12',
      stateRegistration: '280.991.042.115',
      contactName: 'Fernanda Nogueira (Vendas Técnicas)',
      phone: '+55 11 2468-5500',
      whatsapp: '+55 11 98111-7755',
      email: 'vendas@elastotech.com.br',
      category: 'Elásticos Duplos Hipoalergênicos e Clips Nasais Galvanizados',
      leadTimeDays: 2,
      city: 'Guarulhos',
      state: 'SP',
      paymentTerms: 'Boleto 21 DDL',
      status: 'HOMOLOGATED',
      suppliedProductsCount: 3,
      createdAt: dAgo(800),
    },
  ];

  const products: ProductInventory[] = [
    {
      id: 'prod-101',
      sku: 'FLIND-AVT-CIR-50',
      name: 'Avental Cirúrgico Impermeável TNT 50g/m² Esterilizado',
      category: 'Hospitalar & Cirúrgico',
      packagingUnit: 'Caixa (CX)',
      unitsPerPackage: 50,
      unitWeightKg: 0.24,
      weightPerPackageKg: 12.0,
      manufactureDate: '2026-08-10',
      expiryDate: '2029-08-10',
      shelfLifeMonths: 36,
      lotNumber: 'LOTE-FLIND-2026-A19',
      currentStockPackages: 140,
      currentStockUnits: 7000,
      minStockPackages: 60,
      minStockUnits: 3000,
      reorderQuantityPackages: 80,
      supplierId: 'supp-1',
      supplierName: 'Fibras & Não-Tecidos Brasil S/A',
      supplierPhone: '+55 19 99812-4400',
      costPrice: 195.0,
      salePrice: 320.0,
      location: 'Galpão 1 • Rua A-04, Nível 2 (Área Limpa)',
      status: 'NORMAL',
      autoReorderEnabled: true,
      lastRestockAt: dAgo(360),
      createdAt: dAgo(1200),
      updatedAt: dAgo(24),
    },
    {
      id: 'prod-102',
      sku: 'FLIND-MSC-TRIP-TIR',
      name: 'Máscara Cirúrgica Tripla com Tiras BFE≥95%',
      category: 'Hospitalar & Cirúrgico',
      packagingUnit: 'Fardo (FD)',
      unitsPerPackage: 2000,
      unitWeightKg: 0.0035,
      weightPerPackageKg: 7.5,
      manufactureDate: '2026-09-01',
      expiryDate: '2029-09-01',
      shelfLifeMonths: 36,
      lotNumber: 'LOTE-FLIND-2026-B02',
      currentStockPackages: 22,
      currentStockUnits: 44000,
      minStockPackages: 25,
      minStockUnits: 50000,
      reorderQuantityPackages: 30,
      supplierId: 'supp-1',
      supplierName: 'Fibras & Não-Tecidos Brasil S/A',
      supplierPhone: '+55 19 99812-4400',
      costPrice: 140.0,
      salePrice: 250.0,
      location: 'Galpão 1 • Rua B-02, Nível 1',
      status: 'LOW',
      autoReorderEnabled: true,
      lastRestockAt: dAgo(500),
      createdAt: dAgo(1200),
      updatedAt: dAgo(12),
    },
    {
      id: 'prod-103',
      sku: 'FLIND-LNC-MAC-ELAST',
      name: 'Lençol Descartável com Elástico TNT 30g/m² para Macas (2,20m x 0,90m)',
      category: 'Estética & Spas',
      packagingUnit: 'Pacote (PCT)',
      unitsPerPackage: 10,
      unitWeightKg: 0.095,
      weightPerPackageKg: 0.98,
      manufactureDate: '2026-07-15',
      expiryDate: '2029-07-15',
      shelfLifeMonths: 36,
      lotNumber: 'LOTE-FLIND-2026-C44',
      currentStockPackages: 8,
      currentStockUnits: 80,
      minStockPackages: 40,
      minStockUnits: 400,
      reorderQuantityPackages: 60,
      supplierId: 'supp-1',
      supplierName: 'Fibras & Não-Tecidos Brasil S/A',
      supplierPhone: '+55 19 99812-4400',
      costPrice: 42.0,
      salePrice: 79.9,
      location: 'Galpão 2 • Rua C-01, Nível 3',
      status: 'CRITICAL',
      autoReorderEnabled: true,
      lastRestockAt: dAgo(720),
      createdAt: dAgo(1100),
      updatedAt: dAgo(2),
    },
    {
      id: 'prod-104',
      sku: 'FLIND-PROT-TOALET-GEL',
      name: 'Protetor Toalet Descartável Impermeável c/ Gel Superabsorvente',
      category: 'Hospitalar & Cirúrgico',
      packagingUnit: 'Caixa (CX)',
      unitsPerPackage: 100,
      unitWeightKg: 0.048,
      weightPerPackageKg: 5.1,
      manufactureDate: '2026-08-25',
      expiryDate: '2028-08-25',
      shelfLifeMonths: 24,
      lotNumber: 'LOTE-FLIND-2026-T11',
      currentStockPackages: 12,
      currentStockUnits: 1200,
      minStockPackages: 35,
      minStockUnits: 3500,
      reorderQuantityPackages: 50,
      supplierId: 'supp-3',
      supplierName: 'SuperAbsorb Polímeros & Química Industrial Ltda',
      supplierPhone: '+55 11 97233-8899',
      costPrice: 65.0,
      salePrice: 128.0,
      location: 'Galpão 1 • Rua D-05, Nível 1',
      status: 'CRITICAL',
      autoReorderEnabled: true,
      lastRestockAt: dAgo(600),
      createdAt: dAgo(900),
      updatedAt: dAgo(4),
    },
    {
      id: 'prod-105',
      sku: 'FLIND-CAP-BARB-AJUST',
      name: 'Capa Descartável de Corte com Botão Ajustável (Barbearias e Salões)',
      category: 'Salões & Barbearias',
      packagingUnit: 'Caixa (CX)',
      unitsPerPackage: 100,
      unitWeightKg: 0.038,
      weightPerPackageKg: 4.1,
      manufactureDate: '2026-08-01',
      expiryDate: '2031-08-01',
      shelfLifeMonths: 60,
      lotNumber: 'LOTE-FLIND-2026-S08',
      currentStockPackages: 75,
      currentStockUnits: 7500,
      minStockPackages: 25,
      minStockUnits: 2500,
      reorderQuantityPackages: 50,
      supplierId: 'supp-1',
      supplierName: 'Fibras & Não-Tecidos Brasil S/A',
      supplierPhone: '+55 19 99812-4400',
      costPrice: 48.0,
      salePrice: 94.0,
      location: 'Galpão 2 • Rua B-03, Nível 2',
      status: 'NORMAL',
      autoReorderEnabled: true,
      lastRestockAt: dAgo(400),
      createdAt: dAgo(800),
      updatedAt: dAgo(48),
    },
    {
      id: 'prod-106',
      sku: 'FLIND-TCA-SANF-100',
      name: 'Touca Sanfonada Duplo Elástico Hospitalar Branca',
      category: 'Hospitalar & Cirúrgico',
      packagingUnit: 'Pacote (PCT)',
      unitsPerPackage: 100,
      unitWeightKg: 0.0032,
      weightPerPackageKg: 0.35,
      manufactureDate: '2026-09-05',
      expiryDate: '2029-09-05',
      shelfLifeMonths: 36,
      lotNumber: 'LOTE-FLIND-2026-T22',
      currentStockPackages: 210,
      currentStockUnits: 21000,
      minStockPackages: 70,
      minStockUnits: 7000,
      reorderQuantityPackages: 100,
      supplierId: 'supp-4',
      supplierName: 'ElastoTech Componentes Elásticos e Clips Ltda',
      supplierPhone: '+55 11 98111-7755',
      costPrice: 9.8,
      salePrice: 19.9,
      location: 'Galpão 1 • Rua A-01, Nível 1',
      status: 'NORMAL',
      autoReorderEnabled: true,
      lastRestockAt: dAgo(200),
      createdAt: dAgo(1000),
      updatedAt: dAgo(10),
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-flind-101',
      orderNumber: 'PO-FLIND-2026-042',
      supplierId: 'supp-1',
      supplierName: 'Fibras & Não-Tecidos Brasil S/A',
      supplierWhatsapp: '+55 19 99812-4400',
      productId: 'prod-103',
      productSku: 'FLIND-LNC-MAC-ELAST',
      productName: 'Lençol Descartável com Elástico TNT 30g/m² para Macas (2,20m x 0,90m)',
      quantityPackages: 60,
      quantityUnits: 600,
      packagingUnit: 'Pacote (PCT)',
      estimatedCost: 2520.0,
      triggerReason: 'AUTO_LOW_STOCK',
      status: 'SENT_WHATSAPP',
      whatsappMessageId: 'web.WA5519998124400-auto-po42',
      notes: 'Disparo automático acionado: Estoque atingiu 8 pacotes (mínimo de segurança: 40 pct).',
      expectedDeliveryDate: dFuture(3),
      createdAt: dAgo(2),
      updatedAt: dAgo(2),
    },
    {
      id: 'po-flind-102',
      orderNumber: 'PO-FLIND-2026-043',
      supplierId: 'supp-3',
      supplierName: 'SuperAbsorb Polímeros & Química Industrial Ltda',
      supplierWhatsapp: '+55 11 97233-8899',
      productId: 'prod-104',
      productSku: 'FLIND-PROT-TOALET-GEL',
      productName: 'Protetor Toalet Descartável Impermeável c/ Gel Superabsorvente',
      quantityPackages: 50,
      quantityUnits: 5000,
      packagingUnit: 'Caixa (CX)',
      estimatedCost: 3250.0,
      triggerReason: 'AUTO_LOW_STOCK',
      status: 'SENT_WHATSAPP',
      whatsappMessageId: 'web.WA5511972338899-auto-po43',
      notes: 'Disparo automático acionado: Estoque atingiu 12 caixas (mínimo de segurança: 35 cx).',
      expectedDeliveryDate: dFuture(4),
      createdAt: dAgo(4),
      updatedAt: dAgo(4),
    },
  ];

  const autoSettings = {
    autoWhatsAppExpedition: true,
    autoWhatsAppCollection: true,
    autoWhatsAppLowStock: true,
  };

  return {
    version: 1,
    customers,
    addresses,
    deliveryRules,
    orders,
    slaRules,
    alerts,
    receivables,
    collectionRules,
    whatsappLogs,
    shipments,
    auditLogs,
    integrationLogs,
    products,
    suppliers,
    purchaseOrders,
    cancelledPurchaseOrders: [],
    autoSettings,
  };
}

class DatabaseManager {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;
  private cancelledCooldowns: Map<string, number> = new Map();

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const bundledFile = path.resolve(process.cwd(), 'data', 'fabrica_integrada_db.json');
      let fileContent = '';

      if (fs.existsSync(DB_FILE)) {
        fileContent = fs.readFileSync(DB_FILE, 'utf-8');
      } else if (fs.existsSync(bundledFile)) {
        fileContent = fs.readFileSync(bundledFile, 'utf-8');
        try {
          fs.writeFileSync(DB_FILE, fileContent, 'utf-8');
        } catch {}
      }

      if (fileContent) {
        const parsed = JSON.parse(fileContent);
        if (parsed && parsed.version) {
          const seed = getInitialSeed();
          if (!parsed.products || parsed.products.length === 0) parsed.products = seed.products;
          if (!parsed.suppliers || parsed.suppliers.length === 0) parsed.suppliers = seed.suppliers;
          if (!parsed.purchaseOrders) parsed.purchaseOrders = seed.purchaseOrders;
          if (!parsed.cancelledPurchaseOrders) parsed.cancelledPurchaseOrders = [];
          if (!parsed.autoSettings) parsed.autoSettings = seed.autoSettings;

          // Ao cancelar uma compra ela sai de Ordens de Compra: migra canceladas para arquivo histórico
          if (Array.isArray(parsed.purchaseOrders)) {
            const alreadyCancelled = parsed.purchaseOrders.filter((po: any) => po.status === 'CANCELLED');
            if (alreadyCancelled.length > 0) {
              parsed.cancelledPurchaseOrders = [
                ...parsed.cancelledPurchaseOrders,
                ...alreadyCancelled,
              ];
              parsed.purchaseOrders = parsed.purchaseOrders.filter((po: any) => po.status !== 'CANCELLED');
            }
          }

          // Garantir que todos os produtos tenham fichas técnicas completas do Catálogo Flind
          const catalogSpecsMap: Record<string, any> = {
            'FLIND-AVT-CIR-50': {
              barcode: '7898956000101',
              material: 'TNT SMS 100% Polipropileno Tripla Camada (Spunbond-Meltblown-Spunbond)',
              technicalSpecs: 'Tecido não-tecido cirúrgico hidrorrepelente, atóxico, hipoalergênico, barreira bacteriana BFE ≥ 99%, solda ultrassônica e fechamento por tiras ajustáveis.',
              dimensions: 'Comprimento 1,40m x Largura 1,60m (Tamanho G/GG)',
              grammage: '50 g/m²',
              anvisaRegistration: 'Registro ANVISA 80123450001',
              packagingDimensions: '60 x 40 x 35 cm',
              stackingMax: 6,
              storageConditions: 'Armazenar em local seco, arejado, protegido contra umidade e luz solar direta entre 15°C e 30°C.',
              flindCatalogUrl: 'https://www.flind.com.br/produtos/avental-cirurgico-50g',
            },
            'FLIND-MSC-TRIP-TIR': {
              barcode: '7898956000102',
              material: 'TNT Tripla Camada com Filtro Meltblown BFE ≥ 95% e Tiras de Amarração 40cm',
              technicalSpecs: 'Máscara cirúrgica odontológica e hospitalar de tripla camada com clipe nasal maleável revestido. Atende norma ABNT NBR 14853. Eficiência de filtragem bacteriana superior a 95%.',
              dimensions: '17,5cm x 9,5cm (Adulto padrão hospitalar)',
              grammage: 'Três camadas: 20 + 20 + 25 g/m²',
              anvisaRegistration: 'Registro ANVISA 80123450002',
              packagingDimensions: '50 x 38 x 42 cm',
              stackingMax: 8,
              storageConditions: 'Manter na embalagem original em ambiente estéril/limpo, umidade relativa < 80%.',
              flindCatalogUrl: 'https://www.flind.com.br/produtos/mascara-cirurgica-tripla-tiras',
            },
            'FLIND-LNC-MAC-ELAST': {
              barcode: '7898956000103',
              material: 'TNT 100% Polipropileno Spunbond com Elástico Embutido em Todo o Perímetro',
              technicalSpecs: 'Lençol descartável ajustável para macas cirúrgicas, estéticas e ginecológicas. Elástico reforçado nas 4 extremidades, toque macio, alta respirabilidade e barreira contra contaminação cruzada.',
              dimensions: '2,20m de comprimento x 0,90m de largura x 0,20m de aba elástica',
              grammage: '30 g/m²',
              anvisaRegistration: 'Notificação ANVISA / RDC 356',
              packagingDimensions: '45 x 30 x 25 cm',
              stackingMax: 10,
              storageConditions: 'Proteger contra umidade e agentes perfurocortantes.',
              flindCatalogUrl: 'https://www.flind.com.br/produtos/lencol-descartavel-elastico-maca',
            },
            'FLIND-PROT-TOALET-GEL': {
              barcode: '7898956000104',
              material: 'Celulose Virgem + Camada Polímero Superabsorvente (SAP) + Filme Polietileno Impermeável',
              technicalSpecs: 'Toalete e protetor descartável Flind para leitos hospitalares, exames e procedimentos. Gel superabsorvente que retém líquidos e odores instantaneamente sem vazamento para a base.',
              dimensions: '40cm x 60cm (Área útil absorvente)',
              grammage: 'Camada quádrupla absorvente com barreira impermeável 25µ',
              anvisaRegistration: 'Registro ANVISA 80123450004',
              packagingDimensions: '55 x 45 x 30 cm',
              stackingMax: 6,
              storageConditions: 'Armazenar estritamente longe de umidade e fontes de calor excessivo.',
              flindCatalogUrl: 'https://www.flind.com.br/produtos/toalete-descartavel-gel-superabsorvente',
            },
            'FLIND-CAP-BARB-AJUST': {
              barcode: '7898956000105',
              material: 'TNT Spunbond Hidro-repelente com Fechamento Frontal por Botões de Pressão',
              technicalSpecs: 'Capa de corte profissional para salões e barbearias. Leve, ventilada, antiaderente a fios de cabelo e resistente a respingos de tinturas e água.',
              dimensions: '1,50m x 1,20m com gola anatômica ajustável',
              grammage: '40 g/m²',
              anvisaRegistration: 'Isento RDC Anvisa (Uso Estético/Beleza)',
              packagingDimensions: '40 x 30 x 20 cm',
              stackingMax: 12,
              storageConditions: 'Local arejado e limpo.',
              flindCatalogUrl: 'https://www.flind.com.br/produtos/capa-corte-descartavel-barbearia',
            },
            'FLIND-TCA-SANF-100': {
              barcode: '7898956000106',
              material: 'TNT 100% Polipropileno com Duplo Elástico Termosselado',
              technicalSpecs: 'Touca sanfonada descartável de alta elasticidade. Proporciona contenção completa de fios capilares em centros cirúrgicos, salas limpas, indústrias alimentícias e clínicas.',
              dimensions: 'Diâmetro expandido: 50cm (Tamanho Único Anatômico)',
              grammage: '20 g/m²',
              anvisaRegistration: 'Registro ANVISA 80123450006',
              packagingDimensions: '35 x 25 x 20 cm',
              stackingMax: 15,
              storageConditions: 'Conservar na embalagem plástica até o momento do uso.',
              flindCatalogUrl: 'https://www.flind.com.br/produtos/touca-sanfonada-duplo-elastico',
            },
            'FLIND-BOB-TNT-40': {
              barcode: '7898956000107',
              material: 'Polipropileno 100% Grau Cirúrgico SMS em Bobina Industrial',
              technicalSpecs: 'Matéria-prima principal para conversão em aventais, campos operatórios e lençóis cirúrgicos. Homologada conforme normas ABNT NBR 16064.',
              dimensions: 'Largura 1,60m x Comprimento 1.000m lineares',
              grammage: '40 g/m²',
              anvisaRegistration: 'Matéria-Prima Certificada NBR 16064',
              packagingDimensions: 'Bobina Ø 0,60m x 1,60m',
              stackingMax: 3,
              storageConditions: 'Estocagem vertical ou berço palletizado.',
              flindCatalogUrl: 'https://www.flind.com.br/insumos/bobina-tnt-sms-40g',
            },
            'FLIND-CX-KLABIN-60': {
              barcode: '7898956000108',
              material: 'Papelão Ondulado Kraft Onda C (Coluna de compressão ≥ 5,2 kN/m)',
              technicalSpecs: 'Embalagem secundária padrão para transporte e expedição de caixas cirúrgicas e descartáveis Flind. Alta resistência ao empilhamento e umidade.',
              dimensions: '60cm (C) x 40cm (L) x 40cm (A)',
              grammage: '480 g/m² estrutural',
              anvisaRegistration: 'Embalagem Secundária Conforme RDC 16',
              packagingDimensions: 'Fardo com 25 unidades amarradas: 100 x 80 x 20 cm',
              stackingMax: 5,
              storageConditions: 'Armazém sobre pallets secos.',
              flindCatalogUrl: 'https://www.flind.com.br/insumos/caixa-papelao-klabin-60x40x40',
            },
          };

          if (Array.isArray(parsed.products)) {
            parsed.products.forEach((p: any) => {
              const extra = catalogSpecsMap[p.sku];
              if (extra) {
                if (!p.barcode) p.barcode = extra.barcode;
                if (!p.material) p.material = extra.material;
                if (!p.technicalSpecs) p.technicalSpecs = extra.technicalSpecs;
                if (!p.dimensions) p.dimensions = extra.dimensions;
                if (!p.grammage) p.grammage = extra.grammage;
                if (!p.anvisaRegistration) p.anvisaRegistration = extra.anvisaRegistration;
                if (!p.packagingDimensions) p.packagingDimensions = extra.packagingDimensions;
                if (!p.stackingMax) p.stackingMax = extra.stackingMax;
                if (!p.storageConditions) p.storageConditions = extra.storageConditions;
                if (!p.flindCatalogUrl) p.flindCatalogUrl = extra.flindCatalogUrl;
              }
            });

            // Adicionar matérias-primas essenciais se ainda não existirem
            const existingSkus = new Set(parsed.products.map((p: any) => p.sku));
            seed.products.forEach((sp) => {
              if (!existingSkus.has(sp.sku)) {
                parsed.products.push(sp);
              }
            });
          }

          // Garantir classificação correta entre clientes do site e clientes diretos da fábrica (não-web)
          if (Array.isArray(parsed.customers)) {
            parsed.customers.forEach((c: any) => {
              if (!c.segment) {
                const n = (c.name || '').toLowerCase();
                if (n.includes('hospital') || n.includes('aliança') || n.includes('saúde') || n.includes('médic') || n.includes('santa')) {
                  c.segment = 'Hospitalar & Cirúrgico';
                } else if (n.includes('estética') || n.includes('pele') || n.includes('laser') || n.includes('progresso')) {
                  c.segment = 'Estética & Spas';
                } else if (n.includes('salão') || n.includes('barbearia') || n.includes('ferramentas') || n.includes('beauty')) {
                  c.segment = 'Salões & Barbearias';
                } else {
                  c.segment = 'Hospitalar & Cirúrgico';
                }
              }

              // Diferenciação explícita: Clientes do Site vs Clientes Diretos da Fábrica (B2B / Sem Site)
              const isExplicitDirect =
                c.flindOrigin === 'DIRETO_B2B' ||
                c.flindOrigin === 'BALCAO' ||
                c.flindOrigin === 'SINK_ERP' ||
                c.id === 'cust-1' ||
                c.id === 'cust-2' ||
                c.id === 'cust-3';

              if (isExplicitDirect) {
                if (!c.flindOrigin) c.flindOrigin = 'DIRETO_B2B';
                c.flindWebId = undefined;
                c.flindPortalSync = undefined;
                c.flindWebProfileUrl = undefined;
              } else if (c.flindOrigin === 'FLIND_ECOMMERCE_WEB' || c.flindOrigin === 'TRAY' || c.id === 'cust-tray-994' || c.id === 'cust-mue6piye') {
                c.flindOrigin = c.flindOrigin || 'FLIND_ECOMMERCE_WEB';
                if (!c.flindWebProfileUrl) {
                  c.flindWebProfileUrl = 'https://www.flind.com.br/central-do-cliente';
                }
                if (!c.flindWebId) {
                  c.flindWebId = `FW-${Math.floor(10000 + Math.random() * 90000)}`;
                }
                if (!c.flindPortalSync) {
                  c.flindPortalSync = {
                    isRegisteredOnFlindWeb: true,
                    lastSyncedAt: new Date().toISOString(),
                    accountEmail: c.email || 'compras@flind.com.br',
                    totalFlindWebOrders: Array.isArray(parsed.orders)
                      ? parsed.orders.filter((o: any) => o.customerId === c.id).length
                      : 2,
                    flindTier: c.segment?.includes('Hospitalar') ? 'OURO_HOSPITALAR' : 'PRATA_CLINICAS',
                    customerProfileUrl: 'https://www.flind.com.br/central-do-cliente',
                    catalogInterest: ['Descartáveis Hospitalares', 'Toalet Descartável', 'Lençóis TNT para Macas'],
                  };
                }
              }
            });
          }

          // Garantir que haja títulos com status de atraso conforme semente para régua diária
          if (Array.isArray(parsed.receivables)) {
            const hasOverdue = parsed.receivables.some((r: any) => r.status === 'OVERDUE');
            if (!hasOverdue) {
              seed.receivables.forEach((sr) => {
                const target = parsed.receivables.find((pr: any) => pr.id === sr.id);
                if (target && (sr.status === 'OVERDUE' || sr.status === 'DUE_TODAY')) {
                  target.status = sr.status;
                  target.dueDate = sr.dueDate;
                  target.autoCleared = false;
                  delete target.paymentDate;
                }
              });
            }
          }

          return parsed;
        }
      }
    } catch (err) {
      console.error('[DB] Erro ao carregar banco do disco, inicializando com sementes padrão:', err);
    }

    const seed = getInitialSeed();
    this.saveImmediate(seed);
    return seed;
  }

  private saveImmediate(dataToSave: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[DB] Operando com persistência em memória (ambiente serverless/somente-leitura):', err);
    }
  }

  public forceSave(): { success: boolean; path: string; sizeBytes: number; timestamp: string } {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveImmediate(this.data);
    let sizeBytes = 0;
    try {
      if (fs.existsSync(DB_FILE)) {
        sizeBytes = fs.statSync(DB_FILE).size;
      }
    } catch {}
    return {
      success: true,
      path: DB_FILE,
      sizeBytes,
      timestamp: new Date().toISOString(),
    };
  }

  public getRawData(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }

  public importRawData(incoming: Partial<DatabaseSchema>): { success: boolean; message: string; counts: Record<string, number> } {
    if (!incoming || typeof incoming !== 'object') {
      throw new Error('Formato de dados inválido para importação.');
    }
    if (Array.isArray(incoming.customers)) this.data.customers = incoming.customers;
    if (Array.isArray(incoming.addresses)) this.data.addresses = incoming.addresses;
    if (Array.isArray(incoming.orders)) this.data.orders = incoming.orders;
    if (Array.isArray(incoming.deliveryRules)) this.data.deliveryRules = incoming.deliveryRules;
    if (Array.isArray(incoming.slaRules)) this.data.slaRules = incoming.slaRules;
    if (Array.isArray(incoming.alerts)) this.data.alerts = incoming.alerts;
    if (Array.isArray(incoming.receivables)) this.data.receivables = incoming.receivables;
    if (Array.isArray(incoming.collectionRules)) this.data.collectionRules = incoming.collectionRules;
    if (Array.isArray(incoming.whatsappLogs)) this.data.whatsappLogs = incoming.whatsappLogs;
    if (Array.isArray(incoming.shipments)) this.data.shipments = incoming.shipments;
    if (Array.isArray(incoming.auditLogs)) this.data.auditLogs = incoming.auditLogs;
    if (Array.isArray(incoming.products)) this.data.products = incoming.products;
    if (Array.isArray(incoming.suppliers)) this.data.suppliers = incoming.suppliers;
    if (Array.isArray(incoming.purchaseOrders)) this.data.purchaseOrders = incoming.purchaseOrders;
    if (incoming.autoSettings) this.data.autoSettings = { ...this.data.autoSettings, ...incoming.autoSettings };

    this.forceSave();
    return {
      success: true,
      message: 'Banco de dados restaurado e gravado com sucesso no disco!',
      counts: {
        customers: this.data.customers.length,
        orders: this.data.orders.length,
        products: this.data.products.length,
        suppliers: this.data.suppliers.length,
        purchaseOrders: this.data.purchaseOrders.length,
        receivables: this.data.receivables.length,
        whatsappLogs: this.data.whatsappLogs.length,
      },
    };
  }

  public persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(this.data);
      this.saveTimeout = null;
    }, 200);
  }

  // --- GETTERS E MUTATORS ---

  public getCustomers(): Customer[] {
    return this.data.customers.map((c) => ({
      ...c,
      addresses: this.data.addresses.filter((a) => a.customerId === c.id),
    }));
  }

  public getCustomerById(id: string): Customer | undefined {
    const cust = this.data.customers.find((c) => c.id === id);
    if (!cust) return undefined;
    return {
      ...cust,
      addresses: this.data.addresses.filter((a) => a.customerId === cust.id),
    };
  }

  public upsertCustomer(customer: Customer): Customer {
    const idx = this.data.customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      this.data.customers[idx] = { ...customer, updatedAt: new Date().toISOString() };
    } else {
      this.data.customers.push(customer);
    }
    this.persist();
    return customer;
  }

  public deleteCustomer(id: string): boolean {
    const prevLen = this.data.customers.length;
    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    this.data.addresses = this.data.addresses.filter((a) => a.customerId !== id);
    this.data.deliveryRules = this.data.deliveryRules.filter((r) => r.customerId !== id);
    this.persist();
    return this.data.customers.length < prevLen;
  }

  public getAddresses(customerId?: string): CustomerAddress[] {
    if (customerId) {
      return this.data.addresses.filter((a) => a.customerId === customerId);
    }
    return this.data.addresses;
  }

  public getAddressById(id: string): CustomerAddress | undefined {
    return this.data.addresses.find((a) => a.id === id);
  }

  public upsertAddress(address: CustomerAddress): CustomerAddress {
    const idx = this.data.addresses.findIndex((a) => a.id === address.id);
    if (idx >= 0) {
      this.data.addresses[idx] = address;
    } else {
      this.data.addresses.push(address);
    }
    this.persist();
    return address;
  }

  public deleteAddress(id: string): boolean {
    const prevLen = this.data.addresses.length;
    this.data.addresses = this.data.addresses.filter((a) => a.id !== id);
    this.data.deliveryRules = this.data.deliveryRules.filter((r) => r.addressId !== id);
    this.persist();
    return this.data.addresses.length < prevLen;
  }

  public getDeliveryRules(addressId?: string): DeliveryRule[] {
    if (addressId) {
      return this.data.deliveryRules.filter((r) => r.addressId === addressId);
    }
    return this.data.deliveryRules;
  }

  public getDeliveryRuleByAddressId(addressId: string): DeliveryRule | undefined {
    return this.data.deliveryRules.find((r) => r.addressId === addressId && r.active);
  }

  public upsertDeliveryRule(rule: DeliveryRule): DeliveryRule {
    const idx = this.data.deliveryRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.data.deliveryRules[idx] = rule;
    } else {
      this.data.deliveryRules.push(rule);
    }
    this.persist();
    return rule;
  }

  public getOrders(): Order[] {
    return this.data.orders.map((o) => ({
      ...o,
      customer: this.getCustomerById(o.customerId),
      deliveryAddress: this.getAddressById(o.deliveryAddressId),
    }));
  }

  public getOrderById(id: string): Order | undefined {
    const order = this.data.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return undefined;
    return {
      ...order,
      customer: this.getCustomerById(order.customerId),
      deliveryAddress: this.getAddressById(order.deliveryAddressId),
    };
  }

  public upsertOrder(order: Order): Order {
    const idx = this.data.orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.data.orders[idx] = { ...order, updatedAt: new Date().toISOString() };
    } else {
      this.data.orders.push(order);
    }
    this.persist();
    return order;
  }

  public getSlaRules(): SlaRule[] {
    return this.data.slaRules;
  }

  public upsertSlaRule(rule: SlaRule): SlaRule {
    const idx = this.data.slaRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.data.slaRules[idx] = rule;
    } else {
      this.data.slaRules.push(rule);
    }
    this.persist();
    return rule;
  }

  public getAlerts(): Alert[] {
    return this.data.alerts;
  }

  public addAlert(alert: Alert): Alert {
    // Evitar alertas duplicados idênticos para a mesma entidade se ainda pendentes
    const existing = this.data.alerts.find(
      (a) =>
        a.status === 'PENDING' &&
        a.type === alert.type &&
        a.entityType === alert.entityType &&
        a.entityId === alert.entityId
    );
    if (existing) {
      return existing;
    }
    this.data.alerts.unshift(alert);
    this.persist();
    return alert;
  }

  public updateAlertStatus(
    alertId: string,
    status: 'ACKNOWLEDGED' | 'RESOLVED',
    responsible?: string
  ): Alert | undefined {
    const alert = this.data.alerts.find((a) => a.id === alertId);
    if (!alert) return undefined;
    alert.status = status;
    if (responsible) alert.responsible = responsible;
    if (status === 'ACKNOWLEDGED') alert.acknowledgedAt = new Date().toISOString();
    if (status === 'RESOLVED') alert.resolvedAt = new Date().toISOString();
    this.persist();
    return alert;
  }

  public getReceivables(): Receivable[] {
    return this.data.receivables;
  }

  public getReceivableById(id: string): Receivable | undefined {
    return this.data.receivables.find((r) => r.id === id);
  }

  public upsertReceivable(receivable: Receivable): Receivable {
    const idx = this.data.receivables.findIndex((r) => r.id === receivable.id);
    if (idx >= 0) {
      this.data.receivables[idx] = { ...receivable, updatedAt: new Date().toISOString() };
    } else {
      this.data.receivables.push(receivable);
    }
    this.persist();
    return receivable;
  }

  /**
   * RECONHECIMENTO DE PAGAMENTO & BAIXA AUTOMÁTICA
   * Realiza a baixa imediata do título a receber, sincroniza status do pedido vinculado para PAGO,
   * resolve alertas operacionais/financeiros, cancela réguas futuras de cobrança
   * e gera trilha de auditoria e protocolo rastreável.
   */
  public autoClearReceivablePayment(params: {
    receivableId?: string;
    documentNumber?: string;
    orderId?: string;
    pixCode?: string;
    amount?: number;
    channel?: string;
    transactionCode?: string;
    paymentDate?: string;
    payerName?: string;
    payerTaxId?: string;
    notes?: string;
    operatorOrService?: string;
  }): {
    success: boolean;
    message: string;
    receivable: Receivable;
    orderUpdated: boolean;
    orderNumber?: string;
    orderId?: string;
    resolvedAlertsCount: number;
    cancelledCollectionCount: number;
    clearingDetails: {
      transactionCode: string;
      clearingChannel: string;
      clearedAt: string;
      amount: number;
      payerName?: string;
    };
  } {
    let rec: Receivable | undefined;
    if (params.receivableId) {
      rec = this.data.receivables.find((r) => r.id === params.receivableId);
    }
    if (!rec && params.documentNumber) {
      const docClean = params.documentNumber.trim().toLowerCase();
      rec = this.data.receivables.find((r) => r.documentNumber.trim().toLowerCase() === docClean);
    }
    if (!rec && params.orderId) {
      rec = this.data.receivables.find((r) => r.orderId === params.orderId);
    }
    if (!rec && params.pixCode) {
      rec = this.data.receivables.find((r) => r.pixCode === params.pixCode);
    }

    if (!rec) {
      throw new Error(`Título a receber não encontrado para os parâmetros informados.`);
    }

    const nowIso = new Date().toISOString();
    const paymentDateStr = params.paymentDate || nowIso.split('T')[0];
    const channel = params.channel || 'PIX_AUTOMATICO';
    const transactionCode =
      params.transactionCode ||
      `AUT-${channel.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 1. Atualizar Título a Receber com baixa imediata
    const wasAlreadyPaid = rec.status === 'PAID';
    rec.status = 'PAID';
    rec.paymentDate = paymentDateStr;
    rec.autoCleared = true;
    rec.autoClearedAt = nowIso;
    rec.clearingChannel = channel;
    rec.transactionCode = transactionCode;
    if (params.payerName) rec.payerName = params.payerName;
    if (params.payerTaxId) rec.payerTaxId = params.payerTaxId;
    if (params.notes) rec.receiptNotes = params.notes;
    rec.updatedAt = nowIso;

    // 2. Baixa Automática no Pedido Vinculado
    let orderUpdated = false;
    let orderNumber: string | undefined;
    let linkedOrderId: string | undefined;

    if (rec.orderId) {
      const order = this.data.orders.find((o) => o.id === rec.orderId);
      if (order) {
        orderUpdated = true;
        orderNumber = order.orderNumber;
        linkedOrderId = order.id;
        order.paymentStatus = 'PAID';

        const channelLabel =
          channel === 'PIX_AUTOMATICO'
            ? 'Pix Instantâneo'
            : channel === 'RETORNO_BANCARIO_CNAB'
            ? 'Retorno Bancário CNAB'
            : channel === 'SINK_ERP'
            ? 'SINK ERP'
            : channel === 'TRAY'
            ? 'Tray E-commerce'
            : channel;

        const timelineNote = `[BAIXA AUTOMÁTICA] Pagamento de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rec.amount)} reconhecido via ${channelLabel}. Autenticação: ${transactionCode}. Pedido liberado para faturamento/expedição.`;

        const tlEvent = order.timeline.find((t) => t.stage === 'INVOICING' || t.stage === 'ORDER_RECEIVED');
        if (tlEvent) {
          tlEvent.notes = tlEvent.notes ? `${tlEvent.notes} | ${timelineNote}` : timelineNote;
        }

        order.updatedAt = nowIso;
      }
    }

    // 3. Resolução Automática de Alertas Relacionados ao Pagamento
    let resolvedAlertsCount = 0;
    for (const alert of this.data.alerts) {
      const isLinkedToReceivable = alert.entityId === rec.id;
      const isLinkedToOrder = Boolean(rec.orderId && alert.entityId === rec.orderId);
      if ((isLinkedToReceivable || isLinkedToOrder) && alert.status === 'PENDING') {
        if (
          alert.type === 'OVERDUE_RECEIVABLE' ||
          alert.message.toLowerCase().includes('pagamento') ||
          alert.message.toLowerCase().includes('título') ||
          alert.message.toLowerCase().includes('fatura') ||
          alert.message.toLowerCase().includes('atrasado')
        ) {
          alert.status = 'RESOLVED';
          alert.resolvedAt = nowIso;
          alert.responsible = `Baixa Automática (${channel})`;
          resolvedAlertsCount++;
        }
      }
    }

    // 4. Cancelamento de Fila de Cobrança WhatsApp
    let cancelledCollectionCount = 0;
    for (const log of this.data.whatsappLogs) {
      if (
        (log.receivableId === rec.id || (rec.orderId && log.orderId === rec.orderId)) &&
        log.status === 'QUEUED'
      ) {
        log.status = 'FAILED';
        log.errorMessage = 'Cobrança cancelada: pagamento reconhecido e baixado automaticamente.';
        cancelledCollectionCount++;
      }
    }

    // 5. Auditoria do Evento de Baixa Automática
    this.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'PAYMENT_RECOGNIZED_AUTO_CLEARED',
      origin: `api.autoClearReceivablePayment (${channel})`,
      entity: 'Receivable',
      entityId: rec.id,
      newValue: {
        documentNumber: rec.documentNumber,
        amount: rec.amount,
        status: 'PAID',
        paymentDate: paymentDateStr,
        channel,
        transactionCode,
        orderId: rec.orderId,
        orderNumber,
        resolvedAlerts: resolvedAlertsCount,
      },
      userOrService: params.operatorOrService || `Automação Baixa ${channel}`,
      correlationId: `corr-autoclear-${transactionCode}`,
      createdAt: nowIso,
    });

    this.persist();

    return {
      success: true,
      message: wasAlreadyPaid
        ? `Título ${rec.documentNumber} já estava baixado. Dados e pedido revalidados com sucesso.`
        : `Pagamento reconhecido e baixado automaticamente com sucesso para o título ${rec.documentNumber}! Pedido ${orderNumber || 'vinculado'} liberado.`,
      receivable: rec,
      orderUpdated,
      orderNumber,
      orderId: linkedOrderId,
      resolvedAlertsCount,
      cancelledCollectionCount,
      clearingDetails: {
        transactionCode,
        clearingChannel: channel,
        clearedAt: nowIso,
        amount: rec.amount,
        payerName: params.payerName || rec.customerName,
      },
    };
  }

  /**
   * Identificação e Baixa Autônoma de Pagamentos pelo Sistema (Sem necessidade de apertar botão)
   * Monitora confirmações de Pix PSP, Compensações Bancárias e liquidações do ERP/Tray
   */
  public systemAutoDetectPayments(): {
    detected: number;
    clearedList: any[];
  } {
    let detected = 0;
    const clearedList: any[] = [];

    // Localizar títulos vinculados a pedidos de e-commerce Tray com pagamento aprovado que ainda estejam com recebível aberto
    const openReceivables = this.data.receivables.filter(
      (r) => (r.status === 'OPEN' || r.status === 'DUE_SOON') && r.source === 'TRAY' && r.orderId
    );

    for (const rec of openReceivables) {
      const order = this.data.orders.find((o) => o.id === rec.orderId);
      if (order && order.paymentStatus === 'PAID') {
        const fakeE2eId = `AUTOPAY-${Date.now().toString(36).toUpperCase()}`;
        const res = this.autoClearReceivablePayment({
          receivableId: rec.id,
          channel: 'PIX_AUTOMATICO',
          transactionCode: fakeE2eId,
          payerName: rec.customerName,
          notes: `Baixa Automática efetuada pelo sistema via Webhook Pix Instantâneo.`,
          operatorOrService: 'Sistema Autônomo de Identificação de Pagamentos',
        });
        detected++;
        clearedList.push(res);
      }
    }

    return { detected, clearedList };
  }

  public getCollectionRules(): CollectionRule[] {
    const rules = this.data.collectionRules || [];
    // Se o banco salvo em disco ainda contiver a régua legada com D-3, D-1, D+3, D+7, sanitiza para as 3 regras solicitadas
    if (rules.some((r) => r.id === 'crule-2' || r.daysOffset === -3 || r.daysOffset === 7 || r.daysOffset === 3)) {
      this.data.collectionRules = [
        {
          id: 'crule-d5',
          name: 'D-5: Alerta de Vencimento Próximo (5 Dias Antes)',
          daysOffset: -5,
          channel: 'WHATSAPP',
          templateName: 'alerta_vencimento_5dias',
          priority: 'MEDIUM',
          targetAudience: 'ALL',
          allowedTimeStart: '08:00',
          allowedTimeEnd: '18:00',
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'crule-d0',
          name: 'D0: Lembrete de Vencimento no Dia',
          daysOffset: 0,
          channel: 'WHATSAPP',
          templateName: 'lembrete_vence_hoje',
          priority: 'HIGH',
          targetAudience: 'ALL',
          allowedTimeStart: '08:30',
          allowedTimeEnd: '17:30',
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'crule-daily-overdue',
          name: 'Pós-Vencimento: Cobrança Diária Automática WhatsApp',
          daysOffset: 1,
          channel: 'WHATSAPP',
          templateName: 'cobranca_diaria_atraso',
          priority: 'HIGH',
          targetAudience: 'ALL',
          allowedTimeStart: '09:00',
          allowedTimeEnd: '18:00',
          active: true,
          createdAt: new Date().toISOString(),
        },
      ];
      this.persist();
    }
    return this.data.collectionRules;
  }

  public upsertCollectionRule(rule: CollectionRule): CollectionRule {
    const idx = this.data.collectionRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.data.collectionRules[idx] = rule;
    } else {
      this.data.collectionRules.push(rule);
    }
    this.persist();
    return rule;
  }

  public getWhatsAppLogs(): WhatsAppMessageLog[] {
    return this.data.whatsappLogs;
  }

  public addWhatsAppLog(log: WhatsAppMessageLog): WhatsAppMessageLog {
    this.data.whatsappLogs.unshift(log);
    this.persist();
    return log;
  }

  public updateWhatsAppLogStatus(
    providerMessageId: string,
    status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED',
    timestamp?: string
  ) {
    const log = this.data.whatsappLogs.find((l) => l.providerMessageId === providerMessageId);
    if (log) {
      log.status = status;
      const t = timestamp || new Date().toISOString();
      if (status === 'DELIVERED') log.deliveredAt = t;
      if (status === 'READ') log.readAt = t;
      this.persist();
    }
  }

  public getShipments(): Shipment[] {
    return this.data.shipments;
  }

  public getShipmentByToken(token: string): Shipment | undefined {
    return this.data.shipments.find((s) => s.trackingToken === token);
  }

  public getShipmentByOrderId(orderId: string): Shipment | undefined {
    return this.data.shipments.find((s) => s.orderId === orderId);
  }

  public upsertShipment(shipment: Shipment): Shipment {
    const idx = this.data.shipments.findIndex((s) => s.id === shipment.id);
    if (idx >= 0) {
      this.data.shipments[idx] = shipment;
    } else {
      this.data.shipments.push(shipment);
    }
    this.persist();
    return shipment;
  }

  public addAuditLog(log: AuditLog): AuditLog {
    this.data.auditLogs.unshift(log);
    // Limitar histórico de auditoria em memória para desempenho
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.length = 500;
    }
    this.persist();
    return log;
  }

  public getAuditLogs(correlationId?: string, entityId?: string): AuditLog[] {
    let logs = this.data.auditLogs;
    if (correlationId) {
      logs = logs.filter((l) => l.correlationId.toLowerCase().includes(correlationId.toLowerCase()));
    }
    if (entityId) {
      logs = logs.filter((l) => l.entityId === entityId);
    }
    return logs;
  }

  public getIntegrationLogs(): IntegrationSyncLog[] {
    return this.data.integrationLogs;
  }

  public addIntegrationLog(log: IntegrationSyncLog): IntegrationSyncLog {
    const existingIdx = this.data.integrationLogs.findIndex(
      (l) => l.idempotencyKey === log.idempotencyKey
    );
    if (existingIdx >= 0) {
      this.data.integrationLogs[existingIdx] = {
        ...log,
        attempts: this.data.integrationLogs[existingIdx].attempts + 1,
        updatedAt: new Date().toISOString(),
      };
      this.persist();
      return this.data.integrationLogs[existingIdx];
    }
    this.data.integrationLogs.unshift(log);
    this.persist();
    return log;
  }

  public findIdempotencyLog(idempotencyKey: string): IntegrationSyncLog | undefined {
    return this.data.integrationLogs.find((l) => l.idempotencyKey === idempotencyKey);
  }

  // ====================================================
  // MÉTODOS DE ESTOQUE, PRODUTOS, EMBALAGENS E VOLUMES
  // ====================================================

  public getProducts(): ProductInventory[] {
    return this.data.products;
  }

  public getProductById(id: string): ProductInventory | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public getProductBySku(sku: string): ProductInventory | undefined {
    return this.data.products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
  }

  public upsertProduct(product: ProductInventory): ProductInventory {
    const units = (product.currentStockPackages || 0) * (product.unitsPerPackage || 1);
    const minUnits = (product.minStockPackages || 0) * (product.unitsPerPackage || 1);
    const updated: ProductInventory = {
      ...product,
      currentStockUnits: units,
      minStockUnits: minUnits,
      updatedAt: new Date().toISOString(),
    };

    // Atualiza status do estoque conforme níveis
    if (updated.currentStockPackages <= 0) {
      updated.status = 'OUT_OF_STOCK';
    } else if (updated.currentStockPackages <= Math.max(1, Math.floor(updated.minStockPackages * 0.4))) {
      updated.status = 'CRITICAL';
    } else if (updated.currentStockPackages <= updated.minStockPackages) {
      updated.status = 'LOW';
    } else {
      updated.status = 'NORMAL';
    }

    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = updated;
    } else {
      this.data.products.unshift(updated);
    }
    this.persist();

    // Se estoque estiver acabando e automação ligada, aciona reposição automática
    if (updated.status === 'LOW' || updated.status === 'CRITICAL' || updated.status === 'OUT_OF_STOCK') {
      this.triggerAutoReorderForProduct(updated);
    }

    return updated;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  /**
   * Movimenta o estoque (positivo = entrada/reposição, negativo = saída/separação)
   */
  public updateStock(
    productId: string,
    deltaPackages: number,
    reason: string
  ): { product: ProductInventory; autoOrderTriggered?: PurchaseOrder } {
    const product = this.getProductById(productId);
    if (!product) {
      throw new Error(`Produto ${productId} não encontrado.`);
    }

    const previousPackages = product.currentStockPackages;
    const newPackages = Math.max(0, previousPackages + deltaPackages);
    product.currentStockPackages = newPackages;
    product.currentStockUnits = newPackages * product.unitsPerPackage;

    if (deltaPackages > 0) {
      product.lastRestockAt = new Date().toISOString();
    }

    // Recalcula status
    if (product.currentStockPackages <= 0) {
      product.status = 'OUT_OF_STOCK';
    } else if (product.currentStockPackages <= Math.max(1, Math.floor(product.minStockPackages * 0.4))) {
      product.status = 'CRITICAL';
    } else if (product.currentStockPackages <= product.minStockPackages) {
      product.status = 'LOW';
    } else {
      product.status = 'NORMAL';
    }
    product.updatedAt = new Date().toISOString();

    // Registrar auditoria
    this.addAuditLog({
      id: `aud-stk-${Date.now()}`,
      action: deltaPackages >= 0 ? 'STOCK_RESTOCK' : 'STOCK_DISPATCH',
      origin: 'DatabaseManager.updateStock',
      entity: 'ProductInventory',
      entityId: product.id,
      previousValue: { packages: previousPackages, units: previousPackages * product.unitsPerPackage },
      newValue: { packages: newPackages, units: product.currentStockUnits, reason },
      userOrService: 'Almoxarifado & Estoque Flind',
      correlationId: `corr-stock-${product.sku}`,
      createdAt: new Date().toISOString(),
    });

    this.persist();

    // Se estoque ficou baixo/crítico, aciona automação
    let autoOrder: PurchaseOrder | undefined;
    if (product.currentStockPackages <= product.minStockPackages) {
      autoOrder = this.triggerAutoReorderForProduct(product);
    }

    return { product, autoOrderTriggered: autoOrder };
  }

  // ====================================================
  // MÉTODOS DE FORNECEDORES
  // ====================================================

  public getSuppliers(): Supplier[] {
    return this.data.suppliers.map((s) => ({
      ...s,
      suppliedProductsCount: this.data.products.filter((p) => p.supplierId === s.id).length,
    }));
  }

  public getSupplierById(id: string): Supplier | undefined {
    return this.data.suppliers.find((s) => s.id === id);
  }

  public upsertSupplier(supplier: Supplier): Supplier {
    const idx = this.data.suppliers.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      this.data.suppliers[idx] = supplier;
    } else {
      this.data.suppliers.unshift(supplier);
    }
    this.persist();
    return supplier;
  }

  // ====================================================
  // MÉTODOS DE ORDENS DE COMPRA / REPOSIÇÃO (PURCHASE ORDERS)
  // ====================================================

  public getPurchaseOrders(): PurchaseOrder[] {
    return this.data.purchaseOrders.filter((po) => po.status !== 'CANCELLED');
  }

  public getCancelledPurchaseOrders(): PurchaseOrder[] {
    return this.data.cancelledPurchaseOrders || [];
  }

  public getPurchaseOrderById(id: string): PurchaseOrder | undefined {
    return (
      this.data.purchaseOrders.find((po) => po.id === id) ||
      (this.data.cancelledPurchaseOrders || []).find((po) => po.id === id)
    );
  }

  public addPurchaseOrder(po: PurchaseOrder): PurchaseOrder {
    this.data.purchaseOrders.unshift(po);
    this.persist();
    return po;
  }

  public cancelPurchaseOrder(id: string, reason?: string): PurchaseOrder | undefined {
    // Procura na lista de ordens ativas
    const index = this.data.purchaseOrders.findIndex((p) => p.id === id);
    if (index === -1) {
      // Já está no arquivo de canceladas?
      const already = (this.data.cancelledPurchaseOrders || []).find((p) => p.id === id);
      return already;
    }

    // Remove imediatamente de purchaseOrders (sai de ordens de compra)
    const [po] = this.data.purchaseOrders.splice(index, 1);
    po.status = 'CANCELLED';
    const cancelNote = reason ? `Cancelamento: ${reason}` : 'Cancelado pelo gestor';
    po.notes = po.notes ? `${po.notes} • ${cancelNote}` : cancelNote;
    po.updatedAt = new Date().toISOString();

    if (!this.data.cancelledPurchaseOrders) {
      this.data.cancelledPurchaseOrders = [];
    }
    this.data.cancelledPurchaseOrders.unshift(po);

    // Registra cooldown para não recriar automaticamente ressuprimento deste item nas próximas 24h
    if (po.productId) {
      this.cancelledCooldowns.set(po.productId, Date.now() + 24 * 60 * 60 * 1000);
    }

    this.addAuditLog({
      id: `aud-po-cancel-${Date.now()}`,
      action: 'PURCHASE_ORDER_CANCELLED',
      origin: 'DatabaseManager.cancelPurchaseOrder',
      entity: 'PurchaseOrder',
      entityId: po.id,
      newValue: {
        orderNumber: po.orderNumber,
        supplierName: po.supplierName,
        productName: po.productName,
        status: 'CANCELLED',
        reason: reason || 'Cancelamento solicitado pelo gestor de compras.',
      },
      userOrService: 'Gestor de Compras e Suprimentos',
      correlationId: `corr-po-cancel-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    this.persist();
    return po;
  }

  public clearCancelledPurchaseOrders(): number {
    const count = (this.data.cancelledPurchaseOrders || []).length;
    this.data.cancelledPurchaseOrders = [];
    this.cancelledCooldowns.clear();

    this.addAuditLog({
      id: `aud-po-clear-cancel-${Date.now()}`,
      action: 'CANCELLED_PURCHASE_ORDERS_CLEARED',
      origin: 'DatabaseManager.clearCancelledPurchaseOrders',
      entity: 'PurchaseOrder',
      entityId: 'ALL_CANCELLED',
      newValue: {
        clearedCount: count,
        message: 'Histórico de ordens de compra canceladas limpo pelo usuário.',
      },
      userOrService: 'Gestor de Compras e Suprimentos',
      correlationId: `corr-po-clear-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });

    this.persist();
    return count;
  }

  public updatePurchaseOrderStatus(
    id: string,
    status: PurchaseOrder['status'],
    reason?: string
  ): PurchaseOrder | undefined {
    if (status === 'CANCELLED') {
      return this.cancelPurchaseOrder(id, reason);
    }

    const po = this.data.purchaseOrders.find((p) => p.id === id);
    if (po) {
      po.status = status;
      po.updatedAt = new Date().toISOString();

      // Se foi entregue, dá entrada no estoque automaticamente
      if (status === 'DELIVERED') {
        const prod = this.getProductById(po.productId);
        if (prod) {
          prod.currentStockPackages += po.quantityPackages;
          prod.currentStockUnits = prod.currentStockPackages * prod.unitsPerPackage;
          prod.lastRestockAt = new Date().toISOString();
          if (prod.currentStockPackages >= prod.minStockPackages) {
            prod.status = 'NORMAL';
          } else if (prod.currentStockPackages > Math.max(1, Math.floor(prod.minStockPackages * 0.35))) {
            prod.status = 'LOW';
          } else {
            prod.status = 'CRITICAL';
          }

          this.addAuditLog({
            id: `aud-po-deliv-${Date.now()}`,
            action: 'PURCHASE_ORDER_DELIVERED',
            origin: 'DatabaseManager.updatePurchaseOrderStatus',
            entity: 'InventoryProduct',
            entityId: prod.id,
            newValue: {
              orderNumber: po.orderNumber,
              productSku: prod.sku,
              productName: prod.name,
              receivedPackages: po.quantityPackages,
              newStockPackages: prod.currentStockPackages,
              minStockPackages: prod.minStockPackages,
              status: prod.status,
            },
            userOrService: 'Recepção e Almoxarifado Flind',
            correlationId: `corr-po-deliv-${Date.now()}`,
            createdAt: new Date().toISOString(),
          });
        }
      }
      this.persist();
      return po;
    }
    return undefined;
  }

  // ====================================================
  // CONFIGURAÇÕES DE DISPARO AUTOMÁTICO
  // ====================================================

  public getAutoSettings() {
    return this.data.autoSettings || {
      autoWhatsAppExpedition: true,
      autoWhatsAppCollection: true,
      autoWhatsAppLowStock: true,
    };
  }

  public updateAutoSettings(settings: Partial<DatabaseSchema['autoSettings']>) {
    this.data.autoSettings = {
      ...this.getAutoSettings(),
      ...settings,
    };
    this.persist();
    return this.data.autoSettings;
  }

  // ====================================================
  // AUTOMAÇÃO DE ESTOQUE ACABANDO & DISPARO WHATSAPP FORNECEDOR
  // ====================================================

  public triggerAutoReorderForProduct(product: ProductInventory): PurchaseOrder | undefined {
    if (!product.autoReorderEnabled) return undefined;

    // Respeita cancelamento manual prévio feito pelo gestor (não re-emite se cancelado recentemente)
    const cooldown = this.cancelledCooldowns.get(product.id);
    if (cooldown && Date.now() < cooldown) {
      return undefined;
    }

    // Verificar se já existe uma ordem de compra pendente ou enviada para este produto
    const existingPo = this.data.purchaseOrders.find(
      (po) =>
        po.productId === product.id &&
        (po.status === 'PENDING' || po.status === 'SENT_WHATSAPP')
    );

    if (existingPo) {
      return existingPo;
    }

    const supplier = this.getSupplierById(product.supplierId);
    const supplierPhone = supplier?.whatsapp || supplier?.phone || '+55 11 99999-0000';
    const supplierName = supplier?.tradeName || supplier?.name || product.supplierName || 'Fornecedor Homologado';
    const orderNum = `PO-FLIND-${new Date().getFullYear()}-${String(this.data.purchaseOrders.length + 1).padStart(3, '0')}`;
    const qtyPackages = product.reorderQuantityPackages || Math.max(10, product.minStockPackages * 2);
    const qtyUnits = qtyPackages * product.unitsPerPackage;
    const estCost = qtyPackages * product.costPrice;

    // Data de entrega estimada conforme lead time
    const leadDays = supplier?.leadTimeDays || 3;
    const deliveryDate = new Date(Date.now() + leadDays * 86400000).toISOString().split('T')[0];

    // 1. Criar Ordem de Compra
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      orderNumber: orderNum,
      supplierId: product.supplierId,
      supplierName,
      supplierWhatsapp: supplierPhone,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      quantityPackages: qtyPackages,
      quantityUnits: qtyUnits,
      packagingUnit: product.packagingUnit,
      estimatedCost: estCost,
      triggerReason: 'AUTO_LOW_STOCK',
      status: 'SENT_WHATSAPP',
      whatsappMessageId: `auto.WA${supplierPhone.replace(/\D/g, '')}-${Date.now().toString(36)}`,
      notes: `GATILHO AUTOMÁTICO: Estoque em ${product.currentStockPackages} ${product.packagingUnit} (limite mínimo de segurança: ${product.minStockPackages}). Disparo automático emitido ao fornecedor via WhatsApp.`,
      expectedDeliveryDate: deliveryDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.purchaseOrders.unshift(po);

    // 2. Criar Alerta Crítico de Estoque no sistema
    this.addAlert({
      id: `alt-stk-${product.id}-${Date.now()}`,
      severity: 'CRITICAL',
      type: 'SYSTEM_ERROR',
      entityType: 'INTEGRATION',
      entityId: product.id,
      message: `ESTOQUE ACABANDO: Produto "${product.name}" (${product.sku}) atingiu ${product.currentStockPackages} ${product.packagingUnit} (${product.currentStockUnits} un). Nível mínimo: ${product.minStockPackages}. Ordem de Reposição ${orderNum} gerada e notificada ao fornecedor ${supplierName}.`,
      ruleResponsible: 'Automação de Reposição de Estoque',
      responsible: 'PCP & Compras Flind',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    // 3. Registrar Disparo Automático de WhatsApp nos Logs
    this.addWhatsAppLog({
      id: `walog-po-${po.id}`,
      recipientPhone: supplierPhone,
      customerName: supplierName,
      templateName: 'notificacao_reposicao_estoque_fornecedor',
      parameters: {
        fornecedor: supplierName,
        numero_po: orderNum,
        produto: product.name,
        sku: product.sku,
        unidade_volume: product.packagingUnit,
        quantidade_volume: `${qtyPackages} volumes (${qtyUnits} un)`,
        estoque_atual: `${product.currentStockPackages} volumes`,
        prazo_previsto: new Date(deliveryDate).toLocaleDateString('pt-BR'),
      },
      status: 'SENT',
      providerMessageId: po.whatsappMessageId,
      sentAt: new Date().toISOString(),
      direction: 'OUTBOUND',
      createdAt: new Date().toISOString(),
    });

    // 4. Log de auditoria
    this.addAuditLog({
      id: `aud-po-auto-${Date.now()}`,
      action: 'AUTO_REORDER_TRIGGERED',
      origin: 'DatabaseManager.triggerAutoReorderForProduct',
      entity: 'PurchaseOrder',
      entityId: po.id,
      newValue: {
        orderNumber: po.orderNumber,
        productSku: po.productSku,
        qtyPackages,
        supplierName,
        whatsappSentTo: supplierPhone,
      },
      userOrService: 'Automação Central Flind',
      correlationId: `corr-po-${po.id}`,
      createdAt: new Date().toISOString(),
    });

    this.persist();
    return po;
  }

  /**
   * Varredura geral de estoque para disparar ressuprimentos pendentes
   */
  public scanAllLowStockAndTrigger(): PurchaseOrder[] {
    const triggered: PurchaseOrder[] = [];
    for (const product of this.data.products) {
      if (product.currentStockPackages <= product.minStockPackages && product.autoReorderEnabled) {
        const po = this.triggerAutoReorderForProduct(product);
        if (po) triggered.push(po);
      }
    }
    return triggered;
  }

  /**
   * Diagnóstico Automático e Pesquisa de Produtos Faltantes / Abaixo do Mínimo
   */
  public getMissingProductsDiagnostic(): MissingProductsDiagnostic {
    const products = this.getProducts();
    const openPos = this.getPurchaseOrders().filter((po) => po.status !== 'DELIVERED' && po.status !== 'CANCELLED');
    const openOrders = this.getOrders().filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');

    const items: MissingProductItem[] = [];

    products.forEach((p) => {
      // Calcular comprometimento de pedidos em aberto
      let committedUnits = 0;
      openOrders.forEach((ord) => {
        if (Array.isArray(ord.items)) {
          ord.items.forEach((item) => {
            if (item.productId === p.id || item.sku === p.sku) {
              committedUnits += item.quantity || 0;
            }
          });
        }
      });
      const committedPackages = Math.ceil(committedUnits / (p.unitsPerPackage || 1));
      const netAvailablePackages = p.currentStockPackages - committedPackages;

      // É considerado faltante se o estoque físico for menor que o mínimo ou o estoque líquido pós-pedidos for <= 0
      const isMissing = p.currentStockPackages < p.minStockPackages || netAvailablePackages <= 0;

      if (isMissing) {
        const deficitPackages = Math.max(0, p.minStockPackages - p.currentStockPackages) + (netAvailablePackages < 0 ? Math.abs(netAvailablePackages) : 0);
        const deficitUnits = deficitPackages * (p.unitsPerPackage || 1);

        let severity: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW' = 'LOW';
        if (p.currentStockPackages <= 0 || netAvailablePackages <= 0) {
          severity = 'OUT_OF_STOCK';
        } else if (p.currentStockPackages <= Math.max(1, Math.floor(p.minStockPackages * 0.35))) {
          severity = 'CRITICAL';
        }

        const relatedPos = openPos.filter((po) => po.productId === p.id || po.productSku === p.sku);
        const hasOpenPo = relatedPos.length > 0;
        const openPoNumbers = relatedPos.map((po) => po.orderNumber);
        const openPoTotalPackages = relatedPos.reduce((sum, po) => sum + po.quantityPackages, 0);
        const openPoList: OpenPoDetail[] = relatedPos.map((po) => ({
          id: po.id,
          orderNumber: po.orderNumber,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          supplierWhatsapp: po.supplierWhatsapp,
          quantityPackages: po.quantityPackages,
          quantityUnits: po.quantityUnits,
          packagingUnit: po.packagingUnit,
          estimatedCost: po.estimatedCost,
          status: po.status,
          expectedDeliveryDate: po.expectedDeliveryDate,
          createdAt: po.createdAt,
        }));

        const supplier = this.getSupplierById(p.supplierId);
        const supplierName = supplier?.tradeName || supplier?.name || p.supplierName || 'Fornecedor Homologado';
        const supplierWhatsapp = supplier?.whatsapp || supplier?.phone || p.supplierPhone || '+55 11 99999-0000';
        const leadTimeDays = supplier?.leadTimeDays || 3;

        const suggestedReorderPackages = Math.max(
          p.reorderQuantityPackages || 30,
          deficitPackages + Math.ceil(p.minStockPackages * 0.5)
        );
        const estimatedTotalCost = suggestedReorderPackages * (p.costPrice || 50);

        items.push({
          productId: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          currentStockPackages: p.currentStockPackages,
          minStockPackages: p.minStockPackages,
          deficitPackages,
          currentStockUnits: p.currentStockUnits,
          minStockUnits: p.minStockUnits,
          deficitUnits,
          packagingUnit: p.packagingUnit,
          unitsPerPackage: p.unitsPerPackage,
          severity,
          committedInOrdersPackages: committedPackages,
          netAvailablePackages,
          supplierId: p.supplierId,
          supplierName,
          supplierWhatsapp,
          leadTimeDays,
          costPrice: p.costPrice || 0,
          suggestedReorderPackages,
          estimatedTotalCost,
          hasOpenPurchaseOrder: hasOpenPo,
          openPoNumbers,
          openPoTotalPackages,
          openPoList,
          technicalSpecs: p.technicalSpecs,
          material: p.material,
          anvisaRegistration: p.anvisaRegistration,
          barcode: p.barcode,
        });
      }
    });

    // Ordenar itens por severidade (Ruptura primeiro, depois Crítico, depois Baixo)
    const severityOrder = { OUT_OF_STOCK: 0, CRITICAL: 1, LOW: 2 };
    items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const affectedSuppliers = new Set(items.map((i) => i.supplierId));

    return {
      scannedAt: new Date().toISOString(),
      totalProductsScanned: products.length,
      missingProductsCount: items.length,
      outOfStockCount: items.filter((i) => i.severity === 'OUT_OF_STOCK').length,
      criticalCount: items.filter((i) => i.severity === 'CRITICAL').length,
      lowStockCount: items.filter((i) => i.severity === 'LOW').length,
      totalDeficitPackages: items.reduce((sum, i) => sum + i.deficitPackages, 0),
      totalEstimatedCost: items.reduce((sum, i) => sum + i.estimatedTotalCost, 0),
      affectedSuppliersCount: affectedSuppliers.size,
      items,
    };
  }

  /**
   * Criação em Lote de Ordens de Compra para Reposição Automática
   */
  public batchCreatePurchaseOrders(
    ordersToCreate: { productId: string; quantityPackages?: number; notes?: string }[]
  ): PurchaseOrder[] {
    const createdList: PurchaseOrder[] = [];
    const nowIso = new Date().toISOString();

    ordersToCreate.forEach((item, index) => {
      const product = this.getProductById(item.productId);
      if (!product) return;

      const supplier = this.getSupplierById(product.supplierId);
      const supplierPhone = supplier?.whatsapp || supplier?.phone || product.supplierPhone || '+55 11 99999-0000';
      const supplierName = supplier?.tradeName || supplier?.name || product.supplierName || 'Fornecedor Homologado';
      const leadDays = supplier?.leadTimeDays || 3;
      const deliveryDate = new Date(Date.now() + leadDays * 86400000).toISOString().split('T')[0];
      const seq = this.data.purchaseOrders.length + 1;
      const orderNum = `PO-FLIND-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;

      const qtyPackages = item.quantityPackages && item.quantityPackages > 0
        ? item.quantityPackages
        : (product.reorderQuantityPackages || 50);

      const po: PurchaseOrder = {
        id: `po-${Date.now()}-${index}`,
        orderNumber: orderNum,
        supplierId: product.supplierId,
        supplierName,
        supplierWhatsapp: supplierPhone,
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantityPackages: qtyPackages,
        quantityUnits: qtyPackages * (product.unitsPerPackage || 1),
        packagingUnit: product.packagingUnit || 'Caixa (CX)',
        estimatedCost: qtyPackages * (product.costPrice || 50),
        triggerReason: 'AUTO_LOW_STOCK',
        status: 'SENT_WHATSAPP',
        whatsappMessageId: `auto.WA${supplierPhone.replace(/\D/g, '')}-${Date.now().toString(36)}`,
        notes: item.notes || `Ordem de Compra automática gerada pelo Diagnóstico de Faltantes Flind. Estoque atual: ${product.currentStockPackages} ${product.packagingUnit}.`,
        expectedDeliveryDate: deliveryDate,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      this.data.purchaseOrders.unshift(po);
      createdList.push(po);

      // Log de Auditoria
      this.addAuditLog({
        id: `aud-batch-po-${po.id}`,
        action: 'BATCH_PURCHASE_ORDER_CREATED',
        origin: 'DatabaseManager.batchCreatePurchaseOrders',
        entity: 'PurchaseOrder',
        entityId: po.id,
        newValue: {
          orderNumber: po.orderNumber,
          productSku: po.productSku,
          qtyPackages,
          supplierName,
          whatsappSentTo: supplierPhone,
        },
        userOrService: 'Automação Diagnóstico Faltantes Flind',
        correlationId: `corr-batch-${po.id}`,
        createdAt: nowIso,
      });
    });

    this.persist();
    return createdList;
  }

  /**
   * Pesquisa de Mercado & Matriz Comparativa de Cotações para Produtos Faltantes
   * Compara Valores, Tempo de Entrega, Fabricação e Validade do Produto
   */
  public getMissingProductsQuotationComparisons(targetProductId?: string): ProductQuotationComparison[] {
    const diagnostic = this.getMissingProductsDiagnostic();
    let missingItems = diagnostic.items;

    // Se não houver itens faltantes estritos, usar produtos com menor estoque para que o usuário sempre possa testar o comparativo
    if (missingItems.length === 0) {
      const allProducts = this.getProducts();
      allProducts.sort((a, b) => (a.currentStockPackages / (a.minStockPackages || 1)) - (b.currentStockPackages / (b.minStockPackages || 1)));
      const sample = allProducts.slice(0, 3);
      missingItems = sample.map((p) => {
        const supp = this.getSupplierById(p.supplierId);
        return {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          currentStockPackages: p.currentStockPackages,
          minStockPackages: p.minStockPackages,
          deficitPackages: Math.max(5, p.minStockPackages - p.currentStockPackages),
          currentStockUnits: p.currentStockUnits,
          minStockUnits: p.minStockUnits,
          deficitUnits: Math.max(5, p.minStockPackages - p.currentStockPackages) * (p.unitsPerPackage || 1),
          packagingUnit: p.packagingUnit,
          unitsPerPackage: p.unitsPerPackage,
          severity: 'LOW',
          committedInOrdersPackages: 0,
          netAvailablePackages: p.currentStockPackages,
          supplierId: p.supplierId,
          supplierName: supp?.tradeName || p.supplierName || 'Fornecedor',
          supplierWhatsapp: supp?.whatsapp || '+55 19 99812-4400',
          leadTimeDays: supp?.leadTimeDays || 3,
          costPrice: p.costPrice || 45,
          suggestedReorderPackages: p.reorderQuantityPackages || 30,
          estimatedTotalCost: (p.reorderQuantityPackages || 30) * (p.costPrice || 45),
          hasOpenPurchaseOrder: false,
          technicalSpecs: p.technicalSpecs,
          material: p.material,
          anvisaRegistration: p.anvisaRegistration,
          barcode: p.barcode,
        };
      });
    }

    if (targetProductId) {
      missingItems = missingItems.filter((i) => i.productId === targetProductId);
    }

    const now = new Date();
    const dFuture = (days: number) => new Date(now.getTime() + days * 86400000).toISOString().split('T')[0];
    const dPast = (days: number) => new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];
    const dExpiry = (years: number, monthOffset = 0) => {
      const d = new Date(now.getTime() + years * 365 * 86400000);
      d.setMonth(d.getMonth() + monthOffset);
      return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const comparisons: ProductQuotationComparison[] = [];

    missingItems.forEach((item) => {
      const baseCost = item.costPrice > 0 ? item.costPrice : 45.0;
      const suggestedQty = item.suggestedReorderPackages > 0 ? item.suggestedReorderPackages : 30;

      // Gerar fornecedores concorrentes especializados conforme a categoria
      let candidatesConfig: Array<{
        supplierId: string;
        name: string;
        tradeName: string;
        city: string;
        state: string;
        whatsapp: string;
        status: 'HOMOLOGATED' | 'ACTIVE' | 'AUDIT_PENDING';
        priceFactor: number;
        leadTimeDays: number;
        paymentTerms: string;
        commercialDiscountPct?: number;
        freightType: 'CIF' | 'FOB';
        onTimeRate: number;
        manufactureDaysAgo: number;
        lotPrefix: string;
        capacity: string;
        rawMaterial: string;
        anvisaOk: boolean;
        auditScore: number;
        shelfLifeMonths: number;
      }> = [];

      const lowerName = (item.name + ' ' + item.category).toLowerCase();
      const isTntOrSheetOrGown =
        lowerName.includes('lençol') ||
        lowerName.includes('maca') ||
        lowerName.includes('avental') ||
        lowerName.includes('touca') ||
        lowerName.includes('tnt') ||
        lowerName.includes('cirúrgic') ||
        lowerName.includes('estética');

      const isToaletOrAbsorbent =
        lowerName.includes('toalet') ||
        lowerName.includes('protetor') ||
        lowerName.includes('absorv') ||
        lowerName.includes('gel') ||
        lowerName.includes('polímero');

      if (isToaletOrAbsorbent) {
        candidatesConfig = [
          {
            supplierId: 'supp-3',
            name: 'SuperAbsorb Polímeros & Química Industrial Ltda',
            tradeName: 'SuperAbsorb Brasil',
            city: 'Mauá',
            state: 'SP',
            whatsapp: '+55 11 97233-8899',
            status: 'HOMOLOGATED',
            priceFactor: 1.0,
            leadTimeDays: 4,
            paymentTerms: 'Boleto 30 DDL',
            commercialDiscountPct: 4,
            freightType: 'CIF',
            onTimeRate: 95,
            manufactureDaysAgo: 8,
            lotPrefix: 'LOT-SAB-2026',
            capacity: '30.000 caixas/mês',
            rawMaterial: 'Polímero Superabsorvente (SAP) Atóxico + Fibras Naturais',
            anvisaOk: true,
            auditScore: 94,
            shelfLifeMonths: 36,
          },
          {
            supplierId: 'supp-alt-poly',
            name: 'PolymerTech Insumos de Higiene Ltda',
            tradeName: 'PolymerTech Brasil',
            city: 'Cubatão',
            state: 'SP',
            whatsapp: '+55 13 99755-4422',
            status: 'HOMOLOGATED',
            priceFactor: 0.94, // Mais barato
            leadTimeDays: 3,
            paymentTerms: 'Boleto 28 DDL',
            freightType: 'CIF',
            onTimeRate: 96,
            manufactureDaysAgo: 12,
            lotPrefix: 'LOT-PTK-2026',
            capacity: '22.000 caixas/mês',
            rawMaterial: 'Gel Hidrofílico Absorvente e Filme Impermeável PE',
            anvisaOk: true,
            auditScore: 91,
            shelfLifeMonths: 36,
          },
          {
            supplierId: 'supp-alt-abs',
            name: 'AbsorveFácil Celulose & Absorventes Hospitalares S/A',
            tradeName: 'AbsorveFácil Insumos',
            city: 'Suzano',
            state: 'SP',
            whatsapp: '+55 11 98311-6644',
            status: 'ACTIVE',
            priceFactor: 1.06,
            leadTimeDays: 2, // Mais rápido
            paymentTerms: 'Boleto 14 DDL',
            freightType: 'CIF',
            onTimeRate: 92,
            manufactureDaysAgo: 25,
            lotPrefix: 'LOT-ABF-2026',
            capacity: '15.000 caixas/mês',
            rawMaterial: 'Celulose Desfibrada e Poliacrilato de Sódio',
            anvisaOk: true,
            auditScore: 86,
            shelfLifeMonths: 24,
          },
        ];
      } else if (isTntOrSheetOrGown) {
        candidatesConfig = [
          {
            supplierId: 'supp-1',
            name: 'Fibras & Não-Tecidos Brasil S/A',
            tradeName: 'TNT Brasil Matérias-Primas',
            city: 'Americana',
            state: 'SP',
            whatsapp: '+55 19 99812-4400',
            status: 'HOMOLOGATED',
            priceFactor: 1.0,
            leadTimeDays: 3,
            paymentTerms: 'Boleto 28 DDL',
            commercialDiscountPct: 3,
            freightType: 'CIF',
            onTimeRate: 98,
            manufactureDaysAgo: 6,
            lotPrefix: 'LOT-TNT-2026',
            capacity: '25.000 caixas/mês',
            rawMaterial: 'TNT SMS 100% Polipropileno Virgem Médico (Tripla Camada)',
            anvisaOk: true,
            auditScore: 96,
            shelfLifeMonths: 36,
          },
          {
            supplierId: 'supp-alt-fit',
            name: 'Fitesa Fibras Médicas do Brasil Ltda',
            tradeName: 'Fitesa Hospitalar',
            city: 'Paulínia',
            state: 'SP',
            whatsapp: '+55 19 98411-2299',
            status: 'HOMOLOGATED',
            priceFactor: 1.08,
            leadTimeDays: 2, // Entrega mais rápida
            paymentTerms: 'Boleto 30/60 DDL',
            freightType: 'CIF',
            onTimeRate: 99,
            manufactureDaysAgo: 3,
            lotPrefix: 'LOT-FIT-2026',
            capacity: '40.000 caixas/mês',
            rawMaterial: 'Tecido Não-Tecido Spunbond Cirúrgico Calandrado',
            anvisaOk: true,
            auditScore: 98,
            shelfLifeMonths: 36,
          },
          {
            supplierId: 'supp-alt-bio',
            name: 'Cirúrgica BioTêxtil Insumos Hospitalares S/A',
            tradeName: 'BioTêxtil Cirúrgica',
            city: 'Joinville',
            state: 'SC',
            whatsapp: '+55 47 99123-5588',
            status: 'ACTIVE',
            priceFactor: 0.91, // Menor Preço
            leadTimeDays: 7, // Mais distante
            paymentTerms: 'Boleto 15 DDL',
            freightType: 'FOB',
            onTimeRate: 88,
            manufactureDaysAgo: 45,
            lotPrefix: 'LOT-BIO-2026',
            capacity: '12.000 caixas/mês',
            rawMaterial: 'TNT Convencional Hidrorrepelente 30g/m²',
            anvisaOk: true,
            auditScore: 82,
            shelfLifeMonths: 24,
          },
        ];
      } else {
        // Genérico / Componentes / Embalagens
        candidatesConfig = [
          {
            supplierId: 'supp-2',
            name: 'Klabin Embalagens e Papelão Ondulado S/A',
            tradeName: 'Klabin Embalagens Hospitalares',
            city: 'Jundiaí',
            state: 'SP',
            whatsapp: '+55 11 98450-3321',
            status: 'HOMOLOGATED',
            priceFactor: 1.0,
            leadTimeDays: 4,
            paymentTerms: 'Boleto 30/60 DDL',
            commercialDiscountPct: 5,
            freightType: 'CIF',
            onTimeRate: 97,
            manufactureDaysAgo: 7,
            lotPrefix: 'LOT-KLB-2026',
            capacity: '50.000 caixas/mês',
            rawMaterial: 'Papelão Ondulado Onda B/C Kraft 100% Virgem Reciclável',
            anvisaOk: true,
            auditScore: 95,
            shelfLifeMonths: 48,
          },
          {
            supplierId: 'supp-alt-suz',
            name: 'Suzano Papel & Embalagens Bio S/A',
            tradeName: 'Suzano Embalagens',
            city: 'Limeira',
            state: 'SP',
            whatsapp: '+55 19 99644-8833',
            status: 'HOMOLOGATED',
            priceFactor: 0.95,
            leadTimeDays: 3,
            paymentTerms: 'Boleto 28 DDL',
            freightType: 'CIF',
            onTimeRate: 98,
            manufactureDaysAgo: 5,
            lotPrefix: 'LOT-SUZ-2026',
            capacity: '60.000 caixas/mês',
            rawMaterial: 'Kraftliner Celulose Certificada FSC',
            anvisaOk: true,
            auditScore: 96,
            shelfLifeMonths: 48,
          },
          {
            supplierId: 'supp-alt-rig',
            name: 'Rigesa Embalagens Caneladas Ltda',
            tradeName: 'Rigesa Caixas',
            city: 'Valinhos',
            state: 'SP',
            whatsapp: '+55 19 98111-9922',
            status: 'ACTIVE',
            priceFactor: 0.90,
            leadTimeDays: 6,
            paymentTerms: 'Boleto 21 DDL',
            freightType: 'FOB',
            onTimeRate: 89,
            manufactureDaysAgo: 30,
            lotPrefix: 'LOT-RIG-2026',
            capacity: '18.000 caixas/mês',
            rawMaterial: 'Papelão Reciclado Misto Semi-Kraft',
            anvisaOk: false,
            auditScore: 80,
            shelfLifeMonths: 36,
          },
        ];
      }

      // Montar ofertas
      const rawOffers: SupplierQuotationOffer[] = candidatesConfig.map((cfg, idx) => {
        const unitPrice = Math.round(baseCost * cfg.priceFactor * 100) / 100;
        const totalCost = Math.round(unitPrice * suggestedQty * 100) / 100;
        const mfgDate = dPast(cfg.manufactureDaysAgo);
        const expDate = dExpiry(Math.floor(cfg.shelfLifeMonths / 12), cfg.shelfLifeMonths % 12);
        const expectedDelivery = dFuture(cfg.leadTimeDays);

        const freshnessLabel =
          cfg.manufactureDaysAgo <= 7
            ? `Lote fresquíssimo (Fabricado há ${cfg.manufactureDaysAgo} dias)`
            : cfg.manufactureDaysAgo <= 20
            ? `Lote recente (Fabricado há ${cfg.manufactureDaysAgo} dias)`
            : `Lote estocado há ${cfg.manufactureDaysAgo} dias`;

        return {
          id: `quot-${item.productId}-${cfg.supplierId}`,
          supplierId: cfg.supplierId,
          supplierName: cfg.name,
          supplierTradeName: cfg.tradeName,
          supplierCity: cfg.city,
          supplierState: cfg.state,
          supplierWhatsapp: cfg.whatsapp,
          supplierStatus: cfg.status,
          unitPrice,
          totalCost,
          paymentTerms: cfg.paymentTerms,
          commercialDiscountPct: cfg.commercialDiscountPct,
          leadTimeDays: cfg.leadTimeDays,
          expectedDeliveryDate: expectedDelivery,
          freightType: cfg.freightType,
          onTimeDeliveryRatePct: cfg.onTimeRate,
          manufacturingDate: mfgDate,
          manufacturingLot: `${cfg.lotPrefix}-${String(100 + idx * 23)}`,
          manufacturingCapacity: cfg.capacity,
          rawMaterialOrigin: cfg.rawMaterial,
          anvisaCompliant: cfg.anvisaOk,
          qualityAuditScore: cfg.auditScore,
          shelfLifeMonths: cfg.shelfLifeMonths,
          expiryDate: expDate,
          freshnessLabel,
          priceScore: 0,
          deliveryScore: 0,
          manufacturingScore: 0,
          shelfLifeScore: 0,
          compositeScore: 0,
          isBestChoice: false,
          badges: [],
        };
      });

      // Cálculo dos scores comparativos
      const minPrice = Math.min(...rawOffers.map((o) => o.unitPrice));
      const maxPrice = Math.max(...rawOffers.map((o) => o.unitPrice));
      const minLead = Math.min(...rawOffers.map((o) => o.leadTimeDays));
      const maxLead = Math.max(...rawOffers.map((o) => o.leadTimeDays));
      const maxShelf = Math.max(...rawOffers.map((o) => o.shelfLifeMonths));

      rawOffers.forEach((o) => {
        // Preço (menor = melhor): 100 * (minPrice / unitPrice)
        o.priceScore = Math.round(100 * (minPrice / o.unitPrice));
        // Entrega (menor prazo = melhor): 100 * (minLead / leadTimeDays)
        o.deliveryScore = Math.round(100 * (minLead / o.leadTimeDays));
        // Validade (maior vida útil e lote mais recente):
        const freshnessBonus = o.freshnessLabel.includes('fresquíssimo') ? 10 : o.freshnessLabel.includes('recente') ? 5 : 0;
        o.shelfLifeScore = Math.min(100, Math.round(100 * (o.shelfLifeMonths / maxShelf)) + freshnessBonus);
        // Fabricação (auditoria + conformidade ANVISA):
        o.manufacturingScore = Math.round(o.qualityAuditScore * (o.anvisaCompliant ? 1 : 0.7));

        // Score Composto Geral Ponderado:
        // Valores (40%), Entrega (25%), Validade/Frescor (20%), Fabricação/Conformidade (15%)
        o.compositeScore = Math.round(
          o.priceScore * 0.40 +
          o.deliveryScore * 0.25 +
          o.shelfLifeScore * 0.20 +
          o.manufacturingScore * 0.15
        );

        // Atribuir Badges descritivos
        if (o.unitPrice === minPrice) o.badges.push('Menor Preço');
        if (o.leadTimeDays === minLead) o.badges.push('Entrega Mais Rápida');
        if (o.shelfLifeMonths === maxShelf) o.badges.push('Maior Validade');
        if (o.freightType === 'CIF') o.badges.push('Frete CIF Grátis');
      });

      // Ordenar por score composto decrescente
      rawOffers.sort((a, b) => b.compositeScore - a.compositeScore);

      // O primeiro é a Melhor Escolha
      const bestOffer = rawOffers[0];
      bestOffer.isBestChoice = true;
      bestOffer.badges.unshift('🏆 Melhor Opção Flind');
      bestOffer.bestChoiceHighlight = `Melhor pontuação geral (${bestOffer.compositeScore}/100): Equilíbrio perfeito entre valor (R$ ${bestOffer.unitPrice.toFixed(2)}), entrega em ${bestOffer.leadTimeDays} dias e lote com ${bestOffer.shelfLifeMonths} meses de validade.`;

      const priceSavingsVsWorstPct = Math.round(((maxPrice - bestOffer.unitPrice) / maxPrice) * 100);
      const leadTimeAdvantageDays = maxLead - bestOffer.leadTimeDays;

      comparisons.push({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        packagingUnit: item.packagingUnit,
        unitsPerPackage: item.unitsPerPackage,
        currentStockPackages: item.currentStockPackages,
        minStockPackages: item.minStockPackages,
        deficitPackages: item.deficitPackages,
        suggestedPackages: suggestedQty,
        severity: item.severity,
        hasOpenPurchaseOrder: item.hasOpenPurchaseOrder,
        openPoNumbers: item.openPoNumbers,
        openPoTotalPackages: item.openPoTotalPackages,
        openPoList: item.openPoList,
        offers: rawOffers,
        recommendedSupplierId: bestOffer.supplierId,
        recommendedSupplierName: bestOffer.supplierTradeName,
        recommendedOfferId: bestOffer.id,
        recommendationReason: `O sistema selecionou ${bestOffer.supplierTradeName} com nota ${bestOffer.compositeScore}/100. Oferece o menor risco de ruptura com prazo de ${bestOffer.leadTimeDays} dia(s), economia de ${priceSavingsVsWorstPct}% em relação à cotação mais cara, lote fabricado há poucos dias e garantia integral de conformidade ANVISA.`,
        priceSavingsVsWorstPct,
        leadTimeAdvantageDays,
      });
    });

    return comparisons;
  }

  /**
   * Criação direta de Ordem de Compra a partir da Cotação Selecionada no Comparativo
   */
  public createPurchaseOrderFromQuotation(params: {
    productId: string;
    supplierId: string;
    supplierName: string;
    supplierWhatsapp: string;
    quantityPackages: number;
    unitPrice: number;
    leadTimeDays: number;
    paymentTerms: string;
    notes?: string;
  }): PurchaseOrder {
    const product = this.getProductById(params.productId);
    const nowIso = new Date().toISOString();
    const leadDays = params.leadTimeDays || 3;
    const deliveryDate = new Date(Date.now() + leadDays * 86400000).toISOString().split('T')[0];
    const seq = this.data.purchaseOrders.length + 1;
    const orderNum = `PO-FLIND-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;

    const packagingUnit = product?.packagingUnit || 'Caixa (CX)';
    const qtyPackages = params.quantityPackages;
    const unitsPerPkg = product?.unitsPerPackage || 1;
    const estimatedCost = qtyPackages * params.unitPrice;

    const po: PurchaseOrder = {
      id: `po-quot-${Date.now()}`,
      orderNumber: orderNum,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      supplierWhatsapp: params.supplierWhatsapp,
      productId: params.productId,
      productSku: product?.sku || 'SKU-FLIND',
      productName: product?.name || 'Insumo Flind',
      quantityPackages: qtyPackages,
      quantityUnits: qtyPackages * unitsPerPkg,
      packagingUnit,
      estimatedCost,
      triggerReason: 'AUTO_LOW_STOCK',
      status: 'SENT_WHATSAPP',
      whatsappMessageId: `quot.WA${params.supplierWhatsapp.replace(/\D/g, '')}-${Date.now().toString(36)}`,
      notes: params.notes || `Ordem de Compra gerada pelo Comparativo Inteligente Flind. Condição: ${params.paymentTerms}, Prazo: ${leadDays} dias úteis, Preço Unitário: R$ ${params.unitPrice.toFixed(2)}.`,
      expectedDeliveryDate: deliveryDate,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.data.purchaseOrders.unshift(po);

    this.addAuditLog({
      id: `aud-quot-po-${po.id}`,
      action: 'PURCHASE_ORDER_FROM_QUOTATION_CREATED',
      origin: 'DatabaseManager.createPurchaseOrderFromQuotation',
      entity: 'PurchaseOrder',
      entityId: po.id,
      newValue: {
        orderNumber: po.orderNumber,
        productSku: po.productSku,
        qtyPackages,
        supplierName: po.supplierName,
        unitPrice: params.unitPrice,
        estimatedCost,
        whatsappSentTo: po.supplierWhatsapp,
      },
      userOrService: 'Comparativo Inteligente de Fornecedores',
      correlationId: `corr-quot-${po.id}`,
      createdAt: nowIso,
    });

    this.persist();
    return po;
  }

  // ====================================================
  // METADADOS E ESTATÍSTICAS DAS TABELAS (GITHUB & VERCEL)
  // ====================================================
  public getDatabaseTableStats() {
    const { file, isReadOnlyEnv } = getDatabaseFilePaths();
    const tables = [
      {
        tableName: 'suppliers',
        displayName: 'Fornecedores Homologados',
        description: 'Cadastro completo de fornecedores de matérias-primas e insumos com contato WhatsApp.',
        recordCount: this.data.suppliers.length,
        primaryKey: 'id',
        columnsCount: 17,
        columns: ['id', 'name', 'trade_name', 'tax_id', 'state_registration', 'whatsapp', 'email', 'category', 'lead_time_days', 'city', 'state', 'status'],
      },
      {
        tableName: 'products',
        displayName: 'Produtos & Catálogo Técnico',
        description: 'Estoque físico em caixas/unidades, ponto de ressuprimento, lotes e fichas técnicas Flind.',
        recordCount: this.data.products.length,
        primaryKey: 'id',
        columnsCount: 28,
        columns: ['id', 'sku', 'name', 'category', 'packaging_unit', 'units_per_package', 'current_stock_packages', 'min_stock_packages', 'cost_price', 'status'],
      },
      {
        tableName: 'orders',
        displayName: 'Pedidos de Venda',
        description: 'Ordens de venda integradas do ERP/E-commerce, valores, prazos e esteira de expedição.',
        recordCount: this.data.orders.length,
        primaryKey: 'id',
        columnsCount: 16,
        columns: ['id', 'order_number', 'customer_id', 'origin', 'status', 'total_amount', 'packages_count', 'sla_status'],
      },
      {
        tableName: 'purchase_orders',
        displayName: 'Ordens de Compra Ativas',
        description: 'Ordens de compra emitidas para reposição de matéria-prima junto aos fornecedores.',
        recordCount: this.data.purchaseOrders.filter((p) => p.status !== 'CANCELLED').length,
        primaryKey: 'id',
        columnsCount: 15,
        columns: ['id', 'order_number', 'supplier_id', 'product_id', 'quantity_packages', 'estimated_cost', 'status'],
      },
      {
        tableName: 'cancelled_purchase_orders',
        displayName: 'Histórico de Compras Canceladas',
        description: 'Arquivo isolado de ordens de reposição canceladas para não poluir a listagem ativa.',
        recordCount: (this.data.cancelledPurchaseOrders || []).length,
        primaryKey: 'id',
        columnsCount: 14,
        columns: ['id', 'order_number', 'supplier_name', 'product_name', 'cancel_reason', 'cancelled_at'],
      },
      {
        tableName: 'customers',
        displayName: 'Clientes & Contas B2B',
        description: 'Rede hospitalar, clínicas de estética, salões de beleza e contas e-commerce Flind.',
        recordCount: this.data.customers.length,
        primaryKey: 'id',
        columnsCount: 14,
        columns: ['id', 'name', 'trade_name', 'tax_id', 'email', 'phone', 'flind_origin', 'segment'],
      },
      {
        tableName: 'receivables',
        displayName: 'Contas a Receber & Baixa Automática',
        description: 'Títulos financeiros, vencimentos, conciliação e baixas automáticas de pagamentos.',
        recordCount: this.data.receivables.length,
        primaryKey: 'id',
        columnsCount: 14,
        columns: ['id', 'order_id', 'customer_name', 'document_number', 'due_date', 'amount', 'status'],
      },
      {
        tableName: 'delivery_rules',
        displayName: 'Regras de Entrega Operacionais',
        description: 'Janelas horárias de recebimento, agendamento de docas e restrições de veículos (VUC/Carreta).',
        recordCount: this.data.deliveryRules.length,
        primaryKey: 'id',
        columnsCount: 13,
        columns: ['id', 'customer_id', 'allowed_time_start', 'allowed_time_end', 'vehicle_type_allowed', 'requires_scheduling'],
      },
      {
        tableName: 'alerts',
        displayName: 'Alertas Operacionais & SLA',
        description: 'Incidentes de separação, atrasos de fornecedor e riscos de estoque.',
        recordCount: this.data.alerts.length,
        primaryKey: 'id',
        columnsCount: 9,
        columns: ['id', 'type', 'message', 'severity', 'status', 'responsible'],
      },
      {
        tableName: 'audit_logs',
        displayName: 'Trilha de Auditoria & Compliance',
        description: 'Registro cronológico imutável de todas as ações no sistema (compras, cancelamentos, baixas).',
        recordCount: this.data.auditLogs.length,
        primaryKey: 'id',
        columnsCount: 8,
        columns: ['id', 'action', 'entity', 'entity_id', 'user_or_service', 'created_at'],
      },
    ];

    return {
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js Runtime',
      storageEngine: isReadOnlyEnv ? 'In-Memory State + /tmp Persistent Mirror' : 'JSON Persistent Engine / Data Dir',
      storagePath: file,
      tablesCount: tables.length,
      totalRecords: tables.reduce((acc, t) => acc + t.recordCount, 0),
      tables,
    };
  }
}

export const db = new DatabaseManager();
