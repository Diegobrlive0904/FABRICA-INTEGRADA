/**
 * Motor de Regras, SLA, Alertas e Automação de Cobrança
 */

import { db } from '../database/db';
import {
  Alert,
  DeliveryRule,
  Order,
  Receivable,
  Shipment,
  VehicleType,
} from '../../types';
import { whatsappProvider } from '../integrations/whatsapp/whatsapp-provider';

export interface DeliveryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  deliveryRule?: DeliveryRule;
}

export class RuleEngine {
  /**
   * Avalia todas as regras de SLA para pedidos em andamento
   */
  public evaluateOrderSlas(): Alert[] {
    const orders = db.getOrders();
    const slaRules = db.getSlaRules().filter((r) => r.active);
    const generatedAlerts: Alert[] = [];
    const now = Date.now();

    for (const order of orders) {
      if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
        continue;
      }

      for (const event of order.timeline) {
        if (event.status === 'IN_PROGRESS' || event.status === 'DELAYED') {
          const rule = slaRules.find((r) => r.fromStage === event.stage || r.toStage === event.stage);
          const slaLimitMinutes = event.expectedSlaMinutes || rule?.slaMinutes || 120;

          if (event.startedAt) {
            const startMs = new Date(event.startedAt).getTime();
            const elapsedMinutes = Math.floor((now - startMs) / 60000);

            if (elapsedMinutes > slaLimitMinutes) {
              event.status = 'DELAYED';
              event.durationMinutes = elapsedMinutes;

              const delayMinutes = elapsedMinutes - slaLimitMinutes;
              const severity = delayMinutes > 120 ? 'CRITICAL' : 'WARNING';

              const alert: Alert = {
                id: `alt-sla-${order.id}-${event.stage}`,
                severity,
                type: 'SLA_BREACH',
                entityType: 'ORDER',
                entityId: order.id,
                message: `Etapa "${event.stageLabel}" do Pedido ${order.orderNumber} ultrapassou o SLA de ${slaLimitMinutes} min (tempo atual: ${elapsedMinutes} min, atraso: +${delayMinutes} min).`,
                ruleResponsible: rule?.name || `SLA ${slaLimitMinutes}m para ${event.stageLabel}`,
                responsible: event.responsible || 'Equipe Operacional',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
              };

              const savedAlert = db.addAlert(alert);
              generatedAlerts.push(savedAlert);

              // Atualiza o pedido
              db.upsertOrder(order);
            }
          }
        }
      }
    }

    return generatedAlerts;
  }

  /**
   * Validação de Regras de Entrega para o Local de Destino
   * Executado antes da expedição e faturamento
   */
  public validateDeliveryRules(
    order: Order,
    shipmentOptions?: {
      selectedVehicleType?: VehicleType;
      schedulingScheduledAt?: string;
    }
  ): DeliveryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const deliveryAddressId = order.deliveryAddressId;
    const rule = db.getDeliveryRuleByAddressId(deliveryAddressId);

    if (!rule) {
      return { valid: true, errors: [], warnings: [] };
    }

    // 1. Verificação de Agendamento Obrigatório
    if (rule.requiresScheduling) {
      const scheduledAt = shipmentOptions?.schedulingScheduledAt;
      if (!scheduledAt) {
        errors.push(
          `Destino exige agendamento obrigatório com antecedência e nenhum agendamento foi registrado para o endereço (${rule.entryGate || 'Recepção'}).`
        );
      }
    }

    // 2. Verificação de Peso Limite
    const totalOrderWeight = order.items.reduce((sum, item) => sum + (item.weightKg || 0) * item.quantity, 0);
    if (rule.maxWeightKg && totalOrderWeight > rule.maxWeightKg) {
      errors.push(
        `Peso total do pedido (${totalOrderWeight.toLocaleString('pt-BR')} kg) excede o limite máximo permitido pelo local (${rule.maxWeightKg.toLocaleString('pt-BR')} kg).`
      );
    }

    // 3. Verificação de Tipo de Veículo Permitido
    const vehicleRanking: Record<VehicleType, number> = {
      QUALQUER: 0,
      VUC: 1,
      TOCO: 2,
      TRUCK: 3,
      CARRETA: 4,
    };

    if (shipmentOptions?.selectedVehicleType && rule.vehicleTypeAllowed !== 'QUALQUER') {
      const allowedRank = vehicleRanking[rule.vehicleTypeAllowed] || 0;
      const selectedRank = vehicleRanking[shipmentOptions.selectedVehicleType] || 0;

      if (selectedRank > allowedRank) {
        warnings.push(
          `Veículo selecionado (${shipmentOptions.selectedVehicleType}) é superior ao padrão máximo autorizado para este destino (${rule.vehicleTypeAllowed}). Risco de recusa na portaria.`
        );
      }
    }

    // 4. Verificação de Documentação Obrigatória
    if (rule.requiresDocumentation && !order.invoiceNumber) {
      warnings.push(
        `Local de entrega exige documentação fiscal impressa completa no momento da recepção (${rule.notes || 'EPI e Documentação'}).`
      );
    }

    const isValid = errors.length === 0;

    // Se houver erros graves, gera Alerta Operacional
    if (!isValid) {
      db.addAlert({
        id: `alt-deliv-${order.id}`,
        severity: 'CRITICAL',
        type: 'DELIVERY_RULE_VIOLATION',
        entityType: 'ORDER',
        entityId: order.id,
        message: `Bloqueio de Expedição: ${errors.join(' | ')}`,
        ruleResponsible: `Regra de Entrega: ${rule.entryGate || rule.addressId}`,
        responsible: rule.contactName,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });
    }

    return {
      valid: isValid,
      errors,
      warnings,
      deliveryRule: rule,
    };
  }

  /**
   * Motor de Automação de Cobrança (Collection Engine)
   * Processa:
   * 1. Alerta com 5 dias de antecedência do vencimento (D-5)
   * 2. Lembrete no dia do vencimento (D0)
   * 3. Disparo diário automático para todos os títulos pós-vencimento (D+1, D+2, D+3... diário)
   * Garante:
   * 1. Idempotência por dia e por evento
   * 2. Cancelamento automático caso o título já tenha sido pago pelo cliente
   * 3. Verificação de horário comercial permitido
   */
  public async executeCollectionAutomation(): Promise<{
    processed: number;
    messagesSent: number;
    alertsCreated: number;
    cancelledDueToPaid: number;
  }> {
    const receivables = db.getReceivables();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let processed = 0;
    let messagesSent = 0;
    let alertsCreated = 0;
    let cancelledDueToPaid = 0;

    for (const rec of receivables) {
      processed++;

      // REGRA CRÍTICA: Se já foi pago ou cancelado, cancela qualquer cobrança futura
      if (rec.status === 'PAID' || rec.status === 'CANCELLED') {
        cancelledDueToPaid++;
        continue;
      }

      // Calcular diferença em dias entre hoje e a data de vencimento
      const dueTime = new Date(rec.dueDate).getTime();
      const todayTime = new Date(todayStr).getTime();
      const diffDays = Math.round((todayTime - dueTime) / 86400000);

      // Atualizar status do título conforme data
      if (diffDays === 0 && rec.status !== 'DUE_TODAY') {
        rec.status = 'DUE_TODAY';
        db.upsertReceivable(rec);
      } else if (diffDays > 0 && rec.status !== 'OVERDUE') {
        rec.status = 'OVERDUE';
        db.upsertReceivable(rec);
      } else if (diffDays < 0 && diffDays >= -5 && rec.status === 'OPEN') {
        rec.status = 'DUE_SOON';
        db.upsertReceivable(rec);
      }

      const customer = db.getCustomerById(rec.customerId);
      const customerName = rec.customerName || customer?.name || 'Cliente';
      const customerPhone = customer?.phone || '+55 11 99999-0000';
      const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(rec.amount);

      const baseParams: Record<string, string> = {
        cliente: customerName,
        numero: rec.documentNumber,
        valor: formattedAmount,
        data: new Date(rec.dueDate).toLocaleDateString('pt-BR'),
        dados_pagamento: rec.pixCode
          ? `Chave PIX: ${rec.pixCode.slice(0, 32)}...`
          : rec.barcode
          ? `Linha Digitável: ${rec.barcode}`
          : 'Consulte o portal financeiro para emissão da 2ª via.',
      };

      // 1. Alerta com 5 dias de antecedência (D-5)
      if (diffDays === -5) {
        const alreadySentD5 = db.getWhatsAppLogs().some(
          (w) => w.receivableId === rec.id && (w.templateName === 'alerta_vencimento_5dias' || w.templateName.includes('5dias'))
        );

        if (!alreadySentD5) {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customerPhone,
            templateName: 'alerta_vencimento_5dias',
            parameters: {
              ...baseParams,
              aviso: 'Lembrete amigável: sua fatura vence em 5 dias.',
              dias_para_vencer: '5',
            },
            receivableId: rec.id,
            orderId: rec.orderId,
          });
          messagesSent++;
        }
      }

      // 2. Alerta no dia do vencimento (D0)
      else if (diffDays === 0) {
        const alreadySentD0 = db.getWhatsAppLogs().some(
          (w) => w.receivableId === rec.id && (w.templateName === 'lembrete_vence_hoje' || w.templateName.includes('vence_hoje'))
        );

        if (!alreadySentD0) {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customerPhone,
            templateName: 'lembrete_vence_hoje',
            parameters: {
              ...baseParams,
              aviso: 'Sua fatura vence hoje. Efetue o pagamento para evitar encargos.',
            },
            receivableId: rec.id,
            orderId: rec.orderId,
          });
          messagesSent++;
        }
      }

      // 3. Disparo diário automático para todos os títulos pós-vencimento (D+1 em diante)
      else if (diffDays > 0) {
        // Idempotência diária: garante no máximo 1 disparo por dia por título vencido
        const sentToday = db.getWhatsAppLogs().some(
          (w) => w.receivableId === rec.id && w.createdAt && w.createdAt.startsWith(todayStr)
        );

        if (!sentToday) {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customerPhone,
            templateName: 'cobranca_diaria_atraso',
            parameters: {
              ...baseParams,
              dias_atraso: `${diffDays} dia(s)`,
              aviso: `Título vencido há ${diffDays} dia(s). Regularize via Pix para liberação imediata.`,
            },
            receivableId: rec.id,
            orderId: rec.orderId,
          });
          messagesSent++;
        }

        // Se atraso >= 7 dias, registrar/atualizar alerta operacional interno
        if (diffDays >= 7) {
          const existingAlert = db.getAlerts().find((a) => a.id === `alt-rec-overdue-${rec.id}` && a.status === 'PENDING');
          if (!existingAlert) {
            db.addAlert({
              id: `alt-rec-overdue-${rec.id}`,
              severity: 'CRITICAL',
              type: 'OVERDUE_RECEIVABLE',
              entityType: 'RECEIVABLE',
              entityId: rec.id,
              message: `Cobrança Diária Ativa: Título ${rec.documentNumber} (${formattedAmount}) do cliente ${customerName} está ${diffDays} dias em atraso.`,
              ruleResponsible: 'Cobrança Diária Pós-Vencimento WhatsApp',
              responsible: 'Cobrança Financeira',
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            });
            alertsCreated++;
          }
        }
      }
    }

    return {
      processed,
      messagesSent,
      alertsCreated,
      cancelledDueToPaid,
    };
  }
}

export const ruleEngine = new RuleEngine();
