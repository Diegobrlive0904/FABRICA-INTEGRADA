import { test, describe } from 'node:test';
import assert from 'node:assert';
import * as XLSX from 'xlsx';
import { db } from '../server/database/db';
import {
  generateInventoryTemplateWorkbook,
  parseExcelWorkbook,
} from '../server/services/excel-inventory-service';

describe('TESTES DE IMPORTAÇÃO AUTOMÁTICA DE ESTOQUE E VOLUMES VIA XLSX', () => {
  test('Geração da Planilha Modelo: Deve gerar pasta de trabalho com abas e colunas corretas', () => {
    const wb = generateInventoryTemplateWorkbook();
    assert.ok(wb.SheetNames.includes('Estoque e Volumes'), 'Aba principal de estoque deve existir');
    assert.ok(wb.SheetNames.includes('Como Preencher'), 'Aba de instruções deve existir');

    const sheet = wb.Sheets['Estoque e Volumes'];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);
    assert.ok(rows.length >= 5, 'Deve conter produtos de exemplo');
    assert.ok(rows[0]['SKU / Código'], 'Coluna SKU deve estar presente');
    assert.ok(rows[0]['Estoque Atual (Volumes)'], 'Coluna de volumes deve estar presente');
  });

  test('Parser XLSX: Deve reconhecer sinônimos e calcular automaticamente estoque em unidades a partir de volumes', () => {
    const wb = XLSX.utils.book_new();
    const testData = [
      {
        'codigo': 'TEST-XLSX-01',
        'descricao': 'Máscara Cirúrgica Teste Automático',
        'categoria': 'Hospitalar & Cirúrgico',
        'embalagem': 'Caixa (CX)',
        'fator_conversao': 50,
        'saldo_volumes': 30, // 30 caixas * 50 = 1500 unidades
        'minimo_volumes': 10,
        'custo': 85.5,
        'lote': 'LOTE-TEST-01',
      },
      {
        'sku': 'TEST-XLSX-02',
        'produto': 'Lençol TNT Descartável Teste',
        'categoria': 'Estética & Spas',
        'tipo_volume': 'Fardo (FD)',
        'itens_por_caixa': 10,
        'caixas': 5, // 5 fardos * 10 = 50 unidades
        'estoque_minimo': 20, // Abaixo do mínimo -> status CRITICAL ou LOW
        'preco_venda': 120.0,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(testData);
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');

    const result = parseExcelWorkbook(wb);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.rows.length, 2);

    // Item 1
    const item1 = result.rows.find((r) => r.sku === 'TEST-XLSX-01');
    assert.ok(item1);
    assert.strictEqual(item1.currentStockPackages, 30);
    assert.strictEqual(item1.unitsPerPackage, 50);
    assert.strictEqual(item1.currentStockUnits, 1500, 'Unidades devem ser 30 * 50 = 1500');
    assert.strictEqual(item1.status, 'NORMAL');

    // Item 2
    const item2 = result.rows.find((r) => r.sku === 'TEST-XLSX-02');
    assert.ok(item2);
    assert.strictEqual(item2.currentStockPackages, 5);
    assert.strictEqual(item2.unitsPerPackage, 10);
    assert.strictEqual(item2.currentStockUnits, 50, 'Unidades devem ser 5 * 10 = 50');
    assert.ok(
      item2.status === 'LOW' || item2.status === 'CRITICAL',
      'Estoque de 5 com mínimo de 20 deve estar LOW ou CRITICAL'
    );
  });

  test('DatabaseManager.importInventoryItems: Deve atualizar produto existente e preencher unidades e volumes no banco', () => {
    // Localizar um produto existente
    const existing = db.getProducts()[0];
    assert.ok(existing, 'Deve existir produto prévio no banco');

    const newPackages = existing.currentStockPackages + 25;
    const expectedUnits = newPackages * existing.unitsPerPackage;

    const importResult = db.importInventoryItems(
      [
        {
          sku: existing.sku,
          name: existing.name,
          currentStockPackages: newPackages,
          packagingUnit: existing.packagingUnit,
          unitsPerPackage: existing.unitsPerPackage,
        },
      ],
      { mode: 'UPSERT', triggerAutoReorder: false }
    );

    assert.strictEqual(importResult.success, true);
    assert.strictEqual(importResult.updatedCount, 1);

    // Conferir se o produto no banco foi atualizado
    const reloaded = db.getProductById(existing.id);
    assert.ok(reloaded);
    assert.strictEqual(reloaded.currentStockPackages, newPackages);
    assert.strictEqual(reloaded.currentStockUnits, expectedUnits);
  });

  test('Parser XLSX: Deve reconhecer planilha de ERP com linhas de título antes dos cabeçalhos', () => {
    const wb = XLSX.utils.book_new();
    const rowsWithTitleHeader = [
      ['RELATÓRIO DE POSIÇÃO DE ESTOQUE - FLIND INDÚSTRIA'],
      ['Emitido em: 24/09/2026 14:00 - Usuário: Almoxarife'],
      [''], // linha em branco
      ['Código', 'Descrição do Produto', 'Unidade', 'Saldo Atual', 'Estoque Mínimo', 'Preço de Custo'],
      ['FLIND-ERP-01', 'Touca Descartável Sanfonada Branca', 'Caixa (CX)', '120', '30', '45,90'],
      ['FLIND-ERP-02', 'Propé Descartável TNT Antiderrapante', 'Pacote (PCT)', '85', '20', '28,50'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rowsWithTitleHeader);
    XLSX.utils.book_append_sheet(wb, ws, 'RelatorioEstoque');

    const result = parseExcelWorkbook(wb);
    assert.strictEqual(result.success, true, 'Deve encontrar produtos mesmo com títulos nas primeiras linhas');
    assert.strictEqual(result.rows.length, 2);

    const item1 = result.rows.find((r) => r.sku === 'FLIND-ERP-01');
    assert.ok(item1);
    assert.strictEqual(item1.name, 'Touca Descartável Sanfonada Branca');
    assert.strictEqual(item1.currentStockPackages, 120);
    assert.strictEqual(item1.minStockPackages, 30);
    assert.strictEqual(item1.costPrice, 45.9);
  });

  test('Parser XLSX: Deve aceitar coluna genérica "Saldo" e auto-gerar SKU quando apenas "Produto" for informado', () => {
    const wb = XLSX.utils.book_new();
    const simpleSheet = [
      ['Produto', 'Saldo', 'Custo'],
      ['Luva Látex Procedimento Tamanho M', '50', '85.00'],
      ['Avental Descartável Manga Longa', '200', '12.50'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(simpleSheet);
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');

    const result = parseExcelWorkbook(wb);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.rows.length, 2);

    const item1 = result.rows[0];
    assert.ok(item1.sku.startsWith('FLIND-'), 'Deve auto-gerar SKU quando não informado na planilha');
    assert.strictEqual(item1.name, 'Luva Látex Procedimento Tamanho M');
    assert.strictEqual(item1.currentStockPackages, 50);
    assert.strictEqual(item1.costPrice, 85);
  });
});
