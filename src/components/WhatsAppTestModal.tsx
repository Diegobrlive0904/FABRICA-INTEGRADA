import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Copy,
  Check,
  X,
  Smartphone,
  Server,
  Zap,
} from 'lucide-react';

interface WhatsAppTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPhone?: string;
  initialCustomer?: string;
  initialDocument?: string;
  initialAmount?: string;
  initialDueDate?: string;
  initialReceivableId?: string;
  initialOrderId?: string;
}

export type WhatsAppTemplateId =
  | 'lembrete_fatura_vencimento'
  | 'alerta_vencido_cobranca'
  | 'notificacao_cobranca_critica'
  | 'notificacao_despacho_rastreio';

export const WhatsAppTestModal: React.FC<WhatsAppTestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = '',
  initialCustomer = 'Hospital São Camilo - Centro Cirúrgico & CAF',
  initialDocument = 'DUP-4821-01',
  initialAmount = 'R$ 18.450,00',
  initialDueDate = '',
  initialReceivableId,
  initialOrderId,
}) => {
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'META_API' | 'SANDBOX'>('DIRECT');
  const [template, setTemplate] = useState<WhatsAppTemplateId>('lembrete_fatura_vencimento');

  // Form fields
  const [phone, setPhone] = useState(initialPhone || '11988887777');
  const [customerName, setCustomerName] = useState(initialCustomer);
  const [docNumber, setDocNumber] = useState(initialDocument);
  const [amount, setAmount] = useState(initialAmount);
  const [dueDate, setDueDate] = useState(
    initialDueDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
  );
  const [paymentData, setPaymentData] = useState('Chave PIX: financeiro@flind.com.br');

  // Meta API status and credentials
  const [metaConfig, setMetaConfig] = useState<{
    isConfigured: boolean;
    apiUrl: string;
    phoneNumberId: string;
    hasToken: boolean;
    maskedToken: string;
  } | null>(null);
  const [showConfigInputs, setShowConfigInputs] = useState(false);
  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [phoneNumberIdInput, setPhoneNumberIdInput] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);

  // Send status
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch current config on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setLastMessageId(null);
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/integrations/whatsapp/config');
      if (res.ok) {
        const data = await res.json();
        setMetaConfig(data);
        if (data.phoneNumberId) setPhoneNumberIdInput(data.phoneNumberId);
      }
    } catch (err) {
      console.error('Erro ao buscar config WhatsApp:', err);
    }
  };

  if (!isOpen) return null;

  // Formatar número garantindo DDI 55
  const cleanDigits = phone.replace(/\D/g, '');
  const cleanPhone =
    (cleanDigits.length === 10 || cleanDigits.length === 11) && !cleanDigits.startsWith('55')
      ? '55' + cleanDigits
      : cleanDigits;

  // Gerar texto formatado da mensagem
  const getRenderedMessage = () => {
    if (template === 'lembrete_fatura_vencimento') {
      return `*FLIND - Notificação Financeira*\nOlá, *${customerName}*!\n\nLembramos que o título *${docNumber}* no valor de *${amount}* tem vencimento em *${dueDate}*.\n\n*Formas de Pagamento:*\n${paymentData}\n\nCaso já tenha efetuado o pagamento, por favor desconsidere este aviso.\nDúvidas? Responda a esta mensagem.`;
    }
    if (template === 'alerta_vencido_cobranca') {
      return `*FLIND - Aviso Amigável de Vencimento*\nOlá, *${customerName}*!\n\nIdentificamos que o título *${docNumber}* no valor de *${amount}* venceu em *${dueDate}* e consta em aberto no sistema.\n\n*Dados para Liquidação:*\n${paymentData}\n\nPor favor, envie o comprovante por este canal assim que realizado para baixa imediata.`;
    }
    if (template === 'notificacao_cobranca_critica') {
      return `*FLIND - Notificação de Cobrança*\nPrezado(a) *${customerName}*,\n\nConstatamos pendência superior a 7 dias referente ao documento *${docNumber}* (*${amount}*). Solicitamos contato urgente com nosso setor financeiro para regularização antes do bloqueio de novos pedidos.\n\n*PIX Oficial:* financeiro@flind.com.br`;
    }
    return `*FLIND - Pedido Despachado com Sucesso! 🚚*\nOlá, *${customerName}*!\n\nSeu pedido de descartáveis Flind (*${docNumber}*) já foi conferido e expedido pela nossa fábrica.\n\n*Rastreio e Entrega:*\n${paymentData || 'https://flind.com.br/rastreio'}\n\nAgradecemos a confiança e preferência!`;
  };

  const renderedText = getRenderedMessage();

  // 1. Envio Direto via Link do WhatsApp (Web ou App Celular)
  const handleDirectWhatsAppSend = async () => {
    if (!cleanPhone) {
      setErrorMessage('Por favor, informe um número de telefone válido.');
      return;
    }

    setErrorMessage(null);
    setSending(true);

    try {
      // Registrar no backend como disparo oficial
      await fetch('/api/integrations/whatsapp/register-direct-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: cleanPhone,
          customerName,
          templateName: template,
          parameters: {
            cliente: customerName,
            numero: docNumber,
            valor: amount,
            data: dueDate,
            dados_pagamento: paymentData,
          },
          receivableId: initialReceivableId,
          orderId: initialOrderId,
        }),
      });

      // Abrir no WhatsApp Web / App
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
        renderedText
      )}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      setSuccessMessage(
        `Disparo acionado com sucesso para o WhatsApp +${cleanPhone}! A janela do WhatsApp foi aberta com a mensagem pronta.`
      );
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(`Erro ao registrar disparo: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // 2. Disparo via Meta Cloud API Oficial
  const handleMetaApiSend = async () => {
    if (!cleanPhone) {
      setErrorMessage('Por favor, informe um número de telefone com DDD.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setSending(true);

    try {
      const res = await fetch('/api/integrations/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: cleanPhone,
          customerName,
          documentNumber: docNumber,
          amount,
          dueDate,
          paymentData,
          templateName: template,
          mode: 'meta',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.errorMessage ||
            'A Meta Graph API rejeitou o envio. Verifique se o token é válido e o template está homologado.'
        );
        if (data.needsConfiguration) {
          setShowConfigInputs(true);
        }
      } else {
        setLastMessageId(data.providerMessageId);
        setSuccessMessage(
          `Mensagem disparada com sucesso via Meta Cloud API! ID da Meta: ${data.providerMessageId}`
        );
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(`Falha na requisição: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // 3. Simulação Sandbox
  const handleSandboxSend = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSending(true);

    try {
      const res = await fetch('/api/integrations/whatsapp/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: cleanPhone,
          customerName,
          documentNumber: docNumber,
          amount,
          dueDate,
          paymentData,
          templateName: template,
          mode: 'sandbox',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLastMessageId(data.providerMessageId);
        setSuccessMessage(
          `Simulação em Sandbox executada com sucesso! Log gerado com ID ${data.providerMessageId} e evento de leitura simulado.`
        );
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(data.errorMessage || 'Falha na simulação.');
      }
    } catch (err: any) {
      setErrorMessage(`Erro ao simular: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  // Salvar credenciais Meta na hora
  const handleSaveMetaCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/integrations/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: accessTokenInput,
          phoneNumberId: phoneNumberIdInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMetaConfig(data.config);
        setShowConfigInputs(false);
        setSuccessMessage('Credenciais da Meta Cloud API atualizadas no servidor!');
      } else {
        setErrorMessage('Não foi possível salvar as credenciais.');
      }
    } catch (err: any) {
      setErrorMessage(`Erro ao salvar credenciais: ${err.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(renderedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-5 space-y-4 max-h-[92vh] flex flex-col my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span>Disparo e Teste de WhatsApp</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Flind Automações
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Envio direto via WhatsApp Web / Celular, Meta Cloud API ou Simulação Sandbox
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banners */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Aviso no Disparo:</div>
              <div>{errorMessage}</div>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Sucesso:</div>
              <div>{successMessage}</div>
              {lastMessageId && (
                <div className="mt-1 font-mono text-[10px] text-emerald-700">
                  Protocolo / WAMID: {lastMessageId}
                </div>
              )}
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
              ×
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('DIRECT')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'DIRECT'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>1. WhatsApp Web / Celular (100% Funcional)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('META_API')}
            className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'META_API'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-indigo-600" />
            <span>2. Meta Cloud API (Backend)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SANDBOX')}
            className={`py-1.5 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'SANDBOX'
                ? 'bg-white text-amber-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>3. Sandbox</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Aba Meta Cloud API: Informações de credenciais */}
          {activeTab === 'META_API' && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      metaConfig?.isConfigured ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-bold text-slate-800 text-xs">
                    {metaConfig?.isConfigured
                      ? 'Conexão Meta Graph API v21.0 Ativa'
                      : 'Credenciais Meta API Não Configuradas'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfigInputs(!showConfigInputs)}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center space-x-1 text-[11px]"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>{showConfigInputs ? 'Ocultar' : 'Configurar Token / Phone ID'}</span>
                </button>
              </div>

              {showConfigInputs ? (
                <form
                  onSubmit={handleSaveMetaCredentials}
                  className="pt-2 border-t border-indigo-200/60 space-y-2 text-xs"
                >
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      Meta Access Token (Permanente ou Temporário de 24h)
                    </label>
                    <input
                      type="password"
                      value={accessTokenInput}
                      onChange={(e) => setAccessTokenInput(e.target.value)}
                      placeholder="EAAG... ou token gerado no Meta Developers"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">
                      WhatsApp Phone Number ID (ID do número da Meta)
                    </label>
                    <input
                      type="text"
                      value={phoneNumberIdInput}
                      onChange={(e) => setPhoneNumberIdInput(e.target.value)}
                      placeholder="Ex: 104593849502934"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingConfig}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs shadow-xs"
                    >
                      {savingConfig ? 'Salvando...' : 'Salvar Credenciais'}
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-[11px] text-slate-600">
                  {metaConfig?.isConfigured
                    ? `Phone ID: ${metaConfig.phoneNumberId} • Token: ${metaConfig.maskedToken}`
                    : 'Para disparar diretamente pelos servidores sem abrir o WhatsApp, insira seu Access Token do Facebook Developers ou utilize a aba "WhatsApp Web / Celular".'}
                </p>
              )}
            </div>
          )}

          {/* Seleção de Template e Campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Modelo de Notificação</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as WhatsAppTemplateId)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium"
              >
                <option value="lembrete_fatura_vencimento">
                  Lembrete Amigável de Vencimento (D-3 ou D0)
                </option>
                <option value="alerta_vencido_cobranca">
                  Aviso de Vencimento / Pendente (D+1 ou D+3)
                </option>
                <option value="notificacao_cobranca_critica">
                  Notificação Extrajudicial / Cobrança Firme (D+7)
                </option>
                <option value="notificacao_despacho_rastreio">
                  Expedição: Pedido Despachado & Rastreabilidade
                </option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                WhatsApp de Destino (com DDD)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 11 98888-7777 ou 5511988887777"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Formatado automaticamente para envio: +{cleanPhone || '55...'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Cliente / Razão Social</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Documento / Fatura</label>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Valor do Título / Pedido</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Data de Vencimento / Data</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Chave PIX / Código de Barras / Link de Rastreio
            </label>
            <input
              type="text"
              value={paymentData}
              onChange={(e) => setPaymentData(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              required
            />
          </div>

          {/* WhatsApp Chat Preview */}
          <div className="rounded-xl border border-slate-200 bg-emerald-50/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Preview em Tempo Real (Formato WhatsApp)</span>
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center space-x-1 px-2 py-0.5 rounded bg-white border border-slate-200"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>

            <div className="bg-[#E7F8E8] text-[#111B21] p-3 rounded-lg border border-emerald-200 shadow-2xs font-sans text-xs whitespace-pre-wrap leading-relaxed">
              {renderedText}
              <div className="text-[10px] text-slate-500 text-right mt-1 font-mono flex items-center justify-end space-x-1">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-emerald-600 font-bold">✓✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Fechar
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-2">
            {activeTab === 'DIRECT' && (
              <button
                type="button"
                onClick={handleDirectWhatsAppSend}
                disabled={sending}
                className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-200" />
                <span>{sending ? 'Abrindo WhatsApp...' : 'Abrir e Enviar no WhatsApp'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {activeTab === 'META_API' && (
              <button
                type="button"
                onClick={handleMetaApiSend}
                disabled={sending}
                className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <Send className="w-4 h-4 text-indigo-200" />
                <span>{sending ? 'Disparando via Meta...' : 'Disparar via Meta Cloud API'}</span>
              </button>
            )}

            {activeTab === 'SANDBOX' && (
              <button
                type="button"
                onClick={handleSandboxSend}
                disabled={sending}
                className="w-full sm:w-auto px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-xs transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-200" />
                <span>{sending ? 'Executando...' : 'Simular Disparo (Sandbox)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
