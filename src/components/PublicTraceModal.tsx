import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  ShieldCheck,
  X,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface PublicTraceModalProps {
  initialToken?: string | null;
  onClose: () => void;
}

export const PublicTraceModal: React.FC<PublicTraceModalProps> = ({
  initialToken,
  onClose,
}) => {
  const [tokenInput, setTokenInput] = useState(initialToken || '');
  const [traceData, setTraceData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTrace = async (tokenToFetch: string) => {
    if (!tokenToFetch.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/trace/${encodeURIComponent(tokenToFetch.trim())}`);
      if (res.ok) {
        setTraceData(await res.json());
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Rastreabilidade não localizada para o token informado.');
        setTraceData(null);
      }
    } catch (err: any) {
      setErrorMsg('Falha na conexão com o servidor de rastreabilidade.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialToken) {
      fetchTrace(initialToken);
    }
  }, [initialToken]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrace(tokenInput);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Portal de Rastreabilidade Autorizada</h3>
              <p className="text-xs text-slate-500">Consulta via Token Seguro (/trace/:token)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input de Busca de Token */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Digite o token de rastreio (ex: trc_1582_...)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            {loading ? 'Consultando...' : 'Buscar'}
          </button>
        </form>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Informações da Rastreabilidade Autorizada */}
        {traceData && (
          <div className="space-y-4 pt-2 border-t border-slate-100 text-xs">
            {/* Resumo do Pedido e Destino */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">{traceData.orderNumber}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800">
                  {traceData.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                <div>
                  <span className="font-semibold text-slate-700">Nota Fiscal:</span>{' '}
                  {traceData.invoiceNumber || 'Emissão em andamento'}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Transportadora:</span>{' '}
                  {traceData.carrierName}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Destino:</span>{' '}
                  {traceData.destinationCityState}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Volumes / Peso:</span>{' '}
                  {traceData.volumesCount} vol(s) • {traceData.totalWeightKg} kg
                </div>
                <div className="col-span-2 text-slate-500 font-mono text-[10px]">
                  Destinatário: {traceData.recipientName}
                </div>
              </div>
            </div>

            {/* Timeline Histórica */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Histórico de Etapas da Carga</span>
              </h4>

              <div className="space-y-2 pl-2 border-l-2 border-indigo-200">
                {traceData.timeline.map((stage: any, i: number) => (
                  <div key={i} className="pl-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{stage.stageLabel}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                          stage.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : stage.status === 'IN_PROGRESS'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {stage.status}
                      </span>
                    </div>
                    {stage.completedAt && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Concluído em: {new Date(stage.completedAt).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Itens e Rastreio de Lotes */}
            <div>
              <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
                <Package className="w-4 h-4 text-slate-600" />
                <span>Itens Inclusos & Rastreabilidade de Lotes Hospitalares</span>
              </h4>
              <div className="bg-slate-50 rounded-lg p-2 border border-slate-200 space-y-1">
                {traceData.products.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200/50 last:border-none">
                    <div>
                      <span className="font-bold text-slate-800">{p.sku}</span>
                      <span className="text-slate-600 ml-1">({p.title})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-slate-800">{p.quantity} un</span>
                      {p.lotNumber && (
                        <span className="ml-2 font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded">
                          {p.lotNumber}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
