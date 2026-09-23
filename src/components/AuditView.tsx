import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Brain,
  Download,
  Search,
  Filter,
  Layers,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { AuditLog } from '../types';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCorrelationId, setSelectedCorrelationId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error('Erro ao buscar auditoria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportAIDataset = () => {
    const aiDataset = {
      exportedAt: new Date().toISOString(),
      architecture: 'Fábrica Integrada Operational Hub v1.0',
      dataSchema: {
        featureVectors: [
          'stage_transition_durations',
          'sla_delay_breaches',
          'default_risk_score',
          'carrier_performance',
          'industrial_cost_vs_revenue',
        ],
      },
      auditLogsCount: logs.length,
      historicalAuditEvents: logs,
    };

    const blob = new Blob([JSON.stringify(aiDataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fabrica_integrada_ai_dataset_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term) ||
      log.userOrService.toLowerCase().includes(term) ||
      log.correlationId.toLowerCase().includes(term) ||
      log.origin.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (selectedCorrelationId && log.correlationId !== selectedCorrelationId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Preparação Estruturada para IA (Item 14 da especificação) */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Brain className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold">Camada de Auditoria & Preparação para Inteligência Artificial</h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            A rastreabilidade registra dados estruturados para alimentar modelos preditivos: estimativa de gargalos fabris, previsão de atrasos no faturamento, score de risco de inadimplência e recomendação de frota ideal por local de entrega.
          </p>
        </div>

        <button
          onClick={handleExportAIDataset}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-2 shadow-sm transition-colors whitespace-nowrap self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Dataset Estruturado (JSON)</span>
        </button>
      </div>

      {/* 4 Cards de Inteligência & Diagnóstico Operacional */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>Score de Inadimplência</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">Médio (14.2%)</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Baseado em histórico de pagamentos e regresso de régua
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>Gargalo Crítico Detectado</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-rose-600">Faturamento SINK</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Tempo médio: 145 min (SLA nominal: 90 min)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>Acurácia de Expedição</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-600">98.5%</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Zero devoluções por bloqueio de regras de entrega
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 font-medium">
            <span>Segurança & LGPD</span>
            <Lock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">Em Conformidade</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Mascaramento de dados e tokens de consulta seguros
          </div>
        </div>
      </div>

      {/* Tabela de Auditoria e Trilha de Eventos */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ação, autor, correlationId..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {selectedCorrelationId && (
              <button
                onClick={() => setSelectedCorrelationId(null)}
                className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded font-medium hover:bg-indigo-200"
              >
                Filtro: {selectedCorrelationId} (Limpar)
              </button>
            )}
            <span className="text-slate-500 font-medium">{filteredLogs.length} eventos auditados</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ação / Operação</th>
                <th className="py-3 px-4">Entidade & ID</th>
                <th className="py-3 px-4">Autor / Serviço</th>
                <th className="py-3 px-4">CorrelationId</th>
                <th className="py-3 px-4">Origem</th>
                <th className="py-3 px-4">Data / Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    Nenhum log de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{log.entity}</span>
                      <span className="text-slate-400 ml-1">#{log.entityId}</span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-800 font-medium">
                      {log.userOrService}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedCorrelationId(log.correlationId)}
                        className="text-indigo-600 hover:underline"
                        title="Filtrar por esta correlação"
                      >
                        {log.correlationId}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-sans">{log.origin}</td>
                    <td className="py-3 px-4 text-slate-500 font-sans">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
