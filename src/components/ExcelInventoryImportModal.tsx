import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  RefreshCw,
  Layers,
  Boxes,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Eye,
  Info,
} from 'lucide-react';
import { InventoryImportResult } from '../types';

interface ExcelInventoryImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: InventoryImportResult) => void;
}

interface PreviewRow {
  rowNumber: number;
  sku: string;
  name: string;
  category?: string;
  packagingUnit: string;
  unitsPerPackage: number;
  currentStockPackages: number;
  currentStockUnits: number;
  minStockPackages: number;
  unitWeightKg?: number;
  weightPerPackageKg?: number;
  costPrice?: number;
  salePrice?: number;
  lotNumber?: string;
  action: 'UPDATE' | 'CREATE';
  existingProduct?: {
    id: string;
    name: string;
    currentStockPackages: number;
    currentStockUnits: number;
    packagingUnit: string;
    unitsPerPackage: number;
    status: string;
  };
  isValid: boolean;
  validationErrors?: string[];
}

interface PreviewData {
  success: boolean;
  fileName?: string;
  sheetName: string;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  willUpdateCount: number;
  willCreateCount: number;
  detectedColumns: Record<string, string>;
  rows: PreviewRow[];
  errors?: string[];
}

export const ExcelInventoryImportModal: React.FC<ExcelInventoryImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<InventoryImportResult | null>(null);
  const [importMode, setImportMode] = useState<'UPSERT' | 'UPDATE_ONLY'>('UPSERT');
  const [triggerAutoReorder, setTriggerAutoReorder] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPDATE' | 'CREATE'>('ALL');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processSelectedFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processSelectedFile(dropped);
    }
  };

  const processSelectedFile = (fileToProcess: File) => {
    setErrorMsg(null);
    setPreviewData(null);
    setImportResult(null);

    const validExts = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExts.some((ext) => fileToProcess.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setErrorMsg('Por favor selecione um arquivo válido de planilha (.xlsx, .xls ou .csv).');
      return;
    }

    setFile(fileToProcess);
    setLoadingPreview(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        setBase64Data(base64);

        const res = await fetch('/api/inventory/preview-xlsx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64,
            fileName: fileToProcess.name,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Falha ao processar arquivo.');
        }

        setPreviewData(data);
      } catch (err: any) {
        console.error('Erro na leitura da planilha:', err);
        setErrorMsg(err.message || 'Erro ao processar o arquivo selecionado.');
      } finally {
        setLoadingPreview(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('Falha ao ler o arquivo no navegador.');
      setLoadingPreview(false);
    };

    reader.readAsDataURL(fileToProcess);
  };

  const handleExecuteImport = async () => {
    if (!previewData || !base64Data) return;

    try {
      setLoadingImport(true);
      setErrorMsg(null);

      const res = await fetch('/api/inventory/import-xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: base64Data,
          fileName: file?.name,
          mode: importMode,
          triggerAutoReorder,
        }),
      });

      const result: InventoryImportResult = await res.json();
      if (!res.ok) {
        throw new Error((result as any).error || 'Erro ao executar importação.');
      }

      setImportResult(result);
      onSuccess(result);
    } catch (err: any) {
      console.error('Erro ao importar:', err);
      setErrorMsg(err.message || 'Falha ao gravar dados no estoque.');
    } finally {
      setLoadingImport(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setBase64Data(null);
    setPreviewData(null);
    setImportResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredPreviewRows = previewData?.rows.filter((r) => {
    if (activeTab === 'UPDATE') return r.action === 'UPDATE';
    if (activeTab === 'CREATE') return r.action === 'CREATE';
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center space-x-2">
                <span>Importação Automática de Estoque via XLSX</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                  Leitura de Volumes & Caixas
                </span>
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Leia arquivos do Excel (.xlsx / .csv) para atualizar saldos de volumes, embalagens e unidades automaticamente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Erro ao processar planilha</p>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* SUCESSO DA IMPORTAÇÃO */}
          {importResult ? (
            <div className="space-y-6 text-center py-4">
              <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-600 border border-emerald-200 mb-2">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900">
                  Estoque e Volumes Atualizados com Sucesso!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                  {importResult.message}
                </p>
              </div>

              {/* Cards de Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase">Processados</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{importResult.totalProcessed}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Linhas analisadas</div>
                </div>

                <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-indigo-700 uppercase">Atualizados</div>
                  <div className="text-2xl font-black text-indigo-700 mt-1">{importResult.updatedCount}</div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">SKUs recalculados</div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase">Cadastrados</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{importResult.createdCount}</div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">Novos produtos</div>
                </div>

                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-[11px] font-semibold text-amber-700 uppercase">Total Volumes</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">
                    {importResult.totalPackagesUpdated.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">
                    {importResult.totalUnitsCalculated.toLocaleString('pt-BR')} un
                  </div>
                </div>
              </div>

              {importResult.autoOrdersTriggered.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-900 flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      Reposição Automática Disparada para {importResult.autoOrdersTriggered.length} produto(s)!
                    </p>
                    <p className="mt-0.5 text-amber-800">
                      Itens que estavam com estoque abaixo do mínimo geraram ordens de compra imediatas com avisos disparados aos fornecedores via WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetUpload}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Importar Outra Planilha
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Fechar e Ver Estoque
                </button>
              </div>
            </div>
          ) : !previewData ? (
            /* ZONA DE UPLOAD E DOWNLOAD DE MODELO */
            <div className="space-y-6">
              {/* Card de Download do Modelo */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Baixar Planilha Modelo Oficial (.XLSX)
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Baixe o arquivo de exemplo já configurado com as colunas de SKU, Nome, Tipo de Volume (Caixa, Fardo), Fator de Embalagem e Estoque.
                    </p>
                  </div>
                </div>
                <a
                  href="/api/inventory/template-xlsx"
                  download="modelo_estoque_volumes_flind.xlsx"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shrink-0 shadow-xs transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Modelo Excel</span>
                </a>
              </div>

              {/* Zona de Drop / Seleção de Arquivo */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 rounded-2xl p-8 text-center transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                  {loadingPreview ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8" />
                  )}
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    {loadingPreview
                      ? 'Lendo e identificando colunas da planilha...'
                      : 'Arraste e solte o arquivo XLSX aqui, ou clique para selecionar'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Formatos aceitos: Microsoft Excel (.xlsx, .xls) ou Valores Separados por Vírgula (.csv)
                  </p>
                </div>

                <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-lg text-[11px] font-semibold text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mapeamento inteligente e automático de cabeçalhos</span>
                </div>
              </div>

              {/* Instruções e Regras de Reconhecimento */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span>Como o sistema interpreta sua planilha:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-slate-600">
                  <li>
                    <strong>Identificação do Item:</strong> Localiza o produto pelo <strong>SKU / Código</strong> ou pelo <strong>Nome</strong>.
                  </li>
                  <li>
                    <strong>Cálculo Automático de Unidades:</strong> Ao informar a quantidade de volumes (caixas/fardos) e o fator (unidades por volume), o total de unidades individuais é calculado automaticamente.
                  </li>
                  <li>
                    <strong>Atualização Inteligente:</strong> Se o produto já existir no sistema, seus dados e saldo físico são atualizados mantendo o histórico de rastreabilidade. Se for novo, um cadastro completo é criado.
                  </li>
                  <li>
                    <strong>Alerta de Níveis Mínimos:</strong> Produtos com saldo inferior ao estoque mínimo são sinalizados para reposição imediata.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* PRÉVIA DOS DADOS LIDOS DA PLANILHA */
            <div className="space-y-4">
              {/* Barra de Status do Arquivo Lido */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900">{file?.name}</span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-slate-500">
                      Planilha: <strong>{previewData.sheetName}</strong>
                    </span>
                    <span className="text-slate-400 mx-2">•</span>
                    <span className="text-emerald-700 font-semibold">
                      {previewData.validRowsCount} produto(s) reconhecido(s)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetUpload}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Trocar arquivo
                </button>
              </div>

              {/* Colunas Detectadas */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs">
                <div className="flex items-center space-x-1.5 font-bold text-indigo-950 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Colunas reconhecidas automaticamente na sua planilha:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(previewData.detectedColumns).map(([field, originalHeader]) => (
                    <span
                      key={field}
                      className="px-2 py-0.5 bg-white border border-indigo-200 text-indigo-900 rounded-md text-[10px] font-medium shadow-2xs"
                    >
                      {originalHeader} <span className="text-indigo-400">→</span> <strong>{field}</strong>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tabs de Filtro da Prévia */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      activeTab === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos ({previewData.rows.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('UPDATE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                      activeTab === 'UPDATE'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <span>Atualizar Estoque Existente</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                      {previewData.willUpdateCount}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('CREATE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1 ${
                      activeTab === 'CREATE'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <span>Novos Produtos</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                      {previewData.willCreateCount}
                    </span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500">
                  Total de Volumes na Planilha:{' '}
                  <strong className="text-slate-900">
                    {previewData.rows
                      .reduce((acc, r) => acc + (r.currentStockPackages || 0), 0)
                      .toLocaleString('pt-BR')}
                  </strong>
                </div>
              </div>

              {/* Tabela de Prévia dos Dados */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Ação</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Produto</th>
                      <th className="py-2.5 px-3">Embalagem</th>
                      <th className="py-2.5 px-3 text-right">Fator Unid.</th>
                      <th className="py-2.5 px-3 text-right">Volumes</th>
                      <th className="py-2.5 px-3 text-right">Total Unid.</th>
                      <th className="py-2.5 px-3 text-right">Est. Mínimo</th>
                      <th className="py-2.5 px-3">Lote</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPreviewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3">
                          {row.action === 'UPDATE' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Atualizar
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Novo
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                          {row.sku}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-slate-800 line-clamp-1">{row.name}</div>
                          {row.existingProduct && (
                            <div className="text-[10px] text-slate-400">
                              Atual: {row.existingProduct.currentStockPackages} {row.existingProduct.packagingUnit} ({row.existingProduct.currentStockUnits} un)
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{row.packagingUnit}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-700">
                          {row.unitsPerPackage} un
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-indigo-700">
                          {row.currentStockPackages.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {row.currentStockUnits.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {row.minStockPackages} vol
                        </td>
                        <td className="py-2 px-3 font-mono text-[10px] text-slate-500">
                          {row.lotNumber || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Opções de Processamento */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  Configurações da Importação:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="UPSERT"
                      checked={importMode === 'UPSERT'}
                      onChange={() => setImportMode('UPSERT')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Atualizar existentes e cadastrar novos</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Atualiza os produtos já encontrados por SKU e cadastra os novos que ainda não existirem.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="UPDATE_ONLY"
                      checked={importMode === 'UPDATE_ONLY'}
                      onChange={() => setImportMode('UPDATE_ONLY')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Apenas atualizar itens já cadastrados</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ignora produtos que não existirem previamente na Fábrica Integrada.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-200/70">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={triggerAutoReorder}
                      onChange={(e) => setTriggerAutoReorder(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>
                      Verificar níveis críticos e acionar reposição automática para itens abaixo do estoque mínimo
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!importResult && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={loadingImport}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            {previewData ? (
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={resetUpload}
                  disabled={loadingImport}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={loadingImport || previewData.validRowsCount === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors disabled:opacity-50"
                >
                  {loadingImport ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gravando no Estoque...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Confirmar e Atualizar Estoque ({previewData.validRowsCount} itens)
                      </span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                Selecione ou solte a planilha para ver a prévia
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
