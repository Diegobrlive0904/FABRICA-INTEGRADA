import React from 'react';
import {
  ShoppingCart,
  DollarSign,
  Truck,
  Bell,
  Boxes,
  Building2,
  Users,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import { NavTab } from './Navbar';
import { FactoryFloor } from './FactoryFloor';

interface DashboardViewProps {
  onNavigateTab: (tab: NavTab) => void;
}

const menus: Array<{
  id: NavTab;
  title: string;
  icon: React.ReactNode;
  tone: string;
}> = [
  {
    id: 'orders',
    title: 'Pedidos',
    icon: <ShoppingCart className="w-5 h-5" />,
    tone: 'bg-indigo-50 text-indigo-600',
  },
  {
    id: 'inventory',
    title: 'Estoque & Volumes',
    icon: <Boxes className="w-5 h-5" />,
    tone: 'bg-violet-50 text-violet-600',
  },
  {
    id: 'suppliers',
    title: 'Fornecedores & P.O.',
    icon: <Building2 className="w-5 h-5" />,
    tone: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'customers',
    title: 'Clientes',
    icon: <Users className="w-5 h-5" />,
    tone: 'bg-sky-50 text-sky-600',
  },
  {
    id: 'financial',
    title: 'Financeiro',
    icon: <DollarSign className="w-5 h-5" />,
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    id: 'logistics',
    title: 'Expedição',
    icon: <Truck className="w-5 h-5" />,
    tone: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'alerts',
    title: 'Alertas',
    icon: <Bell className="w-5 h-5" />,
    tone: 'bg-amber-50 text-amber-600',
  },
  {
    id: 'integrations',
    title: 'Integrações',
    icon: <Cpu className="w-5 h-5" />,
    tone: 'bg-cyan-50 text-cyan-700',
  },
  {
    id: 'audit',
    title: 'Auditoria',
    icon: <ShieldCheck className="w-5 h-5" />,
    tone: 'bg-rose-50 text-rose-600',
  },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Painel</h2>
        <p className="text-sm text-slate-500 mt-1">Escolha um menu para abrir.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menus.map((menu) => (
          <button
            key={menu.id}
            type="button"
            onClick={() => onNavigateTab(menu.id)}
            className="bg-white rounded-xl border border-slate-200 p-5 text-left shadow-xs hover:border-indigo-300 hover:shadow-sm transition-all"
          >
            <div className={`p-2 rounded-lg w-fit ${menu.tone}`}>{menu.icon}</div>
            <div className="mt-4 text-base font-medium text-slate-900">{menu.title}</div>
          </button>
        ))}
      </div>

      <FactoryFloor />
    </div>
  );
};
