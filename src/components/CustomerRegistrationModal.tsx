import React, { useState } from 'react';
import {
  X,
  Building,
  User,
  MapPin,
  Globe,
  Phone,
  Mail,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Truck,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { Customer, VehicleType } from '../types';

interface CustomerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomer: Customer, message: string) => void;
}

export const CustomerRegistrationModal: React.FC<CustomerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  // Abas de navegação interna
  const [activeTab, setActiveTab] = useState<'BASIC' | 'CONTACT' | 'ADDRESS' | 'FLIND_WEB'>('BASIC');

  // Tipo de Pessoa
  const [personType, setPersonType] = useState<'PJ' | 'PF'>('PJ');

  // Dados Cadastrais
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [isStateRegExempt, setIsStateRegExempt] = useState(false);
  const [segment, setSegment] = useState<string>('Hospitalar & Cirúrgico');

  // Contato
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');

  // Endereço Inicial
  const [hasAddress, setHasAddress] = useState(true);
  const [addressType, setAddressType] = useState<'FISCAL' | 'DELIVERY' | 'BILLING'>('DELIVERY');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [searchingCep, setSearchingCep] = useState(false);

  // Regra de Entrega (se for DELIVERY)
  const [allowedTimeStart, setAllowedTimeStart] = useState('08:00');
  const [allowedTimeEnd, setAllowedTimeEnd] = useState('17:00');
  const [vehicleTypeAllowed, setVehicleTypeAllowed] = useState<VehicleType>('TRUCK');
  const [requiresScheduling, setRequiresScheduling] = useState(false);
  const [entryGate, setEntryGate] = useState('Doca Principal / CAF');

  // Vínculo www.flind.com.br (Opcional - nem todos os clientes são da Web)
  const [linkFlindWeb, setLinkFlindWeb] = useState(false);
  const [flindOrigin, setFlindOrigin] = useState<'FLIND_ECOMMERCE_WEB' | 'DIRETO_B2B' | 'SINK_ERP' | 'TRAY'>(
    'DIRETO_B2B'
  );
  const [flindWebId, setFlindWebId] = useState('');
  const [flindTier, setFlindTier] = useState('OURO_HOSPITALAR');

  // Busca rápida em www.flind.com.br
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<{ type: 'success' | 'info' | 'error'; msg: string } | null>(
    null
  );

  // Estados de submissão
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Máscaras brasileiras
  const maskTaxId = (val: string, type: 'PJ' | 'PF') => {
    const digits = val.replace(/\D/g, '');
    if (type === 'PJ') {
      // 00.000.000/0000-00
      return digits
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // 000.000.000-00
      return digits
        .slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2');
    }
  };

  const maskPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 10) {
      return digits
        .slice(0, 10)
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .slice(0, 11)
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const maskCep = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
  };

  const handleCepLookup = async (cepInput: string) => {
    const clean = cepInput.replace(/\D/g, '');
    if (clean.length !== 8) return;

    const mockAddresses: Record<string, { street: string; neighborhood: string; city: string; state: string }> = {
      '01402000': { street: 'Avenida Brigadeiro Luís Antônio', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP' },
      '13025320': { street: 'Avenida José de Souza Campos', neighborhood: 'Cambuí', city: 'Campinas', state: 'SP' },
      '30112000': { street: 'Rua Fernandes Tourinho', neighborhood: 'Savassi', city: 'Belo Horizonte', state: 'MG' },
    };

    setSearchingCep(true);
    const known = mockAddresses[clean];
    setStreet(known?.street || 'Rua do Protótipo Flind');
    setNeighborhood(known?.neighborhood || 'Centro');
    setCity(known?.city || 'São Paulo');
    setState(known?.state || 'SP');
    setSearchingCep(false);
  };

  // Consulta ao portal www.flind.com.br
  const handleFlindWebLookup = async () => {
    if (!lookupQuery.trim()) {
      setLookupFeedback({
        type: 'info',
        msg: 'Informe um CNPJ, CPF ou e-mail para consultar em www.flind.com.br.',
      });
      return;
    }

    setLookingUp(true);
    setLookupFeedback(null);
    try {
      const res = await fetch(`/api/customers/flind-web-lookup?query=${encodeURIComponent(lookupQuery)}`);
      const data = await res.json();

      if (data.found && data.customer) {
        const c = data.customer;
        setName(c.name || '');
        setTradeName(c.tradeName || '');
        setTaxId(c.taxId || '');
        if (c.taxId && c.taxId.length > 14) setPersonType('PJ');
        if (c.segment) setSegment(c.segment);
        if (c.stateRegistration) setStateRegistration(c.stateRegistration);
        if (c.email) setEmail(c.email);
        if (c.phone) setPhone(c.phone);
        if (c.contactPerson) setContactPerson(c.contactPerson);
        if (c.flindTier) setFlindTier(c.flindTier);
        if (data.flindWebId) setFlindWebId(data.flindWebId);
        setLinkFlindWeb(true);

        if (c.address) {
          setHasAddress(true);
          setAddressType(c.address.type || 'DELIVERY');
          setStreet(c.address.street || '');
          setNumber(c.address.number || '');
          setComplement(c.address.complement || '');
          setNeighborhood(c.address.neighborhood || '');
          setCity(c.address.city || '');
          setState(c.address.state || 'SP');
          setZipCode(c.address.zipCode || '');
        }

        setLookupFeedback({
          type: 'success',
          msg: `✨ Perfil encontrado em www.flind.com.br (${c.name})! Dados preenchidos automaticamente.`,
        });
      } else {
        setLookupFeedback({
          type: 'info',
          msg: data.message || 'Cadastro não localizado no portal online. Prossiga com o preenchimento manual.',
        });
      }
    } catch (err) {
      console.error('Erro na consulta Flind Web:', err);
      setLookupFeedback({
        type: 'error',
        msg: 'Erro ao conectar com a API de consulta do site www.flind.com.br.',
      });
    } finally {
      setLookingUp(false);
    }
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Por favor, informe a Razão Social ou Nome Completo do cliente.');
      setActiveTab('BASIC');
      return;
    }
    if (!taxId.trim()) {
      setErrorMessage('Por favor, informe o CPF ou CNPJ do cliente.');
      setActiveTab('BASIC');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        name,
        tradeName: tradeName || name,
        taxId,
        segment,
        stateRegistration: isStateRegExempt ? 'Isento' : stateRegistration || 'Isento',
        email,
        phone,
        contactPerson,
        notes,
        linkFlindWeb,
        flindOrigin,
        flindWebId: flindWebId || undefined,
        flindTier,
      };

      if (hasAddress && street.trim()) {
        payload.initialAddress = {
          type: addressType,
          street,
          number: number || 'S/N',
          complement,
          neighborhood,
          city,
          state,
          zipCode,
          isDefault: true,
        };

        if (addressType === 'DELIVERY') {
          payload.initialDeliveryRule = {
            allowedTimeStart,
            allowedTimeEnd,
            vehicleTypeAllowed,
            requiresScheduling,
            entryGate,
            contactName: contactPerson || name,
            contactPhone: phone,
          };
        }
      }

      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess(
          data,
          `Cliente "${data.name}" cadastrado com sucesso e integrado ao ecossistema Flind!`
        );
        onClose();
      } else {
        setErrorMessage(data.error || 'Erro ao cadastrar cliente.');
      }
    } catch (err) {
      console.error('Falha ao cadastrar cliente:', err);
      setErrorMessage('Erro de comunicação ao salvar o cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal */}
        <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold">Cadastrar Novo Cliente</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Fábrica Integrada
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1">
                  Venda Direta / B2B / Web
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Cadastre a empresa com multi-endereços (fiscal x entrega). Clientes podem ser de contrato direto, fábrica ou loja online.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Consulta Rápida no Site www.flind.com.br */}
        <div className="bg-indigo-50/90 border-b border-indigo-100 p-3.5 px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-indigo-900 font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Puxar dados do portal www.flind.com.br:</span>
          </div>
          <div className="flex items-center space-x-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleFlindWebLookup())}
                placeholder="CNPJ, CPF ou e-mail cadastrado na Flind..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
            <button
              type="button"
              onClick={handleFlindWebLookup}
              disabled={lookingUp}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-2xs transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <Globe className={`w-3.5 h-3.5 ${lookingUp ? 'animate-spin' : ''}`} />
              <span>{lookingUp ? 'Buscando...' : 'Buscar no Site'}</span>
            </button>
          </div>
        </div>

        {/* Feedback da Consulta Flind Web */}
        {lookupFeedback && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
              lookupFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : lookupFeedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {lookupFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : lookupFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span>{lookupFeedback.msg}</span>
            </div>
            <button
              onClick={() => setLookupFeedback(null)}
              className="text-xs font-bold opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        )}

        {/* Mensagem de Erro Geral */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navegação por Abas */}
        <div className="px-6 pt-4 border-b border-slate-200 flex space-x-6 text-xs font-semibold text-slate-500 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`pb-3 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'BASIC'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>1. Dados da Empresa</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CONTACT')}
            className={`pb-3 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'CONTACT'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>2. Contato & CAF</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ADDRESS')}
            className={`pb-3 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'ADDRESS'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>3. Endereço & Descarga</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FLIND_WEB')}
            className={`pb-3 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'FLIND_WEB'
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>4. Vínculo Web (Opcional)</span>
          </button>
        </div>

        {/* Formulário Principal */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ABA 1: DADOS DA EMPRESA */}
          {activeTab === 'BASIC' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              {/* Seleção Clara de Origem: Site vs Venda Direta Fábrica */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs">Origem do Cadastro do Cliente:</span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {linkFlindWeb ? '🌐 Comprador da Loja Online' : '🏢 Venda Direta Fabril (Sem Site)'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => {
                      setLinkFlindWeb(false);
                      setFlindOrigin('DIRETO_B2B');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      !linkFlindWeb
                        ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-2xs'
                        : 'border-slate-200 bg-slate-100/60 hover:bg-slate-100 opacity-80'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold text-slate-900 text-xs">
                      <Building className="w-4 h-4 text-indigo-600" />
                      <span>Cliente Direto da Fábrica</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Não é do site. Contratos corporativos, televendas B2B, licitações ou balcão industrial.
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setLinkFlindWeb(true);
                      setFlindOrigin('FLIND_ECOMMERCE_WEB');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      linkFlindWeb
                        ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'border-slate-200 bg-slate-100/60 hover:bg-slate-100 opacity-80'
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold text-emerald-950 text-xs">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>Cliente do Site (E-commerce)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Cliente com conta em www.flind.com.br. Realiza compras online integradas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 pb-2 border-b border-slate-100">
                <span className="text-slate-600 font-medium">Tipo de Inscrição:</span>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="personType"
                    checked={personType === 'PJ'}
                    onChange={() => {
                      setPersonType('PJ');
                      setTaxId(maskTaxId(taxId, 'PJ'));
                    }}
                    className="text-indigo-600"
                  />
                  <span className="font-semibold text-slate-800">Pessoa Jurídica (CNPJ)</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="personType"
                    checked={personType === 'PF'}
                    onChange={() => {
                      setPersonType('PF');
                      setTaxId(maskTaxId(taxId, 'PF'));
                    }}
                    className="text-indigo-600"
                  />
                  <span className="font-semibold text-slate-800">Pessoa Física (CPF)</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Razão Social / Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      personType === 'PJ'
                        ? 'Ex: Centro Hospitalar Santa Helena S/A'
                        : 'Ex: Dra. Mariana Costa'
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Fantasia / Apelido</label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ex: Hospital Santa Helena - CAF Insumos"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {personType === 'PJ' ? 'CNPJ' : 'CPF'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={taxId}
                    onChange={(e) => setTaxId(maskTaxId(e.target.value, personType))}
                    placeholder={personType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Inscrição Estadual (IE)</label>
                    <label className="flex items-center space-x-1 text-[11px] text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isStateRegExempt}
                        onChange={(e) => setIsStateRegExempt(e.target.checked)}
                        className="rounded text-indigo-600"
                      />
                      <span>Isento de IE</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    disabled={isStateRegExempt}
                    value={isStateRegExempt ? 'Isento' : stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                    placeholder="Ex: 112.345.678.900"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs disabled:opacity-50 disabled:bg-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Segmento de Atuação na Fábrica Flind
                  </label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Hospitalar & Cirúrgico">
                      🏥 Hospitalar & Cirúrgico (Hospitais, Centros Cirúrgicos, CAFs, UPAs)
                    </option>
                    <option value="Estética & Spas">
                      🌸 Estética & Spas (Clínicas Dermatológicas, Harmonização, Laser)
                    </option>
                    <option value="Salões & Barbearias">
                      ✂️ Salões & Barbearias (Cabeleireiros, Barbearias, Studios de Beleza)
                    </option>
                    <option value="Clínicas & Laboratórios">
                      🔬 Clínicas & Laboratórios (Análises Clínicas, Imagem, Odontologia)
                    </option>
                    <option value="Distribuidor / Revenda">
                      📦 Distribuidor / Revenda B2B (Atacado de descartáveis e EPIs)
                    </option>
                    <option value="Outros Segmentos">🏢 Outros Estabelecimentos</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: CONTATO & CAF */}
          {activeTab === 'CONTACT' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div className="p-3 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl text-[11px] flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  O e-mail e telefone informados serão usados na Central de Notificações, envio de Danfe/XML,
                  rastreio WhatsApp e acesso do cliente ao portal online <strong>www.flind.com.br</strong>.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail Principal / Faturamento</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="compras@cliente.com.br"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp (com DDD)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(maskPhone(e.target.value))}
                      placeholder="(11) 98888-7777"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Responsável de Compras / Farmacêutico CAF
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Ex: Dra. Camila Siqueira (Coord. CAF)"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Observações Comerciais & Faturamento
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Cliente solicita envio de boleto sempre por WhatsApp e faturamento quinzenal."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: ENDEREÇO & DESCARGA */}
          {activeTab === 'ADDRESS' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Cadastrar Endereço Inicial Imediato</div>
                  <div className="text-[11px] text-slate-500">
                    O sistema desacopla o endereço fiscal (matriz) do endereço físico de entrega (Doca/CAF).
                  </div>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAddress}
                    onChange={(e) => setHasAddress(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span className="font-semibold text-slate-700">Incluir Endereço</span>
                </label>
              </div>

              {hasAddress && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-slate-600 font-medium">Finalidade do Endereço:</span>
                    {[
                      { id: 'DELIVERY', label: 'Local de Entrega / Doca / CAF' },
                      { id: 'FISCAL', label: 'Endereço Fiscal (Matriz)' },
                      { id: 'BILLING', label: 'Cobrança / Financeiro' },
                    ].map((item) => (
                      <label key={item.id} className="flex items-center space-x-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="addressType"
                          checked={addressType === item.id}
                          onChange={() => setAddressType(item.id as any)}
                          className="text-indigo-600"
                        />
                        <span className="font-semibold text-slate-800">{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">CEP</label>
                      <div className="flex space-x-1.5">
                        <input
                          type="text"
                          value={zipCode}
                          onChange={(e) => {
                            const val = maskCep(e.target.value);
                            setZipCode(val);
                            if (val.replace(/\D/g, '').length === 8) {
                              handleCepLookup(val);
                            }
                          }}
                          placeholder="00000-000"
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleCepLookup(zipCode)}
                          disabled={searchingCep}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
                          title="Buscar CEP no ViaCEP"
                        >
                          {searchingCep ? '...' : 'Buscar'}
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Rua / Logradouro</label>
                      <input
                        type="text"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder="Ex: Rodovia Presidente Dutra ou Av. Paulista"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Número</label>
                      <input
                        type="text"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder="Ex: 1842 ou Km 218"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Complemento</label>
                      <input
                        type="text"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        placeholder="Ex: Galpão Doca 4B - Farmácia"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="Ex: Bela Vista ou Cumbica"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Estado (UF)</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        placeholder="SP"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Se for endereço de entrega, opções da regra de recebimento */}
                  {addressType === 'DELIVERY' && (
                    <div className="mt-3 p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                      <div className="flex items-center space-x-2 text-indigo-900 font-bold">
                        <Truck className="w-4 h-4 text-indigo-600" />
                        <span>Restrições e Regra de Descarga (Doca / CAF)</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-700 font-medium mb-1">
                            Horário Permitido para Descarga
                          </label>
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="time"
                              value={allowedTimeStart}
                              onChange={(e) => setAllowedTimeStart(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                            <span>às</span>
                            <input
                              type="time"
                              value={allowedTimeEnd}
                              onChange={(e) => setAllowedTimeEnd(e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-medium mb-1">Veículo Máximo</label>
                          <select
                            value={vehicleTypeAllowed}
                            onChange={(e) => setVehicleTypeAllowed(e.target.value as any)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                          >
                            <option value="TRUCK">Truck (Até 14t)</option>
                            <option value="VUC">VUC (Veículo Urbano de Carga)</option>
                            <option value="TOCO">Toco (Médio Porte)</option>
                            <option value="CARRETA">Carreta (Carga Extrapesada)</option>
                            <option value="QUALQUER">Qualquer Veículo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-medium mb-1">Portão / Doca</label>
                          <input
                            type="text"
                            value={entryGate}
                            onChange={(e) => setEntryGate(e.target.value)}
                            placeholder="Doca 4B - Insumos"
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <label className="flex items-center space-x-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={requiresScheduling}
                          onChange={(e) => setRequiresScheduling(e.target.checked)}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-semibold text-slate-800">
                          Exigir Agendamento Prévio Obrigatório para Descarregar
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ABA 4: VÍNCULO WWW.FLIND.COM.BR */}
          {activeTab === 'FLIND_WEB' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3">
                <Globe className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Vínculo com o Portal www.flind.com.br (Opcional)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Nem todos os clientes são da Web. Caso este cliente compre também pelo e-commerce, você pode vincular a conta dele. Para clientes de venda direta, contratos hospitalares presenciais ou televendas B2B, este vínculo não é obrigatório.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkFlindWeb}
                    onChange={(e) => setLinkFlindWeb(e.target.checked)}
                    className="rounded text-emerald-600 w-4 h-4"
                  />
                  <span className="font-bold text-slate-900 text-xs">
                    Ativar e Vincular Conta ao Portal www.flind.com.br
                  </span>
                </label>

                {linkFlindWeb && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Canal de Origem do Cadastro
                      </label>
                      <select
                        value={flindOrigin}
                        onChange={(e) => setFlindOrigin(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="FLIND_ECOMMERCE_WEB">
                          🌐 Loja Online Flind (www.flind.com.br / Tray)
                        </option>
                        <option value="DIRETO_B2B">🏭 Televendas Direto da Fábrica</option>
                        <option value="SINK_ERP">💻 SINK ERP / Força de Vendas</option>
                        <option value="BALCAO">🏪 Balcão / Retirada Fábrica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Categoria & Tabela Flind B2B
                      </label>
                      <select
                        value={flindTier}
                        onChange={(e) => setFlindTier(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="OURO_HOSPITALAR">⭐ Ouro Hospitalar (Preço de Fábrica CAF)</option>
                        <option value="PRATA_CLINICAS">🥈 Prata Clínicas & Consultórios</option>
                        <option value="BRONZE_ESTETICA">🥉 Bronze Estética & Salões</option>
                        <option value="PADRAO_B2B">📋 Padrão Corporativo B2B</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Código / ID do Cliente na Loja Web (Opcional)
                      </label>
                      <input
                        type="text"
                        value={flindWebId}
                        onChange={(e) => setFlindWebId(e.target.value)}
                        placeholder="Ex: FW-84920 (deixe em branco para gerar)"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Link da Central do Cliente
                      </label>
                      <div className="flex items-center space-x-1 p-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-mono text-[11px]">
                        <span className="truncate">https://www.flind.com.br/central-do-cliente</span>
                        <a
                          href="https://www.flind.com.br"
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 ml-auto shrink-0"
                          title="Abrir site www.flind.com.br"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rodapé e Botões de Ação */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              <span className="text-rose-500 font-bold">*</span> Campos obrigatórios: Razão Social e CPF/CNPJ.
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              {activeTab !== 'FLIND_WEB' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'BASIC') setActiveTab('CONTACT');
                    else if (activeTab === 'CONTACT') setActiveTab('ADDRESS');
                    else if (activeTab === 'ADDRESS') setActiveTab('FLIND_WEB');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Avançar →
                </button>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Cadastrando...' : 'Salvar e Integrar Cliente'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
