import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ChevronRight,
  Package,
  FileText,
  Truck,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Send,
  RefreshCw,
  X,
  MapPin,
  Calendar,
  Weight,
} from 'lucide-react';
import { Order, OrderStatus, TimelineStage, VehicleType } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onRefresh: () => void;
  onOpenShippingLabel: (orderId: string) => void;
  initialFilter?: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onRefresh,
  onOpenShippingLabel,
  initialFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter || 'ALL');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailData, setOrderDetailData] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('TRUCK');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (segmentFilter !== 'ALL') {
      const seg = order.customer?.segment || '';
      if (segmentFilter === 'HOSPITALAR' && !seg.includes('Hospitalar')) return false;
      if (segmentFilter === 'ESTETICA' && !seg.includes('Estética')) return false;
      if (segmentFilter === 'SALAO' && !seg.includes('Salões') && !seg.includes('Barbearia')) return false;
    }

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'DELAYED') {
      return order.timeline.some((t) => t.status === 'DELAYED');
    }
    if (statusFilter === 'PROCESSING') {
      return ['INTEGRATED_ERP', 'SEPARATION'].includes(order.status);
    }
    if (statusFilter === 'BILLED') {
      return ['BILLED', 'NFE_ISSUED'].includes(order.status);
    }
    return order.status === statusFilter;
  });

  const formatBRL = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const fetchOrderDetail = async (orderId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrderDetailData(data);
        setSelectedOrder(data.order);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes do pedido:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAdvanceStage = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/advance-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responsible: 'Operador Fábrica',
          notes: 'Etapa concluída pelo painel de controle operacional.',
        }),
      });
      if (res.ok) {
        await fetchOrderDetail(selectedOrder.id);
        onRefresh();
      }
    } catch (err) {
      console.error('Erro ao avançar etapa:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateDelivery = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/validate-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedVehicleType: selectedVehicle,
        }),
      });
      if (res.ok) {
        const validation = await res.json();
        setOrderDetailData((prev: any) => ({ ...prev, deliveryValidation: validation }));
      }
    } catch (err) {
      console.error('Erro ao validar entrega:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSyncSinkERP = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/integrations/sink-erp/sync-order/${selectedOrder.id}`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchOrderDetail(selectedOrder.id);
        onRefresh();
      }
    } catch (err) {
      console.error('Erro ao sincronizar com SINK ERP:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus, hasDelay: boolean) => {
    if (hasDelay) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <Flame className="w-3 h-3 mr-1 text-rose-500" /> ATRASO SLA
        </span>
      );
    }
    const map: Record<OrderStatus, { label: string; cls: string }> = {
      NEW: { label: 'Novo Pedido', cls: 'bg-slate-100 text-slate-800' },
      INTEGRATED_ERP: { label: 'Integrado SINK ERP', cls: 'bg-indigo-100 text-indigo-800' },
      SEPARATION: { label: 'Em Separação', cls: 'bg-amber-100 text-amber-800' },
      BILLED: { label: 'Faturado', cls: 'bg-emerald-100 text-emerald-800' },
      NFE_ISSUED: { label: 'NF-e Emitida', cls: 'bg-teal-100 text-teal-800' },
      EXPEDITION: { label: 'Aguard. Expedição', cls: 'bg-blue-100 text-blue-800' },
      SHIPPED: { label: 'Despachado', cls: 'bg-purple-100 text-purple-800' },
      IN_TRANSIT: { label: 'Em Trânsito', cls: 'bg-indigo-100 text-indigo-800' },
      DELIVERED: { label: 'Entregue', cls: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelado', cls: 'bg-red-100 text-red-800' },
    };
    const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-800' };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nº pedido, cliente, NF-e..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto scrollbar-none">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex space-x-1 text-xs">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'DELAYED', label: 'Com Atraso' },
                { id: 'NEW', label: 'Novos' },
                { id: 'PROCESSING', label: 'Processando' },
                { id: 'BILLED', label: 'Faturados' },
                { id: 'EXPEDITION', label: 'Expedição' },
                { id: 'DELIVERED', label: 'Entregues' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
                    statusFilter === f.id
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors ml-auto"
              title="Atualizar Pedidos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filtro por Especialidade / Segmento Flind */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 shrink-0">Especialidade:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'Todas Especialidades' },
              { id: 'HOSPITALAR', label: '🏥 Hospitalar & Cirúrgico' },
              { id: 'ESTETICA', label: '✨ Estética, Dermatologia & Spas' },
              { id: 'SALAO', label: '✂️ Salões de Beleza & Barbearias' },
            ].map((seg) => (
              <button
                key={seg.id}
                onClick={() => setSegmentFilter(seg.id)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  segmentFilter === seg.id
                    ? seg.id === 'HOSPITALAR'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : seg.id === 'ESTETICA'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : seg.id === 'SALAO'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {seg.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabela de Pedidos */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pedido / Origem</th>
                <th className="py-3 px-4">Cliente / Destino</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4">NF-e & Rastreio</th>
                <th className="py-3 px-4">Status & SLA</th>
                <th className="py-3 px-4">Etapa Atual</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum pedido localizado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const hasDelay = order.timeline.some((t) => t.status === 'DELAYED');
                  const currentStage = order.timeline.find(
                    (t) => t.status === 'IN_PROGRESS' || t.status === 'DELAYED'
                  ) || order.timeline[order.timeline.length - 1];

                  return (
                    <tr
                      key={order.id}
                      onClick={() => fetchOrderDetail(order.id)}
                      className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{order.orderNumber}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 font-medium">{order.source}</span>
                          <span>#{order.trayOrderId || order.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{order.customer?.name || 'Cliente'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs flex items-center gap-1.5 mt-0.5">
                          {order.customer?.segment && (
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              order.customer.segment.includes('Hospitalar')
                                ? 'bg-blue-100 text-blue-800'
                                : order.customer.segment.includes('Estética')
                                ? 'bg-pink-100 text-pink-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {order.customer.segment.includes('Hospitalar') ? 'Hospitalar' : order.customer.segment.includes('Estética') ? 'Estética' : 'Salão / Barbearia'}
                            </span>
                          )}
                          <span>{order.deliveryAddress?.city} - {order.deliveryAddress?.state}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">
                        {formatBRL(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        {order.invoiceNumber ? (
                          <div className="font-semibold text-emerald-700 flex items-center">
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            {order.invoiceNumber}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pendente emissão</span>
                        )}
                        {order.trackingToken && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            tok: {order.trackingToken.slice(0, 14)}...
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(order.status, hasDelay)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5">
                          {currentStage?.status === 'DELAYED' ? (
                            <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          )}
                          <span className="font-medium text-slate-800">{currentStage?.stageLabel}</span>
                        </div>
                        {currentStage?.durationMinutes !== undefined && (
                          <div className="text-[10px] text-slate-500">
                            {currentStage.durationMinutes}m decorridos (SLA {currentStage.expectedSlaMinutes || 120}m)
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchOrderDetail(order.id);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium inline-flex items-center space-x-1 transition-colors"
                        >
                          <span>Ver</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER / MODAL DE DETALHES DO PEDIDO & TIMELINE */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col border-l border-slate-200">
            {/* Header do Drawer */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 sticky top-0 z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-slate-900">{selectedOrder.orderNumber}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-medium">
                    Origem: {selectedOrder.source}
                  </span>
                  {selectedOrder.customer?.segment && (
                    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      selectedOrder.customer.segment.includes('Hospitalar')
                        ? 'bg-blue-100 text-blue-800'
                        : selectedOrder.customer.segment.includes('Estética')
                        ? 'bg-pink-100 text-pink-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedOrder.customer.segment.includes('Hospitalar') ? '🏥 Hospitalar' : selectedOrder.customer.segment.includes('Estética') ? '✨ Estética & Spas' : '✂️ Salões & Barbearias'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-800">{selectedOrder.customer?.name}</span> • ID Fábrica: {selectedOrder.id} • Criado em{' '}
                  {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Drawer */}
            <div className="p-5 space-y-6 flex-1">
              {/* Barra de Ações Rápidas do Pedido */}
              <div className="flex flex-wrap gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={handleAdvanceStage}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Avançar Próxima Etapa</span>
                </button>

                <button
                  onClick={() => onOpenShippingLabel(selectedOrder.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Gerar Etiqueta & QR Code</span>
                </button>

                <button
                  onClick={handleSyncSinkERP}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sincronizar SINK ERP</span>
                </button>
              </div>

              {/* TIMELINE OPERACIONAL COMPLETA (Item 3 da especificação) */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Timeline Operacional do Pedido (Rastreabilidade de Etapas)</span>
                </h4>

                <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {selectedOrder.timeline.map((stage, idx) => {
                    const isCompleted = stage.status === 'COMPLETED';
                    const isDelayed = stage.status === 'DELAYED';
                    const isInProgress = stage.status === 'IN_PROGRESS';

                    return (
                      <div key={stage.id} className="relative group">
                        {/* Marcador de Linha */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isDelayed
                              ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                              : isInProgress
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </div>

                        {/* Card da Etapa */}
                        <div
                          className={`p-3 rounded-xl border text-xs transition-all ${
                            isDelayed
                              ? 'bg-rose-50/70 border-rose-300'
                              : isInProgress
                              ? 'bg-indigo-50/50 border-indigo-200'
                              : isCompleted
                              ? 'bg-white border-slate-200'
                              : 'bg-slate-50/50 border-slate-200/60 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{stage.stageLabel}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isDelayed
                                  ? 'bg-rose-100 text-rose-800'
                                  : isInProgress
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {stage.status}
                            </span>
                          </div>

                          <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                            <div>
                              <span className="font-medium text-slate-600">Origem:</span> {stage.origin}
                            </div>
                            <div>
                              <span className="font-medium text-slate-600">Responsável:</span>{' '}
                              {stage.responsible || '—'}
                            </div>
                            <div>
                              <span className="font-medium text-slate-600">Início:</span>{' '}
                              {stage.startedAt ? new Date(stage.startedAt).toLocaleTimeString('pt-BR') : '—'}
                            </div>
                            <div>
                              <span className="font-medium text-slate-600">Duração / SLA:</span>{' '}
                              {stage.durationMinutes !== undefined ? `${stage.durationMinutes} min` : '—'} /{' '}
                              {stage.expectedSlaMinutes} min
                            </div>
                          </div>

                          {stage.notes && (
                            <div className="mt-1.5 p-1.5 rounded bg-white/80 border border-slate-200/60 text-[11px] text-slate-700">
                              {stage.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* VALIDAÇÃO DE REGRAS DE ENTREGA (Item 10 e 11) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <span>Regras do Local de Entrega (Multi-Endereço)</span>
                  </h4>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value as VehicleType)}
                      className="text-xs bg-white border border-slate-300 rounded px-2 py-1"
                    >
                      <option value="VUC">Veículo: VUC</option>
                      <option value="TOCO">Veículo: Toco</option>
                      <option value="TRUCK">Veículo: Truck</option>
                      <option value="CARRETA">Veículo: Carreta</option>
                    </select>
                    <button
                      onClick={handleValidateDelivery}
                      disabled={actionLoading}
                      className="px-2.5 py-1 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-700"
                    >
                      Validar Destino
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-800">
                    {selectedOrder.deliveryAddress?.street}, {selectedOrder.deliveryAddress?.number}
                    {selectedOrder.deliveryAddress?.complement && ` - ${selectedOrder.deliveryAddress.complement}`}
                  </div>
                  <div>
                    {selectedOrder.deliveryAddress?.neighborhood}, {selectedOrder.deliveryAddress?.city} -{' '}
                    {selectedOrder.deliveryAddress?.state} • CEP {selectedOrder.deliveryAddress?.zipCode}
                  </div>
                </div>

                {orderDetailData?.deliveryValidation && (
                  <div className="space-y-2 text-xs">
                    {orderDetailData.deliveryValidation.valid ? (
                      <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Destino Liberado: Nenhuma restrição impeditiva encontrada para o veículo e peso.</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                        <div className="font-bold flex items-center space-x-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Bloqueio de Expedição Detectado:</span>
                        </div>
                        {orderDetailData.deliveryValidation.errors.map((err: string, i: number) => (
                          <div key={i} className="pl-5 text-rose-700 font-medium">
                            • {err}
                          </div>
                        ))}
                      </div>
                    )}

                    {orderDetailData.deliveryValidation.warnings.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 space-y-1">
                        <div className="font-bold">Avisos Operacionais:</div>
                        {orderDetailData.deliveryValidation.warnings.map((w: string, i: number) => (
                          <div key={i} className="pl-2">
                            • {w}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Itens do Pedido */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-slate-600" />
                  <span>Itens Fabris & Lotes de Fabricação</span>
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">SKU / Descrição</th>
                        <th className="p-2.5">Lote PCP</th>
                        <th className="p-2.5">Qtd</th>
                        <th className="p-2.5">Preço Unit</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{item.sku}</div>
                            <div className="text-[11px] text-slate-500">{item.title}</div>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-indigo-700">
                            {item.lotNumber || 'Aguard. Separação'}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800">{item.quantity}</td>
                          <td className="p-2.5 font-mono">{formatBRL(item.unitPrice)}</td>
                          <td className="p-2.5 font-mono font-bold text-right">{formatBRL(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
