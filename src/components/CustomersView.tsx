import React, { useState, useEffect } from 'react';
import {
  Users,
  MapPin,
  Plus,
  ShieldCheck,
  Clock,
  Calendar,
  Truck,
  Weight,
  Phone,
  AlertTriangle,
  Building,
  CheckCircle2,
  Globe,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  Mail,
  UserCheck,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { Customer, CustomerAddress, DeliveryRule, VehicleType, isCustomerFromSite } from '../types';
import { CustomerRegistrationModal } from './CustomerRegistrationModal';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [deliveryRules, setDeliveryRules] = useState<DeliveryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRule, setSavingRule] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtro de busca na lista de clientes
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('ALL');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'SITE' | 'DIRECT'>('ALL');
  const [togglingOrigin, setTogglingOrigin] = useState(false);

  // Modal de Cadastro de Cliente
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Modal / Edição de Regra de Entrega
  const [editingRule, setEditingRule] = useState<Partial<DeliveryRule> | null>(null);

  // Modal de Adicionar Endereço
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddressType, setNewAddressType] = useState<'FISCAL' | 'DELIVERY' | 'BILLING'>('DELIVERY');
  const [newStreet, setNewStreet] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newComplement, setNewComplement] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('SP');
  const [newZipCode, setNewZipCode] = useState('');
  const [addingAddress, setAddingAddress] = useState(false);

  // Modal de Edição de Dados do Cliente e Vínculo Flind
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editTradeName, setEditTradeName] = useState('');
  const [editSegment, setEditSegment] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editIsWeb, setEditIsWeb] = useState(false);
  const [editFlindOrigin, setEditFlindOrigin] = useState<string>('DIRETO_B2B');
  const [editFlindWebId, setEditFlindWebId] = useState('');
  const [editFlindTier, setEditFlindTier] = useState('');
  const [savingCustomerEdit, setSavingCustomerEdit] = useState(false);

  // Estado de sincronização com www.flind.com.br
  const [syncingCustomerMap, setSyncingCustomerMap] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resCust, resRules] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/delivery-rules'),
      ]);
      if (resCust.ok) {
        const custs: Customer[] = await resCust.json();
        setCustomers(custs);
        if (custs.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(custs[0].id);
        } else if (custs.length > 0 && selectedCustomerId && !custs.some(c => c.id === selectedCustomerId)) {
          setSelectedCustomerId(custs[0].id);
        }
      }
      if (resRules.ok) {
        setDeliveryRules(await resRules.json());
      }
    } catch (err) {
      console.error('Erro ao carregar clientes/regras:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Sincronizar cliente em tempo real com www.flind.com.br
  const handleSyncFlindWeb = async (customer: Customer) => {
    setSyncingCustomerMap((prev) => ({ ...prev, [customer.id]: true }));
    try {
      const res = await fetch(`/api/customers/${customer.id}/sync-flind-web`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: `✨ Cliente "${customer.name}" sincronizado com sucesso com o portal www.flind.com.br!`,
        });
        await fetchData();
      } else {
        setFeedbackMsg({
          type: 'error',
          text: data.error || 'Erro ao sincronizar com portal www.flind.com.br',
        });
      }
    } catch (err) {
      console.error('Erro ao sincronizar Flind Web:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Erro de comunicação ao sincronizar com www.flind.com.br.',
      });
    } finally {
      setSyncingCustomerMap((prev) => ({ ...prev, [customer.id]: false }));
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  // Salvar Regra de Entrega
  const handleSaveDeliveryRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setSavingRule(true);
    try {
      const res = await fetch('/api/delivery-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRule),
      });
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Regra de entrega salva com sucesso.' });
        setEditingRule(null);
        await fetchData();
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao salvar regra de entrega:', err);
    } finally {
      setSavingRule(false);
    }
  };

  // Adicionar Novo Endereço ao Cliente Selecionado
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newStreet.trim()) return;

    setAddingAddress(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newAddressType,
          street: newStreet,
          number: newNumber || 'S/N',
          complement: newComplement,
          neighborhood: newNeighborhood,
          city: newCity,
          state: newState,
          zipCode: newZipCode,
          isDefault: (selectedCustomer.addresses || []).length === 0,
        }),
      });

      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Novo endereço adicionado com sucesso!' });
        setIsAddressModalOpen(false);
        setNewStreet('');
        setNewNumber('');
        setNewComplement('');
        setNewNeighborhood('');
        setNewCity('');
        setNewZipCode('');
        await fetchData();
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        const errData = await res.json();
        setFeedbackMsg({ type: 'error', text: errData.error || 'Erro ao adicionar endereço.' });
      }
    } catch (err) {
      console.error('Erro ao adicionar endereço:', err);
    } finally {
      setAddingAddress(false);
    }
  };

  // Remover Endereço
  const handleDeleteAddress = async (addressId: string) => {
    if (!selectedCustomer) return;
    if (!confirm('Deseja realmente remover este endereço e suas regras de recebimento?')) return;

    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/addresses/${addressId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: 'Endereço removido com sucesso.' });
        await fetchData();
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao remover endereço:', err);
    }
  };

  // Alternar rapidamente entre Cliente do Site e Cliente Direto da Fábrica
  const handleToggleSiteOrigin = async (customer: Customer) => {
    setTogglingOrigin(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/toggle-site-origin`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackMsg({ type: 'success', text: data.message });
        await fetchData();
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao alternar origem do cliente:', err);
      setFeedbackMsg({ type: 'error', text: 'Falha ao alternar origem do cliente.' });
    } finally {
      setTogglingOrigin(false);
    }
  };

  // Abrir Modal de Edição de Cliente
  const handleOpenEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name || '');
    setEditTradeName(customer.tradeName || '');
    setEditSegment(customer.segment || 'Hospitalar & Cirúrgico');
    setEditEmail(customer.email || '');
    setEditPhone(customer.phone || '');
    setEditContactPerson(customer.contactPerson || '');
    const isSite = isCustomerFromSite(customer);
    setEditIsWeb(isSite);
    setEditFlindOrigin(customer.flindOrigin || (isSite ? 'FLIND_ECOMMERCE_WEB' : 'DIRETO_B2B'));
    setEditFlindWebId(String(customer.flindWebId || ''));
    setEditFlindTier(customer.flindPortalSync?.flindTier || 'OURO_HOSPITALAR');
  };

  // Salvar Edição de Cliente
  const handleSaveCustomerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    setSavingCustomerEdit(true);
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          tradeName: editTradeName,
          segment: editSegment,
          email: editEmail,
          phone: editPhone,
          contactPerson: editContactPerson,
          linkFlindWeb: editIsWeb,
          flindOrigin: editIsWeb ? (editFlindOrigin === 'DIRETO_B2B' ? 'FLIND_ECOMMERCE_WEB' : editFlindOrigin) : 'DIRETO_B2B',
          flindWebId: editIsWeb ? editFlindWebId : '',
          flindTier: editFlindTier,
        }),
      });

      if (res.ok) {
        setFeedbackMsg({
          type: 'success',
          text: editIsWeb
            ? 'Dados e vínculo com www.flind.com.br atualizados com sucesso!'
            : 'Dados atualizados como Cliente Direto da Fábrica (Sem vínculo Web).',
        });
        setEditingCustomer(null);
        await fetchData();
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
    } finally {
      setSavingCustomerEdit(false);
    }
  };

  // Contagens para os cards informativos
  const siteCustomersCount = customers.filter(isCustomerFromSite).length;
  const directCustomersCount = customers.length - siteCustomersCount;

  // Filtragem
  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(term) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(term)) ||
      c.taxId.includes(term) ||
      (c.flindWebId && String(c.flindWebId).toLowerCase().includes(term)) ||
      (c.segment && c.segment.toLowerCase().includes(term));

    const matchSegment =
      segmentFilter === 'ALL' ||
      (segmentFilter === 'HOSPITALAR' && c.segment?.includes('Hospitalar')) ||
      (segmentFilter === 'ESTETICA' && c.segment?.includes('Estética')) ||
      (segmentFilter === 'SALOES' && c.segment?.includes('Salões'));

    const matchOrigin =
      originFilter === 'ALL' ||
      (originFilter === 'SITE' && isCustomerFromSite(c)) ||
      (originFilter === 'DIRECT' && !isCustomerFromSite(c));

    return matchSearch && matchSegment && matchOrigin;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner de Gestão de Clientes */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">
                Gestão de Clientes & Entregas Desacopladas
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Desacoplamento estrito entre o endereço <strong>FISCAL (Matriz)</strong> e múltiplos endereços de{' '}
              <strong>ENTREGA (Hospitais, CAF Farmácia, Clínicas e Docas)</strong>. Identificação clara entre clientes de <strong>venda direta fabril (B2B/sem site)</strong> e <strong>clientes integrados à loja virtual (Flind Web)</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Cards de Métricas Informativas: Clientes do Site vs Não do Site */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Base Total Cadastrada</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{customers.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Empresas e filiais ativas</div>
          </div>
          <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setOriginFilter(originFilter === 'SITE' ? 'ALL' : 'SITE')}
          className={`bg-white border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
            originFilter === 'SITE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30'
              : 'border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-emerald-900 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Clientes do Site (Loja Web)</span>
            </div>
            <div className="text-xl font-bold text-emerald-950 mt-0.5">{siteCustomersCount}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Cadastrados em www.flind.com.br</div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
            {originFilter === 'SITE' ? 'Filtro Ativo' : 'Ver Clientes'}
          </span>
        </div>

        <div
          onClick={() => setOriginFilter(originFilter === 'DIRECT' ? 'ALL' : 'DIRECT')}
          className={`bg-white border rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all ${
            originFilter === 'DIRECT'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30'
              : 'border-slate-200/80 hover:border-indigo-300'
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-800 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>Clientes Diretos (Sem Site)</span>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{directCustomersCount}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">Contrato Fabril, B2B e Televendas</div>
          </div>
          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
            {originFilter === 'DIRECT' ? 'Filtro Ativo' : 'Ver Clientes'}
          </span>
        </div>
      </div>

      {/* Layout Split: Lista de Clientes à esquerda / Endereços e Regras à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Clientes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[70vh] lg:h-[750px]">
          {/* Topo da Lista */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Base de Clientes</span>
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {filteredCustomers.length} de {customers.length}
              </span>
            </div>

            {/* Barra de Busca */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CNPJ ou código Flind..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            {/* Filtro de Origem: Todos | 🌐 Clientes do Site | 🏢 Direto da Fábrica */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold">
              <button
                onClick={() => setOriginFilter('ALL')}
                className={`py-1 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  originFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({customers.length})
              </button>
              <button
                onClick={() => setOriginFilter('SITE')}
                className={`py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  originFilter === 'SITE'
                    ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Site ({siteCustomersCount})</span>
              </button>
              <button
                onClick={() => setOriginFilter('DIRECT')}
                className={`py-1 px-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  originFilter === 'DIRECT'
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3 h-3" />
                <span>Direto ({directCustomersCount})</span>
              </button>
            </div>

            {/* Filtros Rápidos por Segmento */}
            <div className="flex space-x-1 overflow-x-auto pb-1 text-[11px] font-semibold text-slate-600 scrollbar-none">
              <button
                onClick={() => setSegmentFilter('ALL')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  segmentFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSegmentFilter('HOSPITALAR')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  segmentFilter === 'HOSPITALAR'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Hospitalar
              </button>
              <button
                onClick={() => setSegmentFilter('ESTETICA')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  segmentFilter === 'ESTETICA'
                    ? 'bg-pink-600 text-white'
                    : 'bg-white border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Estética
              </button>
              <button
                onClick={() => setSegmentFilter('SALOES')}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  segmentFilter === 'SALOES'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Salões
              </button>
            </div>
          </div>

          {/* Lista com Scroll */}
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Carregando clientes...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <p>Nenhum cliente encontrado.</p>
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cadastrar Novo Cliente
                </button>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                const isFromSite = isCustomerFromSite(c);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600 shadow-2xs'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="font-bold text-slate-900 text-xs line-clamp-1">{c.name}</div>
                      {isFromSite ? (
                        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Cliente do Site</span>
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center gap-1">
                          <Building className="w-2.5 h-2.5 text-slate-500" />
                          <span>Direto Fábrica</span>
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{c.taxId}</div>

                    <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                      {c.segment && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            c.segment.includes('Hospitalar')
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : c.segment.includes('Estética')
                              ? 'bg-pink-50 border-pink-200 text-pink-800'
                              : 'bg-purple-50 border-purple-200 text-purple-800'
                          }`}
                        >
                          {c.segment}
                        </span>
                      )}

                      {isFromSite && c.flindWebId && (
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded">
                          Web ID: {c.flindWebId}
                        </span>
                      )}

                      {!isFromSite && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded">
                          Sem Site • Contrato B2B
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                      <span className="truncate">{c.phone || c.email || 'Sem telefone'}</span>
                      <span className="font-semibold text-slate-700">
                        {c.addresses?.length || 0} endereço(s)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 2 & 3: Detalhes, Multi-Endereços e Integração Flind */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCustomer ? (
            <>
              {/* Card de Identificação do Cliente */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                      {selectedCustomer.segment && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedCustomer.segment.includes('Hospitalar')
                              ? 'bg-blue-100 text-blue-800'
                              : selectedCustomer.segment.includes('Estética')
                              ? 'bg-pink-100 text-pink-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {selectedCustomer.segment}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                        {selectedCustomer.externalId || selectedCustomer.id}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      <strong>Nome Fantasia:</strong> {selectedCustomer.tradeName || '—'} •{' '}
                      <strong>Documento:</strong> <span className="font-mono">{selectedCustomer.taxId}</span> •{' '}
                      <strong>IE:</strong> {selectedCustomer.stateRegistration || 'Isento'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleOpenEditCustomer(selectedCustomer)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    {isCustomerFromSite(selectedCustomer) && (
                      <button
                        onClick={() => handleSyncFlindWeb(selectedCustomer)}
                        disabled={syncingCustomerMap[selectedCustomer.id]}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        title="Sincronizar com portal www.flind.com.br"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            syncingCustomerMap[selectedCustomer.id] ? 'animate-spin text-indigo-600' : ''
                          }`}
                        />
                        <span>
                          {syncingCustomerMap[selectedCustomer.id]
                            ? 'Sincronizando...'
                            : 'Sincronizar Web'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bloco Informativo de Origem do Cliente (Cliente do Site vs Cliente Direto Fábrica) */}
                {isCustomerFromSite(selectedCustomer) ? (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
                          <Globe className="w-4 h-4 text-emerald-600" />
                          <span>ORIGEM: CLIENTE DO SITE (WWW.FLIND.COM.BR)</span>
                        </span>
                        {selectedCustomer.flindPortalSync?.flindTier && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300/60">
                            {selectedCustomer.flindPortalSync.flindTier}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-emerald-900 leading-relaxed">
                        Este cliente é <strong>cadastrado na loja virtual da Flind</strong>. Suas compras no e-commerce são sincronizadas automaticamente com a fábrica e despachadas conforme as regras logísticas.
                      </p>

                      <div className="text-[11px] text-slate-600 flex items-center flex-wrap gap-x-3 gap-y-1 pt-1">
                        <span>
                          Código Loja Web:{' '}
                          <strong className="font-mono text-slate-900">
                            {selectedCustomer.flindWebId || 'FW-SYNC'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Canal: <strong>{selectedCustomer.flindOrigin || 'E-commerce Flind'}</strong>
                        </span>
                        {selectedCustomer.flindPortalSync?.totalFlindWebOrders !== undefined && (
                          <>
                            <span>•</span>
                            <span>
                              Pedidos no Site:{' '}
                              <strong>{selectedCustomer.flindPortalSync.totalFlindWebOrders} pedido(s)</strong>
                            </span>
                          </>
                        )}
                        {selectedCustomer.flindPortalSync?.lastSyncedAt && (
                          <>
                            <span>•</span>
                            <span>
                              Última sinc:{' '}
                              {new Date(selectedCustomer.flindPortalSync.lastSyncedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0 self-stretch md:self-auto">
                      <a
                        href={selectedCustomer.flindWebProfileUrl || 'https://www.flind.com.br'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <span>Abrir no Portal Web</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleToggleSiteOrigin(selectedCustomer)}
                        disabled={togglingOrigin}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-[11px] font-medium transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                        title="Desvincular da web e classificar como venda direta fabril"
                      >
                        <Building className="w-3 h-3 text-slate-500" />
                        <span>Mudar p/ Direto Fábrica</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                          <Building className="w-4 h-4 text-slate-700" />
                          <span>ORIGEM: CLIENTE DIRETO DA FÁBRICA (NÃO É DO SITE)</span>
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300/60">
                          B2B / Offline
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Este cliente <strong>NÃO é cadastrado na loja virtual www.flind.com.br</strong>. Trata-se de um cliente industrial de <strong>venda direta</strong> (contrato corporativo, televendas B2B, representante comercial ou balcão da fábrica).
                      </p>

                      <div className="text-[11px] text-slate-500 flex items-center flex-wrap gap-x-3 gap-y-1 pt-1">
                        <span>
                          Canal Comercial: <strong>Venda Direta / B2B Fábrica</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Status E-commerce: <span className="text-amber-800 font-medium">Sem conta no site</span>
                        </span>
                        <span>•</span>
                        <span>
                          Faturamento & Logística: <strong>Direto via SINK ERP</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 shrink-0 self-stretch md:self-auto">
                      <button
                        onClick={() => handleToggleSiteOrigin(selectedCustomer)}
                        disabled={togglingOrigin}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Vincular cliente à loja online www.flind.com.br"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Vincular ao Site Flind Web</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditCustomer(selectedCustomer)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-medium transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 text-slate-400" />
                        <span>Editar Dados Comerciais</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Dados de Contato e Faturamento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-500 font-medium block">Telefone / WhatsApp</span>
                    <span className="font-semibold text-slate-800 flex items-center space-x-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedCustomer.phone || 'Não informado'}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">E-mail Principal</span>
                    <span className="font-semibold text-slate-800 flex items-center space-x-1 mt-0.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{selectedCustomer.email || 'Não informado'}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 font-medium block">Responsável / CAF</span>
                    <span className="font-semibold text-slate-800 flex items-center space-x-1 mt-0.5">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      <span>{selectedCustomer.contactPerson || 'Geral'}</span>
                    </span>
                  </div>
                </div>

                {/* Lista de Multi-Endereços Desacoplados */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Endereços Fiscais e de Entrega (Multi-Local)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        O faturamento da fábrica emite para a matriz fiscal e despacha para docas cirúrgicas ou centros de distribuição específicos.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsAddressModalOpen(true)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Endereço</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedCustomer.addresses || []).map((addr) => {
                      const rule = deliveryRules.find((r) => r.addressId === addr.id);

                      const typeColorMap = {
                        FISCAL: 'bg-slate-100 text-slate-800 border-slate-300',
                        BILLING: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                        DELIVERY: 'bg-indigo-50 text-indigo-800 border-indigo-300',
                      };

                      const typeLabelMap = {
                        FISCAL: 'Endereço Fiscal (Matriz)',
                        BILLING: 'Cobrança / Financeiro',
                        DELIVERY: 'Local de Entrega / Doca / CAF',
                      };

                      return (
                        <div
                          key={addr.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  typeColorMap[addr.type]
                                }`}
                              >
                                {typeLabelMap[addr.type]}
                              </span>
                              <div className="flex items-center space-x-1">
                                {addr.isDefault && (
                                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                    Padrão
                                  </span>
                                )}
                                <button
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                                  title="Remover endereço"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="text-xs font-bold text-slate-900">
                              {addr.street}, {addr.number}
                              {addr.complement && (
                                <span className="font-normal text-slate-600"> ({addr.complement})</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5">
                              {addr.neighborhood} — {addr.city}/{addr.state}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              CEP: {addr.zipCode}
                            </div>
                          </div>

                          {/* Se for endereço de entrega, mostra resumo da regra ou botão de configurar */}
                          {addr.type === 'DELIVERY' && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              {rule ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-800 flex items-center space-x-1">
                                      <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                      <span>{rule.entryGate || 'Doca Principal'}</span>
                                    </span>
                                    <button
                                      onClick={() => setEditingRule(rule)}
                                      className="text-indigo-600 hover:text-indigo-800 font-bold text-[10px] cursor-pointer"
                                    >
                                      Editar Regra
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-xl">
                                    <div>⏰ {rule.allowedTimeStart} às {rule.allowedTimeEnd}</div>
                                    <div>🚛 {rule.vehicleTypeAllowed}</div>
                                    <div>⚖️ {rule.maxWeightKg?.toLocaleString('pt-BR')} kg</div>
                                    <div>
                                      {rule.requiresScheduling ? (
                                        <span className="text-rose-600 font-bold">⚠️ Agend. Obrigatório</span>
                                      ) : (
                                        <span className="text-emerald-600 font-bold">Livre Descarga</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setEditingRule({
                                      addressId: addr.id,
                                      customerId: selectedCustomer.id,
                                      allowedTimeStart: '08:00',
                                      allowedTimeEnd: '17:00',
                                      allowedWeekdays: [1, 2, 3, 4, 5],
                                      requiresScheduling: false,
                                      maxWeightKg: 10000,
                                      vehicleTypeAllowed: 'TRUCK',
                                      entryGate: 'Doca Principal / CAF',
                                      requiresDocumentation: true,
                                      active: true,
                                    })
                                  }
                                  className="w-full py-1.5 text-center rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors cursor-pointer"
                                >
                                  + Configurar Regras de Entrega
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* MODAL / FORMULÁRIO DE EDIÇÃO DE REGRAS DE ENTREGA */}
              {editingRule && (
                <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-md space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span>Configurar Restrições Operacionais de Entrega (Doca / CAF)</span>
                    </h4>
                    <button
                      onClick={() => setEditingRule(null)}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      ✕ Cancelar
                    </button>
                  </div>

                  <form onSubmit={handleSaveDeliveryRule} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Horário Permitido para Descarga
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={editingRule.allowedTimeStart || '08:00'}
                            onChange={(e) =>
                              setEditingRule((prev) => ({ ...prev, allowedTimeStart: e.target.value }))
                            }
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                          />
                          <span>às</span>
                          <input
                            type="time"
                            value={editingRule.allowedTimeEnd || '17:00'}
                            onChange={(e) =>
                              setEditingRule((prev) => ({ ...prev, allowedTimeEnd: e.target.value }))
                            }
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Tipo de Veículo Máximo
                        </label>
                        <select
                          value={editingRule.vehicleTypeAllowed || 'TRUCK'}
                          onChange={(e) =>
                            setEditingRule((prev) => ({
                              ...prev,
                              vehicleTypeAllowed: e.target.value as VehicleType,
                            }))
                          }
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                        >
                          <option value="TRUCK">Truck (Até 14t)</option>
                          <option value="VUC">VUC (Veículo Urbano de Carga)</option>
                          <option value="TOCO">Toco (Médio Porte)</option>
                          <option value="CARRETA">Carreta (Carga Extrapesada)</option>
                          <option value="QUALQUER">Qualquer Veículo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          Peso Máximo por Descarga (kg)
                        </label>
                        <input
                          type="number"
                          value={editingRule.maxWeightKg || 10000}
                          onChange={(e) =>
                            setEditingRule((prev) => ({
                              ...prev,
                              maxWeightKg: Number(e.target.value),
                            }))
                          }
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Portão / Doca</label>
                        <input
                          type="text"
                          value={editingRule.entryGate || ''}
                          onChange={(e) =>
                            setEditingRule((prev) => ({ ...prev, entryGate: e.target.value }))
                          }
                          placeholder="Ex: Doca 4B - Insumos Médicos"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Contato na Doca</label>
                        <input
                          type="text"
                          value={editingRule.contactName || ''}
                          onChange={(e) =>
                            setEditingRule((prev) => ({ ...prev, contactName: e.target.value }))
                          }
                          placeholder="Ex: Carlos (Farmacêutico)"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Telefone da Doca</label>
                        <input
                          type="text"
                          value={editingRule.contactPhone || ''}
                          onChange={(e) =>
                            setEditingRule((prev) => ({ ...prev, contactPhone: e.target.value }))
                          }
                          placeholder="(11) 98888-0000"
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 pt-1">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(editingRule.requiresScheduling)}
                          onChange={(e) =>
                            setEditingRule((prev) => ({
                              ...prev,
                              requiresScheduling: e.target.checked,
                            }))
                          }
                          className="rounded text-indigo-600"
                        />
                        <span className="font-semibold text-slate-800">
                          Exigir Agendamento Prévio de Janela de Entrega
                        </span>
                      </label>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingRule.requiresDocumentation !== false}
                          onChange={(e) =>
                            setEditingRule((prev) => ({
                              ...prev,
                              requiresDocumentation: e.target.checked,
                            }))
                          }
                          className="rounded text-indigo-600"
                        />
                        <span className="font-semibold text-slate-800">
                          Exigir Danfe impressa, Laudo de Lote e EPIs
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Orientações aos Motoristas e Transportadoras
                      </label>
                      <textarea
                        value={editingRule.notes || ''}
                        onChange={(e) =>
                          setEditingRule((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        rows={2}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                        placeholder="Ex: Motorista deve portar calçado de segurança fechado, jaleco e aguardar liberação na guarita CAF."
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingRule(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={savingRule}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                      >
                        <span>{savingRule ? 'Salvando...' : 'Salvar Regra de Entrega'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-base font-bold text-slate-700">Nenhum cliente selecionado</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Selecione um cliente na lista lateral para visualizar e configurar múltiplos endereços, regras de descarga e o vínculo com <strong>www.flind.com.br</strong>.
              </p>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                + Cadastrar Novo Cliente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro de Cliente */}
      <CustomerRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={(newCustomer, message) => {
          setFeedbackMsg({ type: 'success', text: message });
          fetchData();
          setSelectedCustomerId(newCustomer.id);
          setTimeout(() => setFeedbackMsg(null), 5000);
        }}
      />

      {/* Modal de Adicionar Endereço */}
      {isAddressModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold">Adicionar Endereço ao Cliente</h4>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Finalidade do Endereço</label>
                <div className="flex space-x-2">
                  {[
                    { id: 'DELIVERY', label: 'Local de Entrega / Doca' },
                    { id: 'FISCAL', label: 'Fiscal (Matriz)' },
                    { id: 'BILLING', label: 'Cobrança' },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className={`flex-1 p-2 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                        newAddressType === item.id
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="newAddressType"
                        checked={newAddressType === item.id}
                        onChange={() => setNewAddressType(item.id as any)}
                        className="hidden"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CEP</label>
                  <input
                    type="text"
                    value={newZipCode}
                    onChange={(e) => setNewZipCode(e.target.value)}
                    placeholder="00000-000"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Logradouro / Rua <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="Av. das Américas ou Rodovia"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Número</label>
                  <input
                    type="text"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    placeholder="1000"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={newComplement}
                    onChange={(e) => setNewComplement(e.target.value)}
                    placeholder="Doca 2, Galpão CAF, Bloco B"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={newNeighborhood}
                    onChange={(e) => setNewNeighborhood(e.target.value)}
                    placeholder="Centro"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="São Paulo"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newState}
                    onChange={(e) => setNewState(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addingAddress}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {addingAddress ? 'Salvando...' : 'Adicionar Endereço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Cliente & Vínculo Flind Web */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold">Editar Dados & Vínculo Flind</h4>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomerEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razão Social</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={editTradeName}
                  onChange={(e) => setEditTradeName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Segmento</label>
                <select
                  value={editSegment}
                  onChange={(e) => setEditSegment(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="Hospitalar & Cirúrgico">🏥 Hospitalar & Cirúrgico</option>
                  <option value="Estética & Spas">🌸 Estética & Spas</option>
                  <option value="Salões & Barbearias">✂️ Salões & Barbearias</option>
                  <option value="Clínicas & Laboratórios">🔬 Clínicas & Laboratórios</option>
                  <option value="Distribuidor / Revenda">📦 Distribuidor / Revenda B2B</option>
                  <option value="Outros Segmentos">🏢 Outros Estabelecimentos</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail Principal</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Seleção de Origem: Site vs Direto Fábrica */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <label className="block font-semibold text-slate-700 text-xs">Origem do Cliente</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditIsWeb(false);
                      setEditFlindOrigin('DIRETO_B2B');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start space-x-2 ${
                      !editIsWeb
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-2xs'
                        : 'border-slate-200 bg-slate-100 hover:bg-slate-200/60 opacity-75'
                    }`}
                  >
                    <Building className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">Direto da Fábrica</div>
                      <div className="text-[10px] text-slate-500">Sem site • B2B / Televendas</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditIsWeb(true);
                      setEditFlindOrigin('FLIND_ECOMMERCE_WEB');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start space-x-2 ${
                      editIsWeb
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'border-slate-200 bg-slate-100 hover:bg-slate-200/60 opacity-75'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-950 text-xs">Cliente do Site</div>
                      <div className="text-[10px] text-emerald-700">Loja Virtual Flind Web</div>
                    </div>
                  </button>
                </div>
              </div>

              {editIsWeb ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                  <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Configuração do Vínculo Web (www.flind.com.br)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-emerald-950 font-medium mb-1">ID Loja Virtual</label>
                      <input
                        type="text"
                        value={editFlindWebId}
                        onChange={(e) => setEditFlindWebId(e.target.value)}
                        placeholder="FW-00000"
                        className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-emerald-950 font-medium mb-1">Nível B2B</label>
                      <select
                        value={editFlindTier}
                        onChange={(e) => setEditFlindTier(e.target.value)}
                        className="w-full p-2 bg-white border border-emerald-200 rounded-xl font-bold text-xs"
                      >
                        <option value="OURO_HOSPITALAR">⭐ Ouro Hospitalar</option>
                        <option value="PRATA_CLINICAS">🥈 Prata Clínicas</option>
                        <option value="BRONZE_ESTETICA">🥉 Bronze Estética</option>
                        <option value="PADRAO_B2B">📋 Padrão Corporativo</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] flex items-center space-x-2">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Este cliente está configurado como <strong>Venda Direta da Fábrica</strong>. Ele não possui acesso ou vínculo à loja online.
                  </span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCustomerEdit}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {savingCustomerEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
