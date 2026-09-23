/**
 * Provedor Oficial WhatsApp Business Cloud API (Meta Graph API)
 */

import {
  MessagingProvider,
  SendTemplateMessageDTO,
  SendMessageResponseDTO,
  WebhookStatusUpdateDTO,
} from './messaging-provider';
import { db } from '../../database/db';
import { WhatsAppMessageLog } from '../../../types';

export function normalizePhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  // Se for número brasileiro com 10 ou 11 dígitos sem DDI 55
  if ((cleaned.length === 10 || cleaned.length === 11) && !cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

export class WhatsAppProvider implements MessagingProvider {
  public readonly providerName = 'WHATSAPP_BUSINESS_CLOUD';

  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;
  private webhookVerifyToken: string;

  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'fabrica_integrada_token_2026';
  }

  public isConfigured(): boolean {
    return Boolean(this.accessToken && this.phoneNumberId);
  }

  public getConfig() {
    return {
      isConfigured: this.isConfigured(),
      apiUrl: this.apiUrl,
      phoneNumberId: this.phoneNumberId,
      hasToken: Boolean(this.accessToken),
      maskedToken: this.accessToken ? `${this.accessToken.slice(0, 6)}...${this.accessToken.slice(-4)}` : '',
      webhookVerifyToken: this.webhookVerifyToken,
    };
  }

  public updateConfig(config: { apiUrl?: string; accessToken?: string; phoneNumberId?: string; webhookVerifyToken?: string }) {
    if (typeof config.apiUrl === 'string' && config.apiUrl.trim()) this.apiUrl = config.apiUrl.trim();
    if (typeof config.accessToken === 'string') this.accessToken = config.accessToken.trim();
    if (typeof config.phoneNumberId === 'string') this.phoneNumberId = config.phoneNumberId.trim();
    if (typeof config.webhookVerifyToken === 'string') this.webhookVerifyToken = config.webhookVerifyToken.trim();
    return this.getConfig();
  }

  /**
   * Registra disparo manual/direto executado via WhatsApp Web ou App pelo operador
   */
  public registerDirectSend(params: {
    toPhone: string;
    customerName: string;
    templateName: string;
    parameters: Record<string, string>;
    receivableId?: string;
    orderId?: string;
  }): WhatsAppMessageLog {
    const cleanPhone = normalizePhoneForWhatsApp(params.toPhone);
    const nowIso = new Date().toISOString();
    const providerMessageId = `web.WA${cleanPhone}-${Date.now().toString(36)}`;
    const log: WhatsAppMessageLog = {
      id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipientPhone: params.toPhone,
      customerName: params.customerName || 'Cliente',
      receivableId: params.receivableId,
      orderId: params.orderId,
      templateName: params.templateName,
      parameters: params.parameters,
      status: 'SENT',
      providerMessageId,
      sentAt: nowIso,
      direction: 'OUTBOUND',
      createdAt: nowIso,
    };
    db.addWhatsAppLog(log);

    db.addAuditLog({
      id: `aud-${Date.now()}`,
      action: 'WHATSAPP_DIRECT_WEB_SENT',
      origin: 'WhatsAppProvider.registerDirectSend',
      entity: 'WhatsAppMessageLog',
      entityId: log.id,
      newValue: {
        template: params.templateName,
        recipient: params.toPhone,
        receivableId: params.receivableId,
        providerMessageId,
      },
      userOrService: 'UserOperator',
      correlationId: `corr-wpp-direct-${Date.now()}`,
      createdAt: nowIso,
    });

    return log;
  }

  /**
   * Envio de mensagem com template aprovado pelo WhatsApp
   */
  public async sendTemplateMessage(dto: SendTemplateMessageDTO): Promise<SendMessageResponseDTO> {
    const cleanPhone = normalizePhoneForWhatsApp(dto.toPhone);
    const nowIso = new Date().toISOString();

    // Se o usuário solicitou explicitamente envio via Meta API, mas as credenciais não foram informadas
    if (dto.mode === 'meta' && !this.isConfigured()) {
      return {
        success: false,
        status: 'FAILED',
        errorMessage: 'Credenciais da Meta Cloud API (Access Token ou Phone Number ID) não estão configuradas no servidor.',
        needsConfiguration: true,
      };
    }

    // Montar parâmetros do corpo do template
    const bodyParameters = Object.entries(dto.parameters).map(([key, val]) => ({
      type: 'text',
      text: String(val),
    }));

    const customerName = dto.parameters.cliente || dto.parameters.nome || 'Cliente';

    // Se estiver com credenciais da Meta configuradas e modo não for explicitamente sandbox
    if (dto.mode !== 'sandbox' && this.isConfigured()) {
      try {
        const endpoint = `${this.apiUrl}/${this.phoneNumberId}/messages`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'template',
            template: {
              name: dto.templateName,
              language: { code: dto.languageCode || 'pt_BR' },
              components: [
                {
                  type: 'body',
                  parameters: bodyParameters,
                },
              ],
            },
          }),
        });

        const resData = await response.json();

        if (!response.ok) {
          const errMessage = resData?.error?.message || `HTTP ${response.status}: Falha na Meta API`;
          // Registrar log de erro
          const errorLog: WhatsAppMessageLog = {
            id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            recipientPhone: dto.toPhone,
            customerName,
            receivableId: dto.receivableId,
            orderId: dto.orderId,
            templateName: dto.templateName,
            parameters: dto.parameters,
            status: 'FAILED',
            errorMessage: errMessage,
            direction: 'OUTBOUND',
            createdAt: nowIso,
          };
          db.addWhatsAppLog(errorLog);

          return {
            success: false,
            status: 'FAILED',
            errorMessage: errMessage,
            metaDetails: resData?.error,
          };
        }

        const providerMessageId = resData?.messages?.[0]?.id || `wamid.${Date.now()}`;

        // Registrar log de sucesso
        const successLog: WhatsAppMessageLog = {
          id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          recipientPhone: dto.toPhone,
          customerName,
          receivableId: dto.receivableId,
          orderId: dto.orderId,
          templateName: dto.templateName,
          parameters: dto.parameters,
          status: 'SENT',
          providerMessageId,
          sentAt: nowIso,
          direction: 'OUTBOUND',
          createdAt: nowIso,
        };
        db.addWhatsAppLog(successLog);

        return {
          success: true,
          providerMessageId,
          status: 'SENT',
          isSandbox: false,
        };
      } catch (err: any) {
        console.error('[WhatsAppProvider] Erro ao comunicar com API da Meta:', err);
        return {
          success: false,
          status: 'FAILED',
          errorMessage: `Erro de conexão com Meta Graph API: ${err.message}`,
        };
      }
    }

    // Modo Operacional Sandbox / Simulação Controlada para Testes
    const mockMessageId = `wamid.HBgL${cleanPhone}MRIA${Date.now().toString(36)}`;
    const log: WhatsAppMessageLog = {
      id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipientPhone: dto.toPhone,
      customerName,
      receivableId: dto.receivableId,
      orderId: dto.orderId,
      templateName: dto.templateName,
      parameters: dto.parameters,
      status: 'SENT',
      providerMessageId: mockMessageId,
      sentAt: nowIso,
      deliveredAt: new Date(Date.now() + 2000).toISOString(),
      direction: 'OUTBOUND',
      createdAt: nowIso,
    };
    db.addWhatsAppLog(log);

    // Auditoria de disparo
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      action: 'WHATSAPP_MESSAGE_SENT',
      origin: 'WhatsAppProvider.sendTemplateMessage',
      entity: 'WhatsAppMessageLog',
      entityId: log.id,
      newValue: {
        template: dto.templateName,
        recipient: dto.toPhone,
        receivableId: dto.receivableId,
        isSandbox: true,
      },
      userOrService: 'CollectionAutomationService',
      correlationId: `corr-wpp-${Date.now()}`,
      createdAt: nowIso,
    });

    return {
      success: true,
      providerMessageId: mockMessageId,
      status: 'SENT',
      isSandbox: true,
    };
  }

  /**
   * Validação de Verificação do Webhook da Meta
   * GET /api/integrations/whatsapp/webhook?hub.mode=subscribe&hub.challenge=...
   */
  public verifyWebhookChallenge(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  /**
   * Processador de Eventos de Status Recebidos via Webhook
   * POST /api/integrations/whatsapp/webhook
   */
  public async handleWebhookStatus(body: any): Promise<WebhookStatusUpdateDTO[]> {
    const updates: WebhookStatusUpdateDTO[] = [];

    try {
      const entries = body?.entry || [];
      for (const entry of entries) {
        const changes = entry?.changes || [];
        for (const change of changes) {
          if (change?.value?.statuses) {
            for (const statusObj of change.value.statuses) {
              const msgId = statusObj.id;
              const statusName = statusObj.status as 'sent' | 'delivered' | 'read' | 'failed';
              const timestamp = statusObj.timestamp
                ? new Date(Number(statusObj.timestamp) * 1000).toISOString()
                : new Date().toISOString();

              const updateDTO: WebhookStatusUpdateDTO = {
                providerMessageId: msgId,
                status: statusName,
                timestamp,
                recipientId: statusObj.recipient_id,
              };

              if (statusObj.errors && statusObj.errors.length > 0) {
                updateDTO.error = {
                  code: statusObj.errors[0].code,
                  message: statusObj.errors[0].title || statusObj.errors[0].message,
                };
              }

              updates.push(updateDTO);

              // Atualizar no banco de dados local
              const mappedStatus =
                statusName === 'sent'
                  ? 'SENT'
                  : statusName === 'delivered'
                  ? 'DELIVERED'
                  : statusName === 'read'
                  ? 'READ'
                  : 'FAILED';

              db.updateWhatsAppLogStatus(msgId, mappedStatus, timestamp);
            }
          }
        }
      }
    } catch (err) {
      console.error('[WhatsAppProvider] Erro ao decodificar webhook da Meta:', err);
    }

    return updates;
  }
}

export const whatsappProvider = new WhatsAppProvider();
