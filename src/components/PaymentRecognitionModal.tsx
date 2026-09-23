import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Zap,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Package,
  BellOff,
  Send,
  Building2,
  X,
  CreditCard,
  QrCode,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Receivable } from '../types';

interface PaymentRecognitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  receivable?: Receivable | null;
  allReceivables?: Receivable[];
}

export const PaymentRecognitionModal: React.FC<PaymentRecognitionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  receivable,
  allReceivables = [],
}) => {
  const [selectedRecId, setSelectedRecId] = useState<string>('');
  const [channel, setChannel] = useState<string>('PIX_AUTOMATICO');
  const [transactionCode, setTransactionCode] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payerName, setPayerName] = useState<string>('');
  const [payerTaxId, setPayerTaxId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [sendConfirmationWhatsApp, setSendConfirmationWhatsApp] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [resultData, setResultData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Determinar o título atual
  const activeReceivable =
    receivable || allReceivables.find((r) => r.id === selectedRecId) || null;

  // Gerador de código de autenticação
  const generateCode = (chn: string) => {
    const prefix =
      chn === 'PIX_AUTOMATICO'
        ? 'E00416968'
        : chn === 'RETORNO_BANCARIO_CNAB'
        ? 'RET-CNAB240'
        : chn === 'CARTAO_GATEWAY'
        ? 'NSU-CARD'
        : chn === 'SINK_ERP'
        ? 'SINK-FIN'
        : 'AUT-BCO';
    const timestamp = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}-${timestamp}-${rand}`;
  };

  useEffect(() => {
    if (receivable) {
      setSelectedRecId(receivable.id);
      setPayerName(receivable.customerName || '');
    } else if (allReceivables.length > 0) {
      const firstOpen = allReceivables.find((r) => r.status !== 'PAID');
      if (firstOpen) {
        setSelectedRecId(firstOpen.id);
        setPayerName(firstOpen.customerName || '');
      }
    }
    setTransactionCode(generateCode(channel));
    setResultData(null);
    setErrorMsg(null);
  }, [isOpen, receivable, allReceivables]);

  const handleChannelChange = (newChannel: string) => {
    setChannel(newChannel);
    setTransactionCode(generateCode(newChannel));
  };

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReceivable) {
      setErrorMsg('Selecione um título para realizar a baixa automática.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/financial/recognize-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivableId: activeReceivable.id,
          documentNumber: activeReceivable.documentNumber,
          orderId: activeReceivable.orderId,
          amount: activeReceivable.amount,
          channel,
          transactionCode,
          paymentDate,
          payerName: payerName || activeReceivable.customerName,
          payerTaxId,
          notes,
          sendConfirmationWhatsApp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar baixa.');
      }

      setResultData(data);
      onSuccess(data.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao registrar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-linear-to-r from-emerald-600 via-teal-700 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Zap className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Reconhecimento de Pagamento & Baixa Automática</span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  Instantâneo
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Baixa imediata do título, sincronização do pedido para PAGO e cancelamento de cobranças.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback de Sucesso Pós-Processamento */}
        {resultData ? (
          <div className="p-6 space-y-6">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Baixa Automática Concluída com Sucesso!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">{resultData.message}</p>
                <div className="mt-2 text-[11px] font-mono text-emerald-800 bg-white/80 p-2 rounded border border-emerald-200 inline-block">
                  Protocolo / Autenticação: <span className="font-bold">{resultData.clearingDetails?.transactionCode}</span>
                </div>
              </div>
            </div>

            {/* Checklist de Ações Executadas em Cascata */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Efeitos da Baixa Automática no Sistema:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Título Contas a Receber:</span>
                    <span className="text-emerald-700 font-bold ml-1">Status LIQUIDADO (PAID)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                  <Package className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Pedido {resultData.orderNumber || 'Vinculado'}:</span>
                    <span className="text-blue-700 font-bold ml-1">Liberado & Pago</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                  <BellOff className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Régua de Cobrança WhatsApp:</span>
                    <span className="text-slate-600 ml-1">Cobranças futuras canceladas</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Alertas Operacionais:</span>
                    <span className="text-purple-700 font-semibold ml-1">
                      {resultData.resolvedAlertsCount > 0
                        ? `${resultData.resolvedAlertsCount} resolvido(s)`
                        : 'Sem pendências'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Concluir & Atualizar Tela
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Seleção do Título (se aberto sem receivable específico) */}
            {!receivable && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecione o Título a Receber:
                </label>
                <select
                  value={selectedRecId}
                  onChange={(e) => {
                    setSelectedRecId(e.target.value);
                    const found = allReceivables.find((r) => r.id === e.target.value);
                    if (found) setPayerName(found.customerName || '');
                  }}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                >
                  <option value="">-- Selecione um título pendente --</option>
                  {allReceivables
                    .filter((r) => r.status !== 'PAID')
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.documentNumber} • {r.customerName} • {formatBRL(r.amount)} • Venc:{' '}
                        {new Date(r.dueDate).toLocaleDateString('pt-BR')} ({r.status})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Card com Detalhes do Título Ativo */}
            {activeReceivable && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Documento Selecionado
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                      <span>{activeReceivable.documentNumber}</span>
                      <span className="text-xs font-normal text-slate-500">
                        (NF: {activeReceivable.invoiceNumber || '—'})
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Cliente: <span className="font-semibold text-slate-800">{activeReceivable.customerName}</span>
                      {activeReceivable.orderNumber && (
                        <span className="ml-2 font-mono text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded text-[10px]">
                          Pedido: {activeReceivable.orderNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-slate-500">Valor Original</div>
                    <div className="text-base font-extrabold text-emerald-600 font-mono">
                      {formatBRL(activeReceivable.amount)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Vencimento: {new Date(activeReceivable.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Canal de Reconhecimento / Pagamento */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Canal de Pagamento Reconhecido:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'PIX_AUTOMATICO', label: 'Pix Instantâneo', icon: QrCode, badge: 'Recomendado' },
                  { id: 'RETORNO_BANCARIO_CNAB', label: 'Retorno Bancário CNAB', icon: FileText, badge: 'Boleto' },
                  { id: 'CARTAO_GATEWAY', label: 'Cartão / Gateway', icon: CreditCard },
                  { id: 'SINK_ERP', label: 'SINK ERP Sincronizado', icon: Building2 },
                  { id: 'TRANSFERENCIA_TED', label: 'TED / Depósito', icon: DollarSign },
                  { id: 'MANUAL', label: 'Baixa em Caixa Balcão', icon: CheckCircle2 },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = channel === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleChannelChange(item.id)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-500 text-emerald-950 font-bold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon
                          className={`w-4 h-4 ${
                            isSelected ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                        {item.badge && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-200/60 text-emerald-800 font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-xs mt-2 block">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dados da Transação Bancária / Autenticação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Código de Autenticação / EndToEnd:
                  </label>
                  <button
                    type="button"
                    onClick={() => setTransactionCode(generateCode(channel))}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                  >
                    Gerar Novo
                  </button>
                </div>
                <input
                  type="text"
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value)}
                  className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Ex: E00416968..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data Efetiva da Liquidação:
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Nome do Pagador e Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome / Razão do Pagador:
                </label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Nome do cliente ou titular"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações / Histórico:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Pagamento confirmado via conciliação bancária"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Checkbox de Disparo Automático WhatsApp de Confirmação */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <input
                  type="checkbox"
                  id="sendWppCheck"
                  checked={sendConfirmationWhatsApp}
                  onChange={(e) => setSendConfirmationWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="sendWppCheck" className="text-xs text-slate-800 font-semibold cursor-pointer">
                  Disparar recibo de confirmação automática no WhatsApp do cliente
                </label>
              </div>
              <span className="text-[10px] text-emerald-700 font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">
                +55 WhatsApp
              </span>
            </div>

            {/* Resumo do Fluxo em Cascata */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 flex items-center space-x-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>O que acontece ao clicar em "Processar Baixa Automática":</span>
              </div>
              <p>• O título é marcado como <strong>LIQUIDADO</strong> com a data e protocolo informados.</p>
              <p>• O pedido vinculado tem seu status financeiro alterado imediatamente para <strong>PAGO</strong>.</p>
              <p>• A esteira de produção e expedição é desbloqueada para faturamento e despacho.</p>
              <p>• A régua de cobrança automática é cancelada para evitar qualquer contato indevido.</p>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading || !activeReceivable}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>{loading ? 'Processando Baixa...' : 'Processar Baixa Automática Agora'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
