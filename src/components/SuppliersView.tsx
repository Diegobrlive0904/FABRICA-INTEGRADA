import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Boxes,
  Zap,
  ExternalLink,
  Edit3,
  X,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Layers,
  Barcode,
  PackageCheck,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  ShoppingCart,
  SlidersHorizontal,
  Info,
  Scale,
  Award,
  Truck,
  Calendar,
  DollarSign,
  Check,
  Ban,
  Archive,
} from 'lucide-react';
import {
  Supplier,
  PurchaseOrder,
  ProductInventory,
  MissingProductItem,
  MissingProductsDiagnostic,
  SupplierQuotationOffer,
  ProductQuotationComparison,
} from '../types';

interface SuppliersViewProps {
  onRefreshGlobal?: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ onRefreshGlobal }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [diagnostic, setDiagnostic] = useState<MissingProductsDiagnostic | null>(null);

  // Cotações & Comparativo Inteligente de Fornecedores
  const [comparisons, setComparisons] = useState<ProductQuotationComparison[]>([]);
  const [loadingComparisons, setLoadingComparisons] = useState(false);
  const [selectedComparisonProduct, setSelectedComparisonProduct] = useState<string>('ALL');
  const [orderingQuotationId, setOrderingQuotationId] = useState<string | null>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [modalComparisonItem, setModalComparisonItem] = useState<ProductQuotationComparison | null>(null);

  // Tabs: 'missing' (pesquisa de faltantes), 'comparison' (cotações & melhor compra), 'catalog', 'suppliers', 'orders'
  const [activeTab, setActiveTab] = useState<'missing' | 'comparison' | 'catalog' | 'suppliers' | 'orders'>('missing');
  const [loading, setLoading] = useState(true);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);
  const [batchOrdering, setBatchOrdering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros de Faltantes
  const [missingSeverityFilter, setMissingSeverityFilter] = useState<'ALL' | 'OUT_OF_STOCK' | 'CRITICAL' | 'LOW'>('ALL');
  const [missingOrderStatusFilter, setMissingOrderStatusFilter] = useState<'ALL' | 'ORDERED' | 'UNORDERED'>('ALL');
  const [missingCategoryFilter, setMissingCategoryFilter] = useState<string>('ALL');

  // Filtros de Catálogo
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('ALL');
  const [catalogStockFilter, setCatalogStockFilter] = useState<string>('ALL');

  // Modais
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [poModalOpen, setPoModalOpen] = useState(false);
  const [selectedPoProduct, setSelectedPoProduct] = useState<string>('');
  const [suggestedPoQty, setSuggestedPoQty] = useState<number>(50);

  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappSupplier, setWhatsappSupplier] = useState<Supplier | null>(null);
  const [whatsappCustomMsg, setWhatsappCustomMsg] = useState('');

  // Modal Leitor de Ficha Técnica do Catálogo
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [selectedProductSpec, setSelectedProductSpec] = useState<ProductInventory | null>(null);

  // Cancelamento de Ordem de Compra de Fornecedor
  const [poToCancel, setPoToCancel] = useState<PurchaseOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Fornecedor sem disponibilidade imediata');
  const [customCancelReason, setCustomCancelReason] = useState<string>('');
  const [notifySupplierOnCancel, setNotifySupplierOnCancel] = useState<boolean>(true);
  const [isCancellingPo, setIsCancellingPo] = useState<boolean>(false);
  const [poStatusFilter, setPoStatusFilter] = useState<string>('ALL');
  const [cancelledOrders, setCancelledOrders] = useState<PurchaseOrder[]>([]);
  const [showCancelledArchive, setShowCancelledArchive] = useState<boolean>(false);

  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Buscar dados principais
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSupp, resPo, resCancelled, resProd] = await Promise.all([
        fetch('/api/suppliers'),
        fetch('/api/purchase-orders'),
        fetch('/api/purchase-orders/cancelled'),
        fetch('/api/inventory'),
      ]);
      if (resSupp.ok) setSuppliers(await resSupp.json());
      if (resPo.ok) {
        const poData: PurchaseOrder[] = await resPo.json();
        // Garante que canceladas não permaneçam na lista ativa de compras
        setPurchaseOrders(poData.filter((p) => p.status !== 'CANCELLED'));
      }
      if (resCancelled.ok) {
        setCancelledOrders(await resCancelled.json());
      }
      if (resProd.ok) {
        const pData = await resProd.json();
        setProducts(pData.products || []);
      }
    } catch (err) {
      console.error('Erro ao buscar dados de fornecedores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar diagnóstico automático de faltantes
  const fetchDiagnostic = async () => {
    try {
      setLoadingDiagnostic(true);
      const res = await fetch('/api/purchase-orders/missing-diagnostic');
      if (res.ok) {
        const data: MissingProductsDiagnostic = await res.json();
        setDiagnostic(data);
      }
    } catch (err) {
      console.error('Erro ao buscar diagnóstico de produtos faltantes:', err);
    } finally {
      setLoadingDiagnostic(false);
    }
  };

  // Buscar cotações e matriz comparativa de fornecedores
  const fetchComparisons = async (productId?: string) => {
    try {
      setLoadingComparisons(true);
      const url =
        productId && productId !== 'ALL'
          ? `/api/suppliers/quotations/missing-comparison?productId=${encodeURIComponent(productId)}`
          : '/api/suppliers/quotations/missing-comparison';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setComparisons(data.comparisons || []);
      }
    } catch (err) {
      console.error('Erro ao buscar comparativo de cotações:', err);
    } finally {
      setLoadingComparisons(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDiagnostic();
    fetchComparisons();
  }, []);

  // Emitir Ordem de Compra a partir da Cotação Vencedora / Selecionada
  const handleCreatePoFromQuotation = async (
    comparison: ProductQuotationComparison,
    offer: SupplierQuotationOffer
  ) => {
    try {
      setOrderingQuotationId(offer.id);
      const res = await fetch('/api/purchase-orders/create-from-quotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: comparison.productId,
          supplierId: offer.supplierId,
          supplierName: offer.supplierTradeName || offer.supplierName,
          supplierWhatsapp: offer.supplierWhatsapp,
          quantityPackages: comparison.suggestedPackages,
          unitPrice: offer.unitPrice,
          leadTimeDays: offer.leadTimeDays,
          paymentTerms: offer.paymentTerms,
          notes: `Ordem emitida pelo Comparativo Flind: Fornecedor ${offer.supplierTradeName} (Nota ${offer.compositeScore}/100, Prazo: ${offer.leadTimeDays}d, Validade: ${offer.shelfLifeMonths}m, Lote: ${offer.manufacturingLot}).`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao emitir ordem a partir da cotação');
      }

      const result = await res.json();
      setNotification({
        type: 'success',
        message: `🏆 Ordem ${result.purchaseOrder.orderNumber} emitida para ${offer.supplierTradeName} (${comparison.suggestedPackages} ${comparison.packagingUnit}) e disparada via WhatsApp!`,
      });

      setComparisonModalOpen(false);
      await Promise.all([fetchData(), fetchDiagnostic(), fetchComparisons()]);
      if (onRefreshGlobal) onRefreshGlobal();
      setActiveTab('orders');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setOrderingQuotationId(null);
    }
  };

  // Abrir Modal Comparativo para um produto específico
  const handleOpenComparisonModal = (productIdOrItem: string | MissingProductItem) => {
    const pId = typeof productIdOrItem === 'string' ? productIdOrItem : productIdOrItem.productId;
    const match = comparisons.find((c) => c.productId === pId);
    if (match) {
      setModalComparisonItem(match);
      setComparisonModalOpen(true);
    } else {
      setSelectedComparisonProduct(pId);
      setActiveTab('comparison');
      fetchComparisons(pId);
    }
  };

  // Emissão em lote de Ordens de Compra para reposição de todos os itens faltantes
  const handleBatchReorderAll = async () => {
    const items = diagnostic?.items || [];
    if (items.length === 0) {
      alert('Nenhum produto faltante detectado no momento.');
      return;
    }

    const confirmMsg = `Deseja gerar Ordens de Compra automáticas para ${items.length} itens faltantes?\n\nO sistema emitirá as ordens de ressuprimento e disparará notificações instantâneas no WhatsApp dos respectivos fornecedores homologados.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setBatchOrdering(true);
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantityPackages: i.suggestedReorderPackages,
          notes: `Gatilho Automático Flind: Reposição de estoque faltante. Estoque atual: ${i.currentStockPackages} ${i.packagingUnit} (Déficit: ${i.deficitPackages} volumes).`,
        })),
      };

      const res = await fetch('/api/purchase-orders/batch-reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao gerar ordens em lote');
      }

      const result = await res.json();
      setNotification({
        type: 'success',
        message: `${result.count} Ordens de Compra emitidas e enviadas aos fornecedores via WhatsApp!`,
      });

      await Promise.all([fetchData(), fetchDiagnostic()]);
      if (onRefreshGlobal) onRefreshGlobal();
      setActiveTab('orders');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setBatchOrdering(false);
    }
  };

  // Emissão expressa de Ordem de Compra individual para um item faltante
  const handleQuickReorderItem = async (item: MissingProductItem) => {
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          supplierId: item.supplierId,
          quantityPackages: item.suggestedReorderPackages,
          triggerReason: 'AUTO_LOW_STOCK',
          notes: `Ordem de Compra expressa gerada pelo Diagnóstico de Faltantes. Estoque: ${item.currentStockPackages} ${item.packagingUnit}.`,
        }),
      });

      if (!res.ok) throw new Error('Falha ao emitir ordem expressa');
      const po: PurchaseOrder = await res.json();

      setNotification({
        type: 'success',
        message: `Ordem ${po.orderNumber} emitida para "${item.name}" (${item.suggestedReorderPackages} ${item.packagingUnit}) e disparada para o WhatsApp do fornecedor!`,
      });

      await Promise.all([fetchData(), fetchDiagnostic()]);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Confirmar entrega expressa no estoque direto a partir do card de item faltante ou comparativo
  const handleQuickReceiveDelivery = async (
    poId: string,
    productName: string,
    packages: number,
    packagingUnit: string
  ) => {
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      });

      if (!res.ok) throw new Error('Falha ao confirmar recebimento no estoque');
      const updated: PurchaseOrder = await res.json();

      setNotification({
        type: 'success',
        message: `Entrega da Ordem ${updated.orderNumber} confirmada! Foram creditadas ${packages} ${packagingUnit} de "${productName}" no estoque físico. O produto saiu automaticamente da lista de faltantes!`,
      });

      await Promise.all([fetchData(), fetchDiagnostic(), fetchComparisons()]);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert(`Erro ao confirmar recebimento: ${err.message}`);
    }
  };

  // Abrir Ficha Técnica do Catálogo a partir do produto ou item faltante
  const handleOpenCatalogSpec = (productIdOrSku: string) => {
    const prod = products.find((p) => p.id === productIdOrSku || p.sku === productIdOrSku);
    if (prod) {
      setSelectedProductSpec(prod);
      setSpecModalOpen(true);
    }
  };

  // Abrir Modal de PO pré-selecionado
  const handleOpenPoModal = (productId?: string, qty?: number) => {
    if (productId) {
      setSelectedPoProduct(productId);
    } else if (products.length > 0) {
      setSelectedPoProduct(products[0].id);
    }
    if (qty && qty > 0) {
      setSuggestedPoQty(qty);
    } else {
      setSuggestedPoQty(50);
    }
    setPoModalOpen(true);
  };

  // Salvar fornecedor
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const payload: Partial<Supplier> = {
      id: editingSupplier?.id,
      name: formData.get('name') as string,
      tradeName: formData.get('tradeName') as string,
      taxId: formData.get('taxId') as string,
      stateRegistration: formData.get('stateRegistration') as string,
      contactName: formData.get('contactName') as string,
      phone: formData.get('phone') as string,
      whatsapp: formData.get('whatsapp') as string,
      email: formData.get('email') as string,
      category: formData.get('category') as string,
      leadTimeDays: Number(formData.get('leadTimeDays')),
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      paymentTerms: formData.get('paymentTerms') as string,
      status: 'HOMOLOGATED',
      notes: formData.get('notes') as string,
    };

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao salvar fornecedor');
      }

      setNotification({
        type: 'success',
        message: `Fornecedor "${payload.tradeName || payload.name}" salvo com sucesso!`,
      });
      setSupplierModalOpen(false);
      setEditingSupplier(null);
      fetchData();
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Criar Ordem de Compra manual
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const productId = formData.get('productId') as string;
    const selectedProd = products.find((p) => p.id === productId);

    const payload = {
      productId,
      supplierId: selectedProd?.supplierId || suppliers[0]?.id,
      quantityPackages: Number(formData.get('quantityPackages')),
      triggerReason: 'MANUAL',
      notes: formData.get('notes') as string,
    };

    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar ordem de compra');
      }

      const po = await res.json();
      setNotification({
        type: 'success',
        message: `Ordem de Compra ${po.orderNumber} gerada com sucesso! Disparo de WhatsApp enviado ao fornecedor.`,
      });
      setPoModalOpen(false);
      await Promise.all([fetchData(), fetchDiagnostic()]);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Atualizar status de PO (ex: marcar como entregue e alimentar estoque)
  const handleUpdatePoStatus = async (poId: string, status: PurchaseOrder['status']) => {
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Falha ao atualizar status da PO');
      const updated = await res.json();

      setNotification({
        type: 'success',
        message:
          status === 'DELIVERED'
            ? `Ordem ${updated.orderNumber} marcada como entregue! Os volumes foram creditados no estoque automaticamente.`
            : `Status da Ordem ${updated.orderNumber} atualizado para ${status}.`,
      });
      await Promise.all([fetchData(), fetchDiagnostic()]);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Reenviar WhatsApp de PO
  const handleResendPoWhatsapp = async (poId: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${poId}/send-whatsapp`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: 'success',
          message: 'Mensagem de WhatsApp reenviada ao fornecedor com sucesso!',
        });
        fetchData();
      } else {
        throw new Error(data.errorMessage || 'Falha ao reenviar');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Cancelar Compra de Fornecedor
  const handleCancelPo = async () => {
    if (!poToCancel) return;
    setIsCancellingPo(true);
    const finalReason =
      cancelReason === 'OUTRO'
        ? customCancelReason.trim() || 'Cancelado pelo usuário'
        : cancelReason;
    try {
      const res = await fetch(`/api/purchase-orders/${poToCancel.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: finalReason,
          notifySupplier: notifySupplierOnCancel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao cancelar ordem de compra.');
      }

      const data = await res.json();
      const cancelledId = poToCancel.id;
      const cancelledOrderNum = poToCancel.orderNumber;

      // Remove imediatamente da lista local de ordens de compra ativas (sai de Ordens de Compra)
      setPurchaseOrders((prev) => prev.filter((p) => p.id !== cancelledId));
      if (data.purchaseOrder) {
        setCancelledOrders((prev) => [data.purchaseOrder, ...prev.filter((p) => p.id !== cancelledId)]);
      }

      setNotification({
        type: 'success',
        message: `Ordem de Compra ${cancelledOrderNum} CANCELADA com sucesso e removida de Ordens de Compra! ${
          data.whatsappNotificationSent ? 'Fornecedor notificado via WhatsApp.' : ''
        }`,
      });
      setPoToCancel(null);
      setCustomCancelReason('');
      await Promise.all([fetchData(), fetchDiagnostic()]);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err: any) {
      alert(`Erro ao cancelar compra: ${err.message}`);
    } finally {
      setIsCancellingPo(false);
    }
  };

  // Enviar WhatsApp direto para fornecedor
  const handleSendDirectWhatsapp = (supplier: Supplier) => {
    setWhatsappSupplier(supplier);
    setWhatsappCustomMsg(
      `Olá ${supplier.contactName || 'Equipe Comercial'} (${supplier.tradeName}), aqui é do PCP da Flind Indústria. Gostaríamos de consultar o prazo de entrega e cotação para ressuprimento de insumos.`
    );
    setWhatsappModalOpen(true);
  };

  // Itens Faltantes Filtrados
  const filteredMissingItems = (diagnostic?.items || []).filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      item.name.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.supplierName.toLowerCase().includes(term) ||
      (item.material && item.material.toLowerCase().includes(term));

    const matchSeverity =
      missingSeverityFilter === 'ALL' || item.severity === missingSeverityFilter;

    const matchCategory =
      missingCategoryFilter === 'ALL' || item.category === missingCategoryFilter;

    const matchOrderStatus =
      missingOrderStatusFilter === 'ALL' ||
      (missingOrderStatusFilter === 'ORDERED' && item.hasOpenPurchaseOrder) ||
      (missingOrderStatusFilter === 'UNORDERED' && !item.hasOpenPurchaseOrder);

    return matchSearch && matchSeverity && matchCategory && matchOrderStatus;
  });

  // Produtos do Catálogo Filtrados
  const filteredCatalogProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.material && p.material.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.includes(term)) ||
      p.supplierName.toLowerCase().includes(term);

    const matchCat =
      catalogCategoryFilter === 'ALL' || p.category === catalogCategoryFilter;

    const matchStock =
      catalogStockFilter === 'ALL' ||
      (catalogStockFilter === 'LOW_OR_CRITICAL' && (p.status === 'LOW' || p.status === 'CRITICAL' || p.currentStockPackages <= p.minStockPackages)) ||
      (catalogStockFilter === 'NORMAL' && p.status === 'NORMAL' && p.currentStockPackages > p.minStockPackages);

    return matchSearch && matchCat && matchStock;
  });

  // Fornecedores Filtrados
  const filteredSuppliers = suppliers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.tradeName.toLowerCase().includes(term) ||
      s.taxId.toLowerCase().includes(term) ||
      s.category.toLowerCase().includes(term) ||
      s.city.toLowerCase().includes(term)
    );
  });

  // Ordens de Compra Ativas (Canceladas saem da lista de ordens de compra)
  const activePurchaseOrders = purchaseOrders.filter((po) => po.status !== 'CANCELLED');
  const baseOrderList = showCancelledArchive ? cancelledOrders : activePurchaseOrders;
  const filteredOrders = baseOrderList.filter((po) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      po.orderNumber.toLowerCase().includes(term) ||
      po.supplierName.toLowerCase().includes(term) ||
      po.productName.toLowerCase().includes(term) ||
      po.productSku.toLowerCase().includes(term) ||
      (po.notes || '').toLowerCase().includes(term);

    if (!matchSearch) return false;
    if (showCancelledArchive) return true;
    if (poStatusFilter === 'ALL') return true;
    if (poStatusFilter === 'PENDING') return po.status === 'PENDING' || po.status === 'SENT_WHATSAPP';
    return po.status === poStatusFilter;
  });

  const avgLeadTime = suppliers.length > 0
    ? Math.round(suppliers.reduce((acc, s) => acc + s.leadTimeDays, 0) / suppliers.length)
    : 3;

  const autoOrdersCount = activePurchaseOrders.filter((po) => po.triggerReason === 'AUTO_LOW_STOCK').length;
  const missingCount = diagnostic?.missingProductsCount || 0;
  const outOfStockCount = diagnostic?.outOfStockCount || 0;
  const missingItemsWithOrder = (diagnostic?.items || []).filter((i) => i.hasOpenPurchaseOrder);
  const missingItemsWithoutOrder = (diagnostic?.items || []).filter((i) => !i.hasOpenPurchaseOrder);

  return (
    <div className="space-y-6">
      {/* Notificação Toast */}
      {notification && (
        <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Fornecedores, Ordens de Compra & Catálogo Técnico Flind
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pesquisa e diagnóstico automático de <strong>produtos faltantes / abaixo do mínimo</strong>, leitura completa de <strong>fichas técnicas do catálogo</strong> e disparo instantâneo de ordens de reposição via WhatsApp para fornecedores homologados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              fetchDiagnostic();
              fetchData();
            }}
            disabled={loadingDiagnostic}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-200"
            title="Escanear e recalcular faltantes em tempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDiagnostic ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Atualizar Diagnóstico</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPoModal()}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-300" />
            <span>Emitir Ordem de Compra</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingSupplier(null);
              setSupplierModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas e Diagnóstico */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Card 1: Faltantes / Ruptura */}
        <div
          onClick={() => setActiveTab('missing')}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            missingCount > 0
              ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Produtos Faltantes</span>
            </div>
            {outOfStockCount > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-extrabold rounded-full animate-pulse">
                {outOfStockCount} Ruptura
              </span>
            )}
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-2xl font-black text-rose-700">{missingCount} itens</div>
            {missingItemsWithOrder.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {missingItemsWithOrder.length} já pedido(s)
              </span>
            )}
          </div>
          <div className="text-[10px] text-rose-600 font-semibold mt-0.5 flex items-center justify-between">
            <span>{diagnostic ? `${diagnostic.totalDeficitPackages} vols em déficit` : 'Calculando...'}</span>
            {missingItemsWithoutOrder.length > 0 && (
              <span className="text-amber-700 font-bold">{missingItemsWithoutOrder.length} pendente(s)</span>
            )}
          </div>
        </div>

        {/* Card 2: Cotações & Comparativo Inteligente (Melhor Opção) */}
        <div
          onClick={() => {
            setActiveTab('comparison');
            fetchComparisons();
          }}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all ${
            activeTab === 'comparison'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cotações & Comparativo</span>
            </div>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
              Melhor Opção
            </span>
          </div>
          <div className="mt-1 text-2xl font-black text-emerald-700">{comparisons.length} cotações</div>
          <div className="text-[10px] text-emerald-700/80 font-bold flex items-center space-x-1 mt-0.5">
            <span>Preço, Prazo, Fabr. e Validade</span>
          </div>
        </div>

        {/* Card 3: Catálogo Técnico Flind */}
        <div
          onClick={() => setActiveTab('catalog')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-300 transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Catálogo Flind</span>
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">{products.length} itens</div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
            Fichas técnicas & Insumos MP
          </div>
        </div>

        {/* Card 4: Fornecedores & Lead Time */}
        <div
          onClick={() => setActiveTab('suppliers')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all"
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Fornecedores</span>
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900">{suppliers.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Lead time médio: <strong className="text-slate-700">{avgLeadTime} dias</strong>
          </div>
        </div>

        {/* Card 5: Ordens de Compra & Reposição WhatsApp */}
        <div
          onClick={() => {
            setActiveTab('orders');
            setShowCancelledArchive(false);
          }}
          className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Ordens de Compra</span>
          </div>
          <div className="mt-1 text-2xl font-black text-amber-600">{activePurchaseOrders.length}</div>
          <div className="text-[10px] text-amber-700/80 font-bold flex items-center space-x-1 mt-0.5">
            <span>{autoOrdersCount} via ressuprimento automático</span>
          </div>
        </div>
      </div>

      {/* Tabs Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Barra Superior com as 5 Abas e Busca */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Aba 1: Faltantes */}
            <button
              type="button"
              onClick={() => setActiveTab('missing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'missing'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${activeTab === 'missing' ? 'text-white' : 'text-rose-500'}`} />
              <span>Pesquisa Automática de Faltantes</span>
              {missingCount > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'missing' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {missingCount}
                </span>
              )}
            </button>

            {/* Aba 2: Cotações & Comparativo (Melhor Opção) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('comparison');
                fetchComparisons();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'comparison'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <Scale className={`w-3.5 h-3.5 ${activeTab === 'comparison' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Cotações & Comparativo (Melhor Opção)</span>
              {comparisons.length > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'comparison' ? 'bg-white text-emerald-900' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {comparisons.length}
                </span>
              )}
            </button>

            {/* Aba 3: Catálogo Técnico */}
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'catalog' ? 'text-white' : 'text-indigo-500'}`} />
              <span>Catálogo Técnico de Produtos & Insumos</span>
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'catalog' ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {products.length}
              </span>
            </button>

            {/* Aba 3: Fornecedores */}
            <button
              type="button"
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'suppliers'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${activeTab === 'suppliers' ? 'text-white' : 'text-slate-500'}`} />
              <span>Fornecedores Homologados ({suppliers.length})</span>
            </button>

            {/* Aba 4: Ordens de Compra */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('orders');
                setShowCancelledArchive(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === 'orders' ? 'text-white' : 'text-slate-500'}`} />
              <span>Ordens de Compra ({activePurchaseOrders.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, SKU, insumo, PO..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* ABA 1: PESQUISA AUTOMÁTICA DE PRODUTOS FALTANTES          */}
        {/* ========================================================= */}
        {activeTab === 'missing' && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Banner de Diagnóstico e Ação em Lote */}
            <div className="p-4 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Diagnóstico Automático de Ressuprimento em Tempo Real
                  </h3>
                  {diagnostic?.scannedAt && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Última varredura: {new Date(diagnostic.scannedAt).toLocaleTimeString('pt-BR')})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  O algoritmo analisa o estoque físico atual, o estoque de segurança (ponto de ressuprimento) e a demanda de pedidos em separação para identificar déficits e sugerir lotes ideais de compra.
                </p>
              </div>

              {missingCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('comparison');
                      fetchComparisons();
                    }}
                    className="px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-all hover:scale-[1.02]"
                    title="Abrir matriz comparativa inteligente de cotações de fornecedores"
                  >
                    <Scale className="w-4 h-4 text-emerald-200" />
                    <span>⚖️ Ver Comparativo (Melhor Opção)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchReorderAll}
                    disabled={batchOrdering}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all hover:scale-[1.02]"
                  >
                    <Zap className={`w-4 h-4 text-amber-200 ${batchOrdering ? 'animate-spin' : ''}`} />
                    <span>
                      {batchOrdering
                        ? 'Emitindo Ordens & Notificando WhatsApp...'
                        : `⚡ Gerar Ordens em Lote para Todos os ${missingCount} Faltantes`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Barra de Filtros da Aba de Faltantes */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center space-x-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Severidade:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMissingSeverityFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                    missingSeverityFilter === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({diagnostic?.items.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setMissingSeverityFilter('OUT_OF_STOCK')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                    missingSeverityFilter === 'OUT_OF_STOCK'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Ruptura Imediata ({diagnostic?.outOfStockCount || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setMissingSeverityFilter('CRITICAL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                    missingSeverityFilter === 'CRITICAL'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Nível Crítico ({diagnostic?.criticalCount || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setMissingSeverityFilter('LOW')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                    missingSeverityFilter === 'LOW'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  Abaixo do Mínimo ({diagnostic?.lowStockCount || 0})
                </button>
              </div>

              {/* Filtro por Situação do Pedido */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center space-x-1">
                  <Truck className="w-3 h-3 text-indigo-600" />
                  <span>Situação:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMissingOrderStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                    missingOrderStatusFilter === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({diagnostic?.items.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setMissingOrderStatusFilter('ORDERED')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 ${
                    missingOrderStatusFilter === 'ORDERED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>Já Pedido ({missingItemsWithOrder.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMissingOrderStatusFilter('UNORDERED')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center space-x-1 ${
                    missingOrderStatusFilter === 'UNORDERED'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Pendente ({missingItemsWithoutOrder.length})</span>
                </button>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Segmento:</span>
                <select
                  value={missingCategoryFilter}
                  onChange={(e) => setMissingCategoryFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">Todas as Categorias</option>
                  <option value="Hospitalar & Cirúrgico">Hospitalar & Cirúrgico</option>
                  <option value="Estética & Spas">Estética & Spas</option>
                  <option value="Salões & Barbearias">Salões & Barbearias</option>
                  <option value="Insumo & Matéria-Prima">Insumo & Matéria-Prima</option>
                </select>
              </div>
            </div>

            {/* Listagem / Cards de Itens Faltantes */}
            {filteredMissingItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">
                  Nenhum produto faltante encontrado no momento!
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Todos os produtos e insumos estão acima da margem de segurança do estoque mínimo. O sistema continua monitorando as saídas e disparará alertas automaticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMissingItems.map((item) => {
                  const stockPercent = item.minStockPackages > 0
                    ? Math.min(100, Math.round((item.currentStockPackages / item.minStockPackages) * 100))
                    : 0;

                  return (
                    <div
                      key={item.productId}
                      className={`p-4 rounded-xl border transition-all space-y-3 shadow-xs ${
                        item.hasOpenPurchaseOrder
                          ? 'bg-gradient-to-b from-emerald-50/40 via-white to-white border-emerald-300 ring-1 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                              {item.sku}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-50 text-slate-600 rounded border border-slate-200">
                              {item.category}
                            </span>
                            {item.severity === 'OUT_OF_STOCK' && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-600 text-white rounded-full flex items-center space-x-1 animate-pulse">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>RUPTURA IMEDIATA</span>
                              </span>
                            )}
                            {item.severity === 'CRITICAL' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500 text-white rounded-full">
                                NÍVEL CRÍTICO (&le; 35% DO MÍNIMO)
                              </span>
                            )}
                            {item.severity === 'LOW' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                ABAIXO DO MÍNIMO
                              </span>
                            )}

                            {/* ASSINALADO SE JÁ FOI FEITO PEDIDO */}
                            {item.hasOpenPurchaseOrder ? (
                              <span className="text-[11px] font-black px-2.5 py-0.5 bg-emerald-600 text-white rounded-full flex items-center space-x-1.5 shadow-2xs border border-emerald-500 animate-in fade-in">
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                <span>PEDIDO JÁ REALIZADO ({item.openPoNumbers?.join(', ')})</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                <span>Pendente de Pedido</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                          {item.material && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              <strong>Composição/Material:</strong> {item.material}
                            </p>
                          )}
                        </div>

                        {/* Botões de Ação Imediata do Item */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenComparisonModal(item)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
                            title="Comparar valores, prazos de entrega, fabricação e validade entre fornecedores"
                          >
                            <Scale className="w-3.5 h-3.5 text-emerald-600" />
                            <span>⚖️ Comparar Cotações</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCatalogSpec(item.productId)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors"
                            title="Ler especificações do catálogo"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Catálogo</span>
                          </button>

                          {item.hasOpenPurchaseOrder ? (
                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.openPoList && item.openPoList.length > 0) {
                                    handleQuickReceiveDelivery(
                                      item.openPoList[0].id,
                                      item.name,
                                      item.openPoList[0].quantityPackages,
                                      item.packagingUnit
                                    );
                                  } else {
                                    setActiveTab('orders');
                                    setShowCancelledArchive(false);
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                                title="Confirmar entrega do pedido e creditar entrada física no estoque imediatamente"
                              >
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                <span>Confirmar Entrega em Estoque</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleQuickReorderItem(item)}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors shadow-2xs cursor-pointer"
                                title={`Já existem ${item.openPoTotalPackages} volumes em trânsito. Clique aqui para emitir um pedido complementar de mais ${item.suggestedReorderPackages} volumes.`}
                              >
                                <span>+ Pedir Mais</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleQuickReorderItem(item)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
                              title={`Emitir PO de ${item.suggestedReorderPackages} ${item.packagingUnit} e notificar fornecedor`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Pedir {item.suggestedReorderPackages} {item.packagingUnit.split(' ')[0]}s</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Métricas e Barra de Nível */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <div className="text-[10px] font-semibold text-slate-500">Estoque Atual vs Mínimo</div>
                          <div className="mt-1 font-bold text-slate-800">
                            <span className={item.currentStockPackages <= 0 ? 'text-rose-600' : 'text-slate-900'}>
                              {item.currentStockPackages} {item.packagingUnit}
                            </span>
                            <span className="text-slate-400 font-normal"> / mín {item.minStockPackages}</span>
                          </div>
                          <div className="mt-1.5 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                stockPercent < 25 ? 'bg-rose-500' : stockPercent < 60 ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.max(5, stockPercent)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
                          <div className="text-[10px] font-semibold text-rose-700">Déficit de Reposição</div>
                          <div className="mt-1 font-bold text-rose-800">
                            {item.deficitPackages} {item.packagingUnit}
                          </div>
                          <div className="text-[10px] text-rose-600/80">
                            ({item.deficitUnits.toLocaleString('pt-BR')} unidades)
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg">
                          <div className="text-[10px] font-semibold text-slate-500">Fornecedor Homologado</div>
                          <div className="mt-1 font-bold text-slate-800 truncate" title={item.supplierName}>
                            {item.supplierName}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-indigo-500" />
                            <span>Lead time: {item.leadTimeDays} dias</span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
                          <div className="text-[10px] font-semibold text-indigo-800">Sugestão de Compra Flind</div>
                          <div className="mt-1 font-bold text-indigo-900">
                            {item.suggestedReorderPackages} {item.packagingUnit}
                          </div>
                          <div className="text-[10px] text-indigo-700/80">
                            Custo est.: R$ {item.estimatedTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>

                      {/* Notificação e Gestão de Pedido já Realizado em Trânsito */}
                      {item.hasOpenPurchaseOrder && (
                        <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-xl text-emerald-950 text-xs space-y-2.5 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-start space-x-2.5">
                              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black shadow-xs text-sm">
                                ✓
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-extrabold text-emerald-950 text-xs uppercase tracking-wide">
                                    PEDIDO JÁ REALIZADO COM O FORNECEDOR
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                                    Aguardando Entrega em Estoque
                                  </span>
                                </div>
                                <p className="text-[11px] text-emerald-800 mt-0.5">
                                  {item.openPoNumbers?.length === 1 ? 'Ordem de Compra:' : 'Ordens de Compra:'}{' '}
                                  <strong className="font-mono text-emerald-950 font-bold">{item.openPoNumbers?.join(', ')}</strong> • Total de{' '}
                                  <strong className="text-emerald-950">{item.openPoTotalPackages} {item.packagingUnit}</strong> em trânsito com <strong>{item.supplierName}</strong>.
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                              {item.openPoList && item.openPoList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuickReceiveDelivery(
                                      item.openPoList![0].id,
                                      item.name,
                                      item.openPoList![0].quantityPackages,
                                      item.packagingUnit
                                    )
                                  }
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                                  title="Dar entrada imediata no estoque e remover item dos faltantes"
                                >
                                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  <span>Confirmar Entrega em Estoque</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('orders');
                                  setShowCancelledArchive(false);
                                }}
                                className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs"
                              >
                                <span>Ver Ordens &rarr;</span>
                              </button>
                            </div>
                          </div>

                          {item.openPoList && item.openPoList.length > 0 && (
                            <div className="pt-2 border-t border-emerald-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-800">
                              <div className="flex flex-wrap items-center gap-3">
                                <span>
                                  <strong>Status da Compra:</strong>{' '}
                                  {item.openPoList[0].status === 'SENT_WHATSAPP'
                                    ? 'Disparada via WhatsApp ao Fornecedor'
                                    : item.openPoList[0].status === 'CONFIRMED'
                                    ? 'Confirmada pelo Fornecedor'
                                    : item.openPoList[0].status}
                                </span>
                                {item.openPoList[0].expectedDeliveryDate && (
                                  <span>
                                    <strong>Previsão de Chegada:</strong>{' '}
                                    {new Date(item.openPoList[0].expectedDeliveryDate).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                              <span className="text-emerald-700 italic text-[10px]">
                                * O produto permanece assinalado nesta lista até a chegada física no estoque. Ao confirmar a entrega, o estoque é alimentado e ele sai automaticamente de faltantes.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA: COTAÇÕES & COMPARATIVO INTELIGENTE DE FORNECEDORES   */}
        {/* ========================================================= */}
        {activeTab === 'comparison' && (
          <div className="p-4 sm:p-5 space-y-6">
            {/* Banner Explicativo com os 4 Pilares da Decisão Flind */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Pesquisa de Mercado & Matriz Comparativa de Cotações
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                      Melhor Compra Flind
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-4xl">
                    O sistema identifica insumos e produtos faltantes em estoque, realiza a cotação simultânea entre fornecedores homologados e concorrentes de mercado e cruza <strong>Valores Comerciais</strong>, <strong>Tempo de Entrega</strong>, <strong>Capacidade de Fabricação / Laudos</strong> e <strong>Validade do Produto</strong>, recomendando a melhor escolha para aquisição.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fetchComparisons(selectedComparisonProduct)}
                    disabled={loadingComparisons}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingComparisons ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
                    <span>Atualizar Cotações</span>
                  </button>
                </div>
              </div>

              {/* Os 4 Pilares Explicativos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60">
                <div className="flex items-start space-x-2 p-2 bg-white/90 rounded-lg border border-emerald-100">
                  <DollarSign className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-900 block">1. Valores & Condições (40%)</span>
                    <span className="text-slate-500 text-[10px]">Preço unitário, total do lote, frete CIF/FOB e prazo de pagamento</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-2 bg-white/90 rounded-lg border border-emerald-100">
                  <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-900 block">2. Tempo de Entrega (25%)</span>
                    <span className="text-slate-500 text-[10px]">Lead time em dias, previsão de doca e taxa de pontualidade</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-2 bg-white/90 rounded-lg border border-emerald-100">
                  <PackageCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-900 block">3. Fabricação & Laudos (15%)</span>
                    <span className="text-slate-500 text-[10px]">Lote fabril, capacidade de linha e conformidade ANVISA</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-2 bg-white/90 rounded-lg border border-emerald-100">
                  <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-900 block">4. Validade do Produto (20%)</span>
                    <span className="text-slate-500 text-[10px]">Prazo de shelf-life total e frescor do lote de fabricação</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Filtro de Produtos Faltantes */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-700">Filtrar Comparativo por Produto:</span>
                <select
                  value={selectedComparisonProduct}
                  onChange={(e) => {
                    setSelectedComparisonProduct(e.target.value);
                    fetchComparisons(e.target.value);
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Todos os Produtos Faltantes ({comparisons.length})</option>
                  {comparisons.map((c) => (
                    <option key={c.productId} value={c.productId}>
                      {c.name} ({c.sku}) — Déficit: {c.deficitPackages} {c.packagingUnit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500">
                Mostrando <strong>{selectedComparisonProduct === 'ALL' ? comparisons.length : comparisons.filter((c) => c.productId === selectedComparisonProduct).length}</strong> produto(s) comparado(s)
              </div>
            </div>

            {/* Lista de Comparativos */}
            {loadingComparisons ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Cotando com fornecedores e calculando melhor compra...</p>
                <p className="text-xs text-slate-400 mt-1">Comparando valores, prazos de entrega, auditoria fabril e validades.</p>
              </div>
            ) : comparisons.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-700">Nenhum produto faltante pendente de cotação no momento.</p>
                <p className="text-xs text-slate-400 mt-1">Todos os estoques da fábrica estão acima da margem de segurança.</p>
              </div>
            ) : (
              (selectedComparisonProduct === 'ALL'
                ? comparisons
                : comparisons.filter((c) => c.productId === selectedComparisonProduct)
              ).map((comp) => (
                <div key={comp.productId} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Cabeçalho do Produto e Diagnóstico de Estoque */}
                  <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-bold">
                            {comp.sku}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                            {comp.category}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full">
                            DÉFICIT: {comp.deficitPackages} {comp.packagingUnit}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5">{comp.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Estoque físico atual: <strong>{comp.currentStockPackages} {comp.packagingUnit}</strong> | Estoque mínimo de segurança: <strong>{comp.minStockPackages} {comp.packagingUnit}</strong> | Sugestão de ressuprimento: <strong>{comp.suggestedPackages} {comp.packagingUnit}</strong>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenCatalogSpec(comp.productId)}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Ficha Técnica</span>
                        </button>
                      </div>
                    </div>

                    {/* Alerta de Pedido em Andamento para este produto */}
                    {comp.hasOpenPurchaseOrder && (
                      <div className="mt-3 p-3 bg-emerald-100/90 border border-emerald-300 rounded-xl text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xs">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>
                            <strong>Pedido já realizado para este produto:</strong> {comp.openPoNumbers?.join(', ')} ({comp.openPoTotalPackages} {comp.packagingUnit} solicitados). Aguardando entrega física em estoque.
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          {comp.openPoList && comp.openPoList.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickReceiveDelivery(
                                  comp.openPoList![0].id,
                                  comp.name,
                                  comp.openPoList![0].quantityPackages,
                                  comp.packagingUnit
                                )
                              }
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                              title="Confirmar entrega e creditar estoque físico"
                            >
                              <Check className="w-3 h-3 text-white" />
                              <span>Confirmar Entrega em Estoque</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('orders');
                              setShowCancelledArchive(false);
                            }}
                            className="text-emerald-800 font-bold hover:underline text-[11px] cursor-pointer"
                          >
                            Ver Ordens &rarr;
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Banner de Indicação da Melhor Compra */}
                    <div className="mt-4 p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-amber-300 shrink-0" />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                            Recomendação Flind de Compra:
                          </span>
                          <strong className="text-sm font-black text-white underline decoration-amber-300 underline-offset-2">
                            {comp.recommendedSupplierName}
                          </strong>
                        </div>
                        <p className="text-xs text-emerald-50 leading-relaxed max-w-4xl">
                          {comp.recommendationReason}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px] font-bold">
                        {comp.priceSavingsVsWorstPct > 0 && (
                          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-lg text-emerald-100 flex items-center space-x-1">
                            <DollarSign className="w-3.5 h-3.5 text-amber-300" />
                            <span>Economia: {comp.priceSavingsVsWorstPct}%</span>
                          </span>
                        )}
                        {comp.leadTimeAdvantageDays > 0 && (
                          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-xs rounded-lg text-emerald-100 flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5 text-amber-300" />
                            <span>-{comp.leadTimeAdvantageDays} dias no prazo</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grid Comparativo dos Fornecedores (Valores, Prazo, Fabricação e Validade) */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {comp.offers.map((offer) => {
                        const isBest = offer.isBestChoice;
                        const isOrdering = orderingQuotationId === offer.id;

                        return (
                          <div
                            key={offer.id}
                            className={`rounded-xl border flex flex-col justify-between transition-all ${
                              isBest
                                ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
                                : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <div>
                              {/* Top Ribbon */}
                              <div
                                className={`px-3.5 py-2 flex items-center justify-between text-xs font-black ${
                                  isBest
                                    ? 'bg-emerald-600 text-white rounded-t-[10px]'
                                    : 'bg-slate-100 text-slate-700 rounded-t-[11px] border-b border-slate-200'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5">
                                  {isBest && <Award className="w-4 h-4 text-amber-300" />}
                                  <span>{isBest ? '🏆 MELHOR ESCOLHA FLIND' : 'Cotação de Mercado'}</span>
                                </div>
                                <span className="px-2 py-0.5 bg-white/20 backdrop-blur-xs rounded-md font-mono text-[11px]">
                                  Score: {offer.compositeScore}/100
                                </span>
                              </div>

                              {/* Cabeçalho do Fornecedor */}
                              <div className="p-4 border-b border-slate-100 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                                      {offer.supplierTradeName}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 truncate" title={offer.supplierName}>
                                      {offer.supplierName}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {offer.supplierCity} - {offer.supplierState}
                                    </p>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                                      offer.supplierStatus === 'HOMOLOGATED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {offer.supplierStatus === 'HOMOLOGATED' ? 'HOMOLOGADO' : 'ATIVO'}
                                  </span>
                                </div>

                                {/* Badges Comerciais */}
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {offer.badges.map((b, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                        b.includes('Melhor')
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : b.includes('Menor Preço')
                                          ? 'bg-blue-100 text-blue-800'
                                          : b.includes('Rápida')
                                          ? 'bg-amber-100 text-amber-800'
                                          : b.includes('Validade')
                                          ? 'bg-teal-100 text-teal-800'
                                          : 'bg-purple-100 text-purple-800'
                                      }`}
                                    >
                                      {b}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* 4 Pilares da Cotação */}
                              <div className="p-4 space-y-3.5 text-xs">
                                {/* Pilar 1: VALORES */}
                                <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                    <span className="flex items-center space-x-1">
                                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>1. Valores & Condições</span>
                                    </span>
                                    <span className="text-[10px] text-emerald-700 font-mono">
                                      Nota: {offer.priceScore}/100
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between pt-0.5">
                                    <span className="text-slate-500 text-[11px]">Preço Unitário:</span>
                                    <span className="text-sm font-black text-slate-900">
                                      R$ {offer.unitPrice.toFixed(2)}
                                      <span className="text-[10px] text-slate-400 font-normal"> / {comp.packagingUnit.split(' ')[0]}</span>
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between text-[11px]">
                                    <span className="text-slate-500">Total ({comp.suggestedPackages} volumes):</span>
                                    <span className="font-bold text-slate-800">
                                      R$ {offer.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-200/60">
                                    <span>{offer.paymentTerms}</span>
                                    <span className="font-bold text-indigo-700">Frete: {offer.freightType}</span>
                                  </div>
                                </div>

                                {/* Pilar 2: TEMPO DE ENTREGA */}
                                <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                    <span className="flex items-center space-x-1">
                                      <Truck className="w-3.5 h-3.5 text-blue-600" />
                                      <span>2. Tempo de Entrega</span>
                                    </span>
                                    <span className="text-[10px] text-blue-700 font-mono">
                                      Nota: {offer.deliveryScore}/100
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between pt-0.5">
                                    <span className="text-slate-500 text-[11px]">Prazo de Entrega:</span>
                                    <span className={`text-xs font-black ${offer.leadTimeDays <= 3 ? 'text-emerald-700' : 'text-slate-800'}`}>
                                      {offer.leadTimeDays} dia(s) úteis
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between text-[10px] text-slate-500">
                                    <span>Previsão de Doca:</span>
                                    <span className="font-semibold text-slate-700">{offer.expectedDeliveryDate}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-200/60 flex items-center justify-between">
                                    <span>Pontualidade Histórica:</span>
                                    <span className="font-bold text-slate-700">{offer.onTimeDeliveryRatePct}% entregas no prazo</span>
                                  </div>
                                </div>

                                {/* Pilar 3: FABRICAÇÃO & LAUDOS */}
                                <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                    <span className="flex items-center space-x-1">
                                      <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>3. Fabricação & Laudos</span>
                                    </span>
                                    <span className="text-[10px] text-indigo-700 font-mono">
                                      Nota: {offer.manufacturingScore}/100
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-600 space-y-0.5 pt-0.5">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Lote Industrial:</span>
                                      <span className="font-mono font-bold text-slate-800">{offer.manufacturingLot}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Fabricação:</span>
                                      <span className="font-semibold text-slate-700">{offer.manufacturingDate}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">Capacidade:</span>
                                      <span className="text-slate-700">{offer.manufacturingCapacity}</span>
                                    </div>
                                    <div className="pt-0.5 border-t border-slate-200/60 text-[10px] flex items-center justify-between">
                                      <span className="text-slate-500">ANVISA:</span>
                                      <span className="font-bold text-emerald-700 flex items-center space-x-0.5">
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span>Conforme & Auditado</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Pilar 4: VALIDADE DO PRODUTO */}
                                <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-100 space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                      <span>4. Validade do Produto</span>
                                    </span>
                                    <span className="text-[10px] text-amber-700 font-mono">
                                      Nota: {offer.shelfLifeScore}/100
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between pt-0.5">
                                    <span className="text-slate-500 text-[11px]">Shelf-Life Total:</span>
                                    <span className="text-xs font-black text-slate-900">
                                      {offer.shelfLifeMonths} meses ({Math.round(offer.shelfLifeMonths / 12)} anos)
                                    </span>
                                  </div>
                                  <div className="flex items-baseline justify-between text-[10px] text-slate-500">
                                    <span>Vencimento do Lote:</span>
                                    <span className="font-semibold text-slate-700">{offer.expiryDate}</span>
                                  </div>
                                  <div className="text-[10px] text-emerald-700 font-semibold pt-0.5 border-t border-slate-200/60 flex items-center space-x-1">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>{offer.freshnessLabel}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Botão de Compra e Emissão de P.O. */}
                            <div className="p-4 pt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => handleCreatePoFromQuotation(comp, offer)}
                                disabled={isOrdering}
                                className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-xs ${
                                  isBest
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01]'
                                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                                }`}
                              >
                                {isOrdering ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                    <span>Emitindo P.O. & Disparando WhatsApp...</span>
                                  </>
                                ) : isBest ? (
                                  <>
                                    <Award className="w-4 h-4 text-amber-300" />
                                    <span>🏆 Aprovar Melhor Opção ({comp.suggestedPackages} vol)</span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-4 h-4 text-slate-300" />
                                    <span>Emitir P.O. para este Fornecedor</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: CATÁLOGO TÉCNICO DE PRODUTOS & INSUMOS FLIND      */}
        {/* ========================================================= */}
        {activeTab === 'catalog' && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Header explicativo do Catálogo */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Catálogo de Engenharia & Fichas Técnicas Flind
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  Consulte informações completas de fabricação, registros ANVISA, materiais, gramaturas, dimensões técnicas e embalagens de todos os produtos acabados e insumos da fábrica.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500">
                  Exibindo <strong>{filteredCatalogProducts.length}</strong> de {products.length} itens cadastrados
                </span>
              </div>
            </div>

            {/* Filtros da Aba de Catálogo */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Categoria:</span>
                {['ALL', 'Hospitalar & Cirúrgico', 'Estética & Spas', 'Salões & Barbearias', 'Insumo & Matéria-Prima'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      catalogCategoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'ALL' ? 'Todas as Categorias' : cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-semibold text-slate-500">Estoque:</span>
                <select
                  value={catalogStockFilter}
                  onChange={(e) => setCatalogStockFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="LOW_OR_CRITICAL">Abaixo do Mínimo / Faltantes</option>
                  <option value="NORMAL">Estoque Normal</option>
                </select>
              </div>
            </div>

            {/* Grid de Fichas do Catálogo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCatalogProducts.map((p) => {
                const isShortage = p.currentStockPackages <= p.minStockPackages;

                return (
                  <div
                    key={p.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded">
                              {p.sku}
                            </span>
                            {p.barcode && (
                              <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                                <Barcode className="w-3 h-3 text-slate-400" />
                                <span>{p.barcode}</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{p.name}</h4>
                          <span className="inline-block text-[10px] font-semibold px-2 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                            {p.category}
                          </span>
                        </div>

                        {/* Status de estoque */}
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              p.currentStockPackages <= 0
                                ? 'bg-rose-600 text-white'
                                : isShortage
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.currentStockPackages <= 0
                              ? 'Ruptura'
                              : isShortage
                              ? 'Reposição Necessária'
                              : 'Estoque Normal'}
                          </span>
                        </div>
                      </div>

                      {/* Especificações Técnicas Resumidas */}
                      <div className="bg-slate-50 p-2.5 rounded-lg space-y-1 text-xs text-slate-600">
                        {p.material && (
                          <p className="line-clamp-2">
                            <strong>Material / Insumo:</strong> {p.material}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                          {p.grammage && (
                            <span>
                              <strong>Gramatura:</strong> {p.grammage}
                            </span>
                          )}
                          {p.dimensions && (
                            <span>
                              <strong>Dimensões:</strong> {p.dimensions}
                            </span>
                          )}
                          {p.anvisaRegistration && (
                            <span className="text-indigo-700 font-semibold">
                              <strong>Reg.:</strong> {p.anvisaRegistration}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dados de Fornecedor & Embalagem */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-500">Fornecedor Vinculado:</span>
                          <p className="font-semibold text-slate-800 truncate">{p.supplierName}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Embalagem de Fábrica:</span>
                          <p className="font-semibold text-slate-800">
                            {p.packagingUnit} ({p.unitsPerPackage} un)
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Estoque Atual:</span>
                          <p className="font-bold text-slate-900">
                            {p.currentStockPackages} {p.packagingUnit} (mín: {p.minStockPackages})
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Custo de Aquisição:</span>
                          <p className="font-bold text-emerald-700">
                            R$ {p.costPrice.toFixed(2)} / vol
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ações da Ficha */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProductSpec(p);
                          setSpecModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ler Ficha Completa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPoModal(p.id, p.reorderQuantityPackages || 50)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Comprar / Repor</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: FORNECEDORES CADASTRADOS                           */}
        {/* ========================================================= */}
        {activeTab === 'suppliers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Fornecedor / Razão Social</th>
                  <th className="py-3 px-4">Categoria Fornecida</th>
                  <th className="py-3 px-4">Contato & WhatsApp</th>
                  <th className="py-3 px-4">Cidade / UF</th>
                  <th className="py-3 px-4">Lead Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum fornecedor encontrado para o termo pesquisado.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {supplier.tradeName || supplier.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          CNPJ: {supplier.taxId}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {supplier.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{supplier.contactName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1">
                          <Phone className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{supplier.whatsapp || supplier.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {supplier.city} / {supplier.state}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1 text-slate-700 font-bold">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{supplier.leadTimeDays} dias</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Homologado
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleSendDirectWhatsapp(supplier)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            title="Disparar mensagem no WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setSupplierModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                            title="Editar fornecedor"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 4: HISTÓRICO DE ORDENS DE COMPRA (P.O.)               */}
        {/* ========================================================= */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            {/* Barra de Filtros de Status da Ordem de Compra */}
            {showCancelledArchive ? (
              <div className="p-3 border-b border-rose-200 bg-rose-50/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white flex items-center space-x-1.5">
                    <Ban className="w-3.5 h-3.5" />
                    <span>Arquivo de Compras Canceladas ({cancelledOrders.length})</span>
                  </span>
                  <span className="text-xs text-rose-800">
                    Ordens canceladas que foram removidas da lista de ordens de compra
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCancelledArchive(false)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
                >
                  <span>← Voltar para Ordens de Compra Ativas ({activePurchaseOrders.length})</span>
                </button>
              </div>
            ) : (
              <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
                  {[
                    { id: 'ALL', label: `Todas (${activePurchaseOrders.length})` },
                    {
                      id: 'PENDING',
                      label: `Pendentes (${
                        activePurchaseOrders.filter((p) => p.status === 'PENDING' || p.status === 'SENT_WHATSAPP').length
                      })`,
                    },
                    {
                      id: 'CONFIRMED',
                      label: `Confirmadas (${activePurchaseOrders.filter((p) => p.status === 'CONFIRMED').length})`,
                    },
                    {
                      id: 'DELIVERED',
                      label: `Entregues (${activePurchaseOrders.filter((p) => p.status === 'DELIVERED').length})`,
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPoStatusFilter(f.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        poStatusFilter === f.id
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  {cancelledOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCancelledArchive(true)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-colors"
                      title="Ver compras canceladas que foram removidas de Ordens de Compra"
                    >
                      <Archive className="w-3.5 h-3.5 text-rose-600" />
                      <span>Ver Canceladas ({cancelledOrders.length})</span>
                    </button>
                  )}
                  <div className="text-[11px] text-slate-500 font-medium">
                    {filteredOrders.length} ordem(ns) de compra ativa(s)
                  </div>
                </div>
              </div>
            )}

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Nº Ordem (P.O.)</th>
                  <th className="py-3 px-4">Produto / SKU</th>
                  <th className="py-3 px-4">Fornecedor</th>
                  <th className="py-3 px-4">Quantidade</th>
                  <th className="py-3 px-4">Valor Estimado</th>
                  <th className="py-3 px-4">Gatilho</th>
                  <th className="py-3 px-4">Previsão</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Nenhuma ordem de compra encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((po) => {
                    const statusConfig = {
                      PENDING: { label: 'Pendente', bg: 'bg-amber-100', text: 'text-amber-800' },
                      SENT_WHATSAPP: { label: 'Disparada WhatsApp', bg: 'bg-blue-100', text: 'text-blue-800' },
                      CONFIRMED: { label: 'Confirmada', bg: 'bg-indigo-100', text: 'text-indigo-800' },
                      DELIVERED: { label: 'Entregue / Em Estoque', bg: 'bg-emerald-100', text: 'text-emerald-800' },
                      CANCELLED: { label: 'Cancelada', bg: 'bg-rose-100', text: 'text-rose-800' },
                    }[po.status] || { label: po.status, bg: 'bg-slate-100', text: 'text-slate-800' };

                    const isCancelled = po.status === 'CANCELLED';

                    return (
                      <tr
                        key={po.id}
                        className={
                          isCancelled
                            ? 'bg-rose-50/20 hover:bg-rose-50/35 transition-colors'
                            : 'hover:bg-slate-50/80 transition-colors'
                        }
                      >
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                          {po.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{po.productName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{po.productSku}</div>
                          {po.notes && (
                            <div
                              className={`text-[10px] mt-0.5 ${
                                isCancelled ? 'text-rose-700 font-medium' : 'text-slate-500 italic'
                              }`}
                            >
                              {po.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div>{po.supplierName}</div>
                          <div className="text-[10px] text-emerald-600 font-mono">
                            {po.supplierWhatsapp}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {po.quantityPackages} {po.packagingUnit}
                          <div className="text-[10px] font-normal text-slate-400">
                            ({po.quantityUnits} un)
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          R$ {po.estimatedCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          {po.triggerReason === 'AUTO_LOW_STOCK' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center space-x-1 w-max">
                              <Zap className="w-2.5 h-2.5 text-amber-600" />
                              <span>Automático</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {po.expectedDeliveryDate
                            ? new Date(po.expectedDeliveryDate).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {po.status !== 'DELIVERED' && po.status !== 'CANCELLED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdatePoStatus(po.id, 'DELIVERED')}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                  title="Marcar como entregue e creditar volumes no estoque imediatamente"
                                >
                                  Receber no Estoque
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResendPoWhatsapp(po.id)}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                                  title="Reenviar disparo via WhatsApp"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPoToCancel(po);
                                    setCancelReason('Fornecedor sem disponibilidade imediata');
                                    setCustomCancelReason('');
                                    setNotifySupplierOnCancel(true);
                                  }}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-bold inline-flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                                  title="Cancelar esta compra com o fornecedor"
                                >
                                  <Ban className="w-3 h-3 text-rose-600" />
                                  <span>Cancelar Compra</span>
                                </button>
                              </>
                            )}
                            {po.status === 'CANCELLED' && (
                              <div className="flex flex-col items-end">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center space-x-1">
                                  <Ban className="w-3 h-3 text-rose-600" />
                                  <span>Compra Cancelada</span>
                                </span>
                                {po.notes && (
                                  <span className="text-[10px] text-slate-500 mt-0.5 max-w-[200px] truncate" title={po.notes}>
                                    {po.notes}
                                  </span>
                                )}
                              </div>
                            )}
                            {po.status === 'DELIVERED' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Entregue em Estoque</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL: FICHA TÉCNICA DO CATÁLOGO DE PRODUTOS FLIND       */}
      {/* ========================================================= */}
      {specModalOpen && selectedProductSpec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-5">
            {/* Cabeçalho da Ficha Técnica */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                    {selectedProductSpec.sku}
                  </span>
                  {selectedProductSpec.barcode && (
                    <span className="text-xs font-mono text-slate-500 flex items-center space-x-1">
                      <Barcode className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedProductSpec.barcode}</span>
                    </span>
                  )}
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                    {selectedProductSpec.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedProductSpec.name}
                </h3>
              </div>
              <button
                onClick={() => setSpecModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo da Ficha Técnica */}
            <div className="space-y-4 text-xs">
              {/* Seção 1: Especificações de Engenharia e Materiais */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                <div className="flex items-center space-x-2 text-indigo-700 font-bold border-b border-slate-200 pb-2">
                  <Layers className="w-4 h-4" />
                  <span>Especificações Técnicas de Engenharia & Composição</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 font-medium">Material Principal:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {selectedProductSpec.material || 'TNT Polipropileno Atóxico'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Gramatura Nominal:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {selectedProductSpec.grammage || '40 g/m²'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Dimensões Técnicas:</span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {selectedProductSpec.dimensions || 'Padrão Hospitalar'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Registro ANVISA / Laudo Técnico:</span>
                    <p className="font-bold text-indigo-600 mt-0.5">
                      {selectedProductSpec.anvisaRegistration || 'RDC 356 ANVISA / ABNT NBR 14853'}
                    </p>
                  </div>
                </div>

                {selectedProductSpec.technicalSpecs && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 font-medium">Ficha Descritiva de Fabricação:</span>
                    <p className="text-slate-700 mt-1 leading-relaxed">
                      {selectedProductSpec.technicalSpecs}
                    </p>
                  </div>
                )}
              </div>

              {/* Seção 2: Logística, Embalagem & Armazenagem */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-200 pb-2">
                  <Boxes className="w-4 h-4 text-indigo-600" />
                  <span>Acondicionamento, Embalagem & Paletização</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 font-medium">Unidade Embalagem:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedProductSpec.packagingUnit}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Unidades por Caixa:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedProductSpec.unitsPerPackage} un</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Peso do Volume:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedProductSpec.weightPerPackageKg} kg</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Empilhamento Máx:</span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {selectedProductSpec.stackingMax ? `${selectedProductSpec.stackingMax} caixas` : '6 caixas'}
                    </p>
                  </div>
                </div>

                {selectedProductSpec.packagingDimensions && (
                  <p className="text-[11px] text-slate-500">
                    <strong>Dimensões da caixa de transporte:</strong> {selectedProductSpec.packagingDimensions}
                  </p>
                )}

                {selectedProductSpec.storageConditions && (
                  <p className="text-[11px] text-slate-500">
                    <strong>Armazenagem:</strong> {selectedProductSpec.storageConditions}
                  </p>
                )}
              </div>

              {/* Seção 3: Cadeia de Suprimentos & Fornecimento Homologado */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-200">
                <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-200 pb-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Fornecimento Homologado & Ponto de Reposição</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
                  <div>
                    <span className="text-slate-400 font-medium">Fornecedor Principal:</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedProductSpec.supplierName}</p>
                    {selectedProductSpec.supplierPhone && (
                      <p className="text-[11px] text-emerald-600 font-mono">{selectedProductSpec.supplierPhone}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Custo Unitário de Compra:</span>
                    <p className="font-bold text-emerald-700 text-sm mt-0.5">
                      R$ {selectedProductSpec.costPrice.toFixed(2)}
                    </p>
                    <span className="text-[10px] text-slate-400">Preço de venda: R$ {selectedProductSpec.salePrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Estoque Atual / Mínimo:</span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {selectedProductSpec.currentStockPackages} / {selectedProductSpec.minStockPackages} {selectedProductSpec.packagingUnit}
                    </p>
                    <span className="text-[10px] text-indigo-600 font-semibold">
                      Sugestão de lote: {selectedProductSpec.reorderQuantityPackages || 50} vol
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé da Ficha Técnica */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              {selectedProductSpec.flindCatalogUrl ? (
                <a
                  href={selectedProductSpec.flindCatalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Página no Portal www.flind.com.br</span>
                </a>
              ) : (
                <div></div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSpecModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpecModalOpen(false);
                    handleOpenPoModal(selectedProductSpec.id, selectedProductSpec.reorderQuantityPackages || 50);
                  }}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Emitir Ordem de Compra</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO DE FORNECEDOR                    */}
      {/* ========================================================= */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingSupplier ? 'Editar Fornecedor Homologado' : 'Cadastrar Fornecedor Homologado'}
                </h3>
              </div>
              <button onClick={() => setSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Razão Social *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingSupplier?.name || ''}
                    placeholder="Ex: Fibras & Não-Tecidos Brasil S/A"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    name="tradeName"
                    defaultValue={editingSupplier?.tradeName || ''}
                    placeholder="Ex: TNT Brasil Matérias-Primas"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CNPJ *</label>
                  <input
                    type="text"
                    name="taxId"
                    required
                    defaultValue={editingSupplier?.taxId || ''}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    name="stateRegistration"
                    defaultValue={editingSupplier?.stateRegistration || ''}
                    placeholder="Isento ou numérico"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Insumos / Categoria Fornecida *</label>
                <input
                  type="text"
                  name="category"
                  required
                  defaultValue={editingSupplier?.category || ''}
                  placeholder="Ex: Tecidos Não-Tecidos (TNT SMS, Spunbond, Meltblown)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contato Comercial</label>
                  <input
                    type="text"
                    name="contactName"
                    defaultValue={editingSupplier?.contactName || ''}
                    placeholder="Nome do responsável"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp (com DDD) *</label>
                  <input
                    type="text"
                    name="whatsapp"
                    required
                    defaultValue={editingSupplier?.whatsapp || ''}
                    placeholder="+55 11 98888-7777"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Time (Dias) *</label>
                  <input
                    type="number"
                    name="leadTimeDays"
                    min="1"
                    required
                    defaultValue={editingSupplier?.leadTimeDays || 3}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingSupplier?.email || ''}
                    placeholder="comercial@fornecedor.com.br"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    name="city"
                    defaultValue={editingSupplier?.city || 'São Paulo'}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UF</label>
                  <input
                    type="text"
                    name="state"
                    maxLength={2}
                    defaultValue={editingSupplier?.state || 'SP'}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg uppercase focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Salvar Fornecedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EMISSÃO MANUAL DE ORDEM DE COMPRA (P.O.)          */}
      {/* ========================================================= */}
      {poModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Emitir Ordem de Compra / Reposição</h3>
              </div>
              <button onClick={() => setPoModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Selecione o Produto *</label>
                <select
                  name="productId"
                  required
                  value={selectedPoProduct}
                  onChange={(e) => setSelectedPoProduct(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Estoque atual: {p.currentStockPackages} {p.packagingUnit} (mín: {p.minStockPackages})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantidade a Solicitar (em volumes/caixas) *
                </label>
                <input
                  type="number"
                  name="quantityPackages"
                  min="1"
                  required
                  value={suggestedPoQty}
                  onChange={(e) => setSuggestedPoQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações do PCP</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Ex: Entrega prioritária para linha cirúrgica..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px]">
                <strong>Disparo Automático Integrado:</strong> Ao confirmar, o sistema enviará instantaneamente os dados desta ordem de compra para o WhatsApp do fornecedor homologado do produto.
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPoModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Emitir e Disparar WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DISPARO DIRETO DE WHATSAPP PARA FORNECEDOR         */}
      {/* ========================================================= */}
      {whatsappModalOpen && whatsappSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  WhatsApp: {whatsappSupplier.tradeName || whatsappSupplier.name}
                </h3>
              </div>
              <button onClick={() => setWhatsappModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Destinatário: <strong>{whatsappSupplier.contactName || 'Comercial'}</strong> ({whatsappSupplier.whatsapp || whatsappSupplier.phone})
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mensagem a Enviar:</label>
                <textarea
                  rows={4}
                  value={whatsappCustomMsg}
                  onChange={(e) => setWhatsappCustomMsg(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWhatsappModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Fechar
              </button>
              <a
                href={`https://wa.me/${(whatsappSupplier.whatsapp || whatsappSupplier.phone).replace(/\D/g, '')}?text=${encodeURIComponent(whatsappCustomMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setWhatsappModalOpen(false)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODAL: COMPARATIVO INTELIGENTE DE COTAÇÕES DE FORNECEDORES*/}
      {/* ========================================================= */}
      {comparisonModalOpen && modalComparisonItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Scale className="w-6 h-6 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Matriz Comparativa de Cotações & Melhor Opção de Compra
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalComparisonItem.name} ({modalComparisonItem.sku})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setComparisonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner de Recomendação */}
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs space-y-1">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                  Melhor Escolha Flind:
                </span>
                <strong className="text-sm font-black text-white">
                  {modalComparisonItem.recommendedSupplierName}
                </strong>
              </div>
              <p className="text-xs text-emerald-50 leading-relaxed">
                {modalComparisonItem.recommendationReason}
              </p>
            </div>

            {/* Grid dos 3 Fornecedores com os 4 Pilares */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {modalComparisonItem.offers.map((offer) => {
                const isBest = offer.isBestChoice;
                const isOrdering = orderingQuotationId === offer.id;

                return (
                  <div
                    key={offer.id}
                    className={`rounded-xl border flex flex-col justify-between ${
                      isBest
                        ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div
                        className={`px-3 py-1.5 flex items-center justify-between text-xs font-black ${
                          isBest
                            ? 'bg-emerald-600 text-white rounded-t-[10px]'
                            : 'bg-slate-100 text-slate-700 rounded-t-[11px] border-b border-slate-200'
                        }`}
                      >
                        <span>{isBest ? '🏆 MELHOR ESCOLHA' : 'Cotação Concorrente'}</span>
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-xs rounded font-mono text-[11px]">
                          {offer.compositeScore}/100
                        </span>
                      </div>

                      <div className="p-3.5 border-b border-slate-100">
                        <h4 className="text-sm font-black text-slate-900">{offer.supplierTradeName}</h4>
                        <p className="text-[10px] text-slate-400">{offer.supplierCity} - {offer.supplierState}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {offer.badges.map((b, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 space-y-2.5 text-xs">
                        {/* 1. Valores */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">1. Valores & Condições</div>
                          <div className="text-sm font-black text-slate-900 mt-0.5">
                            R$ {offer.unitPrice.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/ volume</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Total ({modalComparisonItem.suggestedPackages} vol): <strong>R$ {offer.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{offer.paymentTerms} • Frete {offer.freightType}</div>
                        </div>

                        {/* 2. Prazo */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">2. Tempo de Entrega</div>
                          <div className="text-xs font-bold text-slate-800 mt-0.5">
                            {offer.leadTimeDays} dia(s) úteis (Chegada: {offer.expectedDeliveryDate})
                          </div>
                          <div className="text-[10px] text-slate-500">Pontualidade: {offer.onTimeDeliveryRatePct}%</div>
                        </div>

                        {/* 3. Fabricação */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">3. Fabricação & Laudos</div>
                          <div className="text-[10px] text-slate-700">Lote: <span className="font-mono font-bold">{offer.manufacturingLot}</span></div>
                          <div className="text-[10px] text-slate-500">Fabricado: {offer.manufacturingDate} • ANVISA Regular</div>
                        </div>

                        {/* 4. Validade */}
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-500 uppercase">4. Validade do Produto</div>
                          <div className="text-xs font-bold text-emerald-800 mt-0.5">
                            {offer.shelfLifeMonths} meses ({offer.expiryDate})
                          </div>
                          <div className="text-[10px] text-slate-500">{offer.freshnessLabel}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 pt-0">
                      <button
                        type="button"
                        onClick={() => handleCreatePoFromQuotation(modalComparisonItem, offer)}
                        disabled={isOrdering}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-xs ${
                          isBest
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-800 hover:bg-slate-900 text-white'
                        }`}
                      >
                        {isOrdering ? (
                          <span>Emitindo P.O. via WhatsApp...</span>
                        ) : isBest ? (
                          <>
                            <Award className="w-3.5 h-3.5 text-amber-300" />
                            <span>🏆 Aprovar Melhor Opção</span>
                          </>
                        ) : (
                          <span>Emitir P.O. para este Fornecedor</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setComparisonModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento de Compra de Fornecedor */}
      {poToCancel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cancelar Compra de Fornecedor</h3>
                  <p className="text-xs text-slate-500">Ordem de Compra {poToCancel.orderNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPoToCancel(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo da Ordem de Compra */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Fornecedor:</span>
                <span className="font-bold text-slate-900">{poToCancel.supplierName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Produto / Insumo:</span>
                <span className="font-semibold text-slate-800 text-right">{poToCancel.productName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Volume & Quantidade:</span>
                <span className="font-bold text-slate-900">
                  {poToCancel.quantityPackages} {poToCancel.packagingUnit} ({poToCancel.quantityUnits} un)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Valor Total Estimado:</span>
                <span className="font-mono font-bold text-rose-700 text-sm">
                  R$ {poToCancel.estimatedCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Seleção do Motivo do Cancelamento */}
            <div className="mt-4 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Motivo do Cancelamento <span className="text-rose-500">*</span>
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Fornecedor sem disponibilidade imediata">
                  Fornecedor sem disponibilidade ou prazo muito longo
                </option>
                <option value="Divergência de preço ou condições comerciais">
                  Divergência de preço, frete ou condição de pagamento
                </option>
                <option value="Substituição por fornecedor homologado mais vantajoso">
                  Substituição por fornecedor homologado mais vantajoso
                </option>
                <option value="Ajuste na demanda interna / Estoque suficiente">
                  Ajuste na demanda interna / Estoque atual suficiente
                </option>
                <option value="Cancelamento ou alteração do lote de produção">
                  Cancelamento ou alteração do lote de produção
                </option>
                <option value="OUTRO">Outro motivo (especificar)</option>
              </select>

              {cancelReason === 'OUTRO' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Descreva o motivo do cancelamento..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            {/* Notificação via WhatsApp */}
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifySupplierOnCancel}
                  onChange={(e) => setNotifySupplierOnCancel(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-blue-900">
                    Notificar cancelamento ao WhatsApp do Fornecedor
                  </div>
                  <div className="text-blue-700 text-[11px] mt-0.5">
                    Envia aviso automático para {poToCancel.supplierWhatsapp} comunicando o cancelamento da ordem.
                  </div>
                </div>
              </label>
            </div>

            {/* Aviso de Auditoria */}
            <div className="mt-3 text-[11px] text-slate-500 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Esta ação será gravada na trilha de auditoria do sistema e a ordem será arquivada.</span>
            </div>

            {/* Botões de Ação */}
            <div className="mt-6 flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPoToCancel(null)}
                disabled={isCancellingPo}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Voltar / Manter Compra
              </button>
              <button
                type="button"
                onClick={handleCancelPo}
                disabled={isCancellingPo}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isCancellingPo ? 'Cancelando...' : 'Confirmar Cancelamento da Compra'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
