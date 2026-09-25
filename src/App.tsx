/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { InventoryView } from './components/InventoryView';
import { SuppliersView } from './components/SuppliersView';
import { CustomersView } from './components/CustomersView';
import { FinancialView } from './components/FinancialView';
import { ShippingView } from './components/ShippingView';
import { AlertsView } from './components/AlertsView';
import { IntegrationsView } from './components/IntegrationsView';
import { AuditView } from './components/AuditView';
import { PublicTraceModal } from './components/PublicTraceModal';
import { SaveBackupModal } from './components/SaveBackupModal';
import { DatabaseSchemaModal } from './components/DatabaseSchemaModal';
import { DashboardMetrics, Order } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [subFilter, setSubFilter] = useState<string | undefined>(undefined);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Modais globais
  const [traceModalOpen, setTraceModalOpen] = useState(false);
  const [selectedTraceToken, setSelectedTraceToken] = useState<string | null>(null);
  const [openLabelOrderId, setOpenLabelOrderId] = useState<string | null>(null);
  const [saveBackupModalOpen, setSaveBackupModalOpen] = useState(false);
  const [databaseModalOpen, setDatabaseModalOpen] = useState(false);

  // Detectar rota inicial para /trace/:token no navegador
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/trace/')) {
      const token = path.replace('/trace/', '');
      if (token) {
        setSelectedTraceToken(token);
        setTraceModalOpen(true);
      }
    }
  }, []);

  const fetchGlobalData = async () => {
    try {
      const [resMetrics, resOrders] = await Promise.all([
        fetch('/api/dashboard/metrics'),
        fetch('/api/orders'),
      ]);
      if (resMetrics.ok) setMetrics(await resMetrics.json());
      if (resOrders.ok) setOrders(await resOrders.json());
    } catch (err) {
      console.error('Erro ao carregar dados operacionais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
    // Atualização periódica leve a cada 30 segundos
    const interval = setInterval(fetchGlobalData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigateTab = (tab: NavTab, filter?: string) => {
    setCurrentTab(tab);
    setSubFilter(filter);
  };

  const renderSection = (tab: NavTab) => {
    if (tab === 'orders') {
      return (
        <OrdersView
          orders={orders}
          onRefresh={fetchGlobalData}
          onOpenShippingLabel={handleOpenShippingLabel}
          initialFilter={subFilter}
        />
      );
    }
    if (tab === 'inventory') return <InventoryView onRefreshGlobal={fetchGlobalData} />;
    if (tab === 'suppliers') return <SuppliersView onRefreshGlobal={fetchGlobalData} />;
    if (tab === 'customers') return <CustomersView />;
    if (tab === 'financial') return <FinancialView initialStatusFilter={subFilter} />;
    if (tab === 'logistics') {
      return (
        <ShippingView
          onOpenTraceSearch={handleOpenTraceSearch}
          openLabelOrderId={openLabelOrderId}
          onClearOpenLabelOrderId={() => setOpenLabelOrderId(null)}
        />
      );
    }
    if (tab === 'alerts') return <AlertsView initialSeverityFilter={subFilter} />;
    if (tab === 'integrations') return <IntegrationsView />;
    if (tab === 'audit') return <AuditView />;
    return null;
  };

  const handleOpenShippingLabel = (orderId: string) => {
    setCurrentTab('logistics');
    setOpenLabelOrderId(orderId);
  };

  const handleOpenTraceSearch = (token?: string) => {
    setSelectedTraceToken(token || null);
    setTraceModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden">
      {/* Barra de Navegação Superior */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSubFilter(undefined);
        }}
        metrics={metrics}
        onOpenTraceSearch={() => handleOpenTraceSearch()}
        onOpenSaveBackup={() => setSaveBackupModalOpen(true)}
        onOpenDatabaseSchema={() => setDatabaseModalOpen(true)}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {currentTab === 'dashboard' && <DashboardView onNavigateTab={handleNavigateTab} />}

        {currentTab !== 'dashboard' && renderSection(currentTab)}
      </main>

      {/* Modal de Rastreabilidade Autorizada (/trace/:token) */}
      {traceModalOpen && (
        <PublicTraceModal
          initialToken={selectedTraceToken}
          onClose={() => {
            setTraceModalOpen(false);
            setSelectedTraceToken(null);
          }}
        />
      )}

      {/* Modal de Salvamento & Backup Completo */}
      <SaveBackupModal
        isOpen={saveBackupModalOpen}
        onClose={() => setSaveBackupModalOpen(false)}
        onRefreshData={fetchGlobalData}
      />

      {/* Modal de Tabelas & Banco de Dados Relacional (GitHub & Vercel) */}
      <DatabaseSchemaModal
        isOpen={databaseModalOpen}
        onClose={() => setDatabaseModalOpen(false)}
      />

      {/* Rodapé Institucional */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">Fábrica Integrada</span> — Conector Operacional Central
            (Tray E-commerce & SINK ERP)
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-500">
            <span>Idempotência Ativa</span>
            <span>•</span>
            <span>Cobrança Diária Pós-Vencimento</span>
            <span>•</span>
            <span>QR Code Seguro</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
