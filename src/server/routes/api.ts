/**
 * Rotas da API REST da Fábrica Integrada
 */

import { Router, Request, Response } from 'express';
import { db } from '../database/db';
import { trayAdapter, TrayWebhookPayload } from '../integrations/tray/tray-adapter';
import { sinkERPProvider } from '../integrations/sink-erp/sink-erp-adapter';
import { whatsappProvider } from '../integrations/whatsapp/whatsapp-provider';
import { ruleEngine } from '../services/rule-engine';
import { shippingService } from '../services/shipping-service';
import {
  DashboardMetrics,
  OrderStatus,
  TimelineEvent,
  TimelineStage,
  VehicleType,
  ProductInventory,
  Supplier,
  PurchaseOrder,
  InventoryImportRow,
} from '../../types';
import * as XLSX from 'xlsx';
import {
  parseExcelWorkbook,
  generateInventoryTemplateWorkbook,
} from '../services/excel-inventory-service';

export const apiRouter = Router();

// ==========================================
// 1. DASHBOARD & MÉTRICAS OPERACIONAIS
// ==========================================
apiRouter.get('/dashboard/metrics', (req: Request, res: Response) => {
  // Executar checagens de SLA em background para atualizar atrasos
  ruleEngine.evaluateOrderSlas();

  const orders = db.getOrders();
  const receivables = db.getReceivables();
  const shipments = db.getShipments();
  const alerts = db.getAlerts();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Métricas de Pedidos
  const orderMetrics = {
    total: orders.length,
    new: orders.filter((o) => o.status === 'NEW').length,
    processing: orders.filter((o) => ['INTEGRATED_ERP', 'SEPARATION'].includes(o.status)).length,
    billed: orders.filter((o) => ['BILLED', 'NFE_ISSUED'].includes(o.status)).length,
    waitingExpedition: orders.filter((o) => o.status === 'EXPEDITION').length,
    delayed: orders.filter((o) => o.timeline.some((t) => t.status === 'DELAYED')).length,
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
  };

  // Métricas Financeiras & Aging Buckets
  const agingBuckets = {
    dueSoon: { count: 0, amount: 0 },
    dueToday: { count: 0, amount: 0 },
    overdue1to3: { count: 0, amount: 0 },
    overdue4to7: { count: 0, amount: 0 },
    overdue8to30: { count: 0, amount: 0 },
    overdue30Plus: { count: 0, amount: 0 },
  };

  let totalOverdueAmount = 0;
  let totalPendingAmount = 0;
  let dueSoonCount = 0;
  let dueTodayCount = 0;
  let overdueCount = 0;
  let paidCount = 0;

  for (const r of receivables) {
    if (r.status === 'PAID') {
      paidCount++;
      continue;
    }
    if (r.status === 'CANCELLED') {
      continue;
    }

    totalPendingAmount += r.amount;
    const diffDays = Math.round((new Date(todayStr).getTime() - new Date(r.dueDate).getTime()) / 86400000);

    if (diffDays < 0) {
      dueSoonCount++;
      agingBuckets.dueSoon.count++;
      agingBuckets.dueSoon.amount += r.amount;
    } else if (diffDays === 0) {
      dueTodayCount++;
      agingBuckets.dueToday.count++;
      agingBuckets.dueToday.amount += r.amount;
    } else {
      overdueCount++;
      totalOverdueAmount += r.amount;

      if (diffDays >= 1 && diffDays <= 3) {
        agingBuckets.overdue1to3.count++;
        agingBuckets.overdue1to3.amount += r.amount;
      } else if (diffDays >= 4 && diffDays <= 7) {
        agingBuckets.overdue4to7.count++;
        agingBuckets.overdue4to7.amount += r.amount;
      } else if (diffDays >= 8 && diffDays <= 30) {
        agingBuckets.overdue8to30.count++;
        agingBuckets.overdue8to30.amount += r.amount;
      } else {
        agingBuckets.overdue30Plus.count++;
        agingBuckets.overdue30Plus.amount += r.amount;
      }
    }
  }

  // Métricas de Logística
  const logisticsMetrics = {
    waitingExpedition: shipments.filter((s) => s.status === 'WAITING_DISPATCH').length,
    inTransit: shipments.filter((s) => ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length,
    delivered: shipments.filter((s) => s.status === 'DELIVERED').length,
    issuesCount: shipments.filter((s) => s.status === 'ISSUE').length,
    delayedDeliveries: orders.filter((o) =>
      o.timeline.some((t) => t.stage === 'EXPEDITION' && t.status === 'DELAYED')
    ).length,
  };

  // Métricas de Alertas
  const alertMetrics = {
    totalPending: alerts.filter((a) => a.status === 'PENDING').length,
    criticalCount: alerts.filter((a) => a.status === 'PENDING' && a.severity === 'CRITICAL').length,
    warningCount: alerts.filter((a) => a.status === 'PENDING' && a.severity === 'WARNING').length,
    infoCount: alerts.filter((a) => a.status === 'PENDING' && a.severity === 'INFO').length,
    resolvedCount: alerts.filter((a) => a.status === 'RESOLVED').length,
  };

  // Métricas de Estoque, Embalagens e Reposição
  const products = db.getProducts();
  const suppliers = db.getSuppliers();
  const purchaseOrders = db.getPurchaseOrders();

  const inventoryMetrics = {
    totalItems: products.length,
    totalPackages: products.reduce((acc, p) => acc + (p.currentStockPackages || 0), 0),
    totalUnits: products.reduce((acc, p) => acc + (p.currentStockUnits || 0), 0),
    normalStockCount: products.filter((p) => p.status === 'NORMAL').length,
    lowStockCount: products.filter((p) => p.status === 'LOW').length,
    criticalStockCount: products.filter((p) => p.status === 'CRITICAL' || p.status === 'OUT_OF_STOCK').length,
    autoReordersCount: purchaseOrders.filter((po) => po.triggerReason === 'AUTO_LOW_STOCK').length,
  };

  const suppliersMetrics = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter((s) => s.status === 'HOMOLOGATED' || s.status === 'ACTIVE').length,
    openPurchaseOrders: purchaseOrders.filter((po) => po.status === 'PENDING' || po.status === 'SENT_WHATSAPP').length,
  };

  const metrics: DashboardMetrics = {
    orders: orderMetrics,
    financial: {
      totalOverdueAmount,
      totalPendingAmount,
      dueSoonCount,
      dueTodayCount,
      overdueCount,
      paidCount,
      agingBuckets,
    },
    logistics: logisticsMetrics,
    alerts: alertMetrics,
    inventory: inventoryMetrics,
    suppliers: suppliersMetrics,
  };

  res.json(metrics);
});

// ==========================================
// 2. PEDIDOS E TIMELINE
// ==========================================
apiRouter.get('/orders', (req: Request, res: Response) => {
  const { status, search, delayed } = req.query;
  let orders = db.getOrders();

  if (status && typeof status === 'string') {
    orders = orders.filter((o) => o.status === status);
  }

  if (delayed === 'true') {
    orders = orders.filter((o) => o.timeline.some((t) => t.status === 'DELAYED'));
  }

  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(s) ||
        o.customer?.name.toLowerCase().includes(s) ||
        o.invoiceNumber?.toLowerCase().includes(s)
    );
  }

  res.json(orders);
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  // Validação de regras de entrega vinculadas
  const deliveryValidation = ruleEngine.validateDeliveryRules(order);
  const shipment = db.getShipmentByOrderId(order.id);

  res.json({
    order,
    deliveryValidation,
    shipment,
  });
});

apiRouter.post('/orders/:id/advance-stage', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  const { targetStage, responsible, notes } = req.body;
  const stages: TimelineStage[] = [
    'ORDER_RECEIVED',
    'ERP_INTEGRATED',
    'SEPARATION',
    'INVOICING',
    'NFE_ISSUED',
    'EXPEDITION',
    'CARRIER_DISPATCH',
    'IN_TRANSIT',
    'DELIVERED',
  ];

  const nowIso = new Date().toISOString();
  let currentActiveIndex = order.timeline.findIndex(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'DELAYED'
  );

  if (currentActiveIndex === -1) {
    currentActiveIndex = order.timeline.findIndex((t) => t.status === 'COMPLETED');
  }

  // Concluir etapa atual
  if (currentActiveIndex >= 0 && order.timeline[currentActiveIndex]) {
    const curr = order.timeline[currentActiveIndex];
    curr.status = 'COMPLETED';
    curr.completedAt = nowIso;
    if (curr.startedAt) {
      const dur = Math.round((new Date(nowIso).getTime() - new Date(curr.startedAt).getTime()) / 60000);
      curr.durationMinutes = Math.max(1, dur);
    }
  }

  // Avançar para a próxima etapa
  const nextIndex = currentActiveIndex + 1;
  if (nextIndex < order.timeline.length) {
    const next = order.timeline[nextIndex];
    next.status = 'IN_PROGRESS';
    next.startedAt = nowIso;
    if (responsible) next.responsible = responsible;
    if (notes) next.notes = notes;

    // Mapear status geral do pedido
    const stageToOrderStatusMap: Record<TimelineStage, OrderStatus> = {
      ORDER_RECEIVED: 'NEW',
      ERP_INTEGRATED: 'INTEGRATED_ERP',
      SEPARATION: 'SEPARATION',
      INVOICING: 'BILLED',
      NFE_ISSUED: 'NFE_ISSUED',
      EXPEDITION: 'EXPEDITION',
      CARRIER_DISPATCH: 'SHIPPED',
      IN_TRANSIT: 'IN_TRANSIT',
      DELIVERED: 'DELIVERED',
    };

    order.status = stageToOrderStatusMap[next.stage] || order.status;

    // Se a etapa for NFE_ISSUED e ainda não tiver NF, gera número
    if (next.stage === 'NFE_ISSUED' && !order.invoiceNumber) {
      const nfeNum = Math.floor(1000 + Math.random() * 9000);
      order.invoiceNumber = `NF-00${nfeNum}`;
      order.invoiceKey = `352609${order.customerId.replace(/\D/g, '').padEnd(14, '0')}5500100000${nfeNum}1098765432`;
    }

    // 1. Débito automático de estoque na etapa de Separação
    if (next.stage === 'SEPARATION') {
      for (const item of order.items) {
        const prod = db.getProductBySku(item.sku) || db.getProductById(item.productId);
        if (prod) {
          try {
            db.updateStock(prod.id, -item.quantity, `Separação do Pedido ${order.orderNumber}`);
          } catch (err) {
            console.error('[Estoque] Falha ao dar baixa de item:', err);
          }
        }
      }
    }

    // 2. Disparo automático de WhatsApp de Despacho e Rastreio
    if (next.stage === 'CARRIER_DISPATCH' || order.status === 'SHIPPED') {
      const customer = db.getCustomerById(order.customerId);
      const phone = customer?.phone;
      if (phone && db.getAutoSettings().autoWhatsAppExpedition) {
        shippingService
          .getOrCreateShipment(order.id)
          .then((shipment) => {
            return whatsappProvider.sendTemplateMessage({
              toPhone: phone,
              templateName: 'notificacao_despacho_rastreio',
              orderId: order.id,
              parameters: {
                cliente: customer.name,
                pedido: order.orderNumber,
                nf: order.invoiceNumber || 'NF-e Autorizada',
                transportadora: shipment.carrierName,
                codigo_rastreio: shipment.trackingCode || 'TRK-EXPEDICAO',
                link_rastreio: `/trace/${shipment.trackingToken}`,
              },
            });
          })
          .catch((err) => console.error('[WhatsApp] Falha no disparo automático de expedição:', err));
      }
    }
  }

  db.upsertOrder(order);

  // Auditoria
  db.addAuditLog({
    id: `aud-${Date.now()}`,
    action: 'ORDER_STAGE_ADVANCED',
    origin: 'api.advance-stage',
    entity: 'Order',
    entityId: order.id,
    newValue: { status: order.status, stage: order.timeline[nextIndex]?.stageLabel },
    userOrService: responsible || 'Operador Web',
    correlationId: `corr-adv-${order.id}`,
    createdAt: nowIso,
  });

  res.json(order);
});

apiRouter.post('/orders/:id/validate-delivery', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  const { selectedVehicleType, schedulingScheduledAt } = req.body;
  const result = ruleEngine.validateDeliveryRules(order, {
    selectedVehicleType: selectedVehicleType as VehicleType,
    schedulingScheduledAt,
  });

  res.json(result);
});

// ==========================================
// 3. CLIENTES E MULTI-ENDEREÇOS
// ==========================================
apiRouter.get('/customers', (req: Request, res: Response) => {
  let list = db.getCustomers();
  const originFilter = req.query.origin as string;
  if (originFilter === 'site') {
    list = list.filter((c) => c.flindOrigin === 'FLIND_ECOMMERCE_WEB' || c.flindOrigin === 'TRAY' || Boolean(c.flindWebId));
  } else if (originFilter === 'direct') {
    list = list.filter((c) => c.flindOrigin === 'DIRETO_B2B' || c.flindOrigin === 'BALCAO' || (!c.flindWebId && c.flindOrigin !== 'FLIND_ECOMMERCE_WEB'));
  }
  res.json(list);
});

apiRouter.post('/customers/:id/toggle-site-origin', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  const currentlySite =
    customer.flindOrigin === 'FLIND_ECOMMERCE_WEB' ||
    customer.flindOrigin === 'TRAY' ||
    Boolean(customer.flindWebId);

  const updated: any = { ...customer, updatedAt: new Date().toISOString() };

  if (currentlySite) {
    // Muda para Cliente Direto da Fábrica (B2B / Offline)
    updated.flindOrigin = 'DIRETO_B2B';
    updated.flindWebId = undefined;
    updated.flindWebProfileUrl = undefined;
    updated.flindPortalSync = undefined;
    updated.notes = updated.notes || 'Cliente Direto da Fábrica (B2B / Sem Site) - Atendimento via Televendas, Representante ou Contrato Fabril.';
  } else {
    // Muda para Cliente do Site (www.flind.com.br)
    updated.flindOrigin = 'FLIND_ECOMMERCE_WEB';
    updated.flindWebId = `FW-${Math.floor(10000 + Math.random() * 90000)}`;
    updated.flindWebProfileUrl = 'https://www.flind.com.br/central-do-cliente';
    updated.flindPortalSync = {
      isRegisteredOnFlindWeb: true,
      lastSyncedAt: new Date().toISOString(),
      accountEmail: customer.email || 'compras@flind.com.br',
      totalFlindWebOrders: 1,
      flindTier: customer.segment?.includes('Hospitalar') ? 'OURO_HOSPITALAR' : 'PRATA_CLINICAS',
      customerProfileUrl: 'https://www.flind.com.br/central-do-cliente',
      catalogInterest: ['Descartáveis Hospitalares', 'Toalet Descartável'],
    };
  }

  db.upsertCustomer(updated);

  db.addAuditLog({
    id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    correlationId: `cor-cust-origin-${updated.id}-${Date.now().toString(36)}`,
    action: currentlySite ? 'CUSTOMER_DISCONNECTED_FROM_WEB' : 'CUSTOMER_LINKED_TO_WEB',
    origin: 'api.customers.toggle-origin',
    entity: 'Customer',
    entityId: updated.id,
    newValue: {
      flindOrigin: updated.flindOrigin,
      flindWebId: updated.flindWebId,
      isWebCustomer: !currentlySite,
    },
    userOrService: 'Operador Comercial',
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: currentlySite
      ? 'Cliente agora está classificado como Venda Direta / Fábrica (Não-Web).'
      : 'Cliente vinculado com sucesso ao portal www.flind.com.br (Cliente do Site).',
    customer: updated,
  });
});

apiRouter.get('/customers/flind-web-lookup', (req: Request, res: Response) => {
  const query = String(req.query.query || '').trim().toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'Parâmetro query (CNPJ, CPF ou e-mail) é obrigatório.' });
  }

  const cleanQ = query.replace(/\D/g, '');
  const existing = db.getCustomers().find(
    (c) =>
      (cleanQ.length > 5 && c.taxId.replace(/\D/g, '').includes(cleanQ)) ||
      (c.email && c.email.toLowerCase().includes(query))
  );

  if (existing) {
    return res.json({
      found: true,
      alreadyInLocalDb: true,
      message: 'Cliente já registrado na Fábrica Integrada!',
      customer: existing,
    });
  }

  const mockWebProfiles: any[] = [
    {
      matchKey: '09123456000188',
      name: 'Centro Hospitalar & Cirúrgico Santa Helena Ltda',
      tradeName: 'Hospital Santa Helena - CAF Insumos',
      taxId: '09.123.456/0001-88',
      segment: 'Hospitalar & Cirúrgico',
      stateRegistration: '112.890.456.110',
      email: 'compras.hospitalar@santahelena.med.br',
      phone: '+55 11 97755-4433',
      contactPerson: 'Dra. Fernanda Lemos (Coord. CAF)',
      address: {
        type: 'DELIVERY',
        street: 'Avenida Brigadeiro Luís Antônio',
        number: '2400',
        complement: 'Doca 2 - CAF Farmácia Central',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01402-000',
      },
      flindTier: 'OURO_HOSPITALAR',
      totalFlindWebOrders: 14,
    },
    {
      matchKey: '18492044000155',
      name: 'Clínica Dermatológica & Estética Harmonia Ltda',
      tradeName: 'Harmonia Estética & Laser',
      taxId: '18.492.044/0001-55',
      segment: 'Estética & Spas',
      stateRegistration: '144.321.908.765',
      email: 'suprimentos@harmoniaestetica.com.br',
      phone: '+55 19 98844-3322',
      contactPerson: 'Juliana Paes (Gerente de Compras)',
      address: {
        type: 'DELIVERY',
        street: 'Avenida José de Souza Campos',
        number: '1250',
        complement: 'Bloco B - Recepção de Suprimentos',
        neighborhood: 'Cambuí',
        city: 'Campinas',
        state: 'SP',
        zipCode: '13025-320',
      },
      flindTier: 'PRATA_CLINICAS',
      totalFlindWebOrders: 6,
    },
    {
      matchKey: '27889102000133',
      name: 'Studio & Barbershop Vintage Gold Eireli',
      tradeName: 'Vintage Gold Barbearia & Hair Club',
      taxId: '27.889.102/0001-33',
      segment: 'Salões & Barbearias',
      stateRegistration: 'Isento',
      email: 'contato@vintagebarbershop.com.br',
      phone: '+55 31 99122-8877',
      contactPerson: 'Marcos Vinícius (Sócio)',
      address: {
        type: 'DELIVERY',
        street: 'Rua Fernandes Tourinho',
        number: '480',
        complement: 'Loja 3 - Térreo',
        neighborhood: 'Savassi',
        city: 'Belo Horizonte',
        state: 'MG',
        zipCode: '30112-000',
      },
      flindTier: 'BRONZE_ESTETICA',
      totalFlindWebOrders: 4,
    },
  ];

  const matched = mockWebProfiles.find(
    (p) =>
      (cleanQ.length > 5 && p.matchKey.includes(cleanQ)) ||
      p.email.toLowerCase().includes(query) ||
      p.taxId.includes(query)
  );

  if (matched) {
    return res.json({
      found: true,
      alreadyInLocalDb: false,
      source: 'PORTAL_FLIND_WEB',
      flindWebId: `FW-${Math.floor(10000 + Math.random() * 90000)}`,
      customer: {
        ...matched,
        flindWebProfileUrl: 'https://www.flind.com.br/central-do-cliente',
        flindOrigin: 'FLIND_ECOMMERCE_WEB',
      },
    });
  }

  return res.json({
    found: false,
    message: 'Nenhum perfil direto localizado no portal www.flind.com.br para esta busca. Prossiga com o preenchimento.',
  });
});

apiRouter.get('/customers/:id', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }
  res.json(customer);
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  const {
    name,
    tradeName,
    taxId,
    segment,
    stateRegistration,
    email,
    phone,
    contactPerson,
    notes,
    flindOrigin,
    flindWebId,
    flindTier,
    linkFlindWeb,
    initialAddress,
    initialDeliveryRule,
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Razão Social ou Nome Completo é obrigatório.' });
  }
  if (!taxId || !taxId.trim()) {
    return res.status(400).json({ error: 'CPF ou CNPJ é obrigatório.' });
  }

  const cleanTax = taxId.replace(/\D/g, '');
  const existingCust = db.getCustomers().find((c) => c.taxId.replace(/\D/g, '') === cleanTax);
  if (existingCust) {
    return res.status(409).json({
      error: `Já existe um cliente cadastrado com este documento: ${existingCust.name} (${existingCust.taxId}).`,
      existingCustomerId: existingCust.id,
    });
  }

  const nowIso = new Date().toISOString();
  const customerId = `cust-${Date.now().toString(36)}`;
  const resolvedFlindWebId =
    flindWebId || `FW-${Math.floor(10000 + Math.random() * 90000)}`;
  const isLinkedToWeb = linkFlindWeb !== false;

  const customer: any = {
    id: customerId,
    externalId: `ERP-${customerId.toUpperCase()}`,
    name: name.trim(),
    tradeName: (tradeName || '').trim() || name.trim(),
    taxId: taxId.trim(),
    segment: segment || 'Hospitalar & Cirúrgico',
    stateRegistration: (stateRegistration || '').trim() || 'Isento',
    email: (email || '').trim(),
    phone: (phone || '').trim(),
    contactPerson: (contactPerson || '').trim(),
    notes: (notes || '').trim(),
    flindOrigin: flindOrigin || (isLinkedToWeb ? 'FLIND_ECOMMERCE_WEB' : 'DIRETO_B2B'),
    flindWebId: isLinkedToWeb ? resolvedFlindWebId : undefined,
    flindWebProfileUrl: isLinkedToWeb ? 'https://www.flind.com.br/central-do-cliente' : undefined,
    flindPortalSync: isLinkedToWeb
      ? {
          isRegisteredOnFlindWeb: true,
          lastSyncedAt: nowIso,
          accountEmail: email || 'compras@flind.com.br',
          totalFlindWebOrders: 0,
          flindTier: flindTier || (segment?.includes('Hospitalar') ? 'OURO_HOSPITALAR' : 'PRATA_CLINICAS'),
          customerProfileUrl: 'https://www.flind.com.br/central-do-cliente',
          catalogInterest: [segment || 'Descartáveis Hospitalares & Toalet'],
        }
      : undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.upsertCustomer(customer);

  // Cadastrar endereço inicial caso fornecido
  if (initialAddress && initialAddress.street) {
    const addressId = `addr-${customerId}-1`;
    const createdAddress = {
      id: addressId,
      customerId,
      type: initialAddress.type || 'FISCAL',
      street: initialAddress.street.trim(),
      number: initialAddress.number ? String(initialAddress.number).trim() : 'S/N',
      complement: (initialAddress.complement || '').trim(),
      neighborhood: (initialAddress.neighborhood || '').trim(),
      city: (initialAddress.city || '').trim(),
      state: (initialAddress.state || 'SP').trim().toUpperCase(),
      zipCode: (initialAddress.zipCode || '').trim(),
      country: 'Brasil',
      isDefault: true,
      createdAt: nowIso,
    };
    db.upsertAddress(createdAddress);

    if (createdAddress.type === 'DELIVERY') {
      const defaultRule: any = {
        id: `delrule-${customerId}-1`,
        addressId: createdAddress.id,
        customerId,
        allowedTimeStart: initialDeliveryRule?.allowedTimeStart || '08:00',
        allowedTimeEnd: initialDeliveryRule?.allowedTimeEnd || '17:00',
        allowedWeekdays: initialDeliveryRule?.allowedWeekdays || [1, 2, 3, 4, 5],
        requiresScheduling: Boolean(initialDeliveryRule?.requiresScheduling),
        maxWeightKg: Number(initialDeliveryRule?.maxWeightKg) || 10000,
        vehicleTypeAllowed: initialDeliveryRule?.vehicleTypeAllowed || 'TRUCK',
        entryGate: initialDeliveryRule?.entryGate || 'Doca Principal de Recebimento',
        contactName: initialDeliveryRule?.contactName || contactPerson || name,
        contactPhone: initialDeliveryRule?.contactPhone || phone || '',
        requiresDocumentation: initialDeliveryRule?.requiresDocumentation !== false,
        notes: initialDeliveryRule?.notes || 'Horário padrão de recebimento da fábrica.',
        active: true,
      };
      db.upsertDeliveryRule(defaultRule);
    }
  }

  try {
    db.addAuditLog({
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'CUSTOMER_REGISTERED',
      origin: 'api.customers.create',
      entity: 'Customer',
      entityId: customer.id,
      newValue: {
        name: customer.name,
        taxId: customer.taxId,
        segment: customer.segment,
        flindOrigin: customer.flindOrigin,
        flindWebId: customer.flindWebId,
        linkedWeb: isLinkedToWeb,
      },
      userOrService: 'Operador Comercial / Flind Web',
      correlationId: `cust-reg-${customer.id}`,
      createdAt: nowIso,
    });
  } catch {}

  const fullCustomer = db.getCustomerById(customerId);
  res.status(201).json(fullCustomer);
});

apiRouter.put('/customers/:id', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  const {
    name,
    tradeName,
    taxId,
    segment,
    stateRegistration,
    email,
    phone,
    contactPerson,
    notes,
    flindOrigin,
    flindWebId,
    flindTier,
    linkFlindWeb,
  } = req.body;

  const willBeSite =
    linkFlindWeb === true ||
    flindOrigin === 'FLIND_ECOMMERCE_WEB' ||
    flindOrigin === 'TRAY' ||
    (linkFlindWeb === undefined &&
      flindOrigin !== 'DIRETO_B2B' &&
      flindOrigin !== 'BALCAO' &&
      flindOrigin !== 'SINK_ERP' &&
      (Boolean(flindWebId) || customer.flindOrigin === 'FLIND_ECOMMERCE_WEB' || customer.flindOrigin === 'TRAY'));

  const finalOrigin = willBeSite
    ? (flindOrigin || (customer.flindOrigin === 'TRAY' ? 'TRAY' : 'FLIND_ECOMMERCE_WEB'))
    : (flindOrigin || 'DIRETO_B2B');

  const updated: any = {
    ...customer,
    name: name !== undefined ? name.trim() : customer.name,
    tradeName: tradeName !== undefined ? tradeName.trim() : customer.tradeName,
    taxId: taxId !== undefined ? taxId.trim() : customer.taxId,
    segment: segment !== undefined ? segment : customer.segment,
    stateRegistration: stateRegistration !== undefined ? stateRegistration : customer.stateRegistration,
    email: email !== undefined ? email.trim() : customer.email,
    phone: phone !== undefined ? phone.trim() : customer.phone,
    contactPerson: contactPerson !== undefined ? contactPerson.trim() : customer.contactPerson,
    notes: notes !== undefined ? notes.trim() : customer.notes,
    flindOrigin: finalOrigin,
    flindWebId: willBeSite
      ? (flindWebId !== undefined ? flindWebId : customer.flindWebId || `FW-${Math.floor(10000 + Math.random() * 90000)}`)
      : undefined,
    flindWebProfileUrl: willBeSite ? 'https://www.flind.com.br/central-do-cliente' : undefined,
    flindPortalSync: willBeSite
      ? {
          ...(customer.flindPortalSync || {}),
          isRegisteredOnFlindWeb: true,
          lastSyncedAt: new Date().toISOString(),
          accountEmail: email || customer.email || 'compras@flind.com.br',
          totalFlindWebOrders: customer.flindPortalSync?.totalFlindWebOrders || 1,
          flindTier: flindTier || customer.flindPortalSync?.flindTier || 'OURO_HOSPITALAR',
          customerProfileUrl: 'https://www.flind.com.br/central-do-cliente',
          catalogInterest: customer.flindPortalSync?.catalogInterest || ['Descartáveis Hospitalares'],
        }
      : undefined,
    updatedAt: new Date().toISOString(),
  };

  db.upsertCustomer(updated);

  try {
    db.addAuditLog({
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'CUSTOMER_UPDATED',
      origin: 'api.customers.update',
      entity: 'Customer',
      entityId: updated.id,
      newValue: {
        name: updated.name,
        taxId: updated.taxId,
        segment: updated.segment,
      },
      userOrService: 'Operador Comercial',
      correlationId: `cust-upd-${updated.id}`,
      createdAt: new Date().toISOString(),
    });
  } catch {}

  res.json(db.getCustomerById(req.params.id));
});

apiRouter.delete('/customers/:id', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  const orders = db.getOrders().filter((o) => o.customerId === req.params.id);
  if (orders.length > 0) {
    return res.status(400).json({
      error: `Não é possível excluir o cliente pois existem ${orders.length} pedido(s) associados a ele.`,
    });
  }

  db.deleteCustomer(req.params.id);
  res.json({ success: true, message: 'Cliente removido com sucesso.' });
});

// Sincronização em tempo real com o portal www.flind.com.br
apiRouter.post('/customers/:id/sync-flind-web', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  const nowIso = new Date().toISOString();
  const customerOrders = db.getOrders().filter((o) => o.customerId === customer.id);
  const webOrdersCount = customerOrders.filter((o) => o.source === 'TRAY' || o.source === 'MANUAL').length || 1;

  const updatedPortalSync: any = {
    isRegisteredOnFlindWeb: true,
    lastSyncedAt: nowIso,
    accountEmail: customer.email || 'compras@flind.com.br',
    totalFlindWebOrders: webOrdersCount,
    flindTier: customer.segment?.includes('Hospitalar')
      ? 'OURO_HOSPITALAR'
      : customer.segment?.includes('Estética')
      ? 'PRATA_CLINICAS'
      : 'BRONZE_ESTETICA',
    customerProfileUrl: 'https://www.flind.com.br/central-do-cliente',
    catalogInterest: [
      customer.segment || 'Descartáveis Hospitalares',
      'Toalete Descartável Flind',
      'Lençóis TNT Cirúrgicos e Macas',
    ],
  };

  const updatedCustomer = {
    ...customer,
    flindOrigin: customer.flindOrigin || 'FLIND_ECOMMERCE_WEB',
    flindWebId: customer.flindWebId || `FW-${Math.floor(10000 + Math.random() * 90000)}`,
    flindWebProfileUrl: 'https://www.flind.com.br/central-do-cliente',
    flindPortalSync: updatedPortalSync,
    updatedAt: nowIso,
  };

  db.upsertCustomer(updatedCustomer);

  try {
    db.addAuditLog({
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'CUSTOMER_SYNCED_FLIND_WEB',
      origin: 'api.customers.syncFlindWeb',
      entity: 'Customer',
      entityId: customer.id,
      newValue: {
        lastSyncedAt: nowIso,
        webOrdersCount,
        portalUrl: 'https://www.flind.com.br/central-do-cliente',
      },
      userOrService: 'Sincronizador www.flind.com.br',
      correlationId: `sync-flind-${customer.id}`,
      createdAt: nowIso,
    });
  } catch {}

  res.json({
    success: true,
    message: 'Dados sincronizados com o portal www.flind.com.br com sucesso!',
    customer: db.getCustomerById(req.params.id),
  });
});

apiRouter.post('/customers/:id/addresses', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  const { type, street, number, complement, neighborhood, city, state, zipCode, isDefault, deliveryRule } = req.body;
  if (!street) {
    return res.status(400).json({ error: 'Logradouro / Rua é obrigatório.' });
  }

  const address = {
    id: `addr-${customer.id}-${Date.now().toString(36)}`,
    customerId: customer.id,
    type: type || 'DELIVERY',
    street: street.trim(),
    number: number ? String(number).trim() : 'S/N',
    complement: (complement || '').trim(),
    neighborhood: (neighborhood || '').trim(),
    city: (city || '').trim(),
    state: (state || 'SP').trim().toUpperCase(),
    zipCode: (zipCode || '').trim(),
    country: 'Brasil',
    isDefault: Boolean(isDefault),
    createdAt: new Date().toISOString(),
  };

  db.upsertAddress(address);

  if (address.type === 'DELIVERY') {
    const rule: any = {
      id: `delrule-${address.id}`,
      addressId: address.id,
      customerId: customer.id,
      allowedTimeStart: deliveryRule?.allowedTimeStart || '08:00',
      allowedTimeEnd: deliveryRule?.allowedTimeEnd || '17:00',
      allowedWeekdays: deliveryRule?.allowedWeekdays || [1, 2, 3, 4, 5],
      requiresScheduling: Boolean(deliveryRule?.requiresScheduling),
      maxWeightKg: Number(deliveryRule?.maxWeightKg) || 10000,
      vehicleTypeAllowed: deliveryRule?.vehicleTypeAllowed || 'TRUCK',
      entryGate: deliveryRule?.entryGate || 'Doca de Recebimento',
      contactName: deliveryRule?.contactName || customer.contactPerson || customer.name,
      contactPhone: deliveryRule?.contactPhone || customer.phone || '',
      requiresDocumentation: deliveryRule?.requiresDocumentation !== false,
      notes: deliveryRule?.notes || '',
      active: true,
    };
    db.upsertDeliveryRule(rule);
  }

  res.status(201).json(address);
});

apiRouter.delete('/customers/:id/addresses/:addressId', (req: Request, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  const address = db.getAddressById(req.params.addressId);
  if (!address || address.customerId !== customer.id) {
    return res.status(404).json({ error: 'Endereço não encontrado para este cliente.' });
  }

  db.deleteAddress(req.params.addressId);
  res.json({ success: true, message: 'Endereço removido com sucesso.' });
});

// ==========================================
// 4. REGRAS DE ENTREGA
// ==========================================
apiRouter.get('/delivery-rules', (req: Request, res: Response) => {
  res.json(db.getDeliveryRules());
});

apiRouter.post('/delivery-rules', (req: Request, res: Response) => {
  const {
    id,
    addressId,
    customerId,
    allowedTimeStart,
    allowedTimeEnd,
    allowedWeekdays,
    requiresScheduling,
    maxWeightKg,
    vehicleTypeAllowed,
    entryGate,
    contactName,
    contactPhone,
    requiresDocumentation,
    notes,
    active,
  } = req.body;

  const rule = {
    id: id || `delrule-${Date.now().toString(36)}`,
    addressId,
    customerId,
    allowedTimeStart: allowedTimeStart || '08:00',
    allowedTimeEnd: allowedTimeEnd || '17:00',
    allowedWeekdays: allowedWeekdays || [1, 2, 3, 4, 5],
    requiresScheduling: Boolean(requiresScheduling),
    maxWeightKg: Number(maxWeightKg) || 10000,
    vehicleTypeAllowed: (vehicleTypeAllowed || 'QUALQUER') as VehicleType,
    entryGate: entryGate || 'Portaria Principal',
    contactName: contactName || 'Recepção',
    contactPhone: contactPhone || '',
    requiresDocumentation: Boolean(requiresDocumentation),
    notes: notes || '',
    active: active !== undefined ? Boolean(active) : true,
  };

  db.upsertDeliveryRule(rule);
  res.json(rule);
});

// ==========================================
// 5. FINANCEIRO E CONTAS A RECEBER
// ==========================================
apiRouter.get('/receivables', (req: Request, res: Response) => {
  const { status, customerId } = req.query;
  let list = db.getReceivables();

  if (status && typeof status === 'string') {
    list = list.filter((r) => r.status === status);
  }
  if (customerId && typeof customerId === 'string') {
    list = list.filter((r) => r.customerId === customerId);
  }

  res.json(list);
});

apiRouter.post('/receivables/:id/pay', async (req: Request, res: Response) => {
  try {
    const { channel, transactionCode, paymentDate, notes, sendConfirmationWhatsApp } = req.body;
    const result = db.autoClearReceivablePayment({
      receivableId: req.params.id,
      channel: channel || 'MANUAL',
      transactionCode,
      paymentDate,
      notes,
      operatorOrService: 'Operador Financeiro / Baixa Caixa',
    });

    let confirmationWhatsAppSent = false;
    if (sendConfirmationWhatsApp !== false) {
      const customer = db.getCustomerById(result.receivable.customerId);
      if (customer && customer.phone) {
        try {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customer.phone,
            templateName: 'confirmacao_pagamento_recebido',
            parameters: {
              cliente: customer.name,
              numero: result.receivable.documentNumber,
              valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.receivable.amount),
              data: new Date().toLocaleDateString('pt-BR'),
              dados_pagamento: `Autenticação: ${result.clearingDetails.transactionCode} (${result.clearingDetails.clearingChannel})`,
            },
            receivableId: result.receivable.id,
            orderId: result.receivable.orderId,
          });
          confirmationWhatsAppSent = true;
        } catch (e) {
          console.warn('Falha no envio de confirmação WhatsApp:', e);
        }
      }
    }

    res.json({
      ...result,
      confirmationWhatsAppSent,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao realizar baixa do título.' });
  }
});

// Reconhecimento de Pagamento com Baixa Automática (PIX, TED, Cartão, Retorno CNAB, ERP)
apiRouter.post('/financial/recognize-payment', async (req: Request, res: Response) => {
  try {
    const {
      receivableId,
      documentNumber,
      orderId,
      pixCode,
      amount,
      channel,
      transactionCode,
      paymentDate,
      payerName,
      payerTaxId,
      notes,
      sendConfirmationWhatsApp,
    } = req.body;

    const result = db.autoClearReceivablePayment({
      receivableId,
      documentNumber,
      orderId,
      pixCode,
      amount: amount ? Number(amount) : undefined,
      channel: channel || 'PIX_AUTOMATICO',
      transactionCode,
      paymentDate,
      payerName,
      payerTaxId,
      notes,
      operatorOrService: `Motor de Reconhecimento Automático (${channel || 'PIX'})`,
    });

    let confirmationWhatsAppSent = false;
    if (sendConfirmationWhatsApp !== false) {
      const customer = db.getCustomerById(result.receivable.customerId);
      if (customer && customer.phone) {
        try {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customer.phone,
            templateName: 'confirmacao_pagamento_recebido',
            parameters: {
              cliente: customer.name,
              numero: result.receivable.documentNumber,
              valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.receivable.amount),
              data: new Date().toLocaleDateString('pt-BR'),
              dados_pagamento: `Autenticação: ${result.clearingDetails.transactionCode} (${result.clearingDetails.clearingChannel})`,
            },
            receivableId: result.receivable.id,
            orderId: result.receivable.orderId,
          });
          confirmationWhatsAppSent = true;
        } catch (e) {
          console.warn('Falha no envio de confirmação WhatsApp:', e);
        }
      }
    }

    res.json({
      ...result,
      confirmationWhatsAppSent,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao reconhecer e baixar pagamento.' });
  }
});

// Simulação / Teste Rápido 1-Clique de Baixa Pix Instantânea
apiRouter.post('/financial/simulate-pix/:id', async (req: Request, res: Response) => {
  try {
    const rec = db.getReceivableById(req.params.id);
    if (!rec) {
      return res.status(404).json({ error: 'Título não encontrado.' });
    }

    const fakeE2eId = `E00416968${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const result = db.autoClearReceivablePayment({
      receivableId: rec.id,
      channel: 'PIX_AUTOMATICO',
      transactionCode: fakeE2eId,
      payerName: rec.customerName || 'Cliente Flind Hospitalar',
      notes: `Reconhecimento instantâneo Pix via Gateway PSP Bancário (Simulação Homologada). EndToEndId: ${fakeE2eId}`,
      operatorOrService: 'Webhook Pix PSP Banco Central',
    });

    let confirmationWhatsAppSent = false;
    const customer = db.getCustomerById(rec.customerId);
    if (customer && customer.phone) {
      try {
        await whatsappProvider.sendTemplateMessage({
          toPhone: customer.phone,
          templateName: 'confirmacao_pagamento_recebido',
          parameters: {
            cliente: customer.name,
            numero: rec.documentNumber,
            valor: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rec.amount),
            data: new Date().toLocaleDateString('pt-BR'),
            dados_pagamento: `Pix EndToEndId: ${fakeE2eId}`,
          },
          receivableId: rec.id,
          orderId: rec.orderId,
        });
        confirmationWhatsAppSent = true;
      } catch (e) {
        console.warn('Erro ao disparar recibo WhatsApp:', e);
      }
    }

    res.json({
      ...result,
      confirmationWhatsAppSent,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Webhook Real / Homologado de Pix do PSP / Banco
apiRouter.post('/financial/webhook/pix', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const txid = body.txid || body.pix?.[0]?.txid || body.id;
    const endToEndId = body.endToEndId || body.pix?.[0]?.endToEndId || `E2E-${Date.now()}`;
    const valor = body.valor || body.pix?.[0]?.valor || body.amount;
    const documentNumber = body.documentNumber || body.solicitacaoPagador || body.infoAdicional;
    const orderId = body.orderId || body.external_reference;

    let targetRec = db.getReceivables().find((r) => 
      (txid && (r.transactionCode === txid || r.pixCode?.includes(txid))) ||
      (documentNumber && r.documentNumber.toLowerCase() === String(documentNumber).toLowerCase()) ||
      (orderId && r.orderId === orderId)
    );

    if (!targetRec && valor) {
      targetRec = db.getReceivables().find((r) => r.status !== 'PAID' && Math.abs(r.amount - Number(valor)) < 0.05);
    }

    if (!targetRec) {
      const firstOpen = db.getReceivables().find((r) => r.status !== 'PAID');
      if (firstOpen) targetRec = firstOpen;
    }

    if (!targetRec) {
      return res.status(200).json({ received: true, cleared: false, message: 'Nenhum título pendente localizado para este Pix.' });
    }

    const result = db.autoClearReceivablePayment({
      receivableId: targetRec.id,
      channel: 'PIX_AUTOMATICO',
      transactionCode: endToEndId,
      amount: valor ? Number(valor) : targetRec.amount,
      payerName: body.pagador?.nome || body.payer?.name,
      payerTaxId: body.pagador?.cpf || body.pagador?.cnpj,
      notes: `Baixa Automática disparada por Webhook Pix do PSP (${endToEndId})`,
      operatorOrService: 'Webhook Pix Instantâneo PSP',
    });

    res.status(200).json({
      received: true,
      cleared: true,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Processamento de Retorno Bancário CNAB 240/400 (Conciliação em Lote)
apiRouter.post('/financial/batch-cnab-return', (req: Request, res: Response) => {
  try {
    const { fileType, selectedReceivableIds } = req.body;
    let clearedCount = 0;
    const clearedList: any[] = [];

    const targetIds: string[] = Array.isArray(selectedReceivableIds) && selectedReceivableIds.length > 0
      ? selectedReceivableIds
      : db.getReceivables().filter((r) => r.status === 'OVERDUE' || r.status === 'OPEN').slice(0, 3).map((r) => r.id);

    for (const recId of targetIds) {
      try {
        const cnabProtocol = `RET-CNAB240-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
        const clearing = db.autoClearReceivablePayment({
          receivableId: recId,
          channel: 'RETORNO_BANCARIO_CNAB',
          transactionCode: cnabProtocol,
          notes: `Baixa Automática por Arquivo de Retorno Bancário (${fileType || 'CNAB 240'}). Ocorrência 06 - Liquidação Normal.`,
          operatorOrService: 'Módulo de Conciliação Bancária CNAB',
        });
        clearedCount++;
        clearedList.push(clearing);
      } catch (e) {
        // Continua próximo
      }
    }

    res.json({
      success: true,
      message: `Arquivo de retorno processado com sucesso. ${clearedCount} título(s) baixado(s) automaticamente no Contas a Receber e Pedidos!`,
      clearedCount,
      clearedList,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/receivables/trigger-collection', async (req: Request, res: Response) => {
  try {
    const result = await ruleEngine.executeCollectionAutomation();
    res.json({
      success: true,
      message: 'Motor de automação de cobrança executado com sucesso.',
      stats: result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. REGRAS DE COBRANÇA
// ==========================================
apiRouter.get('/collection-rules', (req: Request, res: Response) => {
  res.json(db.getCollectionRules());
});

apiRouter.put('/collection-rules/:id', (req: Request, res: Response) => {
  const existing = db.getCollectionRules().find((r) => r.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Regra de cobrança não encontrada.' });
  }

  const updated = {
    ...existing,
    ...req.body,
  };
  db.upsertCollectionRule(updated);
  res.json(updated);
});

// ==========================================
// 7. ALERTAS E MOTOR DE SLA
// ==========================================
apiRouter.get('/alerts', (req: Request, res: Response) => {
  res.json(db.getAlerts());
});

apiRouter.post('/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const { responsible } = req.body;
  const updated = db.updateAlertStatus(req.params.id, 'ACKNOWLEDGED', responsible || 'Operador');
  if (!updated) {
    return res.status(404).json({ error: 'Alerta não encontrado.' });
  }
  res.json(updated);
});

apiRouter.post('/alerts/:id/resolve', (req: Request, res: Response) => {
  const { responsible } = req.body;
  const updated = db.updateAlertStatus(req.params.id, 'RESOLVED', responsible || 'Operador');
  if (!updated) {
    return res.status(404).json({ error: 'Alerta não encontrado.' });
  }
  res.json(updated);
});

apiRouter.get('/sla-rules', (req: Request, res: Response) => {
  res.json(db.getSlaRules());
});

apiRouter.put('/sla-rules/:id', (req: Request, res: Response) => {
  const existing = db.getSlaRules().find((r) => r.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Regra de SLA não encontrada.' });
  }

  const updated = {
    ...existing,
    ...req.body,
  };
  db.upsertSlaRule(updated);
  res.json(updated);
});

apiRouter.post('/sla-rules/run-check', (req: Request, res: Response) => {
  const generatedAlerts = ruleEngine.evaluateOrderSlas();
  res.json({
    success: true,
    alertsGeneratedCount: generatedAlerts.length,
    alerts: generatedAlerts,
  });
});

// ==========================================
// 8. EXPEDIÇÃO, ETIQUETAGEM E RASTREABILIDADE
// ==========================================
apiRouter.get('/shipments', (req: Request, res: Response) => {
  res.json(db.getShipments());
});

apiRouter.get('/shipments/:orderId/label', async (req: Request, res: Response) => {
  try {
    const labelData = await shippingService.generateShippingLabel(req.params.orderId);
    res.json(labelData);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

apiRouter.post('/shipments/:orderId', async (req: Request, res: Response) => {
  try {
    const { carrierName, volumesCount, selectedVehicleType, notes } = req.body;
    const shipment = await shippingService.getOrCreateShipment(req.params.orderId, {
      carrierName,
      volumesCount: Number(volumesCount) || 1,
      selectedVehicleType: selectedVehicleType as VehicleType,
      notes,
    });
    res.json(shipment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Rota pública de Rastreabilidade /trace/:token
apiRouter.get('/trace/:token', (req: Request, res: Response) => {
  const trace = shippingService.getTraceabilityByToken(req.params.token);
  if (!trace) {
    return res.status(404).json({ error: 'Rastreabilidade não localizada para o token fornecido.' });
  }
  res.json(trace);
});

// ==========================================
// 9. INTEGRAÇÕES: TRAY E-COMMERCE
// ==========================================
apiRouter.post('/integrations/tray/webhook', async (req: Request, res: Response) => {
  const correlationId = `corr-tray-${Date.now()}`;
  try {
    const payload: TrayWebhookPayload = req.body;
    if (!payload || !payload.order_id) {
      return res.status(400).json({ error: 'Payload de webhook inválido. order_id obrigatório.' });
    }

    const result = await trayAdapter.handleWebhook(payload, correlationId);
    res.json(result);
  } catch (err: any) {
    console.error('[API] Erro no webhook da Tray:', err);
    res.status(500).json({ error: err.message, correlationId });
  }
});

apiRouter.post('/integrations/tray/simulate-order', async (req: Request, res: Response) => {
  const correlationId = `corr-sim-tray-${Date.now()}`;
  const randomOrderNum = Math.floor(10000 + Math.random() * 90000);
  const fakePayload: TrayWebhookPayload = {
    event: 'order.created',
    scope_id: '9841',
    act: 'order_create',
    order_id: randomOrderNum,
  };

  try {
    const result = await trayAdapter.handleWebhook(fakePayload, correlationId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. INTEGRAÇÕES: SINK ERP
// ==========================================
apiRouter.get('/integrations/sink-erp/health', async (req: Request, res: Response) => {
  const health = await sinkERPProvider.checkHealth();
  res.json(health);
});

apiRouter.post('/integrations/sink-erp/sync-order/:id', async (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  try {
    const result = await sinkERPProvider.createOrder(order);

    // Atualizar timeline do pedido para ERP_INTEGRATED
    const erpEvent = order.timeline.find((t) => t.stage === 'ERP_INTEGRATED');
    if (erpEvent) {
      erpEvent.status = 'COMPLETED';
      erpEvent.completedAt = new Date().toISOString();
      erpEvent.notes = `Protocolo SINK ERP: ${result.erpProtocol}`;
      order.status = 'INTEGRATED_ERP';
      db.upsertOrder(order);
    }

    db.addAuditLog({
      id: `aud-${Date.now()}`,
      action: 'ORDER_SYNCED_SINK_ERP',
      origin: 'api.syncSinkOrder',
      entity: 'Order',
      entityId: order.id,
      newValue: result,
      userOrService: 'SINK Integration Handler',
      correlationId: `corr-sink-${result.erpProtocol}`,
      createdAt: new Date().toISOString(),
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/integrations/sink-erp/production', async (req: Request, res: Response) => {
  const orders = await sinkERPProvider.syncProductionOrders();
  res.json(orders);
});

apiRouter.get('/integrations/sink-erp/costs', async (req: Request, res: Response) => {
  const costs = await sinkERPProvider.syncProductionCosts();
  res.json(costs);
});

// ==========================================
// 11. INTEGRAÇÕES: WHATSAPP BUSINESS
// ==========================================
apiRouter.get('/integrations/whatsapp/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  const validChallenge = whatsappProvider.verifyWebhookChallenge(mode, token, challenge);
  if (validChallenge) {
    return res.status(200).send(validChallenge);
  }
  return res.status(403).send('Forbidden');
});

apiRouter.post('/integrations/whatsapp/webhook', async (req: Request, res: Response) => {
  const updates = await whatsappProvider.handleWebhookStatus(req.body);
  res.status(200).json({ received: true, updatesCount: updates.length });
});

apiRouter.get('/integrations/whatsapp/config', (req: Request, res: Response) => {
  res.json(whatsappProvider.getConfig());
});

apiRouter.post('/integrations/whatsapp/config', (req: Request, res: Response) => {
  const { apiUrl, accessToken, phoneNumberId, webhookVerifyToken } = req.body;
  const updated = whatsappProvider.updateConfig({
    apiUrl,
    accessToken,
    phoneNumberId,
    webhookVerifyToken,
  });
  res.json({ success: true, config: updated });
});

apiRouter.post('/integrations/whatsapp/send-test', async (req: Request, res: Response) => {
  const { toPhone, templateName, customerName, documentNumber, amount, dueDate, paymentData } = req.body;
  const result = await whatsappProvider.sendTemplateMessage({
    toPhone: toPhone || '+55 11 98888-7777',
    templateName: templateName || 'lembrete_fatura_vencimento',
    mode: 'sandbox',
    parameters: {
      cliente: customerName || 'Hospital São Camilo - CAF',
      numero: documentNumber || 'DUP-4821-01',
      valor: amount || 'R$ 18.450,00',
      data: dueDate || new Date().toLocaleDateString('pt-BR'),
      dados_pagamento: paymentData || 'Chave PIX: financeiro@flind.com.br',
    },
  });

  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

apiRouter.post('/integrations/whatsapp/register-direct-send', (req: Request, res: Response) => {
  const { toPhone, customerName, templateName, parameters, receivableId, orderId } = req.body;
  const log = whatsappProvider.registerDirectSend({
    toPhone: toPhone || '+55 11 98888-7777',
    customerName: customerName || 'Cliente Flind',
    templateName: templateName || 'lembrete_fatura_vencimento',
    parameters: parameters || {},
    receivableId,
    orderId,
  });
  res.json({ success: true, log });
});

apiRouter.get('/integrations/whatsapp/logs', (req: Request, res: Response) => {
  res.json(db.getWhatsAppLogs());
});

apiRouter.get('/integrations/sync-logs', (req: Request, res: Response) => {
  res.json(db.getIntegrationLogs());
});

// ==========================================
// 12. AUDITORIA E EVENTOS DE RASTREIO
// ==========================================
apiRouter.get('/audit', (req: Request, res: Response) => {
  const { correlationId, entityId } = req.query;
  const logs = db.getAuditLogs(
    typeof correlationId === 'string' ? correlationId : undefined,
    typeof entityId === 'string' ? entityId : undefined
  );
  res.json(logs);
});

// ==========================================
// 13. ESTOQUE, PRODUTOS, EMBALAGENS E VOLUMES
// ==========================================
apiRouter.get('/inventory', (req: Request, res: Response) => {
  const products = db.getProducts();
  const lowStock = products.filter((p) => p.status === 'LOW' || p.status === 'CRITICAL' || p.status === 'OUT_OF_STOCK');
  res.json({
    products,
    totalProducts: products.length,
    lowStockCount: lowStock.length,
    totalPackages: products.reduce((acc, p) => acc + (p.currentStockPackages || 0), 0),
    totalUnits: products.reduce((acc, p) => acc + (p.currentStockUnits || 0), 0),
  });
});

apiRouter.post('/inventory', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name || !data.sku) {
    return res.status(400).json({ error: 'Nome e SKU do produto são obrigatórios.' });
  }

  const existing = data.id ? db.getProductById(data.id) : undefined;
  const product: ProductInventory = {
    id: data.id || `prod-${Date.now()}`,
    sku: data.sku,
    name: data.name,
    category: data.category || 'Hospitalar & Cirúrgico',
    packagingUnit: data.packagingUnit || 'Caixa (CX)',
    unitsPerPackage: Number(data.unitsPerPackage) || 1,
    unitWeightKg: Number(data.unitWeightKg) || 0.1,
    weightPerPackageKg: Number(data.weightPerPackageKg) || (Number(data.unitWeightKg) || 0.1) * (Number(data.unitsPerPackage) || 1),
    manufactureDate: data.manufactureDate || new Date().toISOString().split('T')[0],
    expiryDate: data.expiryDate || new Date(Date.now() + 365 * 86400000 * 3).toISOString().split('T')[0],
    shelfLifeMonths: Number(data.shelfLifeMonths) || 36,
    lotNumber: data.lotNumber || `LOTE-FLIND-${new Date().getFullYear()}-01`,
    currentStockPackages: Number(data.currentStockPackages) || 0,
    currentStockUnits: (Number(data.currentStockPackages) || 0) * (Number(data.unitsPerPackage) || 1),
    minStockPackages: Number(data.minStockPackages) || 20,
    minStockUnits: (Number(data.minStockPackages) || 20) * (Number(data.unitsPerPackage) || 1),
    reorderQuantityPackages: Number(data.reorderQuantityPackages) || 50,
    supplierId: data.supplierId || 'supp-1',
    supplierName: data.supplierName || 'Fornecedor Homologado',
    supplierPhone: data.supplierPhone || '+55 11 99999-9999',
    costPrice: Number(data.costPrice) || 0,
    salePrice: Number(data.salePrice) || 0,
    location: data.location || 'Galpão 1',
    status: 'NORMAL',
    autoReorderEnabled: data.autoReorderEnabled !== false,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = db.upsertProduct(product);
  res.json(saved);
});

apiRouter.delete('/inventory/:id', (req: Request, res: Response) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }
  res.json({ success: true, message: 'Produto excluído do estoque com sucesso.' });
});

apiRouter.post('/inventory/:id/movement', (req: Request, res: Response) => {
  const { deltaPackages, reason } = req.body;
  if (typeof deltaPackages !== 'number') {
    return res.status(400).json({ error: 'deltaPackages deve ser um número inteiro (positivo para entrada, negativo para saída).' });
  }

  try {
    const result = db.updateStock(req.params.id, deltaPackages, reason || 'Ajuste manual de estoque');
    res.json({
      success: true,
      product: result.product,
      autoOrderTriggered: result.autoOrderTriggered,
      message: result.autoOrderTriggered
        ? `Estoque atualizado para ${result.product.currentStockPackages} volumes. ATENÇÃO: Nível crítico atingido! Ordem de reposição ${result.autoOrderTriggered.orderNumber} disparada automaticamente para o fornecedor via WhatsApp!`
        : `Estoque atualizado com sucesso (${deltaPackages > 0 ? '+' : ''}${deltaPackages} volumes).`,
    });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

apiRouter.post('/inventory/scan-reorder', (req: Request, res: Response) => {
  const triggered = db.scanAllLowStockAndTrigger();
  res.json({
    success: true,
    triggeredCount: triggered.length,
    orders: triggered,
    message: triggered.length > 0
      ? `Varredura de estoque concluída: ${triggered.length} ordens de ressuprimento geradas com disparos automáticos de WhatsApp aos fornecedores!`
      : 'Varredura concluída: Todos os produtos estão com níveis de estoque saudáveis.',
  });
});

// Download da Planilha Modelo Oficial XLSX
apiRouter.get('/inventory/template-xlsx', (req: Request, res: Response) => {
  try {
    const wb = generateInventoryTemplateWorkbook();
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="modelo_estoque_volumes_flind.xlsx"');
    res.send(buffer);
  } catch (err: any) {
    console.error('Erro ao gerar template XLSX:', err);
    res.status(500).json({ error: `Erro ao gerar modelo XLSX: ${err.message}` });
  }
});

// Exportação completa do estoque atual em XLSX
apiRouter.get('/inventory/export-xlsx', (req: Request, res: Response) => {
  try {
    const products = db.getProducts();
    const rows = products.map((p) => ({
      'SKU / Código': p.sku,
      'Nome do Produto': p.name,
      'Categoria': p.category,
      'Tipo de Volume (Embalagem)': p.packagingUnit,
      'Unidades por Volume': p.unitsPerPackage,
      'Estoque Atual (Volumes)': p.currentStockPackages,
      'Estoque Atual (Unidades)': p.currentStockUnits,
      'Estoque Mínimo (Volumes)': p.minStockPackages,
      'Estoque Mínimo (Unidades)': p.minStockUnits,
      'Status': p.status === 'NORMAL' ? 'Normal' : p.status === 'LOW' ? 'Baixo' : p.status === 'CRITICAL' ? 'Crítico' : 'Esgotado',
      'Peso Unitário (kg)': p.unitWeightKg,
      'Peso por Volume (kg)': p.weightPerPackageKg,
      'Preço de Custo (R$)': p.costPrice,
      'Preço de Venda (R$)': p.salePrice,
      'Lote': p.lotNumber,
      'Data de Fabricação': p.manufactureDate,
      'Data de Validade': p.expiryDate,
      'Localização Almoxarifado': p.location,
      'Fornecedor': p.supplierName,
      'EAN / Código de Barras': p.barcode || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Estoque Flind Atual');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="estoque_flind_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('Erro ao exportar estoque XLSX:', err);
    res.status(500).json({ error: `Erro ao exportar estoque XLSX: ${err.message}` });
  }
});

// Prévia de leitura de arquivo XLSX (sem salvar no banco)
apiRouter.post('/inventory/preview-xlsx', (req: Request, res: Response) => {
  try {
    const { base64, rows, fileName } = req.body || {};

    let parsedRows: any[] = [];
    let sheetName = 'Planilha';
    let detectedColumns: Record<string, string> = {};
    let errors: string[] = [];

    if (Array.isArray(rows) && rows.length > 0) {
      parsedRows = rows;
    } else if (base64) {
      // Limpa prefixo de data URI caso enviado e remove quebras de linha / espaços
      const cleanBase64 = String(base64)
        .replace(/^data:[^;]+;base64,/, '')
        .replace(/\s+/g, '');

      const buffer = Buffer.from(cleanBase64, 'base64');
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: 'Arquivo recebido está corrompido ou vazio.' });
      }

      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
      const parseResult = parseExcelWorkbook(workbook);
      sheetName = parseResult.sheetName;
      detectedColumns = parseResult.detectedColumns;
      errors = parseResult.errors;

      if (!parseResult.success || parseResult.rows.length === 0) {
        return res.status(400).json({
          error: parseResult.errors[0] || 'Nenhum produto válido foi identificado na planilha.',
          details: parseResult.errors,
        });
      }
      parsedRows = parseResult.rows;
    } else {
      return res.status(400).json({ error: 'Nenhum dado ou arquivo recebido para leitura.' });
    }

    // Cruza com itens atuais do banco para gerar relatório prévio de atualização vs criação
    const currentProducts = db.getProducts();
    const previewComparison = parsedRows.map((row) => {
      const match = currentProducts.find(
        (p) =>
          p.sku.toLowerCase() === String(row.sku || '').toLowerCase() ||
          (row.name && p.name.toLowerCase() === String(row.name || '').toLowerCase())
      );
      return {
        ...row,
        action: match ? 'UPDATE' : 'CREATE',
        existingProduct: match
          ? {
              id: match.id,
              name: match.name,
              currentStockPackages: match.currentStockPackages,
              currentStockUnits: match.currentStockUnits,
              packagingUnit: match.packagingUnit,
              unitsPerPackage: match.unitsPerPackage,
              status: match.status,
            }
          : undefined,
      };
    });

    const willUpdateCount = previewComparison.filter((p) => p.action === 'UPDATE').length;
    const willCreateCount = previewComparison.filter((p) => p.action === 'CREATE').length;
    const validRowsCount = previewComparison.filter((p) => p.isValid !== false).length;
    const invalidRowsCount = previewComparison.filter((p) => p.isValid === false).length;

    res.json({
      success: true,
      fileName: fileName || 'planilha.xlsx',
      sheetName,
      totalRows: previewComparison.length,
      validRowsCount,
      invalidRowsCount,
      detectedColumns,
      errors,
      rows: previewComparison,
      willUpdateCount,
      willCreateCount,
    });
  } catch (err: any) {
    console.error('Erro ao processar prévia XLSX:', err);
    res.status(400).json({
      error: `Falha ao interpretar arquivo XLSX: ${err.message || 'Formato não reconhecido'}`,
    });
  }
});

// Importação e gravação definitiva de estoque e volumes via XLSX
apiRouter.post('/inventory/import-xlsx', (req: Request, res: Response) => {
  try {
    const { base64, rows, mode, triggerAutoReorder, fileName } = req.body || {};

    let itemsToImport: InventoryImportRow[] = [];

    if (Array.isArray(rows) && rows.length > 0) {
      itemsToImport = rows;
    } else if (base64) {
      const cleanBase64 = String(base64)
        .replace(/^data:[^;]+;base64,/, '')
        .replace(/\s+/g, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
      const parseResult = parseExcelWorkbook(workbook);

      if (!parseResult.success || parseResult.rows.length === 0) {
        return res.status(400).json({
          error: parseResult.errors[0] || 'Nenhum dado legível de estoque ou volumes foi localizado no arquivo.',
          details: parseResult.errors,
        });
      }

      itemsToImport = parseResult.rows.filter((r) => r.isValid);
    } else {
      return res.status(400).json({ error: 'Nenhum dado ou arquivo enviado para importação.' });
    }

    if (itemsToImport.length === 0) {
      return res.status(400).json({ error: 'Nenhum item válido para atualizar no estoque.' });
    }

    const result = db.importInventoryItems(itemsToImport, {
      mode: mode || 'UPSERT',
      triggerAutoReorder: triggerAutoReorder !== false,
      userOrService: fileName ? `Importação XLSX (${fileName})` : 'Importação Planilha XLSX',
    });

    res.json(result);
  } catch (err: any) {
    console.error('Erro ao importar estoque XLSX:', err);
    res.status(500).json({ error: `Erro no processamento da importação: ${err.message}` });
  }
});

// ==========================================
// 14. FORNECEDORES E ORDENS DE COMPRA (P.O.)
// ==========================================
apiRouter.get('/suppliers', (req: Request, res: Response) => {
  res.json(db.getSuppliers());
});

apiRouter.post('/suppliers', (req: Request, res: Response) => {
  const data = req.body || {};
  const name = (data.name || data.tradeName || '').trim();
  const taxId = (data.taxId || '').trim();

  if (!name) {
    return res.status(400).json({ error: 'Razão Social ou Nome do Fornecedor é obrigatório.' });
  }

  // Gera taxId padrão caso o usuário não informe CNPJ
  const finalTaxId = taxId || `ISENTO-${Date.now().toString().slice(-8)}`;

  const existing = data.id ? db.getSupplierById(data.id) : undefined;
  const supplier: Supplier = {
    id: data.id || `supp-${Date.now()}`,
    name: name,
    tradeName: (data.tradeName || name).trim(),
    taxId: finalTaxId,
    stateRegistration: (data.stateRegistration || 'Isento').trim(),
    contactName: (data.contactName || 'Responsável Comercial').trim(),
    phone: (data.phone || data.whatsapp || '').trim(),
    whatsapp: (data.whatsapp || data.phone || '+55 11 99999-0000').trim(),
    email: (data.email || 'comercial@fornecedor.com.br').trim(),
    category: (data.category || 'Insumos e Matérias-Primas').trim(),
    leadTimeDays: Math.max(1, Number(data.leadTimeDays) || 3),
    city: (data.city || 'São Paulo').trim(),
    state: (data.state || 'SP').trim().toUpperCase(),
    paymentTerms: (data.paymentTerms || '30 DDL').trim(),
    status: data.status || 'HOMOLOGATED',
    notes: data.notes || '',
    suppliedProductsCount: existing?.suppliedProductsCount || 0,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };

  const saved = db.upsertSupplier(supplier);
  res.status(201).json(saved);
});

apiRouter.delete('/suppliers/:id', (req: Request, res: Response) => {
  const result = db.deleteSupplier(req.params.id);
  if (!result.success) {
    return res.status(404).json({ error: result.error || 'Fornecedor não encontrado.' });
  }
  res.json({
    success: true,
    message: `Fornecedor "${result.deletedSupplier?.tradeName || result.deletedSupplier?.name}" excluído com sucesso.`,
    supplier: result.deletedSupplier,
  });
});

apiRouter.post('/suppliers/:id/delete', (req: Request, res: Response) => {
  const result = db.deleteSupplier(req.params.id);
  if (!result.success) {
    return res.status(404).json({ error: result.error || 'Fornecedor não encontrado.' });
  }
  res.json({
    success: true,
    message: `Fornecedor "${result.deletedSupplier?.tradeName || result.deletedSupplier?.name}" excluído com sucesso.`,
    supplier: result.deletedSupplier,
  });
});

apiRouter.get('/purchase-orders', (req: Request, res: Response) => {
  res.json(db.getPurchaseOrders());
});

apiRouter.get('/purchase-orders/cancelled', (req: Request, res: Response) => {
  res.json(db.getCancelledPurchaseOrders());
});

// Limpar lista de ordens de compras canceladas
apiRouter.post('/purchase-orders/cancelled/clear', (req: Request, res: Response) => {
  const count = db.clearCancelledPurchaseOrders();
  res.json({
    success: true,
    clearedCount: count,
    message: `${count} ordens de compra canceladas foram removidas com sucesso do arquivo.`,
  });
});

apiRouter.delete('/purchase-orders/cancelled', (req: Request, res: Response) => {
  const count = db.clearCancelledPurchaseOrders();
  res.json({
    success: true,
    clearedCount: count,
    message: `${count} ordens de compra canceladas foram removidas com sucesso do arquivo.`,
  });
});

// Metadados das Tabelas do Banco de Dados para Vercel & GitHub
apiRouter.get('/database/tables', (req: Request, res: Response) => {
  res.json(db.getDatabaseTableStats());
});

apiRouter.post('/database/init', (req: Request, res: Response) => {
  const stats = db.getDatabaseTableStats();
  res.json({
    success: true,
    message: 'Estrutura das tabelas de banco de dados verificada e sincronizada!',
    stats,
  });
});

// Diagnóstico Automático e Pesquisa de Produtos Faltantes
apiRouter.get('/purchase-orders/missing-diagnostic', (req: Request, res: Response) => {
  const diagnostic = db.getMissingProductsDiagnostic();
  res.json(diagnostic);
});

// Emissão em Lote de Ordens de Compra para Itens Faltantes com Disparo WhatsApp
apiRouter.post('/purchase-orders/batch-reorder', async (req: Request, res: Response) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Lista de itens para reposição não fornecida.' });
  }

  const createdOrders = db.batchCreatePurchaseOrders(items);

  // Disparar WhatsApp para cada fornecedor das ordens geradas
  for (const po of createdOrders) {
    whatsappProvider.sendTemplateMessage({
      toPhone: po.supplierWhatsapp,
      templateName: 'notificacao_reposicao_estoque_fornecedor',
      parameters: {
        fornecedor: po.supplierName,
        numero_po: po.orderNumber,
        produto: po.productName,
        sku: po.productSku,
        unidade_volume: po.packagingUnit,
        quantidade_volume: `${po.quantityPackages} volumes (${po.quantityUnits} un)`,
        estoque_atual: `Gatilho Automático Faltantes Flind`,
        prazo_previsto: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('pt-BR') : 'Urgente',
      },
    }).catch((err) => console.error('Erro envio PO WhatsApp em lote:', err));
  }

  res.json({
    success: true,
    count: createdOrders.length,
    orders: createdOrders,
    message: `${createdOrders.length} Ordens de Compra emitidas e enviadas aos fornecedores via WhatsApp.`,
  });
});

// Pesquisa de Mercado & Matriz Comparativa de Cotações para Produtos Faltantes
// Compara Valores, Tempo de Entrega, Fabricação e Validade do Produto
apiRouter.get('/suppliers/quotations/missing-comparison', (req: Request, res: Response) => {
  const { productId } = req.query;
  const comparisons = db.getMissingProductsQuotationComparisons(productId ? String(productId) : undefined);
  res.json({
    timestamp: new Date().toISOString(),
    totalProductsCompared: comparisons.length,
    comparisons,
  });
});

// Emissão de Ordem de Compra a partir da Cotação Vencedora / Escolhida no Comparativo
apiRouter.post('/purchase-orders/create-from-quotation', async (req: Request, res: Response) => {
  const {
    productId,
    supplierId,
    supplierName,
    supplierWhatsapp,
    quantityPackages,
    unitPrice,
    leadTimeDays,
    paymentTerms,
    notes,
  } = req.body;

  if (!productId || !supplierId || !quantityPackages) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes para criar a Ordem de Compra.' });
  }

  const po = db.createPurchaseOrderFromQuotation({
    productId,
    supplierId,
    supplierName: supplierName || 'Fornecedor Homologado',
    supplierWhatsapp: supplierWhatsapp || '+55 19 99812-4400',
    quantityPackages: Number(quantityPackages),
    unitPrice: Number(unitPrice) || 50,
    leadTimeDays: Number(leadTimeDays) || 3,
    paymentTerms: paymentTerms || 'Boleto 28 DDL',
    notes: notes || 'Ordem gerada através do Comparativo Inteligente de Cotações Flind.',
  });

  // Disparo de mensagem no WhatsApp do fornecedor homologado vencedor
  whatsappProvider
    .sendTemplateMessage({
      toPhone: po.supplierWhatsapp,
      templateName: 'notificacao_reposicao_estoque_fornecedor',
      parameters: {
        fornecedor: po.supplierName,
        numero_po: po.orderNumber,
        produto: po.productName,
        sku: po.productSku,
        unidade_volume: po.packagingUnit,
        quantidade_volume: `${po.quantityPackages} volumes (${po.quantityUnits} un)`,
        estoque_atual: `Cotação Aprovada - Melhor Escolha Flind`,
        prazo_previsto: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('pt-BR') : 'Urgente',
      },
    })
    .catch((err) => console.error('Erro envio PO WhatsApp cotação:', err));

  res.json({
    success: true,
    purchaseOrder: po,
    message: `Ordem de Compra ${po.orderNumber} emitida com sucesso para ${po.supplierName} e disparada no WhatsApp.`,
  });
});

// Catálogo Técnico Completo de Produtos Flind
apiRouter.get('/products/catalog', (req: Request, res: Response) => {
  const { category, search, stockStatus } = req.query;
  let products = db.getProducts();

  if (category && category !== 'ALL') {
    products = products.filter((p) => p.category === category);
  }

  if (stockStatus && stockStatus !== 'ALL') {
    products = products.filter((p) => p.status === stockStatus);
  }

  if (search) {
    const s = String(search).toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        (p.material && p.material.toLowerCase().includes(s)) ||
        (p.barcode && p.barcode.includes(s)) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(s))
    );
  }

  res.json({
    total: products.length,
    products,
    categories: ['Hospitalar & Cirúrgico', 'Estética & Spas', 'Salões & Barbearias', 'Insumo & Matéria-Prima'],
  });
});

// Leitura Detalhada de Ficha Técnica do Produto no Catálogo
apiRouter.get('/products/:id/catalog-specs', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado no catálogo.' });
  }

  const supplier = db.getSupplierById(product.supplierId);
  const openPos = db.getPurchaseOrders().filter(
    (po) => (po.productId === product.id || po.productSku === product.sku) && po.status !== 'DELIVERED'
  );

  res.json({
    product,
    supplier,
    openOrdersCount: openPos.length,
    openOrders: openPos,
  });
});

apiRouter.post('/purchase-orders', (req: Request, res: Response) => {
  const data = req.body;
  const product = db.getProductById(data.productId);
  const supplier = db.getSupplierById(data.supplierId || product?.supplierId || '');

  const qtyPackages = Number(data.quantityPackages) || 50;
  const unitsPerPkg = product?.unitsPerPackage || 1;
  const supplierPhone = supplier?.whatsapp || supplier?.phone || data.supplierWhatsapp || '+55 11 99999-0000';
  const supplierName = supplier?.tradeName || supplier?.name || data.supplierName || 'Fornecedor Homologado';
  const leadDays = supplier?.leadTimeDays || 3;
  const deliveryDate = new Date(Date.now() + leadDays * 86400000).toISOString().split('T')[0];
  const orderNum = `PO-FLIND-${new Date().getFullYear()}-${String(db.getPurchaseOrders().length + 1).padStart(3, '0')}`;

  const po: PurchaseOrder = {
    id: `po-${Date.now()}`,
    orderNumber: orderNum,
    supplierId: supplier?.id || 'supp-1',
    supplierName,
    supplierWhatsapp: supplierPhone,
    productId: product?.id || data.productId,
    productSku: product?.sku || data.productSku || 'FLIND-INSUMO',
    productName: product?.name || data.productName || 'Matéria-Prima Flind',
    quantityPackages: qtyPackages,
    quantityUnits: qtyPackages * unitsPerPkg,
    packagingUnit: product?.packagingUnit || data.packagingUnit || 'Caixa (CX)',
    estimatedCost: qtyPackages * (product?.costPrice || Number(data.unitCost) || 50),
    triggerReason: data.triggerReason || 'MANUAL',
    status: 'SENT_WHATSAPP',
    whatsappMessageId: `manual.WA${supplierPhone.replace(/\D/g, '')}-${Date.now().toString(36)}`,
    notes: data.notes || `Ordem de Compra emitida pelo PCP Flind para reposição de estoque.`,
    expectedDeliveryDate: data.expectedDeliveryDate || deliveryDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addPurchaseOrder(po);

  // Registrar disparo WhatsApp
  whatsappProvider.sendTemplateMessage({
    toPhone: supplierPhone,
    templateName: 'notificacao_reposicao_estoque_fornecedor',
    parameters: {
      fornecedor: supplierName,
      numero_po: orderNum,
      produto: po.productName,
      sku: po.productSku,
      unidade_volume: po.packagingUnit,
      quantidade_volume: `${po.quantityPackages} volumes (${po.quantityUnits} un)`,
      estoque_atual: `${product?.currentStockPackages || 0} volumes`,
      prazo_previsto: new Date(po.expectedDeliveryDate || '').toLocaleDateString('pt-BR'),
    },
  }).catch((err) => console.error('Erro envio PO WhatsApp:', err));

  res.json(po);
});

apiRouter.post('/purchase-orders/:id/status', (req: Request, res: Response) => {
  const { status, reason } = req.body;
  const updated = db.updatePurchaseOrderStatus(req.params.id, status, reason);
  if (!updated) {
    return res.status(404).json({ error: 'Ordem de compra não encontrada.' });
  }
  res.json(updated);
});

apiRouter.post('/purchase-orders/:id/cancel', async (req: Request, res: Response) => {
  const { reason, notifySupplier } = req.body;
  const po = db.getPurchaseOrderById(req.params.id);
  if (!po) {
    return res.status(404).json({ error: 'Ordem de compra não encontrada.' });
  }

  if (po.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Esta ordem de compra já está cancelada.' });
  }

  if (po.status === 'DELIVERED') {
    return res.status(400).json({ error: 'Não é possível cancelar uma ordem de compra que já foi entregue no estoque.' });
  }

  const updated = db.updatePurchaseOrderStatus(req.params.id, 'CANCELLED', reason);

  let whatsappNotificationSent = false;
  if (notifySupplier && po.supplierWhatsapp) {
    try {
      await whatsappProvider.sendTemplateMessage({
        toPhone: po.supplierWhatsapp,
        templateName: 'cancelamento_ordem_compra_fornecedor',
        parameters: {
          fornecedor: po.supplierName,
          numero_po: po.orderNumber,
          produto: po.productName,
          quantidade_volume: `${po.quantityPackages} volumes`,
          motivo: reason || 'Cancelamento solicitado pelo setor de compras',
        },
      });
      whatsappNotificationSent = true;
    } catch (err) {
      console.error('[PO Cancel] Falha ao enviar WhatsApp de cancelamento:', err);
    }
  }

  res.json({
    success: true,
    message: `Ordem de compra ${po.orderNumber} cancelada com sucesso.`,
    purchaseOrder: updated,
    whatsappNotificationSent,
  });
});

apiRouter.post('/purchase-orders/:id/send-whatsapp', async (req: Request, res: Response) => {
  const po = db.getPurchaseOrderById(req.params.id);
  if (!po) {
    return res.status(404).json({ error: 'Ordem de compra não encontrada.' });
  }

  const result = await whatsappProvider.sendTemplateMessage({
    toPhone: po.supplierWhatsapp,
    templateName: 'notificacao_reposicao_estoque_fornecedor',
    parameters: {
      fornecedor: po.supplierName,
      numero_po: po.orderNumber,
      produto: po.productName,
      sku: po.productSku,
      unidade_volume: po.packagingUnit,
      quantidade_volume: `${po.quantityPackages} volumes (${po.quantityUnits} un)`,
      estoque_atual: `Verificação de estoque Flind`,
      prazo_previsto: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString('pt-BR') : 'Urgente',
    },
  });

  if (result.success) {
    po.status = 'SENT_WHATSAPP';
    po.updatedAt = new Date().toISOString();
    db.persist();
  }

  res.json(result);
});

// ==========================================
// 15. CONFIGURAÇÕES & AUTOMAÇÕES DO SISTEMA
// ==========================================
apiRouter.get('/automation/settings', (req: Request, res: Response) => {
  res.json(db.getAutoSettings());
});

apiRouter.post('/automation/settings', (req: Request, res: Response) => {
  const updated = db.updateAutoSettings(req.body);
  res.json({ success: true, settings: updated });
});

apiRouter.post('/automation/run-all', async (req: Request, res: Response) => {
  try {
    // 1. Executar SLA e Cobrança Financeira Automática
    const slaViolations = ruleEngine.evaluateOrderSlas();
    const collectionStats = await ruleEngine.executeCollectionAutomation();

    // 2. Executar Varredura de Estoque Baixo e Reposição Automática
    const stockReorders = db.scanAllLowStockAndTrigger();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        slaViolationsCount: slaViolations.length,
        collectionStats,
        stockReordersCount: stockReorders.length,
        stockReorders,
      },
      message: `Automação executada: ${collectionStats.messagesSent} WhatsApps de cobrança enviados | ${stockReorders.length} ressuprimentos de estoque acionados.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================
// SALVAMENTO, BACKUP E EXPORTAÇÃO COMPLETA DO BANCO
// ====================================================

apiRouter.get('/backup/export', (req: Request, res: Response) => {
  try {
    const rawData = db.getRawData();
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-flind-fabrica-${dateStr}.json`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(rawData, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/backup/save', (req: Request, res: Response) => {
  try {
    const saveResult = db.forceSave();
    res.json({
      message: 'Todos os dados da Fábrica Integrada foram salvos e gravados com sucesso no disco.',
      ...saveResult,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/backup/import', (req: Request, res: Response) => {
  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ error: 'Nenhum dado de backup fornecido.' });
    }
    const result = db.importRawData(backupData);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


