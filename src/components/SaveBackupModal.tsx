import React, { useState } from 'react';
import {
  Save,
  Download,
  Upload,
  CheckCircle2,
  HardDrive,
  Copy,
  ExternalLink,
  X,
  Database,
  RefreshCw,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface SaveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const SaveBackupModal: React.FC<SaveBackupModalProps> = ({ isOpen, onClose, onRefreshData }) => {
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastSavedInfo, setLastSavedInfo] = useState<{ timestamp: string; sizeBytes: number } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const appUrl = window.location.origin;

  const handleForceSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/backup/save', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setLastSavedInfo({ timestamp: data.timestamp, sizeBytes: data.sizeBytes });
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err: any) {
      alert('Erro ao forçar gravação: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open('/api/backup/export', '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImporting(true);
        setImportMsg(null);
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/backup/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData: json }),
        });
        const data = await res.json();
        if (res.ok) {
          setImportMsg({
            type: 'success',
            text: `Backup restaurado com sucesso! ${data.counts?.products || 0} produtos, ${data.counts?.orders || 0} pedidos e ${data.counts?.suppliers || 0} fornecedores.`,
          });
          if (onRefreshData) onRefreshData();
        } else {
          setImportMsg({ type: 'error', text: data.error || 'Erro ao importar dados.' });
        }
      } catch (err: any) {
        setImportMsg({ type: 'error', text: 'Arquivo inválido ou corrompido: ' + err.message });
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Salvar & Backup do Sistema</h2>
              <p className="text-xs text-slate-400">Garantia de persistência, exportação e acesso ao Flind</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Atual do Banco de Dados */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <div className="font-bold text-emerald-900 flex items-center space-x-2">
                <span>Persistência Ativa em Disco</span>
                <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-mono">
                  AUTO-SAVE
                </span>
              </div>
              <p className="text-emerald-800">
                Todas as alterações feitas no painel (novos pedidos, movimentações de estoque, lotes, fornecedores e ordens de compra) são <strong>gravadas automaticamente no disco do servidor</strong>.
              </p>
              {lastSavedInfo && (
                <div className="text-[11px] text-emerald-700 font-mono mt-1 pt-1 border-t border-emerald-200/60">
                  Última gravação síncrona: {new Date(lastSavedInfo.timestamp).toLocaleTimeString('pt-BR')} ({(lastSavedInfo.sizeBytes / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>

          {/* Opção 1: Baixar Arquivo de Backup Completo */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Baixar Cópia de Segurança (.json)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Baixe para o seu computador um arquivo JSON completo com todos os clientes, produtos, caixas, fardos, ordens e histórico.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs shrink-0 ml-3"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Backup</span>
              </button>
            </div>
          </div>

          {/* Opção 2: Forçar Gravação Manual Imediata */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <HardDrive className="w-4 h-4 text-indigo-600" />
                  <span>Gravar Imediatamente no Servidor</span>
                </div>
                <p className="text-xs text-slate-500">
                  Força a escrita síncrona de todo o estado em memória no arquivo físico de banco de dados.
                </p>
              </div>
              <button
                onClick={handleForceSave}
                disabled={saving}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs shrink-0 ml-3"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Salvo!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-slate-300" />
                    <span>Salvar Agora</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Opção 3: Link Permanente do Sistema para Favoritar */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                <span>Link Permanente do Aplicativo</span>
              </div>
              <p className="text-xs text-slate-500">
                Guarde ou favorite este endereço no seu navegador para acessar sua fábrica a qualquer hora:
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={appUrl}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Opção 4: Restaurar Dados a partir de um Arquivo (.json) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Restaurar / Importar Dados</span>
              </div>
              <p className="text-xs text-slate-500">
                Se você tiver um backup anterior em formato <code>.json</code>, pode carregá-lo aqui para restaurar todo o banco.
              </p>
              <label className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>{importing ? 'Importando...' : 'Selecionar Arquivo de Backup (.json)'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  disabled={importing}
                  className="hidden"
                />
              </label>

              {importMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-start space-x-2 ${
                    importMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {importMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{importMsg.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Banco local: <code>data/fabrica_integrada_db.json</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
