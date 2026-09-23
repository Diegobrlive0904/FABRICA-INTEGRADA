/**
 * Tray E-commerce Integration Adapter
 * Comunica com a API oficial da Tray Commerce e processa Webhooks de pedidos com Idempotência.
 */

import { db } from '../../database/db';
import { Customer, CustomerAddress, Order, OrderItem, TimelineEvent } from '../../../types';

export interface TrayWebhookPayload {
  event: 'order.created' | 'order.updated' | 'order.paid' | 'order.canceled';
  scope_id: string; // ID da loja Tray
  act: string;
  order_id: number | string;
  date?: string;
  data?: any;
}

export interface TrayOrderDetailsDTO {
  Order: {
    id: number | string;
    date: string;
    hour: string;
    status: string;
    total: number;
    subtotal: number;
    taxes: number;
    discount: number;
    shipment_value: number;
    shipment: string;
    payment_method_type: string;
    Customer: {
      id: number | string;
      name: string;
      cpf?: string;
      cnpj?: string;
      email: string;
      phone: string;
      cellphone?: string;
      address: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zip_code: string;
    };
    ProductsOrder: Array<{
      ProductOrder: {
        product_id: number | string;
        reference: string;
        name: string;
        quantity: number;
        cost_price: number;
        price: number;
        weight?: number;
      };
    }>;
  };
}

export class TrayAdapter {
  private apiUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private code: string;
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.apiUrl = process.env.TRAY_API_URL || 'https://api.commerce.tray.com.br';
    this.consumerKey = process.env.TRAY_CONSUMER_KEY || '';
    this.consumerSecret = process.env.TRAY_CONSUMER_SECRET || '';
    this.code = process.env.TRAY_CODE || '';
  }

  /**
   * Autenticação OAuth 2.0 da Tray
   * POST /auth com consumer_key, consumer_secret e code
   */
  public async authenticate(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken;
    }

    if (!this.consumerKey || !this.consumerSecret) {
      console.warn('[TrayAdapter] Credenciais TRAY_CONSUMER_KEY/SECRET não configuradas em ambiente.');
      return 'MOCK_TRAY_ACCESS_TOKEN';
    }

    const endpoint = `${this.apiUrl}/auth`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        consumer_key: this.consumerKey,
        consumer_secret: this.consumerSecret,
        code: this.code,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Falha na autenticação da API Tray: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // Expira em data.date_expiration_access_token ou 3 horas
    this.tokenExpiresAt = Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600000 * 3);
    return this.accessToken!;
  }

  /**
   * Consulta pedido completo na API oficial da Tray
   * GET /orders/{order_id}/complete
   */
  public async getOrderDetails(orderId: string | number): Promise<TrayOrderDetailsDTO> {
    const token = await this.authenticate();

    // Se estiver em ambiente sem credenciais reais da Tray, retorna estrutura de DTO padrão
    if (token === 'MOCK_TRAY_ACCESS_TOKEN') {
      return this.buildStandardOrderMock(orderId);
    }

    const endpoint = `${this.apiUrl}/orders/${orderId}/complete?access_token=${token}`;
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Erro ao consultar pedido Tray #${orderId}: ${response.status} - ${err}`);
    }

    return await response.json();
  }

  /**
   * Processador de Webhook com Garantia de Idempotência
   * O mesmo evento/pedido não é processado duas vezes.
   */
  public async handleWebhook(
    payload: TrayWebhookPayload,
    correlationId: string
  ): Promise<{ success: boolean; message: string; orderId?: string; alreadyProcessed?: boolean }> {
    const externalOrderId = String(payload.order_id);
    const eventType = payload.event || 'order.created';
    const idempotencyKey = `tray:order:${externalOrderId}:${eventType}`;

    // 1. Verificação de Idempotência
    const existingLog = db.findIdempotencyLog(idempotencyKey);
    if (existingLog && existingLog.status === 'SUCCESS') {
      console.log(`[TrayAdapter] [IDEMPOTÊNCIA] Evento ${idempotencyKey} já processado anteriormente. Ignorando duplicata.`);
      return {
        success: true,
        message: 'Evento já processado com sucesso anteriormente (Idempotente).',
        orderId: existingLog.externalId,
        alreadyProcessed: true,
      };
    }

    // Registrar tentativa na auditoria de integração
    db.addIntegrationLog({
      id: `intlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      integration: 'TRAY',
      eventType,
      externalId: externalOrderId,
      idempotencyKey,
      status: 'PENDING',
      attempts: (existingLog?.attempts || 0) + 1,
      payloadOriginal: payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      // 2. Buscar detalhes completos do pedido
      const details = await this.getOrderDetails(externalOrderId);
      const rawOrder = details.Order;

      // 3. Normalizar Cliente e Endereços
      const customerTaxId = rawOrder.Customer.cnpj || rawOrder.Customer.cpf || '00.000.000/0000-00';
      let customer = db.getCustomers().find((c) => c.taxId === customerTaxId);

      if (!customer) {
        let detectedSegment = 'Hospitalar & Cirúrgico';
        const nameLower = (rawOrder.Customer.name || '').toLowerCase();
        if (nameLower.includes('estética') || nameLower.includes('spa') || nameLower.includes('laser') || nameLower.includes('dermato')) {
          detectedSegment = 'Estética & Spas';
        } else if (nameLower.includes('salão') || nameLower.includes('salao') || nameLower.includes('barbearia') || nameLower.includes('beauty')) {
          detectedSegment = 'Salões & Barbearias';
        }

        customer = {
          id: `cust-tray-${rawOrder.Customer.id}`,
          externalId: `TRAY-${rawOrder.Customer.id}`,
          name: rawOrder.Customer.name,
          segment: detectedSegment,
          taxId: customerTaxId,
          email: rawOrder.Customer.email,
          phone: rawOrder.Customer.phone || rawOrder.Customer.cellphone || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.upsertCustomer(customer);
      }

      // 4. Cadastrar Endereço de Entrega explicitamente (Nunca assumir fiscal = entrega)
      const deliveryAddressId = `addr-del-${customer.id}-${Date.now().toString(36)}`;
      const deliveryAddress: CustomerAddress = {
        id: deliveryAddressId,
        customerId: customer.id,
        type: 'DELIVERY',
        street: rawOrder.Customer.address || 'Logradouro não informado',
        number: rawOrder.Customer.number || 'S/N',
        complement: rawOrder.Customer.complement,
        neighborhood: rawOrder.Customer.neighborhood || 'Centro',
        city: rawOrder.Customer.city || 'São Paulo',
        state: rawOrder.Customer.state || 'SP',
        zipCode: rawOrder.Customer.zip_code || '00000-000',
        country: 'Brasil',
        isDefault: true,
        createdAt: new Date().toISOString(),
      };
      db.upsertAddress(deliveryAddress);

      // 5. Itens do Pedido
      const items: OrderItem[] = (rawOrder.ProductsOrder || []).map((item, idx) => {
        const p = item.ProductOrder;
        return {
          id: `item-${externalOrderId}-${idx + 1}`,
          orderId: `ord-tray-${externalOrderId}`,
          productId: String(p.product_id),
          sku: p.reference || `SKU-${p.product_id}`,
          title: p.name,
          quantity: Number(p.quantity) || 1,
          unitPrice: Number(p.price) || 0,
          totalPrice: (Number(p.quantity) || 1) * (Number(p.price) || 0),
          weightKg: p.weight ? Number(p.weight) : 1,
        };
      });

      // 6. Timeline Operacional Inicial
      const nowIso = new Date().toISOString();
      const initialTimeline: TimelineEvent[] = [
        {
          id: `tl-tray-${externalOrderId}-1`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: 'ORDER_RECEIVED',
          stageLabel: 'Pedido Recebido',
          status: 'COMPLETED',
          startedAt: nowIso,
          completedAt: nowIso,
          durationMinutes: 1,
          expectedSlaMinutes: 10,
          responsible: 'Tray Webhook Sync',
          sourceSystem: 'TRAY',
          notes: `Importado da Tray E-commerce via webhook (${eventType}). Total: R$ ${rawOrder.total}.`,
        },
        {
          id: `tl-tray-${externalOrderId}-2`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: 'ERP_INTEGRATED',
          stageLabel: 'Integrado ao ERP',
          status: 'IN_PROGRESS',
          startedAt: nowIso,
          expectedSlaMinutes: 30,
          responsible: 'SINK ERP Queue Worker',
          sourceSystem: 'SINK_ERP',
          notes: 'Encaminhado para a fila de sincronização com o SINK ERP.',
        },
        {
          id: `tl-tray-${externalOrderId}-3`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: 'SEPARATION',
          stageLabel: 'Separação',
          status: 'PENDING',
          expectedSlaMinutes: 120,
          sourceSystem: 'FABRICA_INTEGRADA',
        },
        {
          id: `tl-tray-${externalOrderId}-4`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: 'INVOICING',
          stageLabel: 'Faturamento',
          status: 'PENDING',
          expectedSlaMinutes: 240,
          sourceSystem: 'SINK_ERP',
        },
        {
          id: `tl-tray-${externalOrderId}-5`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: 'NFE_ISSUED',
          stageLabel: 'NF-e Emitida',
          status: 'PENDING',
          expectedSlaMinutes: 15,
          sourceSystem: 'SINK_ERP',
        },
        {
          id: `tl-tray-${externalOrderId}-6`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: 'EXPEDITION',
          stageLabel: 'Expedição & Etiquetagem',
          status: 'PENDING',
          expectedSlaMinutes: 480,
          sourceSystem: 'FABRICA_INTEGRADA',
        },
        {
          id: `tl-tray-${externalOrderId}-7`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: 'CARRIER_DISPATCH',
          stageLabel: 'Coleta Transportadora',
          status: 'PENDING',
          expectedSlaMinutes: 360,
          sourceSystem: 'TRANSPORTADORA',
        },
        {
          id: `tl-tray-${externalOrderId}-8`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: 'IN_TRANSIT',
          stageLabel: 'Em Trânsito',
          status: 'PENDING',
          expectedSlaMinutes: 1440,
          sourceSystem: 'TRANSPORTADORA',
        },
        {
          id: `tl-tray-${externalOrderId}-9`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: 'DELIVERED',
          stageLabel: 'Entregue ao Cliente',
          status: 'PENDING',
          expectedSlaMinutes: 2880,
          sourceSystem: 'TRANSPORTADORA',
        },
      ];

      // 7. Criar/Atualizar Pedido
      const order: Order = {
        id: `ord-tray-${externalOrderId}`,
        orderNumber: `#${externalOrderId}`,
        externalId: `TRAY-ORD-${externalOrderId}`,
        source: 'TRAY',
        customerId: customer.id,
        deliveryAddressId,
        status: 'NEW',
        totalAmount: Number(rawOrder.total) || 0,
        subtotal: Number(rawOrder.subtotal) || Number(rawOrder.total) || 0,
        shippingCost: Number(rawOrder.shipment_value) || 0,
        discount: Number(rawOrder.discount) || 0,
        paymentMethod: rawOrder.payment_method_type || 'CARTAO_CREDITO',
        paymentStatus: 'PAID',
        items,
        timeline: initialTimeline,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      db.upsertOrder(order);

      // 7.1 Garantir Título a Receber com Baixa Automática sincronizada
      const recId = `rec-tray-${externalOrderId}`;
      const existingRec = db.getReceivableById(recId);
      if (!existingRec) {
        db.upsertReceivable({
          id: recId,
          customerId: customer.id,
          customerName: customer.name,
          orderId: order.id,
          orderNumber: order.orderNumber,
          documentNumber: `DUP-TRAY-${externalOrderId}`,
          invoiceNumber: `NF-${externalOrderId}`,
          amount: order.totalAmount,
          dueDate: nowIso.split('T')[0],
          paymentDate: nowIso.split('T')[0],
          status: 'PAID',
          paymentMethod: order.paymentMethod,
          source: 'TRAY',
          autoCleared: true,
          autoClearedAt: nowIso,
          clearingChannel: 'TRAY',
          transactionCode: `TRAY-PAY-${externalOrderId}`,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      } else if (existingRec.status !== 'PAID') {
        db.autoClearReceivablePayment({
          receivableId: existingRec.id,
          channel: 'TRAY',
          transactionCode: `TRAY-PAY-${externalOrderId}`,
          notes: 'Baixa automática disparada via Webhook Tray E-commerce (order.paid)',
          operatorOrService: 'Webhook Tray',
        });
      }

      // 8. Atualizar Log de Idempotência para SUCCESS
      db.addIntegrationLog({
        id: `intlog-${Date.now()}`,
        integration: 'TRAY',
        eventType,
        externalId: externalOrderId,
        idempotencyKey,
        status: 'SUCCESS',
        attempts: (existingLog?.attempts || 0) + 1,
        payloadOriginal: payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 9. Auditoria do Evento
      db.addAuditLog({
        id: `aud-${Date.now()}`,
        action: 'TRAY_ORDER_SYNCED',
        origin: 'TrayAdapter.handleWebhook',
        entity: 'Order',
        entityId: order.id,
        newValue: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          customer: customer.name,
        },
        userOrService: 'Tray Webhook Service',
        correlationId,
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Pedido #${externalOrderId} da Tray processado e integrado com sucesso.`,
        orderId: order.id,
        alreadyProcessed: false,
      };
    } catch (err: any) {
      console.error(`[TrayAdapter] Erro ao processar webhook da Tray #${externalOrderId}:`, err);

      // Registrar falha na integração
      db.addIntegrationLog({
        id: `intlog-${Date.now()}`,
        integration: 'TRAY',
        eventType,
        externalId: externalOrderId,
        idempotencyKey,
        status: 'FAILED',
        attempts: (existingLog?.attempts || 0) + 1,
        payloadOriginal: payload,
        errorMessage: err.message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      throw err;
    }
  }

  private buildStandardOrderMock(orderId: string | number): TrayOrderDetailsDTO {
    return {
      Order: {
        id: orderId,
        date: new Date().toISOString().split('T')[0],
        hour: '10:15:00',
        status: 'approved',
        total: 7850.0,
        subtotal: 7500.0,
        taxes: 0,
        discount: 0,
        shipment_value: 120.0,
        shipment: 'Flind Express Transportes',
        payment_method_type: 'BOLETO_BANCARIO',
        Customer: {
          id: 994,
          name: 'Hospital São Camilo - Centro Cirúrgico & CAF',
          cnpj: '14.285.932/0001-44',
          email: 'suprimentos@saocamilo.org.br',
          phone: '+55 11 98452-1100',
          address: 'Av. Paulista',
          number: '1842',
          complement: 'Galpão CAF - Insumos e Descartáveis',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01310-200',
        },
        ProductsOrder: [
          {
            ProductOrder: {
              product_id: 8820,
              reference: 'FLIND-TOALET-CX6',
              name: 'Saco de Urina, Vômito, Enjoo - Caixa com 6 Toalet Descartável Flind',
              quantity: 50,
              cost_price: 38.5,
              price: 65.15,
              weight: 12.0,
            },
          },
          {
            ProductOrder: {
              product_id: 8821,
              reference: 'FLIND-MSC-TRIP-MEDIX',
              name: 'Máscara Tripla Descartável Medix - Cx c/ 50 un',
              quantity: 30,
              cost_price: 4.8,
              price: 7.75,
              weight: 4.5,
            },
          },
        ],
      },
    };
  }
}

export const trayAdapter = new TrayAdapter();
