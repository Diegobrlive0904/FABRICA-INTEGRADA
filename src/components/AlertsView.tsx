import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Info,
  Check,
  Filter,
} from 'lucide-react';
import { Alert, AlertSeverity, SlaRule } from '../types';

interface AlertsViewProps {
  initialSeverityFilter?: string;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ initialSeverityFilter }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [slaRules, setSlaRules] = useState<SlaRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>(initialSeverityFilter || 'ALL');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | 'ALL'>('PENDING');
  const [checkingSla, setCheckingSla] = useState(false);
  const [editingRule, setEditingRule] = useState<SlaRule | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resAlerts, resRules] = await Promise.all([
        fetch('/api/alerts'),
        fetch('/api/sla-rules'),
      ]);
      if (resAlerts.ok) setAlerts(await resAlerts.json());
      if (resRules.ok) setSlaRules(await resRules.json());
    } catch (err) {
      console.error('Erro ao buscar alertas e SLAs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsible: 'Operador de Turno' }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao reconhecer alerta:', err);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responsible: 'Operador de Turno' }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Erro ao resolver alerta:', err);
    }
  };

  const handleRunSlaCheck = async () => {
    setCheckingSla(true);
    try {
      const res = await fetch('/api/sla-rules/run-check', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActionMsg(`Varredura concluída. ${data.alertsGeneratedCount} alerta(s) de SLA avaliado(s).`);
        await fetchData();
        setTimeout(() => setActionMsg(null), 4000);
      }
    } catch (err) {
      console.error('Erro na checagem de SLA:', err);
    } finally {
      setCheckingSla(false);
    }
  };

  const handleSaveSlaRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    try {
      const res = await fetch(`/api/sla-rules/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule),
      });
      if (res.ok) {
        setEditingRule(null);
        setActionMsg('Regra de SLA atualizada com sucesso.');
        await fetchData();
        setTimeout(() => setActionMsg(null), 3000);
      }
    } catch (err) {
      console.error('Erro ao atualizar SLA:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (severityFilter === 'CRITICAL') return a.severity === 'CRITICAL';
    if (severityFilter === 'WARNING') return a.severity === 'WARNING';
    if (severityFilter === 'INFO') return a.severity === 'INFO';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Banner de Feedback */}
      {actionMsg && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>{actionMsg}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-indigo-700">
            ×
          </button>
        </div>
      )}

      {/* Header Operacional de Alertas & Motor de SLA */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <span>Central de Alertas & Motor Dinâmico de SLA</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento proativo de gargalos fabris, estouros de tempo entre etapas, regras de recebimento violadas e inadimplência.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRunSlaCheck}
            disabled={checkingSla}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{checkingSla ? 'Avaliando SLAs...' : 'Forçar Checagem de SLA'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Configuração de Regras de SLA (Sem tempos hardcoded) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Regras Configuráveis de SLA por Etapa (Sem Tempos Hardcoded)</span>
          </h4>
          <span className="text-xs text-slate-500">Clique para ajustar tolerâncias em minutos</span>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {slaRules.map((rule) => (
            <div
              key={rule.id}
              onClick={() => setEditingRule(rule)}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 cursor-pointer transition-all text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{rule.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    rule.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {rule.severity}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-600">
                Transição: {rule.fromStage} → {rule.toStage}
              </div>
              <div className="mt-2 flex items-center justify-between font-mono">
                <span className="text-slate-500">Limite SLA:</span>
                <span className="font-bold text-indigo-700 text-sm">{rule.slaMinutes} min</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros e Tabela de Alertas Operacionais */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-500 font-medium mr-1 flex items-center">
              <Filter className="w-3.5 h-3.5 mr-1" /> Severidade:
            </span>
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'CRITICAL', label: 'Críticos' },
              { id: 'WARNING', label: 'Warnings' },
              { id: 'INFO', label: 'Informativos' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSeverityFilter(f.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  severityFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {statusFilter === 'PENDING' ? 'Apenas Pendentes' : 'Exibindo Todos'}
            </button>

            <button
              onClick={fetchData}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
              title="Atualizar Alertas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Severidade & Tipo</th>
                <th className="py-3 px-4">Mensagem do Alerta</th>
                <th className="py-3 px-4">Entidade / ID</th>
                <th className="py-3 px-4">Regra Responsável</th>
                <th className="py-3 px-4">Responsável Atual</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum alerta ativo encontrado com os filtros selecionados. Operação em conformidade.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((a) => {
                  const isCritical = a.severity === 'CRITICAL';
                  const isWarning = a.severity === 'WARNING';

                  return (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          {isCritical ? (
                            <span className="p-1 rounded bg-rose-100 text-rose-700">
                              <ShieldAlert className="w-4 h-4" />
                            </span>
                          ) : isWarning ? (
                            <span className="p-1 rounded bg-amber-100 text-amber-700">
                              <AlertTriangle className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="p-1 rounded bg-blue-100 text-blue-700">
                              <Info className="w-4 h-4" />
                            </span>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{a.severity}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{a.type}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 max-w-md">{a.message}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(a.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-700 font-semibold">{a.entityId}</span>
                        <div className="text-[10px] text-slate-500">{a.entityType}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{a.ruleResponsible}</td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">{a.responsible || '—'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.status === 'PENDING'
                              ? 'bg-rose-100 text-rose-800'
                              : a.status === 'ACKNOWLEDGED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {a.status === 'PENDING' && (
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-medium text-xs transition-colors"
                            title="Reconhecer e assumir responsabilidade"
                          >
                            Reconhecer
                          </button>
                        )}
                        {a.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleResolve(a.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs inline-flex items-center space-x-1 transition-colors shadow-2xs"
                            title="Marcar alerta como resolvido"
                          >
                            <Check className="w-3 h-3" />
                            <span>Resolver</span>
                          </button>
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

      {/* MODAL DE EDIÇÃO DE REGRA DE SLA */}
      {editingRule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Editar Tolerância de SLA</h4>
              <button
                onClick={() => setEditingRule(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveSlaRule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Nome da Regra</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule((prev) => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Tempo Limite de SLA (minutos)</label>
                <input
                  type="number"
                  value={editingRule.slaMinutes}
                  onChange={(e) =>
                    setEditingRule((prev) => prev ? { ...prev, slaMinutes: Number(e.target.value) } : null)
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Severidade em caso de Estouro</label>
                <select
                  value={editingRule.severity}
                  onChange={(e) =>
                    setEditingRule((prev) =>
                      prev ? { ...prev, severity: e.target.value as AlertSeverity } : null
                    )
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="WARNING">WARNING</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Salvar SLA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
