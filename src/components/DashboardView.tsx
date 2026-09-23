import React from 'react';
import {
  ShoppingCart,
  DollarSign,
  Truck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Flame,
  Calendar,
  Boxes,
  Building2,
  Zap,
} from 'lucide-react';
import { DashboardMetrics } from '../types';
import { NavTab } from './Navbar';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  onNavigateTab: (tab: NavTab, filter?: string) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  onNavigateTab,
  onRefresh,
}) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Clock className="w-5 h-5 animate-spin mr-2" /> Carregando métricas operacionais...
      </div>
    );
  }

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const { orders, financial, logistics, alerts } = metrics;
  const aging = financial.agingBuckets;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert se houver gargalos ou alertas críticos */}
      {alerts.criticalCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-rose-900">
                Atenção Operacional: {alerts.criticalCount} Alerta(s) Crítico(s) Requerem Ação Imediata
              </h4>
              <p className="text-xs text-rose-700">
                Gargalos de SLA ou infrações de regras de entrega e expedição detectadas no fluxo operacional.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('alerts')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <span>Ver Alertas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid Principal: 4 Pilares da Operação Flind */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* PILAR 1: PEDIDOS */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Pedidos Flind</h3>
            </div>
            <button
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
            >
              Ver todos <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{orders.total}</span>
              <span className="text-xs text-slate-500">Total em carteira</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('orders', 'NEW')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <div className="text-slate-500 font-medium">Novos</div>
              <div className="text-base font-semibold text-slate-900 mt-0.5">{orders.new}</div>
            </button>
            <button
              onClick={() => onNavigateTab('orders', 'PROCESSING')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <div className="text-slate-500 font-medium">Processando</div>
              <div className="text-base font-semibold text-indigo-600 mt-0.5">{orders.processing}</div>
            </button>
            <button
              onClick={() => onNavigateTab('orders', 'BILLED')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <div className="text-slate-500 font-medium">Faturados / NF-e</div>
              <div className="text-base font-semibold text-emerald-600 mt-0.5">{orders.billed}</div>
            </button>
            <button
              onClick={() => onNavigateTab('orders', 'DELAYED')}
              className={`p-2 rounded-lg text-left transition-colors ${
                orders.delayed > 0 ? 'bg-rose-50 text-rose-800 hover:bg-rose-100' : 'bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="font-medium flex items-center">
                <span>Atrasados</span>
                {orders.delayed > 0 && <Flame className="w-3 h-3 ml-1 text-rose-500" />}
              </div>
              <div className={`text-base font-semibold mt-0.5 ${orders.delayed > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {orders.delayed}
              </div>
            </button>
          </div>
        </div>

        {/* PILAR 2: FINANCEIRO */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Contas a Receber</h3>
            </div>
            <button
              onClick={() => onNavigateTab('financial')}
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium flex items-center"
            >
              Ver Títulos <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xl font-bold text-slate-900">{formatBRL(financial.totalOverdueAmount)}</span>
                <span className="block text-[11px] text-rose-600 font-medium">Em atraso ({financial.overdueCount} títulos)</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-slate-600">{financial.paidCount}</span>
                <span className="block text-[11px] text-emerald-600">Recebidos</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('financial', 'DUE_SOON')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <div className="text-slate-500 font-medium">A Vencer</div>
              <div className="text-base font-semibold text-slate-800 mt-0.5">{financial.dueSoonCount}</div>
            </button>
            <button
              onClick={() => onNavigateTab('financial', 'DUE_TODAY')}
              className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-left transition-colors text-amber-900"
            >
              <div className="font-medium">Vencendo Hoje</div>
              <div className="text-base font-semibold text-amber-700 mt-0.5">{financial.dueTodayCount}</div>
            </button>
            <button
              onClick={() => onNavigateTab('financial', 'OVERDUE')}
              className="col-span-2 p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-left transition-colors"
            >
              <div className="text-rose-700 font-medium flex items-center justify-between">
                <span>Total Vencido em Carteira</span>
                <span className="font-bold">{financial.overdueCount} títulos</span>
              </div>
              <div className="text-sm font-bold text-rose-700 mt-0.5">{formatBRL(financial.totalOverdueAmount)}</div>
            </button>
          </div>
        </div>

        {/* PILAR 3: LOGÍSTICA & EXPEDIÇÃO */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Logística Hospitalar</h3>
            </div>
            <button
              onClick={() => onNavigateTab('logistics')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
            >
              Ver Cargas <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{logistics.inTransit}</span>
              <span className="text-xs text-slate-500">Cargas em Transporte</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('logistics', 'WAITING_DISPATCH')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <div className="text-slate-500 font-medium">Aguard. Expedição</div>
              <div className="text-base font-semibold text-slate-900 mt-0.5">{logistics.waitingExpedition}</div>
            </button>
            <button
              onClick={() => onNavigateTab('logistics', 'IN_TRANSIT')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <div className="text-slate-500 font-medium">Em Trânsito</div>
              <div className="text-base font-semibold text-blue-600 mt-0.5">{logistics.inTransit}</div>
            </button>
            <button
              onClick={() => onNavigateTab('logistics', 'DELIVERED')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <div className="text-slate-500 font-medium">Entregues</div>
              <div className="text-base font-semibold text-emerald-600 mt-0.5">{logistics.delivered}</div>
            </button>
            <button
              onClick={() => onNavigateTab('logistics', 'ISSUES')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left transition-colors"
            >
              <div className="text-slate-500 font-medium">Ocorrências</div>
              <div className={`text-base font-semibold mt-0.5 ${logistics.issuesCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {logistics.issuesCount}
              </div>
            </button>
          </div>
        </div>

        {/* PILAR 4: ALERTAS & SLA */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm">Alertas & SLA</h3>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs text-amber-600 hover:text-amber-800 font-medium flex items-center"
            >
              Central <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900">{alerts.totalPending}</span>
              <span className="text-xs text-slate-500">Pendentes de Ação</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('alerts', 'CRITICAL')}
              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-left transition-colors"
            >
              <div className="text-rose-600 font-medium flex items-center">
                <span>Críticos</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-1.5"></span>
              </div>
              <div className="text-base font-semibold text-rose-700 mt-0.5">{alerts.criticalCount}</div>
            </button>
            <button
              onClick={() => onNavigateTab('alerts', 'WARNING')}
              className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-left transition-colors"
            >
              <div className="text-amber-600 font-medium">Warnings</div>
              <div className="text-base font-semibold text-amber-700 mt-0.5">{alerts.warningCount}</div>
            </button>
            <button
              onClick={() => onNavigateTab('alerts', 'RESOLVED')}
              className="col-span-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-left transition-colors flex items-center justify-between"
            >
              <span className="text-slate-500 font-medium">Resolvidos / Tratados</span>
              <span className="text-base font-semibold text-emerald-600">{alerts.resolvedCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seção Nova: ESTOQUE, EMBALAGENS & REPOSIÇÃO AUTOMÁTICA DE FORNECEDORES */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <span>Estoque de Produtos, Volumes & Reposição Automática via WhatsApp</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold flex items-center space-x-1">
                <Zap className="w-2.5 h-2.5 text-amber-600" />
                <span>DISPARO AUTOMÁTICO ATIVO</span>
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rastreabilidade de embalagens (CX/FD), unidades internas, pesagem, fabricação e validade com ordens automáticas para fornecedores homologados.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateTab('suppliers')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Fornecedores & P.O. ({metrics.suppliers?.totalSuppliers || 0})</span>
            </button>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <span>Gerenciar Estoque</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Produtos</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {metrics.inventory?.totalItems || 0} SKUs
            </div>
            <div className="text-[10px] text-slate-500">Linha fabril Flind</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total em Volumes</div>
            <div className="text-lg font-black text-indigo-600 mt-0.5">
              {(metrics.inventory?.totalPackages || 0).toLocaleString('pt-BR')} vol
            </div>
            <div className="text-[10px] text-slate-500">Caixas e fardos</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total em Unidades</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {(metrics.inventory?.totalUnits || 0).toLocaleString('pt-BR')} un
            </div>
            <div className="text-[10px] text-slate-500">Peças individuais</div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
            <div className="text-[10px] uppercase font-bold text-emerald-700">Nível Saudável</div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">
              {metrics.inventory?.normalStockCount || 0}
            </div>
            <div className="text-[10px] text-emerald-600">Dentro da meta</div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
            <div className="text-[10px] uppercase font-bold text-amber-800">Estoque Baixo</div>
            <div className="text-lg font-black text-amber-700 mt-0.5">
              {metrics.inventory?.lowStockCount || 0}
            </div>
            <div className="text-[10px] text-amber-700/80">Ponto de pedido</div>
          </div>

          <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200">
            <div className="text-[10px] uppercase font-bold text-rose-800">Crítico / Auto P.O.</div>
            <div className="text-lg font-black text-rose-700 mt-0.5">
              {metrics.inventory?.criticalStockCount || 0}
            </div>
            <div className="text-[10px] text-rose-700/80 font-bold flex items-center space-x-1">
              <Zap className="w-2.5 h-2.5 text-rose-600" />
              <span>{metrics.inventory?.autoReordersCount || 0} disparos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: AGING BREAKDOWN FINANCEIRO (Item 12 da especificação) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm flex items-center space-x-2">
              <span>Aging Breakdown — Contas a Receber por Faixa de Atraso</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                DISPARO DIÁRIO PÓS-VENCIMENTO
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribuição de inadimplência e títulos vencidos para automação de cobrança via WhatsApp Business
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('financial')}
            className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition-colors w-fit"
          >
            Abrir Painel Financeiro
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1 a 3 dias */}
          <div
            onClick={() => onNavigateTab('financial', 'OVERDUE')}
            className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">1 a 3 dias</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800 font-bold">
                {aging.overdue1to3.count}
              </span>
            </div>
            <div className="mt-2 text-base font-bold text-amber-950 font-mono">
              {formatBRL(aging.overdue1to3.amount)}
            </div>
            <div className="mt-1 text-[11px] text-amber-700">Régua D+1 / D+3 disparada</div>
          </div>

          {/* 4 a 7 dias */}
          <div
            onClick={() => onNavigateTab('financial', 'OVERDUE')}
            className="p-3.5 rounded-xl border border-orange-200/80 bg-orange-50/50 hover:bg-orange-50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-orange-900">4 a 7 dias</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-200/60 text-orange-800 font-bold">
                {aging.overdue4to7.count}
              </span>
            </div>
            <div className="mt-2 text-base font-bold text-orange-950 font-mono">
              {formatBRL(aging.overdue4to7.amount)}
            </div>
            <div className="mt-1 text-[11px] text-orange-700">Régua D+7 em andamento</div>
          </div>

          {/* 8 a 30 dias */}
          <div
            onClick={() => onNavigateTab('financial', 'OVERDUE')}
            className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-900">8 a 30 dias</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200/60 text-rose-800 font-bold">
                {aging.overdue8to30.count}
              </span>
            </div>
            <div className="mt-2 text-base font-bold text-rose-950 font-mono">
              {formatBRL(aging.overdue8to30.amount)}
            </div>
            <div className="mt-1 text-[11px] text-rose-700">Atraso moderado (Alerta Gerado)</div>
          </div>

          {/* Mais de 30 dias */}
          <div
            onClick={() => onNavigateTab('financial', 'OVERDUE')}
            className="p-3.5 rounded-xl border border-red-300 bg-red-50/60 hover:bg-red-50 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-900">+30 dias</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-900 font-bold">
                {aging.overdue30Plus.count}
              </span>
            </div>
            <div className="mt-2 text-base font-bold text-red-950 font-mono">
              {formatBRL(aging.overdue30Plus.amount)}
            </div>
            <div className="mt-1 text-[11px] text-red-700">Inadimplência Crítica / Bloqueio</div>
          </div>
        </div>
      </div>
    </div>
  );
};
