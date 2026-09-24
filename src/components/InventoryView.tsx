import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Package,
  Calendar,
  Weight,
  Layers,
  Send,
  Printer,
  RotateCcw,
  Building2,
  Phone,
  Trash2,
  Edit3,
  X,
  Zap,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { ProductInventory, Supplier, PurchaseOrder } from '../types';
import { ExcelInventoryImportModal } from './ExcelInventoryImportModal';

interface InventoryViewProps {
  onRefreshGlobal?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onRefreshGlobal }) => {
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modais
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductInventory | null>(null);

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementProduct, setMovementProduct] = useState<ProductInventory | null>(null);
  const [movementDelta, setMovementDelta] = useState<number>(10);
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('OUT');
  const [movementReason, setMovementReason] = useState('');

  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [labelProduct, setLabelProduct] = useState<ProductInventory | null>(null);

  const [excelModalOpen, setExcelModalOpen] = useState(false);

  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
    details?: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resInv, resSupp] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/suppliers'),
      ]);
      if (resInv.ok) {
        const invData = await resInv.json();
        setProducts(invData.products || []);
      }
      if (resSupp.ok) {
        setSuppliers(await resSupp.json());
      }
    } catch (err) {
      console.error('Erro ao carregar dados do estoque:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Disparo de varredura geral e ressuprimento automático
  const handleScanReorder = async () => {
    try {
      const res = await fetch('/api/inventory/scan-reorder', { method: 'POST' });
      const data = await res.json();
      setNotification({
        type: data.triggeredCount > 0 ? 'warning' : 'success',
        message: data.message,
        details: data.triggeredCount > 0
          ? `${data.triggeredCount} ordem(ns) de compra emitida(s) com disparos de WhatsApp para os fornecedores homologados.`
          : 'Todos os produtos estão com níveis de estoque acima do ponto mínimo.',
      });
      fetchData();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      setNotification({ type: 'warning', message: `Falha ao executar varredura: ${err.message}` });
    }
  };

  // Movimentação de Estoque
  const handleConfirmMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementProduct) return;

    const delta = movementType === 'IN' ? Math.abs(movementDelta) : -Math.abs(movementDelta);
    try {
      const res = await fetch(`/api/inventory/${movementProduct.id}/movement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deltaPackages: delta,
          reason: movementReason || (delta > 0 ? 'Entrada no almoxarifado' : 'Saída para expedição'),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao movimentar estoque');
      }

      setNotification({
        type: data.autoOrderTriggered ? 'warning' : 'success',
        message: data.message,
        details: data.autoOrderTriggered
          ? `Ordem de Reposição ${data.autoOrderTriggered.orderNumber} gerada automaticamente! WhatsApp enviado para ${data.autoOrderTriggered.supplierWhatsapp}.`
          : undefined,
      });

      setMovementModalOpen(false);
      setMovementProduct(null);
      fetchData();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Salvar produto
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const supplierId = formData.get('supplierId') as string;
    const matchedSupplier = suppliers.find((s) => s.id === supplierId);

    const payload = {
      id: editingProduct?.id,
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as string,
      packagingUnit: formData.get('packagingUnit') as string,
      unitsPerPackage: Number(formData.get('unitsPerPackage')),
      unitWeightKg: Number(formData.get('unitWeightKg')),
      weightPerPackageKg: Number(formData.get('weightPerPackageKg')),
      manufactureDate: formData.get('manufactureDate') as string,
      expiryDate: formData.get('expiryDate') as string,
      shelfLifeMonths: Number(formData.get('shelfLifeMonths')),
      lotNumber: formData.get('lotNumber') as string,
      currentStockPackages: Number(formData.get('currentStockPackages')),
      minStockPackages: Number(formData.get('minStockPackages')),
      reorderQuantityPackages: Number(formData.get('reorderQuantityPackages')),
      supplierId: matchedSupplier?.id || supplierId,
      supplierName: matchedSupplier?.tradeName || matchedSupplier?.name || 'Fornecedor Homologado',
      supplierPhone: matchedSupplier?.whatsapp || matchedSupplier?.phone || '+55 11 99999-9999',
      costPrice: Number(formData.get('costPrice')),
      salePrice: Number(formData.get('salePrice')),
      location: formData.get('location') as string,
      autoReorderEnabled: formData.get('autoReorderEnabled') === 'on',
    };

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar produto');
      }

      setNotification({
        type: 'success',
        message: `Produto "${payload.name}" (${payload.sku}) salvo com sucesso no estoque.`,
      });
      setProductModalOpen(false);
      setEditingProduct(null);
      fetchData();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Excluir produto
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente remover o produto "${name}" do estoque?`)) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotification({ type: 'info', message: `Produto "${name}" excluído com sucesso.` });
        fetchData();
        if (onRefreshGlobal) onRefreshGlobal();
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Filtros
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.lotNumber.toLowerCase().includes(term) ||
      p.supplierName.toLowerCase().includes(term) ||
      p.packagingUnit.toLowerCase().includes(term);

    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'LOW_OR_CRITICAL' && (p.status === 'LOW' || p.status === 'CRITICAL' || p.status === 'OUT_OF_STOCK')) ||
      p.status === statusFilter;

    return matchSearch && matchCategory && matchStatus;
  });

  // Métricas de cabeçalho
  const totalPackages = products.reduce((acc, p) => acc + (p.currentStockPackages || 0), 0);
  const totalUnits = products.reduce((acc, p) => acc + (p.currentStockUnits || 0), 0);
  const lowCount = products.filter((p) => p.status === 'LOW').length;
  const criticalCount = products.filter((p) => p.status === 'CRITICAL' || p.status === 'OUT_OF_STOCK').length;
  const normalCount = products.filter((p) => p.status === 'NORMAL').length;

  return (
    <div className="space-y-6">
      {/* Banner de Notificação / Toast de Automação */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between shadow-xs transition-all ${
            notification.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : notification.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-start space-x-3">
            {notification.type === 'warning' ? (
              <Zap className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-xs font-bold">{notification.message}</p>
              {notification.details && (
                <p className="text-xs opacity-90 mt-0.5">{notification.details}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Ações Rápidas */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Controle de Estoque, Embalagens & Reposição Automática Flind
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão integrada de insumos e produtos acabados: Unidade/Volume, Quantidade Interna, Peso Líquido/Bruto, Fabricação, Validade, Lote e <strong>Disparo Automático de WhatsApp para Fornecedores</strong> quando o estoque estiver acabando.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setExcelModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            title="Importa planilha XLSX de estoque e preenche volumes e saldos automaticamente"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Importar Planilha XLSX</span>
          </button>

          <a
            href="/api/inventory/export-xlsx"
            download="estoque_flind.xlsx"
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            title="Exporta todos os produtos, volumes e unidades em formato Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar XLSX</span>
          </a>

          <button
            type="button"
            onClick={handleScanReorder}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            title="Verifica todos os produtos abaixo do estoque mínimo e dispara WhatsApp de compra automaticamente"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Verificar Reposição Automática</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setProductModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Produto / Volume</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas do Estoque */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Produtos
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">{products.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">SKUs cadastrados</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total em Volumes
          </div>
          <div className="mt-1 text-2xl font-black text-indigo-600">
            {totalPackages.toLocaleString('pt-BR')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Caixas, fardos e pct</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total em Unidades
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {totalUnits.toLocaleString('pt-BR')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Peças individuais</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Estoque Saudável
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-600">{normalCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Acima do limite mín.</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Atenção (Baixo)
          </div>
          <div className="mt-1 text-2xl font-black text-amber-600">{lowCount}</div>
          <div className="text-[10px] text-amber-700/80 mt-0.5">Ponto de pedido</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            Crítico / Esgotando
          </div>
          <div className="mt-1 text-2xl font-black text-rose-600">{criticalCount}</div>
          <div className="text-[10px] text-rose-700/80 mt-0.5 font-bold flex items-center space-x-1">
            <Zap className="w-2.5 h-2.5 text-rose-600" />
            <span>Reposição ativa</span>
          </div>
        </div>
      </div>

      {/* Barra de Busca & Filtros Rápidos */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por SKU, nome, volume, lote, fornecedor..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de Categoria */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="Hospitalar & Cirúrgico">Hospitalar & Cirúrgico</option>
            <option value="Salões & Barbearias">Salões & Barbearias</option>
            <option value="Estética & Spas">Estética & Spas</option>
            <option value="Odontológico">Odontológico</option>
          </select>

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">Todos os Níveis de Estoque</option>
            <option value="LOW_OR_CRITICAL">Apenas Alerta (Baixo / Crítico)</option>
            <option value="NORMAL">Normal / Saudável</option>
            <option value="LOW">Estoque Baixo</option>
            <option value="CRITICAL">Estoque Crítico</option>
            <option value="OUT_OF_STOCK">Esgotado</option>
          </select>
        </div>
      </div>

      {/* Tabela de Produtos do Estoque */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Produto & SKU</th>
                <th className="py-3 px-3">Unidade / Volume</th>
                <th className="py-3 px-3">Qtd / Embalagem</th>
                <th className="py-3 px-3">Peso (Un / Vol)</th>
                <th className="py-3 px-3">Lote & Validade</th>
                <th className="py-3 px-3">Estoque Atual</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Fornecedor</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhum produto encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLow = prod.status === 'LOW';
                  const isCritical = prod.status === 'CRITICAL' || prod.status === 'OUT_OF_STOCK';
                  const pctRemaining = Math.min(
                    100,
                    Math.round((prod.currentStockPackages / (prod.minStockPackages * 2)) * 100)
                  );

                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCritical ? 'bg-rose-50/20' : isLow ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Produto & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{prod.name}</div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {prod.sku}
                          </span>
                          <span className="text-[10px] text-slate-400">{prod.category}</span>
                        </div>
                      </td>

                      {/* Unidade / Volume */}
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {prod.packagingUnit}
                        </span>
                      </td>

                      {/* Quantidade dentro do Volume */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">
                          {prod.unitsPerPackage.toLocaleString('pt-BR')} un
                        </div>
                        <div className="text-[10px] text-slate-500">por {prod.packagingUnit}</div>
                      </td>

                      {/* Peso */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">
                          {prod.weightPerPackageKg.toFixed(2)} kg
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ({prod.unitWeightKg.toFixed(3)} kg/un)
                        </div>
                      </td>

                      {/* Lote & Validade */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] font-bold text-slate-800">
                          {prod.lotNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Val: {new Date(prod.expiryDate).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          Fab: {new Date(prod.manufactureDate).toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      {/* Estoque Atual */}
                      <td className="py-3 px-3">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-sm font-black text-slate-900">
                            {prod.currentStockPackages}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            volumes ({prod.currentStockUnits.toLocaleString('pt-BR')} un)
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Mínimo: {prod.minStockPackages} vol
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCritical
                                ? 'bg-rose-500'
                                : isLow
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pctRemaining}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {isCritical ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Crítico</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Baixo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Normal</span>
                          </span>
                        )}
                        {prod.autoReorderEnabled && (
                          <div className="text-[9px] text-indigo-600 font-semibold mt-0.5 flex items-center space-x-0.5">
                            <Zap className="w-2.5 h-2.5" />
                            <span>Auto WhatsApp</span>
                          </div>
                        )}
                      </td>

                      {/* Fornecedor */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 truncate max-w-[140px]" title={prod.supplierName}>
                          {prod.supplierName}
                        </div>
                        <a
                          href={`https://wa.me/${(prod.supplierPhone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1 mt-0.5"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{prod.supplierPhone || 'WhatsApp'}</span>
                        </a>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMovementProduct(prod);
                              setMovementType('OUT');
                              setMovementDelta(Math.min(5, prod.currentStockPackages));
                              setMovementReason('');
                              setMovementModalOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer"
                            title="Movimentar estoque (+ Entrada / - Saída)"
                          >
                            Movimentar
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setLabelProduct(prod);
                              setLabelModalOpen(true);
                            }}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Imprimir Etiqueta Industrial do Volume"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(prod);
                              setProductModalOpen(true);
                            }}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Editar produto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id, prod.name)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            title="Remover produto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: MOVIMENTAÇÃO DE ESTOQUE (+ / -)                     */}
      {/* ========================================================= */}
      {movementModalOpen && movementProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Movimentar Estoque de Volumes</h3>
              </div>
              <button
                type="button"
                onClick={() => setMovementModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{movementProduct.name}</div>
              <div className="text-slate-500 mt-0.5">
                SKU: <span className="font-mono text-indigo-600">{movementProduct.sku}</span> | Embalagem: {movementProduct.packagingUnit} ({movementProduct.unitsPerPackage} un/vol)
              </div>
              <div className="mt-1 font-semibold text-slate-700">
                Estoque Atual: <span className="text-indigo-600 font-bold">{movementProduct.currentStockPackages}</span> volumes | Mínimo: <span className="text-rose-600 font-bold">{movementProduct.minStockPackages}</span> volumes
              </div>
            </div>

            <form onSubmit={handleConfirmMovement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType('OUT')}
                  className={`py-2 px-3 rounded-lg font-bold border text-center transition-all ${
                    movementType === 'OUT'
                      ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-400/20'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                  Saída / Expedição (-)
                </button>

                <button
                  type="button"
                  onClick={() => setMovementType('IN')}
                  className={`py-2 px-3 rounded-lg font-bold border text-center transition-all ${
                    movementType === 'IN'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/20'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  Entrada / Reposição (+)
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantidade em Volumes ({movementProduct.packagingUnit})
                </label>
                <input
                  type="number"
                  min="1"
                  max={movementType === 'OUT' ? movementProduct.currentStockPackages : 99999}
                  required
                  value={movementDelta}
                  onChange={(e) => setMovementDelta(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Equivale a <strong>{(movementDelta * movementProduct.unitsPerPackage).toLocaleString('pt-BR')} unidades</strong> de produto.
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Separação de pedido grande, reposição fabril, inventário..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Aviso dinâmico de gatilho automático */}
              {movementType === 'OUT' &&
                movementProduct.currentStockPackages - movementDelta <= movementProduct.minStockPackages && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[11px] space-y-1">
                    <div className="font-bold flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Gatilho Automático será acionado!</span>
                    </div>
                    <p>
                      Com essa saída, o estoque cairá para <strong>{movementProduct.currentStockPackages - movementDelta} volumes</strong> (abaixo do limite mínimo de {movementProduct.minStockPackages}).
                    </p>
                    <p className="text-[10px] text-amber-800">
                      O sistema emitirá imediatamente uma <strong>Ordem de Compra</strong> e fará o <strong>disparo automático de WhatsApp</strong> para o fornecedor <em>{movementProduct.supplierName}</em>.
                    </p>
                  </div>
                )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMovementModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white rounded-lg text-xs font-bold shadow-xs transition-colors ${
                    movementType === 'OUT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Confirmar {movementType === 'OUT' ? 'Baixa' : 'Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO DE PRODUTO & ESPECIFICAÇÃO       */}
      {/* ========================================================= */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? 'Editar Produto & Embalagem' : 'Cadastrar Novo Produto & Volume'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingProduct?.name || ''}
                    placeholder="Ex: Avental Cirúrgico Impermeável TNT 50g/m²"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    required
                    defaultValue={editingProduct?.sku || ''}
                    placeholder="Ex: FLIND-AVT-CIR-50"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria Fabril</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || 'Hospitalar & Cirúrgico'}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Hospitalar & Cirúrgico">Hospitalar & Cirúrgico</option>
                    <option value="Salões & Barbearias">Salões & Barbearias</option>
                    <option value="Estética & Spas">Estética & Spas</option>
                    <option value="Odontológico">Odontológico</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidade / Volume *</label>
                  <select
                    name="packagingUnit"
                    defaultValue={editingProduct?.packagingUnit || 'Caixa (CX)'}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Caixa (CX)">Caixa (CX)</option>
                    <option value="Fardo (FD)">Fardo (FD)</option>
                    <option value="Pacote (PCT)">Pacote (PCT)</option>
                    <option value="Rolo (RL)">Rolo (RL)</option>
                    <option value="Galão (GL)">Galão (GL)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantidade no Volume *</label>
                  <input
                    type="number"
                    name="unitsPerPackage"
                    min="1"
                    required
                    defaultValue={editingProduct?.unitsPerPackage || 50}
                    placeholder="Ex: 50"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Pesos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Peso Unitário Individual (kg)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    name="unitWeightKg"
                    required
                    defaultValue={editingProduct?.unitWeightKg || 0.24}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Peso Bruto da Embalagem / Volume (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="weightPerPackageKg"
                    required
                    defaultValue={editingProduct?.weightPerPackageKg || 12.0}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Lote, Fabricação e Validade */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-indigo-50/40 rounded-lg border border-indigo-100">
                <div>
                  <label className="block font-semibold text-indigo-950 mb-1">Lote Oficial *</label>
                  <input
                    type="text"
                    name="lotNumber"
                    required
                    defaultValue={editingProduct?.lotNumber || `LOTE-FLIND-${new Date().getFullYear()}-01`}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-indigo-950 mb-1">Data Fabricação *</label>
                  <input
                    type="date"
                    name="manufactureDate"
                    required
                    defaultValue={editingProduct?.manufactureDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-indigo-950 mb-1">Data Validade *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    required
                    defaultValue={
                      editingProduct?.expiryDate ||
                      new Date(Date.now() + 365 * 86400000 * 3).toISOString().split('T')[0]
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-indigo-950 mb-1">Shelf-Life (Meses)</label>
                  <input
                    type="number"
                    name="shelfLifeMonths"
                    defaultValue={editingProduct?.shelfLifeMonths || 36}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Estoque e Níveis de Ressuprimento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estoque Inicial (Volumes) *
                  </label>
                  <input
                    type="number"
                    name="currentStockPackages"
                    min="0"
                    required
                    defaultValue={editingProduct?.currentStockPackages || 100}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estoque Mínimo (Ponto de Pedido) *
                  </label>
                  <input
                    type="number"
                    name="minStockPackages"
                    min="1"
                    required
                    defaultValue={editingProduct?.minStockPackages || 40}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Qtd Padrão de Reposição *
                  </label>
                  <input
                    type="number"
                    name="reorderQuantityPackages"
                    min="1"
                    required
                    defaultValue={editingProduct?.reorderQuantityPackages || 60}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Fornecedor Homologado & Disparo Automático */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fornecedor Homologado *
                  </label>
                  <select
                    name="supplierId"
                    defaultValue={editingProduct?.supplierId || suppliers[0]?.id || ''}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.tradeName || s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Localização no Galpão
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingProduct?.location || 'Galpão 1 • Rua A-02'}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Custos e Preços */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custo por Volume (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="costPrice"
                    defaultValue={editingProduct?.costPrice || 120.0}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Preço Venda por Volume (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="salePrice"
                    defaultValue={editingProduct?.salePrice || 240.0}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Checkbox de Disparo Automático */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoReorderEnabled"
                  name="autoReorderEnabled"
                  defaultChecked={editingProduct ? editingProduct.autoReorderEnabled : true}
                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <label htmlFor="autoReorderEnabled" className="text-xs font-bold text-amber-950">
                  Ativar Disparo Automático de WhatsApp para o fornecedor assim que o estoque atingir o limite mínimo.
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ETIQUETA INDUSTRIAL DO VOLUME COM TODOS OS DADOS    */}
      {/* ========================================================= */}
      {labelModalOpen && labelProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 no-print">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Etiqueta Industrial de Embalagem & Volume</h3>
              </div>
              <button
                type="button"
                onClick={() => setLabelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Layout da Etiqueta Térmica 100x150mm */}
            <div className="border-2 border-slate-900 rounded-lg p-4 bg-white text-slate-900 space-y-3 font-sans shadow-inner">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                    FLIND INDÚSTRIA & EMBALAGENS
                  </div>
                  <div className="text-base font-black tracking-tight text-indigo-900">
                    IDENTIFICAÇÃO DE VOLUME INDUSTRIAL
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500">EMBALAGEM</div>
                  <div className="text-sm font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                    {labelProduct.packagingUnit}
                  </div>
                </div>
              </div>

              {/* Produto & SKU */}
              <div className="border-b border-slate-300 pb-2">
                <div className="text-[9px] font-bold text-slate-500 uppercase">PRODUTO</div>
                <div className="font-black text-sm text-slate-900">{labelProduct.name}</div>
                <div className="font-mono text-xs font-bold text-indigo-700 mt-0.5">
                  SKU: {labelProduct.sku}
                </div>
              </div>

              {/* Quantidade na Unidade & Peso */}
              <div className="grid grid-cols-2 gap-2 border-b border-slate-300 pb-2">
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase">
                    CONTEÚDO DA EMBALAGEM
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {labelProduct.unitsPerPackage.toLocaleString('pt-BR')} UNIDADES
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase">
                    PESO BRUTO / LÍQUIDO
                  </div>
                  <div className="text-lg font-black text-slate-900">
                    {labelProduct.weightPerPackageKg.toFixed(2)} KG
                  </div>
                </div>
              </div>

              {/* Fabricação, Validade & Lote */}
              <div className="grid grid-cols-3 gap-2 border-b-2 border-slate-900 pb-2 text-[11px]">
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase">FABRICAÇÃO</div>
                  <div className="font-black text-slate-900">
                    {new Date(labelProduct.manufactureDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase">VALIDADE</div>
                  <div className="font-black text-slate-900">
                    {new Date(labelProduct.expiryDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase">LOTE OFICIAL</div>
                  <div className="font-mono font-black text-slate-900">
                    {labelProduct.lotNumber}
                  </div>
                </div>
              </div>

              {/* Rodapé com Localização & Código */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-slate-600">
                  <div><strong>Galpão:</strong> {labelProduct.location}</div>
                  <div><strong>Fornecedor:</strong> {labelProduct.supplierName}</div>
                </div>
                <div className="text-[9px] font-mono text-slate-400">
                  FLIND-TAG-{labelProduct.id}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 no-print">
              <button
                type="button"
                onClick={() => setLabelModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Etiqueta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação de Estoque via Planilha XLSX */}
      <ExcelInventoryImportModal
        isOpen={excelModalOpen}
        onClose={() => setExcelModalOpen(false)}
        onSuccess={(result) => {
          fetchData();
          if (onRefreshGlobal) onRefreshGlobal();
          setNotification({
            type: 'success',
            message: result.message,
            details:
              result.autoOrdersTriggered.length > 0
                ? `${result.autoOrdersTriggered.length} ordem(ns) de reposição disparada(s) automaticamente para fornecedores via WhatsApp.`
                : undefined,
          });
        }}
      />
    </div>
  );
};
