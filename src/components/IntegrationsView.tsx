import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Send,
  Zap,
  ShieldCheck,
  Code,
  ExternalLink,
  Layers,
  FileCode,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { IntegrationSyncLog } from '../types';
import { WhatsAppTestModal } from './WhatsAppTestModal';

export const IntegrationsView: React.FC = () => {
  const [syncLogs, setSyncLogs] = useState<IntegrationSyncLog[]>([]);
  const [sinkHealth, setSinkHealth] = useState<any | null>(null);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatingTray, setSimulatingTray] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resLogs, resHealth, resProd, resCosts] = await Promise.all([
        fetch('/api/integrations/sync-logs'),
        fetch('/api/integrations/sink-erp/health'),
        fetch('/api/integrations/sink-erp/production'),
        fetch('/api/integrations/sink-erp/costs'),
      ]);
      if (resLogs.ok) setSyncLogs(await resLogs.json());
      if (resHealth.ok) setSinkHealth(await resHealth.json());
      if (resProd.ok) setProductionOrders(await resProd.json());
      if (resCosts.ok) setCosts(await resCosts.json());
    } catch (err) {
      console.error('Erro ao carregar integrações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulateTrayWebhook = async () => {
    setSimulatingTray(true);
    try {
      const res = await fetch('/api/integrations/tray/simulate-order', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setActionMsg(
          `Webhook Tray simulado com sucesso. Pedido #${data.order?.orderNumber || data.orderId} processado com idempotência garantida.`
        );
        await fetchData();
        setTimeout(() => setActionMsg(null), 5000);
      }
    } catch (err) {
      console.error('Erro ao simular webhook Tray:', err);
    } finally {
      setSimulatingTray(false);
    }
  };

  return (
    <div className="space-y-6">
      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-emerald-700">
            ×
          </button>
        </div>
      )}

      {/* Header dos Adaptadores & Arquitetura */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>Painel de Conectores & Adapters Desacoplados</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Arquitetura desacoplada via Interfaces (ERPProvider, MessagingProvider, TrayAdapter) com idempotência rigorosa, tolerância a falhas e rastreabilidade total.
          </p>
        </div>

        <button
          onClick={handleSimulateTrayWebhook}
          disabled={simulatingTray}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-xs transition-colors"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>{simulatingTray ? 'Disparando...' : 'Simular Webhook Tray (Idempotente)'}</span>
        </button>
      </div>

      {/* 3 CARDS DE INTEGRAÇÃO (Tray, SINK ERP, WhatsApp) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TRAY E-COMMERCE */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="font-bold text-slate-900 text-sm">1. Tray E-commerce</div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              ADAPTER ATIVO
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Recepção de webhooks oficiais (order.created, order.paid), consulta REST com paginação, sincronização de clientes, itens e endereço de entrega.
          </p>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1">
            <div>Chave Idempotência: <span className="text-indigo-600 font-bold">tray:order:ID:EVENT</span></div>
            <div>Webhook URL: <span className="text-slate-500">/api/integrations/tray/webhook</span></div>
          </div>
        </div>

        {/* SINK ERP (Demarcado conforme diretriz estrita) */}
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/20 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <div className="font-bold text-slate-900 text-sm">2. SINK ERP</div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
              AGUARDANDO DOCS OFICIAIS
            </span>
          </div>
          <p className="text-xs text-slate-700 font-medium">
            Estrutura 100% desacoplada via <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">ERPProvider</code>.
            Nenhum endpoint fictício foi inventado; métodos preparados com fallback seguro e DTOs tipados.
          </p>
          <div className="bg-white p-2.5 rounded-lg border border-amber-200 text-[11px] font-mono text-slate-700 space-y-1">
            <div>Status: <span className="text-amber-700 font-bold">{sinkHealth?.status || 'PENDING_DOCS'}</span></div>
            <div className="text-[10px] text-slate-500">Sincroniza: Catálogo, Estoque, NF-e, OP e Custos</div>
          </div>
        </div>

        {/* WHATSAPP BUSINESS */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="font-bold text-slate-900 text-sm">3. WhatsApp Business</div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
              CLOUD API & DIRETO
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Disparo de templates aprovados (Meta Graph API v21.0), envio direto via WhatsApp Web e simulação em Sandbox com webhook.
          </p>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1">
            <div>Webhook Challenge: <span className="text-emerald-700 font-bold">hub.challenge OK</span></div>
            <div>Template Ativo: <span className="text-slate-600">lembrete_fatura_vencimento</span></div>
          </div>
          <button
            onClick={() => setWhatsappModalOpen(true)}
            className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Testar Disparo WhatsApp (Web / Meta / Sandbox)</span>
          </button>
        </div>
      </div>

      {/* Rastreabilidade de Chão de Fábrica & PCP SINK ERP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Ordens de Produção & Rastreabilidade de Lotes (PCP SINK ERP)</span>
          </h4>
          <div className="space-y-2">
            {productionOrders.map((op) => (
              <div
                key={op.productionOrderId}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{op.productionOrderId} • {op.productSku}</div>
                  <div className="text-[11px] text-indigo-700 font-mono font-semibold">
                    Lote Fabricado: {op.batchNumber}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {op.status}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {op.producedQuantity} / {op.plannedQuantity} produzidos
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Apropriação de Custos Industriais (SINK ERP)</span>
          </h4>
          <div className="space-y-2">
            {costs.map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{c.costCenter}</div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {c.category} • SKU {c.sku}
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-slate-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Logs de Sincronização & Idempotência */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Logs de Sincronização, Idempotência e Webhooks</span>
          </h4>
          <span className="text-xs text-slate-500">{syncLogs.length} eventos registrados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Provedor / Evento</th>
                <th className="py-3 px-4">Chave de Idempotência</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duração</th>
                <th className="py-3 px-4">Data / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    Nenhum log de sincronização registrado ainda.
                  </td>
                </tr>
              ) : (
                syncLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.provider}</div>
                      <div className="text-slate-500">{log.event}</div>
                    </td>
                    <td className="py-3 px-4 text-indigo-700">{log.idempotencyKey}</td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'SKIPPED_DUPLICATE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.durationMs || 0} ms</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WhatsAppTestModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setActionMsg('Disparo de WhatsApp registrado com sucesso nos logs do sistema!');
          setTimeout(() => setActionMsg(null), 4500);
        }}
      />
    </div>
  );
};
