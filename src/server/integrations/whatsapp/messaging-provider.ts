/**
 * Contrato de Provedor de Mensageria (MessagingProvider)
 */

export interface MessageTemplateParam {
  name: string;
  value: string;
}

export interface SendTemplateMessageDTO {
  toPhone: string;
  templateName: string;
  languageCode?: string;
  parameters: Record<string, string>;
  receivableId?: string;
  orderId?: string;
  mode?: 'meta' | 'sandbox';
}

export interface SendMessageResponseDTO {
  success: boolean;
  providerMessageId?: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  errorMessage?: string;
  isSandbox?: boolean;
  metaDetails?: any;
  needsConfiguration?: boolean;
}

export interface WebhookStatusUpdateDTO {
  providerMessageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipientId: string;
  error?: {
    code: number;
    message: string;
  };
}

export interface MessagingProvider {
  readonly providerName: string;

  /**
   * Envia mensagem baseada em template oficial aprovado
   */
  sendTemplateMessage(dto: SendTemplateMessageDTO): Promise<SendMessageResponseDTO>;

  /**
   * Processa Webhook de atualização de status (entregue, lido, etc)
   */
  handleWebhookStatus(body: any): Promise<WebhookStatusUpdateDTO[]>;

  /**
   * Valida verificação de webhook (hub.verify_token)
   */
  verifyWebhookChallenge(mode: string, token: string, challenge: string): string | null;
}
