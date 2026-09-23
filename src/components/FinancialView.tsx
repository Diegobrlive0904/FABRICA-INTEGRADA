import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Zap,
  Package,
  Radio,
  Check,
  Activity,
  MessageCircle,
} from 'lucide-react';
import { Receivable, ReceivableStatus, WhatsAppMessageLog } from '../types';

interface FinancialViewProps {
  initialStatusFilter?: string;
}

export const FinancialView: React.FC<FinancialViewProps> = ({ initialStatusFilter }) => {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppMessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('pt-BR'));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resRec, resLogs] = await Promise.all([
        fetch('/api/receivables'),
        fetch('/api/integrations/whatsapp/logs'),
      ]);
      if (resRec.ok) setReceivables(await resRec.json());
      if (resLogs.ok) setWhatsappLogs(await resLogs.json());
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Atualização periódica automática em segundo plano para refletir baixas identificadas pelo sistema
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getDaysOverdue = (dueDateStr: string) => {
    const dueTime = new Date(dueDateStr).getTime();
    const todayTime = new Date(new Date().toISOString().split('T')[0]).getTime();
    return Math.max(1, Math.round((todayTime - dueTime) / 86400000));
  };

  // Métricas Consolidadas
  const totalOpenAmount = receivables
    .filter((r) => r.status === 'OPEN' || r.status === 'DUE_SOON' || r.status === 'DUE_TODAY')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalOverdueAmount = receivables
    .filter((r) => r.status === 'OVERDUE')
    .reduce((sum, r) => sum + r.amount, 0);

  const paidReceivables = receivables.filter((r) => r.status === 'PAID');
  const totalPaidAmount = paidReceivables.reduce((sum, r) => sum + r.amount, 0);

  const autoClearedReceivables = paidReceivables.filter((r) => r.autoCleared);
  const totalAutoClearedAmount = autoClearedReceivables.reduce((sum, r) => sum + r.amount, 0);

  const overdueReceivables = receivables.filter((r) => r.status === 'OVERDUE');

  const filteredReceivables = receivables.filter((r) => {
    const matchesSearch =
      r.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.transactionCode || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'OVERDUE') return r.status === 'OVERDUE';
    if (statusFilter === 'DUE_TODAY') return r.status === 'DUE_TODAY';
    if (statusFilter === 'DUE_SOON') return ['OPEN', 'DUE_SOON'].includes(r.status);
    if (statusFilter === 'PAID') return r.status === 'PAID';
    if (statusFilter === 'AUTO_CLEARED') return r.status === 'PAID' && Boolean(r.autoCleared);
    return r.status === statusFilter;
  });

  const getStatusBadge = (rec: Receivable) => {
    if (rec.status === 'PAID') {
      const channelLabel =
        rec.clearingChannel === 'PIX_AUTOMATICO'
          ? 'Pix Instantâneo'
          : rec.clearingChannel === 'RETORNO_BANCARIO_CNAB'
          ? 'Retorno CNAB'
          : rec.clearingChannel === 'TRAY'
          ? 'Tray E-commerce'
          : rec.clearingChannel === 'SINK_ERP'
          ? 'SINK ERP'
          : 'Sistema';
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold shadow-2xs">
          <Zap className="w-3 h-3 mr-1 text-emerald-600 fill-emerald-600" />
          Liquidado ({channelLabel})
        </span>
      );
    }

    const map: Record<ReceivableStatus, { label: string; cls: string }> = {
      OPEN: { label: 'A Vencer', cls: 'bg-slate-100 text-slate-800' },
      DUE_SOON: { label: 'Vencimento Próximo (D-5)', cls: 'bg-blue-100 text-blue-800 font-medium' },
      DUE_TODAY: { label: 'Vencendo Hoje (D0)', cls: 'bg-amber-100 text-amber-800 font-bold' },
      OVERDUE: { label: 'Vencido (Cobrança Diária)', cls: 'bg-rose-100 text-rose-800 font-bold' },
      PAID: { label: 'Liquidado / Pago', cls: 'bg-emerald-100 text-emerald-800 font-bold' },
      CANCELLED: { label: 'Cancelado', cls: 'bg-slate-200 text-slate-600' },
    };
    const s = map[rec.status] || { label: rec.status, cls: 'bg-slate-100 text-slate-800' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Controle de Automação Financeira e Baixa por Identificação do Sistema */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Contas a Receber & Baixa Automática do Sistema
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Sistema Autônomo Ativo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            A baixa financeira <strong className="text-slate-800 font-semibold">não depende de cliques manuais</strong>: o sistema identifica os pagamentos diretamente via Webhooks Pix Instantâneo, Retornos Bancários CNAB e sincronização com ERP. A régua de WhatsApp emite alertas <strong className="text-slate-800 font-semibold">5 dias antes (D-5)</strong>, no <strong className="text-slate-800 font-semibold">dia do vencimento (D0)</strong> e <strong className="text-rose-700 font-semibold">disparos diários para títulos vencidos</strong>, cancelando cobranças automaticamente assim que a liquidação for detectada.
          </p>
        </div>

        {/* Status de Operação do Sistema */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Escuta 24/7 de Webhooks Pix</span>
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Conciliação Autônoma CNAB/ERP</span>
          </div>

          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Atualizar dados do servidor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizado {lastSyncTime}</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Financeiras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">A Vencer / Em Aberto</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-xl font-extrabold text-slate-900 font-mono">
            {formatBRL(totalOpenAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {receivables.filter((r) => ['OPEN', 'DUE_SOON', 'DUE_TODAY'].includes(r.status)).length} título(s) monitorados pelo sistema
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-rose-700">Títulos Vencidos</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-extrabold text-rose-600 font-mono">
            {formatBRL(totalOverdueAmount)}
          </div>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            {overdueReceivables.length} título(s) em cobrança diária WhatsApp
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Total Liquidado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-extrabold text-emerald-700 font-mono">
            {formatBRL(totalPaidAmount)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {paidReceivables.length} título(s) quitados com sucesso
          </div>
        </div>

        <div className="p-4 bg-linear-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-900 text-xs">
            <span className="font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              Baixas Automáticas pelo Sistema
            </span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-200/60 text-emerald-800 text-[10px] font-bold">
              100% Autônomo
            </span>
          </div>
          <div className="mt-2 text-xl font-extrabold text-emerald-800 font-mono">
            {formatBRL(totalAutoClearedAmount)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center justify-between">
            <span>{autoClearedReceivables.length} baixados sem intervenção</span>
            <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200">
              {paidReceivables.length > 0
                ? `${Math.round((autoClearedReceivables.length / paidReceivables.length) * 100)}% auto`
                : '100% auto'}
            </span>
          </div>
        </div>
      </div>

      {/* Cobrança por WhatsApp — Apenas Títulos Vencidos (Disparo Diário) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                Cobrança por WhatsApp — Títulos Vencidos (Disparo Diário Automático)
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {overdueReceivables.length} vencido(s)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Os alertas prévios de <strong className="text-slate-700 font-semibold">5 dias antes (D-5)</strong> e no <strong className="text-slate-700 font-semibold">dia do vencimento (D0)</strong> rodam em segundo plano. Abaixo estão exibidos <strong className="text-rose-700 font-semibold">exclusivamente os títulos vencidos</strong>, que recebem disparo diário automático via WhatsApp até o sistema identificar o pagamento.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500 self-start sm:self-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cancelamento automático no momento da baixa</span>
          </div>
        </div>

        {/* Lista de Títulos Vencidos em Cobrança Diária */}
        <div className="mt-4">
          {overdueReceivables.length === 0 ? (
            <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <div className="font-bold text-emerald-900">Nenhum título vencido no momento!</div>
              <div className="text-emerald-700 text-[11px] mt-0.5">
                Todos os clientes estão em dia ou os pagamentos já foram identificados e baixados pelo sistema.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {overdueReceivables.map((rec) => {
                const days = getDaysOverdue(rec.dueDate);
                const wppLog = whatsappLogs.find((l) => l.receivableId === rec.id);

                return (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl border border-rose-200/90 bg-rose-50/30 hover:bg-rose-50/50 transition-colors flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">{rec.documentNumber}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          {days} dia(s) em atraso
                        </span>
                      </div>

                      {/* Cliente e Valor */}
                      <div className="mt-2">
                        <div className="font-bold text-slate-800 text-xs line-clamp-1">{rec.customerName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                          <span>Venceu em {new Date(rec.dueDate).toLocaleDateString('pt-BR')}</span>
                          <span className="font-mono font-extrabold text-rose-700 text-xs">
                            {formatBRL(rec.amount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status da Cobrança Diária WhatsApp */}
                    <div className="mt-3 pt-3 border-t border-rose-200/60 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          Régua Diária:
                        </span>
                        <span className="font-semibold text-rose-800">Disparo Diário Ativo</span>
                      </div>

                      {wppLog ? (
                        <div className="flex items-center justify-between text-slate-500 text-[10px]">
                          <span>Último envio WhatsApp:</span>
                          <span className="font-mono font-medium text-slate-700">
                            {wppLog.status === 'READ' ? '✓✓ Lido' : wppLog.status === 'DELIVERED' ? '✓✓ Entregue' : '✓ Enviado'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-500 italic">
                          Disparo diário programado para este título
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 bg-white/70 rounded p-1 border border-rose-100 text-center font-mono">
                        Cancelamento automático ao identificar pagamento
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Títulos a Receber com Identificação e Baixa pelo Sistema */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Barra de Busca e Filtros */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar título, cliente, pedido ou código..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-1 text-xs w-full sm:w-auto overflow-x-auto scrollbar-none">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'OVERDUE', label: 'Vencidos (Cobrança Diária)' },
              { id: 'DUE_TODAY', label: 'Vencendo Hoje (D0)' },
              { id: 'DUE_SOON', label: 'A Vencer (D-5)' },
              { id: 'PAID', label: 'Liquidados' },
              { id: 'AUTO_CLEARED', label: '⚡ Baixas Automáticas' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={fetchData}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors ml-auto cursor-pointer"
              title="Atualizar Títulos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabela de Títulos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Título / Documento</th>
                <th className="py-3 px-4">Cliente / Pedido</th>
                <th className="py-3 px-4">Vencimento / Liquidação</th>
                <th className="py-3 px-4">Valor Original</th>
                <th className="py-3 px-4">Status do Título</th>
                <th className="py-3 px-4">Cobrança WhatsApp</th>
                <th className="py-3 px-4 text-right">Identificação de Pagamento & Baixa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    Nenhum título encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredReceivables.map((rec) => {
                  const isPaid = rec.status === 'PAID';
                  const wppLog = whatsappLogs.find((l) => l.receivableId === rec.id);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Documento */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{rec.documentNumber}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ID: {rec.id} • {rec.source}
                        </div>
                        {rec.transactionCode && (
                          <div className="text-[10px] text-emerald-800 font-mono mt-0.5 truncate max-w-[180px]" title={rec.transactionCode}>
                            Aut: {rec.transactionCode}
                          </div>
                        )}
                      </td>

                      {/* Cliente e Pedido */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{rec.customerName}</div>
                        {rec.orderNumber ? (
                          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                            <Package className="w-3 h-3" />
                            <span>Pedido {rec.orderNumber}</span>
                            {isPaid && (
                              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1 rounded font-bold">
                                Liberado
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">Sem pedido direto</div>
                        )}
                      </td>

                      {/* Vencimento e Liquidação */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {new Date(rec.dueDate).toLocaleDateString('pt-BR')}
                        </div>
                        {isPaid && rec.paymentDate && (
                          <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Liquidado em {new Date(rec.paymentDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                        {formatBRL(rec.amount)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">{getStatusBadge(rec)}</td>

                      {/* Cobrança WhatsApp */}
                      <td className="py-3 px-4">
                        {isPaid ? (
                          <div className="flex items-center space-x-1.5 text-[11px] text-emerald-800 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Cobranças Canceladas</span>
                          </div>
                        ) : rec.status === 'OVERDUE' ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 text-rose-700 font-bold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                              <span>Cobrança Diária Ativa</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {wppLog ? `Status: ${wppLog.status}` : 'Disparando todo dia'}
                            </div>
                          </div>
                        ) : rec.status === 'DUE_TODAY' ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 text-amber-700 font-bold text-[11px]">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Lembrete D0 (Hoje)</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {wppLog ? `Status: ${wppLog.status}` : 'Disparo no vencimento'}
                            </div>
                          </div>
                        ) : rec.status === 'DUE_SOON' ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 text-blue-700 font-medium text-[11px]">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>Alerta D-5 (5 dias antes)</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {wppLog ? `Status: ${wppLog.status}` : 'Disparo prévio ativo'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No prazo (aguarda D-5)</span>
                        )}
                      </td>

                      {/* Identificação de Pagamento & Baixa do Sistema (Sem necessidade de apertar botão) */}
                      <td className="py-3 px-4 text-right">
                        {isPaid ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                              Liquidado pelo Sistema
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {rec.clearingChannel === 'PIX_AUTOMATICO'
                                ? 'Pix Instantâneo'
                                : rec.clearingChannel === 'RETORNO_BANCARIO_CNAB'
                                ? 'Retorno Bancário CNAB'
                                : rec.clearingChannel || 'Conciliação Automática'}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5"></span>
                              Identificação Automática Ativa
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Monitorando Pix & Compensação Bancária
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
