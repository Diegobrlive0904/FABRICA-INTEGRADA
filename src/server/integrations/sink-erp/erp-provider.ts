/**
 * Contrato e DTOs de Provedor ERP (ERPProvider)
 * Arquitetura desacoplada para permitir substituição ou expansão de ERPs
 */

import { Customer, Order, Receivable } from '../../../types';

export interface ERPSyncCustomerDTO {
  externalId?: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  stateRegistration?: string;
}

export interface ERPSyncProductDTO {
  sku: string;
  name: string;
  description?: string;
  unit: string;
  currentStock: number;
  reservedStock: number;
  costPrice: number;
  salePrice: number;
}

export interface ERPSyncInventoryDTO {
  sku: string;
  warehouseId?: string;
  availableQuantity: number;
  updatedAt: string;
}

export interface ERPCreateOrderDTO {
  internalOrderId: string;
  orderNumber: string;
  customerTaxId: string;
  items: Array<{
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
  shippingValue: number;
  totalAmount: number;
  paymentTerm: string;
}

export interface ERPCreateOrderResponseDTO {
  erpProtocol: string;
  erpOrderId: string;
  status: string;
  synchronizedAt: string;
}

export interface ERPInvoiceDTO {
  invoiceNumber: string;
  series: string;
  accessKey: string;
  xmlUrl?: string;
  pdfDanfeUrl?: string;
  issuedAt: string;
  totalAmount: number;
  taxAmount: number;
}

export interface ERPReceivableDTO {
  documentNumber: string;
  invoiceNumber: string;
  parcelNumber: number;
  dueDate: string;
  amount: number;
  barcode?: string;
  pixQrCode?: string;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
}

export interface ERPProductionOrderDTO {
  productionOrderId: string;
  productSku: string;
  batchNumber: string;
  plannedQuantity: number;
  producedQuantity: number;
  status: 'PLANNED' | 'IN_PRODUCTION' | 'COMPLETED' | 'SUSPENDED';
  startedAt?: string;
  completedAt?: string;
}

export interface ERPCostEntryDTO {
  costCenter: string;
  category: string;
  sku?: string;
  amount: number;
  date: string;
}

/**
 * Interface Obrigatória do Provedor de ERP
 */
export interface ERPProvider {
  readonly providerName: string;

  /**
   * Sincroniza cliente com o ERP
   */
  syncCustomer(customer: Customer): Promise<{ erpCustomerId: string; synced: boolean }>;

  /**
   * Sincroniza catálogo de produtos
   */
  syncProducts(): Promise<ERPSyncProductDTO[]>;

  /**
   * Consulta saldo e disponibilidade de estoque
   */
  syncInventory(skus?: string[]): Promise<ERPSyncInventoryDTO[]>;

  /**
   * Envia pedido da Fábrica Integrada para faturamento no ERP
   */
  createOrder(order: Order): Promise<ERPCreateOrderResponseDTO>;

  /**
   * Consulta dados de faturamento e NF-e emitida
   */
  getInvoiceByOrder(orderId: string): Promise<ERPInvoiceDTO | null>;

  /**
   * Sincroniza duplicatas e títulos a receber gerados pelo ERP
   */
  syncReceivables(): Promise<Receivable[]>;

  /**
   * Consulta ordens de produção e rastreabilidade de lotes fabris
   */
  syncProductionOrders(): Promise<ERPProductionOrderDTO[]>;

  /**
   * Consulta apropriação de custos de produção
   */
  syncProductionCosts(): Promise<ERPCostEntryDTO[]>;

  /**
   * Verifica conectividade e saúde da integração com o ERP
   */
  checkHealth(): Promise<{ status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING_DOCS'; latencyMs?: number; message: string }>;
}
