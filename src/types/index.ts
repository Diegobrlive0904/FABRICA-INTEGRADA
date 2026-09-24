/**
 * Tipos e Interfaces da Fábrica Integrada
 * Camada Central de Integração, Rastreabilidade, Automação Operacional e Regras
 */

export type AddressType = 'FISCAL' | 'BILLING' | 'DELIVERY';

export interface CustomerAddress {
  id: string;
  customerId: string;
  type: AddressType;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

export type Address = CustomerAddress;

export type CustomerOrigin =
  | 'FLIND_ECOMMERCE_WEB'
  | 'SINK_ERP'
  | 'TRAY'
  | 'DIRETO_B2B'
  | 'BALCAO';

export function isCustomerFromSite(customer: Customer | null | undefined): boolean {
  if (!customer) return false;
  if (
    customer.flindOrigin === 'DIRETO_B2B' ||
    customer.flindOrigin === 'BALCAO' ||
    customer.flindOrigin === 'SINK_ERP'
  ) {
    return false;
  }
  if (customer.flindOrigin === 'FLIND_ECOMMERCE_WEB' || customer.flindOrigin === 'TRAY') {
    return true;
  }
  return Boolean(customer.flindWebId || customer.flindPortalSync?.isRegisteredOnFlindWeb);
}

export interface FlindPortalSyncInfo {
  isRegisteredOnFlindWeb: boolean;
  lastSyncedAt?: string;
  accountEmail?: string;
  totalFlindWebOrders?: number;
  flindTier?: 'OURO_HOSPITALAR' | 'PRATA_CLINICAS' | 'BRONZE_ESTETICA' | 'PADRAO_B2B' | string;
  customerProfileUrl?: string;
  catalogInterest?: string[];
}

export interface Customer {
  id: string;
  externalId?: string;
  flindWebId?: string | number; // Identificador da conta do cliente no e-commerce www.flind.com.br
  flindWebProfileUrl?: string; // Link direto do cliente em www.flind.com.br
  flindOrigin?: CustomerOrigin;
  flindPortalSync?: FlindPortalSyncInfo;
  name: string;
  tradeName?: string;
  segment?: 'Hospitalar & Cirúrgico' | 'Estética & Spas' | 'Salões & Barbearias' | 'Clínicas & Laboratórios' | 'Distribuidor / Revenda' | string;
  taxId: string; // CPF ou CNPJ formatado
  stateRegistration?: string; // Inscrição Estadual (IE)
  email: string;
  phone: string;
  contactPerson?: string;
  notes?: string;
  addresses?: CustomerAddress[];
  createdAt: string;
  updatedAt: string;
}

export type VehicleType = 'VUC' | 'TOCO' | 'TRUCK' | 'CARRETA' | 'QUALQUER';

export interface DeliveryRule {
  id: string;
  addressId: string;
  customerId: string;
  allowedTimeStart: string; // HH:mm ex: "08:00"
  allowedTimeEnd: string; // HH:mm ex: "17:00"
  allowedWeekdays: number[]; // 1=Segunda, 5=Sexta, etc
  requiresScheduling: boolean;
  maxWeightKg?: number;
  vehicleTypeAllowed: VehicleType;
  entryGate?: string;
  contactName: string;
  contactPhone: string;
  requiresDocumentation: boolean;
  notes?: string;
  active: boolean;
}

export type OrderStatus =
  | 'NEW'
  | 'INTEGRATED_ERP'
  | 'SEPARATION'
  | 'BILLED'
  | 'NFE_ISSUED'
  | 'EXPEDITION'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export type TimelineStage =
  | 'ORDER_RECEIVED'
  | 'ERP_INTEGRATED'
  | 'SEPARATION'
  | 'INVOICING'
  | 'NFE_ISSUED'
  | 'EXPEDITION'
  | 'CARRIER_DISPATCH'
  | 'IN_TRANSIT'
  | 'DELIVERED';

export type TimelineEventStatus = 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'DELAYED';

export interface TimelineEvent {
  id: string;
  orderId: string;
  stage: TimelineStage;
  stageLabel: string;
  status: TimelineEventStatus;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  expectedSlaMinutes: number;
  responsible?: string;
  sourceSystem: 'TRAY' | 'SINK_ERP' | 'FABRICA_INTEGRADA' | 'TRANSPORTADORA';
  origin?: string;
  notes?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sku: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  lotNumber?: string;
  weightKg?: number;
  packagingUnit?: string;
  unitsPerPackage?: number;
  manufactureDate?: string;
  expiryDate?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  externalId?: string; // ID na Tray ou ERP
  trayOrderId?: number | string;
  source: 'TRAY' | 'SINK' | 'MANUAL';
  customerId: string;
  customer?: Customer;
  deliveryAddressId: string;
  deliveryAddress?: CustomerAddress;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  discount: number;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  items: OrderItem[];
  timeline: TimelineEvent[];
  invoiceNumber?: string;
  invoiceKey?: string;
  trackingToken?: string;
  createdAt: string;
  updatedAt: string;
}

export type SlaSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertSeverity = SlaSeverity;

export interface SlaRule {
  id: string;
  name: string;
  fromStage: TimelineStage;
  toStage: TimelineStage;
  slaMinutes: number;
  severity: SlaSeverity;
  active: boolean;
  createdAt: string;
}

export type AlertType =
  | 'SLA_BREACH'
  | 'DELIVERY_RULE_VIOLATION'
  | 'SYNC_FAILURE'
  | 'OVERDUE_RECEIVABLE'
  | 'SYSTEM_ERROR';

export type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Alert {
  id: string;
  severity: SlaSeverity;
  type: AlertType;
  entityType: 'ORDER' | 'RECEIVABLE' | 'SHIPMENT' | 'INTEGRATION';
  entityId: string;
  message: string;
  ruleResponsible?: string;
  responsible?: string;
  status: AlertStatus;
  acknowledgedAt?: string;
  resolvedAt?: string;
  createdAt: string;
}

export type ReceivableStatus =
  | 'OPEN'
  | 'DUE_SOON'
  | 'DUE_TODAY'
  | 'OVERDUE'
  | 'PAID'
  | 'CANCELLED';

export interface Receivable {
  id: string;
  customerId: string;
  customerName?: string;
  orderId?: string;
  orderNumber?: string;
  documentNumber: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string;
  status: ReceivableStatus;
  paymentMethod: string;
  externalId?: string;
  source: 'SINK_ERP' | 'TRAY' | 'MANUAL';
  pixCode?: string;
  barcode?: string;
  transactionCode?: string;
  clearingChannel?: string;
  autoCleared?: boolean;
  autoClearedAt?: string;
  payerTaxId?: string;
  payerName?: string;
  receiptNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentClearingChannel =
  | 'PIX_AUTOMATICO'
  | 'RETORNO_BANCARIO_CNAB'
  | 'SINK_ERP'
  | 'TRAY'
  | 'CARTAO_GATEWAY'
  | 'TRANSFERENCIA_TED'
  | 'MANUAL';

export interface PaymentClearingResult {
  success: boolean;
  message: string;
  receivable: Receivable;
  orderUpdated: boolean;
  orderNumber?: string;
  resolvedAlertsCount: number;
  cancelledCollectionCount: number;
  confirmationWhatsAppSent: boolean;
  clearingDetails: {
    transactionCode: string;
    clearingChannel: string;
    clearedAt: string;
    amount: number;
    payerName?: string;
  };
}

export interface CollectionRule {
  id: string;
  name: string;
  daysOffset: number; // -5, -3, -1, 0, 1, 3, 7
  channel: 'WHATSAPP' | 'INTERNAL_ALERT' | 'EMAIL';
  templateName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  targetAudience: 'ALL' | 'RETAIL' | 'WHOLESALE';
  allowedTimeStart: string; // "09:00"
  allowedTimeEnd: string; // "18:00"
  active: boolean;
  createdAt: string;
}

export interface WhatsAppMessageLog {
  id: string;
  recipientPhone: string;
  customerName: string;
  receivableId?: string;
  orderId?: string;
  templateName: string;
  parameters: Record<string, string>;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  providerMessageId?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
  direction: 'OUTBOUND' | 'INBOUND';
  createdAt: string;
}

export type ShipmentStatus =
  | 'WAITING_DISPATCH'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'ISSUE';

export interface Shipment {
  id: string;
  trackingToken: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  invoiceKey?: string;
  carrierName: string;
  trackingCode?: string;
  volumesCount: number;
  totalWeightKg: number;
  selectedVehicleType: VehicleType;
  schedulingScheduledAt?: string;
  status: ShipmentStatus;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  origin: string;
  entity: string;
  entityId: string;
  previousValue?: any;
  newValue?: any;
  userOrService: string;
  correlationId: string;
  createdAt: string;
}

export interface IntegrationSyncLog {
  id: string;
  integration: 'TRAY' | 'SINK_ERP' | 'WHATSAPP';
  provider?: string;
  eventType: string;
  event?: string;
  externalId: string;
  idempotencyKey: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SKIPPED_DUPLICATE';
  attempts: number;
  durationMs?: number;
  payloadOriginal?: any;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  orders: {
    total: number;
    new: number;
    processing: number;
    billed: number;
    waitingExpedition: number;
    delayed: number;
    delivered: number;
  };
  financial: {
    totalOverdueAmount: number;
    totalPendingAmount: number;
    dueSoonCount: number;
    dueTodayCount: number;
    overdueCount: number;
    paidCount: number;
    agingBuckets: {
      dueSoon: { count: number; amount: number }; // A vencer
      dueToday: { count: number; amount: number }; // Vence hoje
      overdue1to3: { count: number; amount: number }; // 1-3 dias atrasado
      overdue4to7: { count: number; amount: number }; // 4-7 dias atrasado
      overdue8to30: { count: number; amount: number }; // 8-30 dias atrasado
      overdue30Plus: { count: number; amount: number }; // +30 dias atrasado
    };
  };
  logistics: {
    waitingExpedition: number;
    inTransit: number;
    delivered: number;
    issuesCount: number;
    delayedDeliveries: number;
  };
  alerts: {
    totalPending: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    resolvedCount: number;
  };
  inventory?: {
    totalItems: number;
    totalPackages: number;
    totalUnits: number;
    normalStockCount: number;
    lowStockCount: number;
    criticalStockCount: number;
    autoReordersCount: number;
  };
  suppliers?: {
    totalSuppliers: number;
    activeSuppliers: number;
    openPurchaseOrders: number;
  };
}

export type StockStatus = 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';

export interface ProductInventory {
  id: string;
  sku: string;
  name: string;
  category: 'Hospitalar & Cirúrgico' | 'Estética & Spas' | 'Salões & Barbearias' | 'Insumo & Matéria-Prima';
  packagingUnit: string; // ex: 'Caixa (CX)', 'Fardo (FD)', 'Pacote (PCT)', 'Rolo (RL)'
  unitsPerPackage: number; // Quantidade dentro da unidade ou volume
  unitWeightKg: number; // Peso unitário individual
  weightPerPackageKg: number; // Peso bruto da unidade/volume
  manufactureDate: string; // Data de fabricação YYYY-MM-DD
  expiryDate: string; // Data de validade YYYY-MM-DD
  shelfLifeMonths: number; // Vida útil em meses
  lotNumber: string; // Lote de fabricação
  currentStockPackages: number; // Estoque atual em volumes/embalagens
  currentStockUnits: number; // Estoque atual em unidades (packages * unitsPerPackage)
  minStockPackages: number; // Estoque mínimo / Ponto de ressuprimento automático
  minStockUnits: number;
  reorderQuantityPackages: number; // Quantidade padrão para reposição automática
  supplierId: string; // Fornecedor homologado vinculado
  supplierName: string;
  supplierPhone?: string;
  costPrice: number;
  salePrice: number;
  location: string; // Endereço de estocagem (Rua / Prateleira / Doca)
  status: StockStatus;
  autoReorderEnabled: boolean; // Automação quando o estoque estiver acabando
  lastRestockAt?: string;
  createdAt: string;
  updatedAt: string;
  // Campos de Catálogo Técnico Flind
  barcode?: string; // Código EAN-13
  material?: string; // ex: "TNT SMS 100% Polipropileno Atóxico"
  technicalSpecs?: string; // Ficha técnica completa de fabricação e uso
  dimensions?: string; // Dimensões nominais (ex: 2,20m x 0,90m)
  grammage?: string; // Gramatura nominal (ex: 50g/m²)
  anvisaRegistration?: string; // Registro ANVISA / Notificação AFE
  packagingDimensions?: string; // Dimensões da embalagem/caixa em cm
  stackingMax?: number; // Empilhamento máximo em caixas
  storageConditions?: string; // Condições recomendadas de estocagem
  flindCatalogUrl?: string; // Link no catálogo online www.flind.com.br
}

export interface OpenPoDetail {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierWhatsapp: string;
  quantityPackages: number;
  quantityUnits: number;
  packagingUnit: string;
  estimatedCost: number;
  status: 'PENDING' | 'SENT_WHATSAPP' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  expectedDeliveryDate?: string;
  createdAt: string;
}

export interface MissingProductItem {
  productId: string;
  sku: string;
  name: string;
  category: string;
  currentStockPackages: number;
  minStockPackages: number;
  deficitPackages: number;
  currentStockUnits: number;
  minStockUnits: number;
  deficitUnits: number;
  packagingUnit: string;
  unitsPerPackage: number;
  severity: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW';
  committedInOrdersPackages: number;
  netAvailablePackages: number;
  supplierId: string;
  supplierName: string;
  supplierWhatsapp: string;
  leadTimeDays: number;
  costPrice: number;
  suggestedReorderPackages: number;
  estimatedTotalCost: number;
  hasOpenPurchaseOrder: boolean;
  openPoNumbers?: string[];
  openPoTotalPackages?: number;
  openPoList?: OpenPoDetail[];
  technicalSpecs?: string;
  material?: string;
  anvisaRegistration?: string;
  barcode?: string;
}

export interface MissingProductsDiagnostic {
  scannedAt: string;
  totalProductsScanned: number;
  missingProductsCount: number;
  outOfStockCount: number;
  criticalCount: number;
  lowStockCount: number;
  totalDeficitPackages: number;
  totalEstimatedCost: number;
  affectedSuppliersCount: number;
  items: MissingProductItem[];
}

export interface InventoryImportRow {
  sku: string;
  name: string;
  category?: ProductInventory['category'];
  packagingUnit?: string;
  unitsPerPackage?: number;
  currentStockPackages?: number;
  currentStockUnits?: number;
  minStockPackages?: number;
  unitWeightKg?: number;
  weightPerPackageKg?: number;
  costPrice?: number;
  salePrice?: number;
  lotNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
  shelfLifeMonths?: number;
  location?: string;
  supplierName?: string;
  supplierId?: string;
  barcode?: string;
}

export interface InventoryImportResult {
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  totalPackagesUpdated: number;
  totalUnitsCalculated: number;
  items: Array<{
    id: string;
    sku: string;
    name: string;
    action: 'CREATED' | 'UPDATED' | 'UNCHANGED';
    previousPackages?: number;
    newPackages: number;
    previousUnits?: number;
    newUnits: number;
    packagingUnit: string;
    unitsPerPackage: number;
    status: StockStatus;
  }>;
  autoOrdersTriggered: PurchaseOrder[];
  auditLogId: string;
  message: string;
}

export interface Supplier {
  id: string;
  name: string;
  tradeName: string;
  taxId: string; // CNPJ
  stateRegistration?: string; // Inscrição Estadual
  contactName: string;
  phone: string;
  whatsapp: string; // Número para disparo automático de pedidos de reposição
  email: string;
  category: string; // Insumos / Itens fornecidos
  leadTimeDays: number; // Prazo médio de entrega em dias
  city: string;
  state: string;
  paymentTerms: string; // ex: "Boleto 30/60 DDL"
  status: 'HOMOLOGATED' | 'ACTIVE' | 'AUDIT_PENDING';
  notes?: string;
  suppliedProductsCount?: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // ex: "PO-FLIND-2026-001"
  supplierId: string;
  supplierName: string;
  supplierWhatsapp: string;
  productId: string;
  productSku: string;
  productName: string;
  quantityPackages: number; // Quantidade em caixas/volumes
  quantityUnits: number; // Quantidade em unidades individuais
  packagingUnit: string;
  estimatedCost: number;
  triggerReason: 'AUTO_LOW_STOCK' | 'MANUAL_REORDER' | 'MANUAL';
  status: 'PENDING' | 'SENT_WHATSAPP' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  whatsappMessageId?: string;
  notes?: string;
  expectedDeliveryDate: string;
  createdAt: string;
  updatedAt: string;
}

// Proposta de cotação individual de um fornecedor para um produto faltante
export interface SupplierQuotationOffer {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierTradeName: string;
  supplierCity: string;
  supplierState: string;
  supplierWhatsapp: string;
  supplierStatus: 'HOMOLOGATED' | 'ACTIVE' | 'AUDIT_PENDING';

  // 1. Valores
  unitPrice: number; // Preço unitário por volume/caixa
  totalCost: number; // Preço total do lote
  paymentTerms: string; // Ex: "Boleto 28 DDL", "30/60 DDL"
  commercialDiscountPct?: number;

  // 2. Tempo de Entrega
  leadTimeDays: number; // Prazo de entrega em dias úteis
  expectedDeliveryDate: string; // Data prevista de chegada no armazém
  freightType: 'CIF' | 'FOB'; // CIF (frete incluso) ou FOB (retirada)
  onTimeDeliveryRatePct: number; // Histórico de pontualidade (%)

  // 3. Fabricação
  manufacturingDate: string; // Data em que o lote foi fabricado
  manufacturingLot: string; // Código do lote fabril
  manufacturingCapacity: string; // Ex: "15.000 caixas/mês"
  rawMaterialOrigin: string; // Procedência (ex: "Polipropileno SMS 100% Virgem")
  anvisaCompliant: boolean; // Registro e laudo ANVISA em dia
  qualityAuditScore: number; // 0-100 nota de qualidade fabril

  // 4. Validade do Produto
  shelfLifeMonths: number; // Validade total em meses (ex: 24, 36)
  expiryDate: string; // Data exata de vencimento do lote
  freshnessLabel: string; // Ex: "Lote Recente (Fabricado há 9 dias)"

  // Scores comparativos (0 a 100)
  priceScore: number;
  deliveryScore: number;
  manufacturingScore: number;
  shelfLifeScore: number;
  compositeScore: number; // Score geral ponderado

  isBestChoice: boolean; // Marcado como o melhor fornecedor pelo algoritmo
  bestChoiceHighlight?: string; // Motivo resumido da indicação
  badges: string[]; // ["🏆 Melhor Opção", "Menor Preço", "Entrega Mais Rápida", "Maior Validade"]
}

// Matriz comparativa de cotações para um produto em déficit
export interface ProductQuotationComparison {
  productId: string;
  sku: string;
  name: string;
  category: string;
  packagingUnit: string;
  unitsPerPackage: number;
  currentStockPackages: number;
  minStockPackages: number;
  deficitPackages: number;
  suggestedPackages: number;
  severity: 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW';

  // Cotações comparadas lado a lado
  offers: SupplierQuotationOffer[];

  // Informações de Pedido em Andamento
  hasOpenPurchaseOrder?: boolean;
  openPoNumbers?: string[];
  openPoTotalPackages?: number;
  openPoList?: OpenPoDetail[];

  // Recomendação do Sistema
  recommendedSupplierId: string;
  recommendedSupplierName: string;
  recommendedOfferId: string;
  recommendationReason: string;
  priceSavingsVsWorstPct: number;
  leadTimeAdvantageDays: number;
}


