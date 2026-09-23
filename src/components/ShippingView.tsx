import React, { useState, useEffect } from 'react';
import {
  Truck,
  QrCode,
  Printer,
  Search,
  CheckCircle2,
  Package,
  Calendar,
  FileText,
  ExternalLink,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Shipment, Order } from '../types';
import { ShippingLabelData } from '../server/services/shipping-service';

interface ShippingViewProps {
  onOpenTraceSearch: (token?: string) => void;
  openLabelOrderId?: string | null;
  onClearOpenLabelOrderId?: () => void;
}

export const ShippingView: React.FC<ShippingViewProps> = ({
  onOpenTraceSearch,
  openLabelOrderId,
  onClearOpenLabelOrderId,
}) => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal de Etiqueta de Expedição
  const [labelData, setLabelData] = useState<ShippingLabelData | null>(null);
  const [labelLoading, setLabelLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resShip, resOrd] = await Promise.all([
        fetch('/api/shipments'),
        fetch('/api/orders'),
      ]);
      if (resShip.ok) setShipments(await resShip.ok ? await resShip.json() : []);
      if (resOrd.ok) setOrders(await resOrd.ok ? await resOrd.json() : []);
    } catch (err) {
      console.error('Erro ao carregar expedições:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Se vier com openLabelOrderId do exterior (ex: drawer de pedidos)
  useEffect(() => {
    if (openLabelOrderId) {
      handleOpenLabel(openLabelOrderId);
      if (onClearOpenLabelOrderId) onClearOpenLabelOrderId();
    }
  }, [openLabelOrderId]);

  const handleOpenLabel = async (orderId: string) => {
    setLabelLoading(true);
    try {
      const res = await fetch(`/api/shipments/${orderId}/label`);
      if (res.ok) {
        const data = await res.json();
        setLabelData(data);
      }
    } catch (err) {
      console.error('Erro ao gerar etiqueta:', err);
    } finally {
      setLabelLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredShipments = shipments.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.orderNumber.toLowerCase().includes(term) ||
      s.carrierName.toLowerCase().includes(term) ||
      (s.trackingCode && s.trackingCode.toLowerCase().includes(term)) ||
      s.trackingToken.toLowerCase().includes(term) ||
      (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner de Expedição & Rastreabilidade */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-indigo-600" />
            <span>Módulo de Rastreabilidade, Expedição & Etiquetas Térmicas com QR Code</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Geração de etiquetas conforme especificação: Pedido, NF-e, Cliente, Transportadora, Local de Entrega, Volumes e QR Code com URL segura (/trace/token).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenTraceSearch()}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-indigo-300" />
            <span>Consultar Token de Rastreio</span>
          </button>
        </div>
      </div>

      {/* Busca & Lista de Expedições */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por pedido, NF-e, transportadora, token..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {filteredShipments.length} expedição(ões) registrada(s)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pedido Fabril</th>
                <th className="py-3 px-4">Nota Fiscal (NF-e)</th>
                <th className="py-3 px-4">Transportadora & Rastreador</th>
                <th className="py-3 px-4">Volumes & Peso</th>
                <th className="py-3 px-4">Status Logístico</th>
                <th className="py-3 px-4">Token Rastreabilidade</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhuma expedição encontrada para os critérios informados.
                  </td>
                </tr>
              ) : (
                filteredShipments.map((ship) => (
                  <tr key={ship.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{ship.orderNumber}</td>
                    <td className="py-3 px-4">
                      {ship.invoiceNumber ? (
                        <span className="font-semibold text-emerald-700">{ship.invoiceNumber}</span>
                      ) : (
                        <span className="text-slate-400 italic">Pendente</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{ship.carrierName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{ship.trackingCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{ship.volumesCount} vol(s)</div>
                      <div className="text-[11px] text-slate-500">{ship.totalWeightKg} kg</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                        {ship.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-700">
                      <button
                        onClick={() => onOpenTraceSearch(ship.trackingToken)}
                        className="hover:underline flex items-center space-x-1"
                        title="Ver Rastreabilidade Pública"
                      >
                        <span>{ship.trackingToken}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenLabel(ship.orderId)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-xs inline-flex items-center space-x-1 transition-colors shadow-2xs"
                      >
                        <QrCode className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Imprimir Etiqueta</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE VISUALIZAÇÃO E IMPRESSÃO DE ETIQUETA DE EXPEDIÇÃO COM QR CODE */}
      {labelData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span>Etiqueta Oficial de Expedição & Rastreio</span>
              </h4>
              <button
                onClick={() => setLabelData(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-base"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ÁREA DA ETIQUETA (Conforme Item 9 da especificação) */}
            <div
              id="printable-shipping-label"
              className="border-2 border-slate-900 rounded-xl p-5 bg-white text-slate-900 space-y-3 font-sans print:border-none print:p-0"
            >
              {/* Topo da Etiqueta */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-slate-600">
                    FÁBRICA INTEGRADA • EXPEDIÇÃO
                  </div>
                  <div className="text-xl font-black tracking-tight">{labelData.orderNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-600">NOTA FISCAL</div>
                  <div className="text-base font-black text-slate-900">{labelData.invoiceNumber}</div>
                </div>
              </div>

              {/* Informações de Destinatário */}
              <div className="border-b border-slate-400 pb-2 text-xs">
                <div className="text-[10px] font-bold uppercase text-slate-500">DESTINATÁRIO</div>
                <div className="font-bold text-sm text-slate-900">{labelData.customerName}</div>
                <div className="text-[11px] text-slate-600 font-mono">CNPJ/CPF: {labelData.customerTaxId}</div>
              </div>

              {/* Endereço & Local / Unidade de Entrega */}
              <div className="border-b border-slate-400 pb-2 text-xs">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  ENDEREÇO DE ENTREGA / UNIDADE DESTINO
                </div>
                <div className="font-semibold text-slate-900">
                  {labelData.deliveryAddress.street}, {labelData.deliveryAddress.number}
                  {labelData.deliveryAddress.complement && ` (${labelData.deliveryAddress.complement})`}
                </div>
                <div className="text-slate-700">
                  {labelData.deliveryAddress.neighborhood} — {labelData.deliveryAddress.city}/
                  {labelData.deliveryAddress.state} • CEP {labelData.deliveryAddress.zipCode}
                </div>
                {labelData.deliveryAddress.entryGate && (
                  <div className="mt-1 p-1 bg-slate-100 rounded text-[11px] font-bold text-slate-800">
                    PORTÃO / DOCA: {labelData.deliveryAddress.entryGate}
                  </div>
                )}
              </div>

              {/* Transportadora e Volumes */}
              <div className="grid grid-cols-2 gap-2 border-b border-slate-400 pb-2 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">TRANSPORTADORA</div>
                  <div className="font-bold text-slate-900">{labelData.carrierName}</div>
                  <div className="text-[10px] font-mono text-slate-600">
                    TRK: {labelData.trackingCode || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">VOLUMES / PESO TOTAL</div>
                  <div className="font-black text-base text-slate-900">
                    {labelData.volumesCount} VOL | {labelData.totalWeightKg} KG
                  </div>
                </div>
              </div>

              {/* DADOS DO PRODUTO, EMBALAGEM / VOLUME, FABRICAÇÃO E VALIDADE */}
              <div className="border-b border-slate-400 pb-2 text-xs space-y-1.5 bg-slate-50/70 p-2 rounded">
                <div className="text-[10px] font-black uppercase text-indigo-950 flex items-center justify-between">
                  <span>ESPECIFICAÇÃO DE EMBALAGEM, LOTE & VALIDADE</span>
                  <span className="font-mono text-[9px] bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded font-bold">PADRÃO ANVISA / FLIND</span>
                </div>

                {labelData.items && labelData.items.length > 0 ? (
                  labelData.items.map((it, idx) => (
                    <div key={idx} className="border-t border-slate-200 pt-1 text-[11px]">
                      <div className="font-bold text-slate-900 flex justify-between">
                        <span>{it.title}</span>
                        <span className="font-mono text-[10px] text-slate-600">{it.sku}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mt-1 text-[10px] text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-500">Unidade/Vol:</span>{' '}
                          <strong>{it.packagingUnit}</strong>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Qtd no Volume:</span>{' '}
                          <strong>{it.unitsPerPackage} un</strong>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Peso Total:</span>{' '}
                          <strong>{it.weightKg.toFixed(2)} kg</strong>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Lote:</span>{' '}
                          <strong className="font-mono text-indigo-900">{it.lotNumber}</strong>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 mt-0.5 text-[10px] text-slate-600">
                        <div>
                          <span className="font-semibold text-slate-500">Fabricação:</span>{' '}
                          <strong>{new Date(it.manufactureDate).toLocaleDateString('pt-BR')}</strong>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Validade:</span>{' '}
                          <strong className="text-emerald-800 font-bold">
                            {new Date(it.expiryDate).toLocaleDateString('pt-BR')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-slate-600">
                    Volume padrão industrial Flind • Embalagem: Caixa (CX) • 50 un/volume
                  </div>
                )}
              </div>

              {/* Observações Operacionais */}
              {labelData.notes && (
                <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                  <span className="font-bold">OBS:</span> {labelData.notes}
                </div>
              )}

              {/* QR CODE OFICIAL (Com URL Interna Segura /trace/:token) */}
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1 max-w-[200px]">
                  <div className="text-[10px] font-bold uppercase text-slate-600">RASTREABILIDADE SEGURA</div>
                  <div className="text-[11px] font-mono font-bold text-slate-900 break-all">
                    {labelData.trackingToken}
                  </div>
                  <div className="text-[9px] text-slate-500 leading-tight">
                    Aponte a câmera para consultar histórico, etapas e validação de entrega.
                  </div>
                </div>

                <div className="p-1 border border-slate-900 rounded-lg bg-white shrink-0">
                  <img
                    src={labelData.qrCodeDataUrl}
                    alt="QR Code de Rastreabilidade"
                    className="w-28 h-28 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="flex justify-end space-x-2 pt-2 no-print">
              <button
                type="button"
                onClick={() => setLabelData(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-xs"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg font-semibold text-xs flex items-center space-x-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Etiqueta / PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
