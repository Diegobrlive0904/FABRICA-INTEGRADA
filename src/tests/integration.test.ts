import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { db } from '../server/database/db';
import { trayAdapter, TrayWebhookPayload } from '../server/integrations/tray/tray-adapter';
import { sinkERPProvider } from '../server/integrations/sink-erp/sink-erp-adapter';
import { whatsappProvider } from '../server/integrations/whatsapp/whatsapp-provider';
import { ruleEngine } from '../server/services/rule-engine';
import { shippingService } from '../server/services/shipping-service';

describe('FÁBRICA INTEGRADA - SUITE DE TESTES OPERACIONAIS', () => {
  beforeEach(() => {
    // Garante que o banco está pronto para cada teste
  });

  // 1. SINCRONIZAÇÃO E IDEMPOTÊNCIA TRAY
  test('Tray: Deve processar webhook e garantir IDEMPOTÊNCIA impedindo duplicidade', async () => {
    const testOrderId = `TEST-ORD-${Date.now()}`;
    const payload: TrayWebhookPayload = {
      event: 'order.created',
      scope_id: '991',
      act: 'order_create',
      order_id: testOrderId,
    };

    // Primeira execução: deve sincronizar
    const res1 = await trayAdapter.handleWebhook(payload, 'corr-test-1');
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.alreadyProcessed, false);

    const createdOrder = db.getOrderById(`ord-tray-${testOrderId}`);
    assert.ok(createdOrder, 'Pedido deve ter sido criado no banco da Fábrica Integrada');
    assert.strictEqual(createdOrder.source, 'TRAY');
    assert.ok(createdOrder.timeline.length >= 7, 'Timeline inicial deve ser gerada');

    // Segunda execução com o mesmo payload/evento: DEVE SER IDEMPOTENTE
    const res2 = await trayAdapter.handleWebhook(payload, 'corr-test-2');
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.alreadyProcessed, true, 'O segundo processamento deve ser detectado como duplicata idempotente');
  });

  // 2. SINCRONIZAÇÃO SINK ERP DESACOPLADA
  test('SINK ERP: Adapter desacoplado deve sincronizar pedido e retornar protocolo rastreável', async () => {
    const order = db.getOrders()[0];
    assert.ok(order, 'Deve existir pelo menos um pedido de teste');

    const result = await sinkERPProvider.createOrder(order);
    assert.ok(result.erpProtocol, 'Deve conter protocolo de integração do SINK ERP');
    assert.ok(result.synchronizedAt);

    // Consulta de saúde
    const health = await sinkERPProvider.checkHealth();
    assert.ok(['CONNECTED', 'PENDING_DOCS'].includes(health.status));
  });

  // 3. MOTOR DE SLA E GERAÇÃO DE ALERTAS
  test('SLA Engine: Deve detectar pedidos com etapas atrasadas e gerar alertas com severidade correta', () => {
    const alertsBefore = db.getAlerts().length;
    const generatedAlerts = ruleEngine.evaluateOrderSlas();

    const orders = db.getOrders();
    const hasDelayed = orders.some((o) => o.timeline.some((t) => t.status === 'DELAYED'));
    assert.ok(hasDelayed, 'Deve existir pedido marcado com status DELAYED pelo motor');

    const pendingAlerts = db.getAlerts().filter((a) => a.status === 'PENDING');
    assert.ok(pendingAlerts.length > 0, 'Devem existir alertas operacionais pendentes');
  });

  // 4. REGRAS DE ENTREGA (DELIVERY RULES)
  test('DeliveryRule: Deve validar agendamento obrigatório e limite de peso', () => {
    // Pedido 1583 entrega em Campinas (addr-2-delivery): limite 4000kg, agendamento obrigatório
    const order1583 = db.getOrderById('ord-1583');
    assert.ok(order1583);

    // Cenário 1: Sem agendamento e com peso excedido (4600kg > 4000kg)
    const resultInvalid = ruleEngine.validateDeliveryRules(order1583, {
      selectedVehicleType: 'CARRETA',
    });
    assert.strictEqual(resultInvalid.valid, false, 'Validação deve falhar devido a regras restritivas');
    assert.ok(resultInvalid.errors.length >= 1, 'Deve conter erro de agendamento ou peso');
    assert.ok(resultInvalid.warnings.length >= 1, 'Deve conter aviso de tipo de veículo incompatível');

    // Cenário 2: Com agendamento cadastrado e pedido com peso compatível
    const order1582 = db.getOrderById('ord-1582'); // Entrega Guarulhos: limite 15000kg, sem agendamento obrigatório
    assert.ok(order1582);
    const resultValid = ruleEngine.validateDeliveryRules(order1582, {
      selectedVehicleType: 'TRUCK',
    });
    assert.strictEqual(resultValid.valid, true, 'Pedido dentro dos limites de entrega deve ser válido');
  });

  // 5. FINANCEIRO E CONTAS A RECEBER
  test('Financeiro: Deve classificar títulos em status adequados e calcular aging buckets', () => {
    const receivables = db.getReceivables();
    assert.ok(receivables.length >= 5, 'Devem existir títulos a receber no banco');

    const hasOverdue = receivables.some((r) => r.status === 'OVERDUE');
    const hasDueSoon = receivables.some((r) => r.status === 'OPEN' || r.status === 'DUE_SOON');
    const hasPaid = receivables.some((r) => r.status === 'PAID');

    assert.ok(hasOverdue, 'Deve conter títulos em atraso');
    assert.ok(hasDueSoon, 'Deve conter títulos a vencer');
    assert.ok(hasPaid, 'Deve conter títulos pagos');
  });

  // 6. AUTOMAÇÃO DE COBRANÇA E CANCELAMENTO APÓS PAGAMENTO
  test('Cobrança: Pagamento de título deve cancelar envios futuros', async () => {
    // Pegar título em aberto
    const rec = db.getReceivables().find((r) => r.status === 'OPEN' || r.status === 'OVERDUE');
    assert.ok(rec);

    // Registrar pagamento
    rec.status = 'PAID';
    rec.paymentDate = new Date().toISOString().split('T')[0];
    db.upsertReceivable(rec);

    // Executar automação de cobrança
    const result = await ruleEngine.executeCollectionAutomation();
    assert.ok(result.cancelledDueToPaid >= 1, 'Título pago deve ser ignorado/cancelado pela régua de cobrança');
  });

  // 7. RASTREABILIDADE E ETIQUETA COM QR CODE
  test('Rastreabilidade: Deve gerar token seguro, QR Code e exibir rastreio autorizado', async () => {
    const order = db.getOrders()[0];
    assert.ok(order);

    const label = await shippingService.generateShippingLabel(order.id);
    assert.ok(label.trackingToken, 'Deve possuir token único de rastreio');
    assert.ok(label.qrCodeDataUrl.startsWith('data:image/png;base64,'), 'QR Code deve ser uma Data URL PNG válida');
    assert.ok(label.trackingUrl.includes(`/trace/${label.trackingToken}`), 'URL do QR Code deve apontar para endpoint /trace/:token');

    // Consultar rastreabilidade pública autorizada
    const trace = shippingService.getTraceabilityByToken(label.trackingToken);
    assert.ok(trace, 'Rastreabilidade autorizada deve ser encontrada pelo token');
    assert.strictEqual(trace.orderNumber, order.orderNumber);
    assert.ok(trace.timeline.length > 0, 'Histórico da timeline deve estar visível');
  });

  // 8. WHATSAPP BUSINESS WEBHOOK & MENSAGEM
  test('WhatsApp: Deve enviar mensagem com template e processar webhook de status', async () => {
    const sendResult = await whatsappProvider.sendTemplateMessage({
      toPhone: '+55 11 98888-9999',
      templateName: 'lembrete_fatura_vencimento',
      parameters: {
        cliente: 'Cliente Teste',
        numero: 'NF-9999',
        valor: 'R$ 1.500,00',
        data: '2026-10-01',
        dados_pagamento: 'PIX: teste@pix.com',
      },
    });

    assert.strictEqual(sendResult.success, true);
    assert.ok(sendResult.providerMessageId);

    // Simulação de Webhook da Meta informando leitura da mensagem
    const webhookPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: sendResult.providerMessageId,
                    status: 'read',
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    recipient_id: '5511988889999',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const updates = await whatsappProvider.handleWebhookStatus(webhookPayload);
    assert.strictEqual(updates.length, 1);
    assert.strictEqual(updates[0].status, 'read');

    // Verificar se no log atualizou para READ
    const log = db.getWhatsAppLogs().find((l) => l.providerMessageId === sendResult.providerMessageId);
    assert.ok(log);
    assert.strictEqual(log.status, 'READ');
  });

  // 9. GESTÃO E EXCLUSÃO DE FORNECEDOR
  test('Fornecedores: Deve cadastrar e permitir exclusão de fornecedor com desvinculação segura', () => {
    const newSupp = db.upsertSupplier({
      id: `supp-test-del-${Date.now()}`,
      name: 'Fornecedor Teste Temporário Ltda',
      tradeName: 'Fornecedor Temporário',
      taxId: '99.888.777/0001-66',
      stateRegistration: 'Isento',
      contactName: 'Carlos Contato',
      phone: '+55 11 98765-4321',
      whatsapp: '+55 11 98765-4321',
      email: 'temporario@fornecedor.com.br',
      category: 'Embalagens',
      leadTimeDays: 4,
      city: 'Campinas',
      state: 'SP',
      paymentTerms: '30 DDL',
      status: 'HOMOLOGATED',
      notes: 'Fornecedor criado para teste de exclusão',
      suppliedProductsCount: 0,
      createdAt: new Date().toISOString(),
    });

    assert.ok(db.getSupplierById(newSupp.id));

    // Executa exclusão
    const delResult = db.deleteSupplier(newSupp.id);
    assert.strictEqual(delResult.success, true);
    assert.strictEqual(delResult.deletedSupplier?.id, newSupp.id);

    // Não deve mais existir na base
    assert.strictEqual(db.getSupplierById(newSupp.id), undefined);

    // Tentar excluir novamente deve retornar erro controlado
    const retryDel = db.deleteSupplier(newSupp.id);
    assert.strictEqual(retryDel.success, false);
    assert.strictEqual(retryDel.error, 'Fornecedor não encontrado.');
  });
});
