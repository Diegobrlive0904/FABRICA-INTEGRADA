import * as XLSX from 'xlsx';
import { ProductInventory, StockStatus } from '../../types';

export interface ParsedInventoryRow {
  rowNumber: number;
  sku: string;
  name: string;
  category: ProductInventory['category'];
  packagingUnit: string;
  unitsPerPackage: number;
  currentStockPackages: number;
  currentStockUnits: number;
  minStockPackages: number;
  unitWeightKg: number;
  weightPerPackageKg: number;
  costPrice: number;
  salePrice: number;
  lotNumber: string;
  manufactureDate: string;
  expiryDate: string;
  shelfLifeMonths: number;
  location: string;
  supplierName: string;
  barcode?: string;
  status: StockStatus;
  isValid: boolean;
  validationErrors: string[];
}

export interface ExcelParseResult {
  success: boolean;
  fileName?: string;
  sheetName: string;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  detectedColumns: Record<string, string>; // normalizedField -> originalHeader
  rows: ParsedInventoryRow[];
  errors: string[];
}

/**
 * Normaliza strings de cabeçalho para mapeamento automático resiliente
 */
export function normalizeHeaderKey(header: string): string {
  return String(header || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, ''); // apenas alfanuméricos
}

/**
 * Mapeamento inteligente de colunas comuns em planilhas de estoque e ERPs brasileiros
 * (Bling, Tiny, Omie, Senior, TOTVS Protheus, ContaAzul, SAP, Excel padronizado, etc.)
 */
export const FIELD_ALIASES: Record<
  keyof Omit<ParsedInventoryRow, 'rowNumber' | 'isValid' | 'validationErrors' | 'status'>,
  string[]
> = {
  sku: [
    'sku',
    'codigo',
    'cod',
    'codproduto',
    'codigoproduto',
    'coddoproduto',
    'codigodoproduto',
    'coditem',
    'codigoitem',
    'coddoitem',
    'codigodoitem',
    'referencia',
    'ref',
    'referenciadoproduto',
    'partnumber',
    'idproduto',
    'id',
    'material',
    'codigomaterial',
    'coderp',
    'codigoerp',
    'codigointerno',
    'codinterno',
    'código',
    'cód',
    'itemcode',
    'productcode',
  ],
  name: [
    'nome',
    'descricao',
    'descricaoproduto',
    'descricaodoproduto',
    'produto',
    'item',
    'titulo',
    'descricaodoitem',
    'nomedoproduto',
    'descricaocomercial',
    'nomecomercial',
    'especificacao',
    'mercadoria',
    'detalhes',
    'designacao',
    'productname',
    'description',
  ],
  category: [
    'categoria',
    'segmento',
    'departamento',
    'linha',
    'tipo',
    'grupodeproduto',
    'familiadeproduto',
    'grupo',
    'familia',
    'subgrupo',
    'classe',
    'category',
  ],
  packagingUnit: [
    'embalagem',
    'unidade',
    'unid',
    'und',
    'tipovolume',
    'packagingunit',
    'tipoembalagem',
    'unidadevolume',
    'volume',
    'unidadedemedida',
    'unidademedida',
    'um',
    'medida',
    'tipodevolume',
    'siglaum',
    'un',
    'unit',
  ],
  unitsPerPackage: [
    'unidadesporvolume',
    'unidadesporembalagem',
    'itensporcaixa',
    'fator',
    'fatorconversao',
    'fatorembalagem',
    'unitsperpackage',
    'unidadesporcaixa',
    'qtdporvolume',
    'fatorcaixa',
    'qtdvolume',
    'quantidadeporvolume',
    'multiplo',
    'unidadesporfardo',
    'fatorentrada',
    'embalagemfator',
    'qtdembalagem',
    'fatorunidades',
  ],
  currentStockPackages: [
    'estoquevolumes',
    'volumes',
    'saldovolumes',
    'caixas',
    'fardos',
    'pacotes',
    'currentstockpackages',
    'estoqueembalagens',
    'qtdvolumes',
    'qtdevolumes',
    'saldocaixas',
    'quantidadedevolumes',
    'estoqueatualvolumes',
    'saldo',
    'estoque',
    'qtd',
    'quantidade',
    'qtde',
    'saldoatual',
    'estoqueatual',
    'disponivel',
    'saldofisico',
    'estoquefisico',
    'posicao',
    'posicaofisica',
    'qtdestoque',
    'quant',
    'quantidadeatual',
    'estoquedisponivel',
    'saldofinal',
    'stock',
    'balance',
  ],
  currentStockUnits: [
    'estoqueunidades',
    'unidades',
    'saldounidades',
    'qtdunidades',
    'qtdeunidades',
    'currentstockunits',
    'saldounid',
    'pecas',
    'estoquetotalunidades',
    'quantidadedeunidades',
    'estoqueatualunidades',
    'saldoun',
    'qtdun',
    'unidestoque',
    'totalpecas',
    'unidadesestoque',
  ],
  minStockPackages: [
    'estoqueminimo',
    'minimovolumes',
    'pontopedido',
    'minstockpackages',
    'minimo',
    'estminimo',
    'estoqueminimovolumes',
    'minimocaixas',
    'estoquedeseguranca',
    'estseguranca',
    'pontoressuprimento',
    'min',
    'saldominimo',
    'qtdminima',
  ],
  unitWeightKg: [
    'pesounitario',
    'pesounit',
    'pesoliquido',
    'unitweightkg',
    'pesounitariokg',
    'pesounitkg',
    'pesokg',
    'pesoun',
    'pesoporunidade',
  ],
  weightPerPackageKg: [
    'pesovolume',
    'pesobruto',
    'pesocaixa',
    'weightperpackagekg',
    'pesofardo',
    'pesobrutokg',
    'pesoporvolume',
    'pesoporembalagem',
  ],
  costPrice: [
    'precocusto',
    'custo',
    'valorcusto',
    'custounitario',
    'costprice',
    'custounit',
    'precocustounitario',
    'customedio',
    'custoatual',
    'vlrcusto',
    'vlcusto',
    'precodecusto',
    'valorunitariocusto',
  ],
  salePrice: [
    'precovenda',
    'venda',
    'valorvenda',
    'saleprice',
    'preco',
    'precotabela',
    'precofinal',
    'valortabela',
    'precodevenda',
    'vlrvenda',
    'vlvenda',
    'precounitario',
    'valorunitario',
  ],
  lotNumber: [
    'lote',
    'numerolote',
    'lotnumber',
    'lotefabricacao',
    'partida',
    'numlote',
    'numerodelote',
    'lotes',
  ],
  manufactureDate: [
    'datafabricacao',
    'fabricacao',
    'datafab',
    'manufacturedate',
    'dtfabricacao',
    'dtfab',
    'datadefabricacao',
  ],
  expiryDate: [
    'datavalidade',
    'validade',
    'dataval',
    'vencimento',
    'expirydate',
    'dtvalidade',
    'dtvencimento',
    'dtval',
    'datadevalidade',
    'venc',
  ],
  shelfLifeMonths: [
    'vidautil',
    'mesesvalidade',
    'shelflifemonths',
    'validademeses',
    'prazoanos',
    'meses',
  ],
  location: [
    'localizacao',
    'local',
    'posicao',
    'rua',
    'enderecoestoque',
    'location',
    'deposito',
    'prateleira',
    'almoxarifado',
    'doca',
    'galpao',
    'box',
    'predio',
  ],
  supplierName: [
    'fornecedor',
    'nomefornecedor',
    'fabricante',
    'suppliername',
    'razaofornecedor',
    'fornecedorhomologado',
    'marca',
    'fornecedorprincipal',
    'razaosocial',
  ],
  barcode: [
    'ean',
    'barcode',
    'codigobarras',
    'gtin',
    'codigodebarras',
    'ean13',
    'codbarras',
    'codbarra',
  ],
};

/**
 * Converte data de células de Excel (número serial ou string) em YYYY-MM-DD
 */
export function parseExcelDate(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? '' : val.toISOString().split('T')[0];
  }
  if (typeof val === 'number') {
    // Excel date serial number (1900 date system)
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    if (!isNaN(dateInfo.getTime())) {
      return dateInfo.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  // Formato DD/MM/YYYY ou DD-MM-YYYY ou DD.MM.YYYY
  const brMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // Formato YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return str;
}

/**
 * Converte número com suporte resiliente a formatos monetários e numéricos
 * (brasileiro 1.250,50 ou americano 1,250.50 ou simples 12.5)
 */
export function parseNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;

  let str = String(val)
    .replace(/R\$/gi, '')
    .replace(/[$€£]/g, '')
    .trim();

  if (!str) return fallback;

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Padrão brasileiro: 1.234,56
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Padrão americano: 1,234.56
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Somente vírgula: 1234,56 ou 10,5
    str = str.replace(',', '.');
  } else if (hasDot) {
    // Somente ponto: 12.50 ou 1.000
    const parts = str.split('.');
    if (parts.length > 2) {
      // Mais de um ponto: milhar brasileiro 1.000.000
      str = str.replace(/\./g, '');
    }
  }

  // Remove caracteres estranhos preservando dígitos, ponto e menos
  str = str.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Localiza a melhor aba de dados em uma planilha que possa conter múltiplas abas
 */
function findBestInventorySheet(workbook: XLSX.WorkBook): { sheetName: string; sheet: XLSX.WorkSheet } | null {
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return null;
  }

  // Prioridades por nome comum
  const preferredNames = ['estoque', 'produtos', 'itens', 'inventario', 'saldos', 'planilha1', 'sheet1', 'dados'];
  for (const preferred of preferredNames) {
    const found = workbook.SheetNames.find((s) => s.toLowerCase().includes(preferred));
    if (found) {
      const sheet = workbook.Sheets[found];
      if (sheet && sheet['!ref']) {
        return { sheetName: found, sheet };
      }
    }
  }

  // Procura a primeira aba que não esteja vazia
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (sheet && sheet['!ref']) {
      return { sheetName: name, sheet };
    }
  }

  const defaultName = workbook.SheetNames[0];
  return { sheetName: defaultName, sheet: workbook.Sheets[defaultName] };
}

/**
 * Detecta dinamicamente a linha de cabeçalho mesmo quando há títulos ou linhas em branco no topo
 */
function detectHeaderRowIndex(rows2D: any[][]): number {
  if (!rows2D || rows2D.length === 0) return 0;

  let bestIndex = 0;
  let maxScore = 0;

  // Analisa até as primeiras 25 linhas
  const checkLimit = Math.min(25, rows2D.length);

  for (let i = 0; i < checkLimit; i++) {
    const row = rows2D[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    let matchCount = 0;
    for (const cell of row) {
      if (cell === null || cell === undefined || cell === '') continue;
      const normalized = normalizeHeaderKey(String(cell));
      if (!normalized) continue;

      for (const aliases of Object.values(FIELD_ALIASES)) {
        if (aliases.includes(normalized)) {
          matchCount++;
          break;
        }
      }
    }

    if (matchCount > maxScore) {
      maxScore = matchCount;
      bestIndex = i;
    }
  }

  return maxScore >= 1 ? bestIndex : 0;
}

/**
 * Faz a leitura de uma pasta de trabalho Excel ou CSV e mapeia para a estrutura de estoque
 */
export function parseExcelWorkbook(workbook: XLSX.WorkBook): ExcelParseResult {
  const sheetInfo = findBestInventorySheet(workbook);
  if (!sheetInfo || !sheetInfo.sheet) {
    return {
      success: false,
      sheetName: '',
      totalRows: 0,
      validRowsCount: 0,
      invalidRowsCount: 0,
      detectedColumns: {},
      rows: [],
      errors: ['O arquivo Excel não contém nenhuma planilha legível com dados.'],
    };
  }

  const { sheetName, sheet } = sheetInfo;

  // Lê a planilha em formato 2D para identificar a linha real de cabeçalho
  const raw2D: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!raw2D || raw2D.length === 0) {
    return {
      success: false,
      sheetName,
      totalRows: 0,
      validRowsCount: 0,
      invalidRowsCount: 0,
      detectedColumns: {},
      rows: [],
      errors: ['A planilha está vazia ou sem linhas de dados.'],
    };
  }

  // Detecta em qual linha está o cabeçalho
  const headerRowIndex = detectHeaderRowIndex(raw2D);
  const headerRow = raw2D[headerRowIndex] || [];

  // Mapeia colunas encontradas
  const normalizedToOriginalHeader: Record<string, string> = {};
  headerRow.forEach((col: any) => {
    if (col !== null && col !== undefined && String(col).trim() !== '') {
      normalizedToOriginalHeader[normalizeHeaderKey(String(col))] = String(col).trim();
    }
  });

  // Associa cada campo do sistema à coluna correspondente no Excel
  const fieldToHeader: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (normalizedToOriginalHeader[alias]) {
        fieldToHeader[field] = normalizedToOriginalHeader[alias];
        break;
      }
    }
  }

  // Lê as linhas de dados a partir da linha de cabeçalho
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
    range: headerRowIndex,
    defval: '',
  });

  if (rawRows.length === 0) {
    return {
      success: false,
      sheetName,
      totalRows: 0,
      validRowsCount: 0,
      invalidRowsCount: 0,
      detectedColumns: fieldToHeader,
      rows: [],
      errors: ['Nenhuma linha de produto encontrada abaixo da linha de cabeçalho da planilha.'],
    };
  }

  const parsedRows: ParsedInventoryRow[] = [];
  let validCount = 0;
  let invalidCount = 0;

  rawRows.forEach((row, index) => {
    const rowNumber = headerRowIndex + index + 2; // Linha real no Excel
    const errors: string[] = [];

    // Mapeamento dinâmico flexível da linha
    const rowNormalizedKeys: Record<string, string> = {};
    for (const k of Object.keys(row)) {
      rowNormalizedKeys[normalizeHeaderKey(k)] = k;
    }

    const getVal = (field: string) => {
      const header = fieldToHeader[field];
      if (header !== undefined && row[header] !== undefined && row[header] !== '') {
        return row[header];
      }
      const aliases = (FIELD_ALIASES as any)[field] || [];
      for (const alias of aliases) {
        const origKey = rowNormalizedKeys[alias];
        if (origKey && row[origKey] !== undefined && row[origKey] !== '') {
          return row[origKey];
        }
      }
      return undefined;
    };

    let rawSku = String(getVal('sku') || '').trim();
    let rawName = String(getVal('name') || '').trim();

    // Se a linha estiver totalmente vazia, ignora
    const hasAnyContent = Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '');
    if (!hasAnyContent) {
      return;
    }

    // Se não tiver nem código nem nome, mas tiver colunas numéricas de saldo, tenta gerar nome padrão
    if (!rawSku && !rawName) {
      // Ignora linhas de rodapé ou totais
      const firstCol = String(Object.values(row)[0] || '').toLowerCase();
      if (firstCol.includes('total') || firstCol.includes('somatória') || firstCol.includes('resumo')) {
        return;
      }
      return; // Linha sem produto identificável
    }

    // Se tiver nome mas não tiver SKU, gera SKU inteligente
    if (!rawSku && rawName) {
      const cleanSlug = normalizeHeaderKey(rawName).slice(0, 12).toUpperCase();
      rawSku = `FLIND-${cleanSlug || 'ITEM'}-${rowNumber}`;
    }

    // Se tiver SKU mas não tiver nome, atribui nome amigável
    if (rawSku && !rawName) {
      rawName = `Item ${rawSku}`;
    }

    // Categoria
    const rawCat = String(getVal('category') || '').trim();
    let category: ProductInventory['category'] = 'Hospitalar & Cirúrgico';
    if (rawCat.toLowerCase().includes('est') || rawCat.toLowerCase().includes('spa')) {
      category = 'Estética & Spas';
    } else if (rawCat.toLowerCase().includes('sal') || rawCat.toLowerCase().includes('barb')) {
      category = 'Salões & Barbearias';
    } else if (rawCat.toLowerCase().includes('insumo') || rawCat.toLowerCase().includes('mat')) {
      category = 'Insumo & Matéria-Prima';
    }

    // Embalagem / Unidade de volume
    let packagingUnit = String(getVal('packagingUnit') || 'Caixa (CX)').trim();
    const pkgUpper = packagingUnit.toUpperCase();
    if (pkgUpper === 'CX' || pkgUpper === 'CAIXA') packagingUnit = 'Caixa (CX)';
    else if (pkgUpper === 'FD' || pkgUpper === 'FARDO') packagingUnit = 'Fardo (FD)';
    else if (pkgUpper === 'PCT' || pkgUpper === 'PACOTE') packagingUnit = 'Pacote (PCT)';
    else if (pkgUpper === 'RL' || pkgUpper === 'ROLO') packagingUnit = 'Rolo (RL)';
    else if (pkgUpper === 'UN' || pkgUpper === 'UND' || pkgUpper === 'UNID') packagingUnit = 'Unidade (UN)';

    // Fator de embalagem (Unidades por volume)
    let unitsPerPackage = parseNumber(getVal('unitsPerPackage'), 0);

    // Estoque em volumes vs unidades
    const rawPackages = getVal('currentStockPackages');
    const rawUnits = getVal('currentStockUnits');

    let currentStockPackages = 0;
    let currentStockUnits = 0;

    if (rawPackages !== undefined && rawPackages !== '') {
      currentStockPackages = Math.max(0, Math.round(parseNumber(rawPackages, 0)));
      if (unitsPerPackage > 0) {
        currentStockUnits = currentStockPackages * unitsPerPackage;
      } else if (rawUnits !== undefined && rawUnits !== '') {
        currentStockUnits = Math.max(0, Math.round(parseNumber(rawUnits, 0)));
        if (currentStockPackages > 0) {
          unitsPerPackage = Math.round(currentStockUnits / currentStockPackages) || 1;
        } else {
          unitsPerPackage = 1;
        }
      } else {
        unitsPerPackage = 1;
        currentStockUnits = currentStockPackages;
      }
    } else if (rawUnits !== undefined && rawUnits !== '') {
      currentStockUnits = Math.max(0, Math.round(parseNumber(rawUnits, 0)));
      if (unitsPerPackage <= 0) unitsPerPackage = 1;
      currentStockPackages = Math.ceil(currentStockUnits / unitsPerPackage);
    } else {
      currentStockPackages = 0;
      currentStockUnits = 0;
      if (unitsPerPackage <= 0) unitsPerPackage = 1;
    }

    if (unitsPerPackage <= 0) unitsPerPackage = 1;

    // Estoque Mínimo
    const minStockPackages = Math.max(0, Math.round(parseNumber(getVal('minStockPackages'), 15)));

    // Pesos
    let unitWeightKg = parseNumber(getVal('unitWeightKg'), 0);
    let weightPerPackageKg = parseNumber(getVal('weightPerPackageKg'), 0);

    if (weightPerPackageKg <= 0 && unitWeightKg > 0) {
      weightPerPackageKg = Number((unitWeightKg * unitsPerPackage).toFixed(3));
    } else if (unitWeightKg <= 0 && weightPerPackageKg > 0 && unitsPerPackage > 0) {
      unitWeightKg = Number((weightPerPackageKg / unitsPerPackage).toFixed(4));
    }

    // Preços
    const costPrice = Math.max(0, parseNumber(getVal('costPrice'), 0));
    const salePrice = Math.max(0, parseNumber(getVal('salePrice'), 0));

    // Lote e Validades
    const lotNumber = String(getVal('lotNumber') || `LOTE-${new Date().getFullYear()}-IMP`).trim();
    const manufactureDate = parseExcelDate(getVal('manufactureDate')) || new Date().toISOString().split('T')[0];
    const expiryDate =
      parseExcelDate(getVal('expiryDate')) ||
      new Date(Date.now() + 365 * 86400000 * 3).toISOString().split('T')[0];
    const shelfLifeMonths = parseNumber(getVal('shelfLifeMonths'), 36);

    const location = String(getVal('location') || 'Almoxarifado Geral').trim();
    const supplierName = String(getVal('supplierName') || 'Fornecedor Homologado').trim();
    const barcode = String(getVal('barcode') || '').trim();

    // Cálculo do Status do Estoque
    let status: StockStatus = 'NORMAL';
    if (currentStockPackages <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (currentStockPackages <= Math.max(1, Math.floor(minStockPackages * 0.4))) {
      status = 'CRITICAL';
    } else if (currentStockPackages <= minStockPackages) {
      status = 'LOW';
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }

    parsedRows.push({
      rowNumber,
      sku: rawSku,
      name: rawName,
      category,
      packagingUnit,
      unitsPerPackage,
      currentStockPackages,
      currentStockUnits,
      minStockPackages,
      unitWeightKg,
      weightPerPackageKg,
      costPrice,
      salePrice,
      lotNumber,
      manufactureDate,
      expiryDate,
      shelfLifeMonths,
      location,
      supplierName,
      barcode: barcode || undefined,
      status,
      isValid,
      validationErrors: errors,
    });
  });

  return {
    success: parsedRows.length > 0,
    sheetName,
    totalRows: parsedRows.length,
    validRowsCount: validCount,
    invalidRowsCount: invalidCount,
    detectedColumns: fieldToHeader,
    rows: parsedRows,
    errors: parsedRows.length === 0 ? ['Nenhum produto válido encontrado na planilha.'] : [],
  };
}

/**
 * Gera uma planilha modelo oficial XLSX para download
 */
export function generateInventoryTemplateWorkbook(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const sampleData = [
    {
      'SKU / Código': 'FLIND-AVT-CIR-50',
      'Nome do Produto': 'Avental Cirúrgico Impermeável TNT 50g/m² Esterilizado',
      'Categoria': 'Hospitalar & Cirúrgico',
      'Tipo de Volume (Embalagem)': 'Caixa (CX)',
      'Unidades por Volume': 50,
      'Estoque Atual (Volumes)': 140,
      'Estoque Atual (Unidades)': 7000,
      'Estoque Mínimo (Volumes)': 60,
      'Peso Unitário (kg)': 0.24,
      'Peso por Volume (kg)': 12.0,
      'Preço de Custo (R$)': 195.0,
      'Preço de Venda (R$)': 320.0,
      'Lote': 'LOTE-FLIND-2026-A19',
      'Data de Fabricação': '2026-08-10',
      'Data de Validade': '2029-08-10',
      'Localização Almoxarifado': 'Galpão 1 • Rua A-04, Nível 2',
      'Fornecedor': 'Fibras & Não-Tecidos Brasil S/A',
      'Código de Barras (EAN)': '7898912340012',
    },
    {
      'SKU / Código': 'FLIND-MSC-TRIP-TIR',
      'Nome do Produto': 'Máscara Cirúrgica Tripla com Tiras BFE≥95%',
      'Categoria': 'Hospitalar & Cirúrgico',
      'Tipo de Volume (Embalagem)': 'Fardo (FD)',
      'Unidades por Volume': 2000,
      'Estoque Atual (Volumes)': 45,
      'Estoque Atual (Unidades)': 90000,
      'Estoque Mínimo (Volumes)': 25,
      'Peso Unitário (kg)': 0.0035,
      'Peso por Volume (kg)': 7.5,
      'Preço de Custo (R$)': 140.0,
      'Preço de Venda (R$)': 250.0,
      'Lote': 'LOTE-FLIND-2026-B02',
      'Data de Fabricação': '2026-09-01',
      'Data de Validade': '2029-09-01',
      'Localização Almoxarifado': 'Galpão 1 • Rua B-02, Nível 1',
      'Fornecedor': 'Fibras & Não-Tecidos Brasil S/A',
      'Código de Barras (EAN)': '7898912340029',
    },
    {
      'SKU / Código': 'FLIND-LEN-TNT-70',
      'Nome do Produto': 'Lençol Descartável em Rolo TNT 70cm x 50m para Macas',
      'Categoria': 'Estética & Spas',
      'Tipo de Volume (Embalagem)': 'Fardo (FD)',
      'Unidades por Volume': 10,
      'Estoque Atual (Volumes)': 80,
      'Estoque Atual (Unidades)': 800,
      'Estoque Mínimo (Volumes)': 30,
      'Peso Unitário (kg)': 1.3,
      'Peso por Volume (kg)': 13.0,
      'Preço de Custo (R$)': 45.0,
      'Preço de Venda (R$)': 85.0,
      'Lote': 'LOTE-FLIND-2026-EST01',
      'Data de Fabricação': '2026-08-15',
      'Data de Validade': '2029-08-15',
      'Localização Almoxarifado': 'Galpão 2 • Rua E-01',
      'Fornecedor': 'Fibras & Não-Tecidos Brasil S/A',
      'Código de Barras (EAN)': '7898912340036',
    },
    {
      'SKU / Código': 'FLIND-LUV-NIT-PINK',
      'Nome do Produto': 'Luva Nitrílica Pink Tam M Especial Clínicas de Estética',
      'Categoria': 'Estética & Spas',
      'Tipo de Volume (Embalagem)': 'Fardo (FD)',
      'Unidades por Volume': 5000,
      'Estoque Atual (Volumes)': 35,
      'Estoque Atual (Unidades)': 175000,
      'Estoque Mínimo (Volumes)': 20,
      'Peso Unitário (kg)': 0.004,
      'Peso por Volume (kg)': 20.0,
      'Preço de Custo (R$)': 950.0,
      'Preço de Venda (R$)': 1590.0,
      'Lote': 'LOTE-FLIND-2026-EST02',
      'Data de Fabricação': '2026-07-20',
      'Data de Validade': '2029-07-20',
      'Localização Almoxarifado': 'Galpão 2 • Rua F-03',
      'Fornecedor': 'SuperAbsorb Brasil',
      'Código de Barras (EAN)': '7898912340043',
    },
    {
      'SKU / Código': 'FLIND-CAP-CORTE-BARB',
      'Nome do Produto': 'Capa de Corte Descartável TNT Impermeável c/ Elástico',
      'Categoria': 'Salões & Barbearias',
      'Tipo de Volume (Embalagem)': 'Pacote (PCT)',
      'Unidades por Volume': 50,
      'Estoque Atual (Volumes)': 120,
      'Estoque Atual (Unidades)': 6000,
      'Estoque Mínimo (Volumes)': 40,
      'Peso Unitário (kg)': 0.025,
      'Peso por Volume (kg)': 1.25,
      'Preço de Custo (R$)': 28.0,
      'Preço de Venda (R$)': 55.0,
      'Lote': 'LOTE-FLIND-2026-BB01',
      'Data de Fabricação': '2026-08-01',
      'Data de Validade': '2029-08-01',
      'Localização Almoxarifado': 'Galpão 3 • Rua C-02',
      'Fornecedor': 'Klabin Embalagens Hospitalares',
      'Código de Barras (EAN)': '7898912340050',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Largura das colunas para visualização agradável
  ws['!cols'] = [
    { wch: 22 }, // SKU
    { wch: 50 }, // Nome
    { wch: 24 }, // Categoria
    { wch: 26 }, // Tipo de Volume
    { wch: 20 }, // Unidades por Volume
    { wch: 22 }, // Estoque Volumes
    { wch: 22 }, // Estoque Unidades
    { wch: 22 }, // Estoque Mínimo
    { wch: 18 }, // Peso Unit
    { wch: 20 }, // Peso Volume
    { wch: 18 }, // Preço Custo
    { wch: 18 }, // Preço Venda
    { wch: 22 }, // Lote
    { wch: 18 }, // Fabricação
    { wch: 18 }, // Validade
    { wch: 30 }, // Localização
    { wch: 32 }, // Fornecedor
    { wch: 22 }, // EAN
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Estoque e Volumes');

  // Adicionar folha com Instruções de Preenchimento
  const instructions = [
    {
      'Instrução': '1. SKU / Código',
      'Regra de Preenchimento': 'Identificador único do produto ou insumo no sistema.',
    },
    {
      'Instrução': '2. Nome do Produto',
      'Regra de Preenchimento': 'Descrição completa do produto. Se não houver SKU, o sistema gera automaticamente.',
    },
    {
      'Instrução': '3. Tipo de Volume (Embalagem)',
      'Regra de Preenchimento': 'Caixa (CX), Fardo (FD), Pacote (PCT), Rolo (RL), Palete (PAL) ou Unidade (UN).',
    },
    {
      'Instrução': '4. Unidades por Volume',
      'Regra de Preenchimento': 'Quantidade de unidades dentro de cada caixa/fardo. O padrão é 1 se não informado.',
    },
    {
      'Instrução': '5. Estoque Atual (Volumes)',
      'Regra de Preenchimento': 'Quantidade física em caixas/fardos. O sistema calcula automaticamente o total em unidades.',
    },
    {
      'Instrução': '6. Estoque Atual (Unidades)',
      'Regra de Preenchimento': 'Opcional se preenchido em volumes. Se informado apenas unidades, o sistema calcula os volumes.',
    },
    {
      'Instrução': '7. Estoque Mínimo',
      'Regra de Preenchimento': 'Ponto de pedido / estoque de segurança em volumes. Aciona alertas e reposições automáticas.',
    },
    {
      'Instrução': '8. Atualização Inteligente',
      'Regra de Preenchimento': 'Se o SKU ou Nome já existir, o saldo será atualizado. Se não existir, um novo item será cadastrado.',
    },
  ];
  const wsInst = XLSX.utils.json_to_sheet(instructions);
  wsInst['!cols'] = [{ wch: 30 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsInst, 'Como Preencher');

  return wb;
}
