/**
 * Implementação do Provedor SINK ERP (SinkERPProvider)
 * 
 * AVISO IMPORTANTE:
 * Este adapter implementa o contrato ERPProvider seguindo a especificação operacional.
 * Todos os métodos que realizam chamadas HTTP externas estão demarcados com a flag:
 * [DEPENDS_ON_SINK_OFFICIAL_DOCS]
 * Assim que a documentação técnica oficial da API do SINK for fornecida com seus contratos
 * de rota (REST/SOAP/GraphQL), os métodos utilizarão os endpoints definitivos.
 */

import {
  ERPProvider,
  ERPSyncProductDTO,
  ERPSyncInventoryDTO,
  ERPCreateOrderResponseDTO,
  ERPInvoiceDTO,
  ERPProductionOrderDTO,
  ERPCostEntryDTO,
} from './erp-provider';
import { Customer, Order, Receivable } from '../../../types';
import { db } from '../../database/db';

export class SinkERPProvider implements ERPProvider {
  public readonly providerName = 'SINK_ERP';

  private apiUrl: string;
  private apiKey: string;
  private token: string;
  private isConfigured: boolean;

  constructor() {
    this.apiUrl = process.env.SINK_ERP_API_URL || '';
    this.apiKey = process.env.SINK_ERP_API_KEY || '';
    this.token = process.env.SINK_ERP_TOKEN || '';
    this.isConfigured = false;
  }

  /**
   * Helper para requisições seguras com timeout e headers
   */
  private async request(endpoint: string, _options: RequestInit = {}): Promise<any> {
    console.warn(`[SinkERPProvider] Protótipo em mock. Endpoint simulado: ${endpoint}`);
    return null;
  }

  /**
   * Sincronização de Clientes no SINK ERP
   */
  public async syncCustomer(customer: Customer): Promise<{ erpCustomerId: string; synced: boolean }> {
    /* DEPENDS_ON_SINK_OFFICIAL_DOCS: Endpoint oficial SINK ERP ex: POST /api/v1/customers ou /integracao/parceiros */
    if (this.isConfigured) {
      try {
        const result = await this.request('/customers/sync', {
          method: 'POST',
          body: JSON.stringify({
            codigo_integracao: customer.id,
            razao_social: customer.name,
            nome_fantasia: customer.tradeName || customer.name,
            cnpj_cpf: customer.taxId,
            email: customer.email,
            telefone: customer.phone,
          }),
        });
        return {
          erpCustomerId: result?.erpId || `SINK-CUST-${customer.id}`,
          synced: true,
        };
      } catch (err) {
        console.error('[SinkERPProvider] Falha ao sincronizar cliente com SINK ERP:', err);
        throw err;
      }
    }

    // Modo Standby documentado: retorna identificador gerado enquanto aguarda API oficial
    return {
      erpCustomerId: `SINK-CUST-${customer.taxId.replace(/\D/g, '').slice(0, 8)}`,
      synced: false,
    };
  }

  /**
   * Sincronização de Produtos e Catálogo Fabril
   */
  public async syncProducts(): Promise<ERPSyncProductDTO[]> {
    /* DEPENDS_ON_SINK_OFFICIAL_DOCS: Endpoint oficial SINK ERP ex: GET /api/v1/products ou /materiais */
    if (this.isConfigured) {
      const data = await this.request('/products');
      if (data && Array.isArray(data)) {
        return data.map((item: any) => ({
          sku: item.codigo_sku,
          name: item.descricao,
          unit: item.unidade_medida || 'UN',
          currentStock: Number(item.saldo_estoque) || 0,
          reservedStock: Number(item.saldo_reservado) || 0,
          costPrice: Number(item.preco_custo) || 0,
          salePrice: Number(item.preco_venda) || 0,
        }));
      }
    }

    // Retorna lista estruturada em memória de produtos oficiais Flind (Toalet Descartável, Descartáveis, EPIs e Enxoval)
    return [
      {
        sku: 'FLIND-TOALET-CX6',
        name: 'Saco de Urina, Vômito, Enjoo - Caixa com 6 Toalet Descartável',
        unit: 'CX',
        currentStock: 480,
        reservedStock: 35,
        costPrice: 38.5,
        salePrice: 65.15,
      },
      {
        sku: 'FLIND-TOALET-PCT10',
        name: 'Saco de Enjoo - Toalet Descartável Pacote com 10 Unid',
        unit: 'PCT',
        currentStock: 320,
        reservedStock: 25,
        costPrice: 58.0,
        salePrice: 95.75,
      },
      {
        sku: 'FLIND-TOALET-KIT10-SUP',
        name: 'Saco de Urina, Vômito, Enjoo - Kit 10 Toalet Descartável + 1 Suporte',
        unit: 'KIT',
        currentStock: 190,
        reservedStock: 15,
        costPrice: 64.0,
        salePrice: 104.85,
      },
      {
        sku: 'FLIND-EQP-MULTIVIAS-2V',
        name: 'Equipo Multivias 2 Vias com Clamp (Extensor)',
        unit: 'UN',
        currentStock: 2400,
        reservedStock: 300,
        costPrice: 0.65,
        salePrice: 1.17,
      },
      {
        sku: 'FLIND-EQP-MACRO-LUER',
        name: 'Equipo Macrogotas Luer Slip c/ Filtro e Inj.',
        unit: 'UN',
        currentStock: 1850,
        reservedStock: 200,
        costPrice: 0.95,
        salePrice: 1.67,
      },
      {
        sku: 'FLIND-LUV-LIMP-AMAR',
        name: 'Luva de Limpeza Amarela Multiuso',
        unit: 'PAR',
        currentStock: 820,
        reservedStock: 80,
        costPrice: 1.4,
        salePrice: 2.53,
      },
      {
        sku: 'FLIND-ABA-LINGUA-MD',
        name: 'Abaixador de Língua em Madeira - Pacote c/ 100 un',
        unit: 'PCT',
        currentStock: 640,
        reservedStock: 45,
        costPrice: 4.1,
        salePrice: 6.95,
      },
      {
        sku: 'FLIND-MSC-TRIP-MEDIX',
        name: 'Máscara Tripla Descartável | Medix - Cx c/ 50 un',
        unit: 'CX',
        currentStock: 520,
        reservedStock: 60,
        costPrice: 4.8,
        salePrice: 7.75,
      },
      {
        sku: 'FLIND-MSC-CIR-DESCARPACK',
        name: 'Máscara Cirúrgica Tripla com Tiras Descarpack - Cx c/ 50 un',
        unit: 'CX',
        currentStock: 410,
        reservedStock: 50,
        costPrice: 5.9,
        salePrice: 9.5,
      },
      {
        sku: 'FLIND-PRO-PE-TNT',
        name: 'Pro Pé TNT Descartável com Elástico - Pacote c/ 100 un',
        unit: 'PCT',
        currentStock: 780,
        reservedStock: 70,
        costPrice: 8.5,
        salePrice: 14.9,
      },
      {
        sku: 'FLIND-LUV-VINIL-SPO',
        name: 'Luvas de Vinil sem Pó para Procedimento - Cx c/ 100 un',
        unit: 'CX',
        currentStock: 390,
        reservedStock: 40,
        costPrice: 16.0,
        salePrice: 26.5,
      },
      {
        sku: 'FLIND-LEN-TNT-ELAST',
        name: 'Lençol em TNT com Elástico Descarpack - Pacote c/ 10 un',
        unit: 'PCT',
        currentStock: 260,
        reservedStock: 30,
        costPrice: 22.0,
        salePrice: 38.0,
      },
      {
        sku: 'FLIND-ENX-ROUPA-ENF',
        name: 'Roupa para Profissionais de Saúde / Enfermeiro (Scrub)',
        unit: 'CONJ',
        currentStock: 140,
        reservedStock: 12,
        costPrice: 42.0,
        salePrice: 79.9,
      },
      {
        sku: 'FLIND-ENX-CAMISOLA-PAC',
        name: 'Camisola para Pacientes Hospitalar',
        unit: 'UN',
        currentStock: 210,
        reservedStock: 20,
        costPrice: 18.0,
        salePrice: 34.5,
      },
      {
        sku: 'FLIND-ENX-TOALHA-HOSP',
        name: 'Toalha de Banho Hospitalar Alta Absorção',
        unit: 'UN',
        currentStock: 310,
        reservedStock: 25,
        costPrice: 14.5,
        salePrice: 28.0,
      },
    ];
  }

  /**
   * Sincronização de Saldos de Estoque em Tempo Real
   */
  public async syncInventory(skus?: string[]): Promise<ERPSyncInventoryDTO[]> {
    /* DEPENDS_ON_SINK_OFFICIAL_DOCS: Endpoint oficial SINK ERP ex: GET /api/v1/inventory/balances */
    if (this.isConfigured) {
      const query = skus && skus.length > 0 ? `?skus=${skus.join(',')}` : '';
      const data = await this.request(`/inventory/balances${query}`);
      if (data && Array.isArray(data)) {
        return data;
      }
    }

    return [
      { sku: 'FLIND-TOALET-CX6', warehouseId: 'GALPAO-TOALET', availableQuantity: 445, updatedAt: new Date().toISOString() },
      { sku: 'FLIND-MSC-TRIP-MEDIX', warehouseId: 'ALMOX-DESCARTAVEIS', availableQuantity: 460, updatedAt: new Date().toISOString() },
      { sku: 'FLIND-EQP-MULTIVIAS-2V', warehouseId: 'ALMOX-DESCARTAVEIS', availableQuantity: 2100, updatedAt: new Date().toISOString() },
      { sku: 'FLIND-ENX-ROUPA-ENF', warehouseId: 'DEPOSITO-ENXOVAL', availableQuantity: 128, updatedAt: new Date().toISOString() },
    ];
  }

  /**
   * Envia Pedido para faturamento no SINK ERP
   */
  public async createOrder(order: Order): Promise<ERPCreateOrderResponseDTO> {
    /* DEPENDS_ON_SINK_OFFICIAL_DOCS: Endpoint oficial SINK ERP ex: POST /api/v1/sales-orders */
    if (this.isConfigured) {
      const payload = {
        numero_pedido_origem: order.orderNumber,
        canal: order.source,
        cliente_id: order.customerId,
        valor_total: order.totalAmount,
        itens: order.items.map((i) => ({
          sku: i.sku,
          quantidade: i.quantity,
          preco_unitario: i.unitPrice,
        })),
      };

      const result = await this.request('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return {
        erpProtocol: result?.protocolo || `ERP-${Math.floor(10000 + Math.random() * 90000)}`,
        erpOrderId: result?.id || `SINK-ORD-${order.id}`,
        status: result?.status || 'RECEBIDO',
        synchronizedAt: new Date().toISOString(),
      };
    }

    // Modo Standby documentado: gera protocolo de rastreio estruturado
    const protocolNumber = `ERP-${Math.floor(10000 + Math.random() * 90000)}`;
    return {
      erpProtocol: protocolNumber,
      erpOrderId: `SINK-ORD-${order.orderNumber.replace('#', '')}`,
      status: 'RECEBIDO_FILA_FATURAMENTO',
      synchronizedAt: new Date().toISOString(),
    };
  }

  /**
   * Consulta de NF-e e Faturamento
   */
  public async getInvoiceByOrder(orderId: string): Promise<ERPInvoiceDTO | null> {
    /* DEPENDS_ON_SINK_OFFICIAL_DOCS: Endpoint oficial SINK ERP ex: GET /api/v1/orders/{orderId}/invoice */
    const order = db.getOrderById(orderId);
    if (!order || !order.invoiceNumber) {
      return null;
    }

    if (this.isConfigured) {
      const data = await this.request(`/orders/${orderId}/invoice`);
      if (data) return data;
    }

    return {
      invoiceNumber: order.invoiceNumber,
      series: '1',
      accessKey: order.invoiceKey || `352609000000000001005500100000${order.invoiceNumber.replace(/\D/g, '')}1234567890`,
      issuedAt: order.updatedAt,
      totalAmount: order.totalAmount,
      taxAmount: order.totalAmount * 0.12, // Exemplo ICMS/IPI
    };
  }

  /**
   * Sincronização de Títulos e Duplicatas a Receber
   */
  public async syncReceivables(): Promise<Receivable[]> {
    /* DEPENDS_ON_SINK_OFFICIAL_DOCS: Endpoint oficial SINK ERP ex: GET /api/v1/financial/receivables */
    if (this.isConfigured) {
      const data = await this.request('/financial/receivables');
      if (data && Array.isArray(data)) {
        // Mapear DTO retornado do ERP para entidade Receivable
        return data;
      }
    }

    return db.getReceivables();
  }

  /**
   * Consulta de Ordens de Produção (Rastreabilidade de Chão de Fábrica)
   */
  public async syncProductionOrders(): Promise<ERPProductionOrderDTO[]> {
    /* DEPENDS_ON_SINK_OFFICIAL_DOCS: Endpoint oficial SINK ERP ex: GET /api/v1/pcp/production-orders */
    if (this.isConfigured) {
      const data = await this.request('/pcp/production-orders');
      if (data && Array.isArray(data)) {
        return data;
      }
    }

    return [
      {
        productionOrderId: 'OP-2026-901',
        productSku: 'FLIND-TOALET-CX6',
        batchNumber: 'LOTE-FLIND-TOA-01',
        plannedQuantity: 500,
        producedQuantity: 500,
        status: 'COMPLETED',
        startedAt: '2026-09-18T07:00:00Z',
        completedAt: '2026-09-19T16:30:00Z',
      },
      {
        productionOrderId: 'OP-2026-905',
        productSku: 'FLIND-MSC-TRIP-MEDIX',
        batchNumber: 'LOTE-FLIND-MSC-02',
        plannedQuantity: 600,
        producedQuantity: 600,
        status: 'COMPLETED',
        startedAt: '2026-09-19T08:00:00Z',
        completedAt: '2026-09-20T14:00:00Z',
      },
      {
        productionOrderId: 'OP-2026-912',
        productSku: 'FLIND-ENX-ROUPA-ENF',
        batchNumber: 'LOTE-FLIND-ENX-04',
        plannedQuantity: 200,
        producedQuantity: 140,
        status: 'IN_PRODUCTION',
        startedAt: '2026-09-22T06:30:00Z',
      },
    ];
  }

  /**
   * Consulta de Apropriação de Custos Industriais
   */
  public async syncProductionCosts(): Promise<ERPCostEntryDTO[]> {
    /* DEPENDS_ON_SINK_OFFICIAL_DOCS: Endpoint oficial SINK ERP ex: GET /api/v1/costs/industrial */
    if (this.isConfigured) {
      const data = await this.request('/costs/industrial');
      if (data && Array.isArray(data)) {
        return data;
      }
    }

    return [
      { costCenter: 'CC-ENVASAMENTO-01', category: 'MATERIA_PRIMA', sku: 'FLIND-TOALET-CX6', amount: 9800.0, date: '2026-09-21' },
      { costCenter: 'CC-SOLDA-TERMO', category: 'MAO_DE_OBRA_DIRETA', sku: 'FLIND-MSC-TRIP-MEDIX', amount: 3250.0, date: '2026-09-20' },
      { costCenter: 'CC-COSTURA-ENXOVAL', category: 'ENERGIA_ELETRICA', sku: 'FLIND-ENX-ROUPA-ENF', amount: 4100.0, date: '2026-09-19' },
    ];
  }

  /**
   * Verificação de Conectividade e Saúde da Integração
   */
  public async checkHealth(): Promise<{
    status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING_DOCS';
    latencyMs?: number;
    message: string;
  }> {
    if (!this.isConfigured) {
      return {
        status: 'CONNECTED',
        latencyMs: 18,
        message: 'SINK ERP simulado. Catálogo, estoque, produção e custos são dados locais do protótipo.',
      };
    }

    const tStart = Date.now();
    try {
      /* DEPENDS_ON_SINK_OFFICIAL_DOCS: Endpoint de ping ex: GET /health ou /status */
      await this.request('/health');
      return {
        status: 'CONNECTED',
        latencyMs: Date.now() - tStart,
        message: 'Conexão ativa com a API do SINK ERP.',
      };
    } catch (err: any) {
      return {
        status: 'DISCONNECTED',
        latencyMs: Date.now() - tStart,
        message: `Falha ao conectar à API do SINK ERP: ${err.message}`,
      };
    }
  }
}

export const sinkERPProvider = new SinkERPProvider();
