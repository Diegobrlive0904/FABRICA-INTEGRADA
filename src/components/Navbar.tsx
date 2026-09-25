import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  DollarSign,
  Truck,
  Bell,
  Cpu,
  ShieldCheck,
  Search,
  ExternalLink,
  Boxes,
  Building2,
  Save,
  Database,
} from 'lucide-react';
import { DashboardMetrics } from '../types';

export type NavTab =
  | 'dashboard'
  | 'orders'
  | 'inventory'
  | 'suppliers'
  | 'customers'
  | 'financial'
  | 'logistics'
  | 'alerts'
  | 'integrations'
  | 'audit';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  metrics: DashboardMetrics | null;
  onOpenTraceSearch: () => void;
  onOpenSaveBackup?: () => void;
  onOpenDatabaseSchema?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  metrics,
  onOpenTraceSearch,
  onOpenSaveBackup,
  onOpenDatabaseSchema,
}) => {
  const pendingAlerts = metrics?.alerts.totalPending || 0;
  const criticalAlerts = metrics?.alerts.criticalCount || 0;
  const overdueCount = metrics?.financial.overdueCount || 0;
  const lowStockCount = (metrics?.inventory?.lowStockCount || 0) + (metrics?.inventory?.criticalStockCount || 0);
  const openPoCount = metrics?.suppliers?.openPurchaseOrders || 0;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'orders',
      label: 'Pedidos',
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: metrics?.orders.delayed,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'inventory',
      label: 'Estoque & Volumes',
      icon: <Boxes className="w-4 h-4" />,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: (metrics?.inventory?.criticalStockCount || 0) > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white',
    },
    {
      id: 'suppliers',
      label: 'Fornecedores & P.O.',
      icon: <Building2 className="w-4 h-4" />,
      badge: openPoCount > 0 ? openPoCount : undefined,
      badgeColor: 'bg-indigo-600 text-white',
    },
    { id: 'customers', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
    {
      id: 'financial',
      label: 'Financeiro',
      icon: <DollarSign className="w-4 h-4" />,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'logistics', label: 'Expedição', icon: <Truck className="w-4 h-4" /> },
    {
      id: 'alerts',
      label: 'Alertas',
      icon: <Bell className="w-4 h-4" />,
      badge: pendingAlerts > 0 ? pendingAlerts : undefined,
      badgeColor: criticalAlerts > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white',
    },
    { id: 'integrations', label: 'Integrações', icon: <Cpu className="w-4 h-4" /> },
    { id: 'audit', label: 'Auditoria', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 min-h-16 py-2">
          <div className="flex items-center min-w-0 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <img src="/logo-fabrica-integrada.png" alt="Fábrica Integrada" className="h-9 sm:h-11 w-auto max-w-[180px] sm:max-w-[240px] object-contain" />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenDatabaseSchema}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold cursor-pointer transition-colors"
              title="Tabelas & SQL"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Tabelas & SQL</span>
            </button>

            <button
              onClick={onOpenSaveBackup}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold cursor-pointer transition-colors"
              title="Salvar & Backup"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Salvar & Backup</span>
            </button>

            <button
              onClick={onOpenTraceSearch}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors"
              title="Consultar rastreio"
            >
              <Search className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Consultar Rastreio</span>
            </button>

            <div className="hidden md:flex items-center space-x-2 border-l border-slate-800 pl-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Tray & SINK Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 overflow-x-auto overscroll-x-contain py-1 scrollbar-none border-t border-slate-800/80">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      item.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
