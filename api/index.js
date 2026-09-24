// src/server/api-handler.ts
import express from "express";

// src/server/routes/api.ts
import { Router } from "express";

// src/server/database/db.ts
import fs from "fs";
import path from "path";
function getDatabaseFilePaths() {
  const localDir = path.resolve(process.cwd(), "data");
  const localFile = path.join(localDir, "fabrica_integrada_db.json");
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDir = path.join("/tmp", "data");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return { dir: tmpDir, file: path.join(tmpDir, "fabrica_integrada_db.json"), isReadOnlyEnv: true };
    } catch {
      return { dir: tmpDir, file: path.join(tmpDir, "fabrica_integrada_db.json"), isReadOnlyEnv: true };
    }
  }
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return { dir: localDir, file: localFile, isReadOnlyEnv: false };
  } catch {
    const tmpDir = path.join("/tmp", "data");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {
    }
    return { dir: tmpDir, file: path.join(tmpDir, "fabrica_integrada_db.json"), isReadOnlyEnv: true };
  }
}
var dbPaths = getDatabaseFilePaths();
var DATA_DIR = dbPaths.dir;
var DB_FILE = dbPaths.file;
function getInitialSeed() {
  const now = /* @__PURE__ */ new Date("2026-09-22T10:00:00.000Z");
  const dAgo = (hours) => new Date(now.getTime() - hours * 36e5).toISOString();
  const dFuture = (days) => new Date(now.getTime() + days * 864e5).toISOString().split("T")[0];
  const dPast = (days) => new Date(now.getTime() - days * 864e5).toISOString().split("T")[0];
  const customers = [
    {
      id: "cust-1",
      externalId: "ERP-CUST-881",
      name: "Rede Hospitalar S\xE3o Camilo S/A",
      tradeName: "Hospital S\xE3o Camilo - CAF Central",
      segment: "Hospitalar & Cir\xFArgico",
      taxId: "14.285.932/0001-44",
      email: "compras.hospitalar@saocamilo.org.br",
      phone: "+55 11 98452-1100",
      flindOrigin: "DIRETO_B2B",
      notes: "Cliente Direto da F\xE1brica: Contrato corporativo hospitalar anual, televendas e faturamento direto via SINK ERP. N\xE3o possui conta no e-commerce.",
      createdAt: dAgo(720),
      updatedAt: dAgo(24)
    },
    {
      id: "cust-2",
      externalId: "TRAY-CUST-904",
      name: "Rede Bella Pelle Est\xE9tica Avan\xE7ada & Spas Ltda",
      tradeName: "Bella Pelle Est\xE9tica & Laser",
      segment: "Est\xE9tica & Spas",
      taxId: "08.921.344/0002-19",
      email: "suprimentos@bellapelleestetica.com.br",
      phone: "+55 19 97123-4567",
      flindOrigin: "FLIND_ECOMMERCE_WEB",
      flindWebId: "FW-48921",
      flindWebProfileUrl: "https://www.flind.com.br/central-do-cliente",
      flindPortalSync: {
        isRegisteredOnFlindWeb: true,
        lastSyncedAt: dAgo(2),
        accountEmail: "suprimentos@bellapelleestetica.com.br",
        totalFlindWebOrders: 6,
        flindTier: "PRATA_CLINICAS",
        customerProfileUrl: "https://www.flind.com.br/central-do-cliente",
        catalogInterest: ["Len\xE7\xF3is TNT para Macas", "Luvas Pink Nitr\xEDlicas"]
      },
      createdAt: dAgo(480),
      updatedAt: dAgo(10)
    },
    {
      id: "cust-3",
      externalId: "TRAY-CUST-915",
      name: "Rede de Sal\xF5es Jacques Janine & Beauty Studio Ltda",
      tradeName: "Jacques Janine Sal\xF5es & Barbearias",
      segment: "Sal\xF5es & Barbearias",
      taxId: "32.198.765/0001-88",
      email: "suprimentos@jacquesjanine.com.br",
      phone: "+55 31 99876-5432",
      flindOrigin: "TRAY",
      flindWebId: "FW-32198",
      flindWebProfileUrl: "https://www.flind.com.br/central-do-cliente",
      flindPortalSync: {
        isRegisteredOnFlindWeb: true,
        lastSyncedAt: dAgo(1),
        accountEmail: "suprimentos@jacquesjanine.com.br",
        totalFlindWebOrders: 4,
        flindTier: "BRONZE_ESTETICA",
        customerProfileUrl: "https://www.flind.com.br/central-do-cliente",
        catalogInterest: ["Capas de Corte Descart\xE1veis", "Golas Higi\xEAnicas"]
      },
      createdAt: dAgo(240),
      updatedAt: dAgo(5)
    },
    {
      id: "cust-4",
      externalId: "ERP-CUST-920",
      name: "Santa Casa de Miseric\xF3rdia de Santos",
      tradeName: "Santa Casa de Santos - Farm\xE1cia Hospitalar",
      segment: "Hospitalar & Cir\xFArgico",
      taxId: "58.194.205/0001-30",
      email: "licitacoes@santacasasantos.org.br",
      phone: "+55 13 3202-0600",
      flindOrigin: "DIRETO_B2B",
      notes: "Cliente Direto da F\xE1brica: Fornecimento hospitalar por licita\xE7\xE3o p\xFAblica e televendas direto com a ind\xFAstria. Sem cadastro no site.",
      createdAt: dAgo(180),
      updatedAt: dAgo(12)
    }
  ];
  const addresses = [
    // Cliente 1 - São Camilo (Hospitalar: Sede Administrativa, Escritório Cobrança, Galpão CAF Guarulhos)
    {
      id: "addr-1-fiscal",
      customerId: "cust-1",
      type: "FISCAL",
      street: "Av. Paulista",
      number: "1842",
      complement: "Conjunto 141 - Diretoria Administrativa",
      neighborhood: "Bela Vista",
      city: "S\xE3o Paulo",
      state: "SP",
      zipCode: "01310-200",
      country: "Brasil",
      isDefault: false,
      createdAt: dAgo(720)
    },
    {
      id: "addr-1-billing",
      customerId: "cust-1",
      type: "BILLING",
      street: "Av. Paulista",
      number: "1842",
      complement: "Conjunto 142 - Auditoria M\xE9dica & Faturamento",
      neighborhood: "Bela Vista",
      city: "S\xE3o Paulo",
      state: "SP",
      zipCode: "01310-200",
      country: "Brasil",
      isDefault: false,
      createdAt: dAgo(720)
    },
    {
      id: "addr-1-delivery",
      customerId: "cust-1",
      type: "DELIVERY",
      street: "Rodovia Presidente Dutra",
      number: "Km 218",
      complement: "Galp\xE3o CAF - Central de Abastecimento Farmac\xEAutico",
      neighborhood: "Cumbica",
      city: "Guarulhos",
      state: "SP",
      zipCode: "07180-000",
      country: "Brasil",
      isDefault: true,
      createdAt: dAgo(720)
    },
    // Cliente 2 - Bella Pelle (Estética & Spas: Sede Administrativa em Campinas e CD Regional das Clínicas)
    {
      id: "addr-2-fiscal",
      customerId: "cust-2",
      type: "FISCAL",
      street: "Rua Bar\xE3o de Jaguara",
      number: "950",
      neighborhood: "Cambu\xED",
      city: "Campinas",
      state: "SP",
      zipCode: "13015-001",
      country: "Brasil",
      isDefault: false,
      createdAt: dAgo(480)
    },
    {
      id: "addr-2-delivery",
      customerId: "cust-2",
      type: "DELIVERY",
      street: "Av. Engenheiro Augusto Figueiredo",
      number: "2100",
      complement: "Doca 3 - Central de Distribui\xE7\xE3o de Cl\xEDnicas & Franquias de Est\xE9tica",
      neighborhood: "Vila Progresso",
      city: "Campinas",
      state: "SP",
      zipCode: "13045-500",
      country: "Brasil",
      isDefault: true,
      createdAt: dAgo(480)
    },
    // Cliente 3 - Jacques Janine (Salões & Barbearias: Matriz e Central de Suprimentos para Cabeleireiros e Barbeiros)
    {
      id: "addr-3-fiscal",
      customerId: "cust-3",
      type: "FISCAL",
      street: "Rua dos Guajajaras",
      number: "650",
      complement: "Conjunto 801 - Escrit\xF3rio Corporativo",
      neighborhood: "Centro",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30180-100",
      country: "Brasil",
      isDefault: false,
      createdAt: dAgo(240)
    },
    {
      id: "addr-3-delivery",
      customerId: "cust-3",
      type: "DELIVERY",
      street: "Rua dos Guajajaras",
      number: "650",
      complement: "T\xE9rreo - Recep\xE7\xE3o de Suprimentos & Descart\xE1veis para Sal\xF5es e Barbearias",
      neighborhood: "Centro",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30180-100",
      country: "Brasil",
      isDefault: true,
      createdAt: dAgo(240)
    }
  ];
  const deliveryRules = [
    {
      id: "delrule-1",
      addressId: "addr-1-delivery",
      customerId: "cust-1",
      allowedTimeStart: "07:00",
      allowedTimeEnd: "16:00",
      allowedWeekdays: [1, 2, 3, 4, 5],
      requiresScheduling: false,
      maxWeightKg: 15e3,
      vehicleTypeAllowed: "TRUCK",
      entryGate: "Doca 4B - Insumos e Materiais Hospitalares",
      contactName: "Carlos Eduardo - Farmac\xEAutico Respons\xE1vel",
      contactPhone: "+55 11 98888-2233",
      requiresDocumentation: true,
      notes: "Motorista deve portar cal\xE7ado fechado, jaleco e laudo de lote/esterilidade dos descart\xE1veis cir\xFArgicos.",
      active: true
    },
    {
      id: "delrule-2",
      addressId: "addr-2-delivery",
      customerId: "cust-2",
      allowedTimeStart: "08:30",
      allowedTimeEnd: "11:30",
      allowedWeekdays: [2, 3, 4],
      // Terça a Quinta
      requiresScheduling: true,
      maxWeightKg: 4e3,
      vehicleTypeAllowed: "VUC",
      entryGate: "Doca 3 - Central de Distribui\xE7\xE3o Cl\xEDnicas de Est\xE9tica",
      contactName: "Mariana Souza (Coord. Suprimentos Est\xE9tica)",
      contactPhone: "+55 19 99777-6655",
      requiresDocumentation: true,
      notes: "AGENDAMENTO OBRIGAT\xD3RIO com 24h de anteced\xEAncia. Entrada restrita a ve\xEDculos VUC na Doca do CD das Cl\xEDnicas de Est\xE9tica.",
      active: true
    },
    {
      id: "delrule-3",
      addressId: "addr-3-delivery",
      customerId: "cust-3",
      allowedTimeStart: "09:00",
      allowedTimeEnd: "17:00",
      allowedWeekdays: [1, 2, 3, 4, 5],
      requiresScheduling: false,
      maxWeightKg: 2e3,
      vehicleTypeAllowed: "VUC",
      entryGate: "Recep\xE7\xE3o de Mercadorias - Sal\xF5es & Barbearias",
      contactName: "Rodrigo Alcantara (Almoxarifado Sal\xF5es)",
      contactPhone: "+55 31 98877-3322",
      requiresDocumentation: false,
      notes: "Hor\xE1rio comercial. Entregas de capas descart\xE1veis, golas de barbeiro e luvas para colora\xE7\xE3o.",
      active: true
    }
  ];
  const slaRules = [
    {
      id: "sla-1",
      name: "Pedido Recebido \u2192 Integra\xE7\xE3o ERP",
      fromStage: "ORDER_RECEIVED",
      toStage: "ERP_INTEGRATED",
      slaMinutes: 10,
      severity: "WARNING",
      active: true,
      createdAt: dAgo(720)
    },
    {
      id: "sla-2",
      name: "Integra\xE7\xE3o ERP \u2192 Separa\xE7\xE3o Estoque",
      fromStage: "ERP_INTEGRATED",
      toStage: "SEPARATION",
      slaMinutes: 120,
      // 2 horas
      severity: "WARNING",
      active: true,
      createdAt: dAgo(720)
    },
    {
      id: "sla-3",
      name: "Separa\xE7\xE3o \u2192 Faturamento / NF-e",
      fromStage: "SEPARATION",
      toStage: "INVOICING",
      slaMinutes: 240,
      // 4 horas
      severity: "CRITICAL",
      active: true,
      createdAt: dAgo(720)
    },
    {
      id: "sla-4",
      name: "Faturamento \u2192 Expedi\xE7\xE3o / Etiquetagem",
      fromStage: "NFE_ISSUED",
      toStage: "EXPEDITION",
      slaMinutes: 480,
      // 8 horas
      severity: "CRITICAL",
      active: true,
      createdAt: dAgo(720)
    },
    {
      id: "sla-5",
      name: "Expedi\xE7\xE3o \u2192 Coleta Transportadora",
      fromStage: "EXPEDITION",
      toStage: "CARRIER_DISPATCH",
      slaMinutes: 360,
      // 6 horas
      severity: "WARNING",
      active: true,
      createdAt: dAgo(720)
    }
  ];
  const orders = [
    {
      id: "ord-1582",
      orderNumber: "#1582",
      externalId: "TRAY-ORD-99412",
      source: "TRAY",
      customerId: "cust-1",
      deliveryAddressId: "addr-1-delivery",
      status: "BILLED",
      totalAmount: 18450,
      subtotal: 17800,
      shippingCost: 650,
      discount: 0,
      paymentMethod: "BOLETO_BANCARIO_30D",
      paymentStatus: "PAID",
      invoiceNumber: "NF-004821",
      invoiceKey: "35260914285932000144550010000048211987654321",
      trackingToken: "trc_1582_a8f9c10e",
      createdAt: dAgo(9),
      updatedAt: dAgo(1),
      items: [
        {
          id: "item-1",
          orderId: "ord-1582",
          productId: "prod-101",
          sku: "FLIND-AVT-CIR-50",
          title: "Avental Cir\xFArgico Imperme\xE1vel TNT 50g/m\xB2 Esterilizado - Cx 50 un",
          quantity: 40,
          unitPrice: 320,
          totalPrice: 12800,
          lotNumber: "LOTE-FLIND-2026-A19",
          weightKg: 12
        },
        {
          id: "item-2",
          orderId: "ord-1582",
          productId: "prod-102",
          sku: "FLIND-MSC-TRIP-TIR",
          title: "M\xE1scara Cir\xFArgica Tripla com Tiras BFE\u226595% - Fardo c/ 40 cxs (2.000 un)",
          quantity: 20,
          unitPrice: 250,
          totalPrice: 5e3,
          lotNumber: "LOTE-FLIND-2026-B02",
          weightKg: 4.5
        }
      ],
      timeline: [
        {
          id: "tl-1",
          orderId: "ord-1582",
          stage: "ORDER_RECEIVED",
          stageLabel: "Pedido Recebido",
          status: "COMPLETED",
          startedAt: dAgo(9),
          completedAt: dAgo(8.9),
          durationMinutes: 6,
          expectedSlaMinutes: 10,
          responsible: "Tray Webhook Sync",
          sourceSystem: "TRAY",
          notes: "Pedido importado automaticamente via Webhook Tray E-commerce."
        },
        {
          id: "tl-2",
          orderId: "ord-1582",
          stage: "ERP_INTEGRATED",
          stageLabel: "Integrado ao ERP",
          status: "COMPLETED",
          startedAt: dAgo(8.9),
          completedAt: dAgo(8.7),
          durationMinutes: 12,
          expectedSlaMinutes: 30,
          responsible: "SINK ERP Provider",
          sourceSystem: "SINK_ERP",
          notes: "Pedido cadastrado no SINK ERP sob protocolo ERP-98124."
        },
        {
          id: "tl-3",
          orderId: "ord-1582",
          stage: "SEPARATION",
          stageLabel: "Separa\xE7\xE3o",
          status: "COMPLETED",
          startedAt: dAgo(8.7),
          completedAt: dAgo(7),
          durationMinutes: 102,
          expectedSlaMinutes: 120,
          responsible: "Operador Almoxarifado Jos\xE9 M.",
          sourceSystem: "FABRICA_INTEGRADA",
          notes: "Lotes LOTE-FLIND-2026-A19 e LOTE-FLIND-2026-B02 conferidos com leitor \xF3ptico e laudo ANVISA validado."
        },
        {
          id: "tl-4",
          orderId: "ord-1582",
          stage: "INVOICING",
          stageLabel: "Faturamento",
          status: "DELAYED",
          startedAt: dAgo(7),
          completedAt: dAgo(1.5),
          durationMinutes: 330,
          // 5.5 horas vs SLA 4 horas (240m) -> ATRASADO 90m
          expectedSlaMinutes: 240,
          responsible: "Faturamento / SINK ERP",
          sourceSystem: "SINK_ERP",
          notes: "Atraso na valida\xE7\xE3o fiscal de al\xEDquota interestadual pelo SINK ERP. SLA excedido em 1h30."
        },
        {
          id: "tl-5",
          orderId: "ord-1582",
          stage: "NFE_ISSUED",
          stageLabel: "NF-e Emitida",
          status: "COMPLETED",
          startedAt: dAgo(1.5),
          completedAt: dAgo(1.4),
          durationMinutes: 6,
          expectedSlaMinutes: 15,
          responsible: "SEFAZ-SP / SINK ERP",
          sourceSystem: "SINK_ERP",
          notes: "NF-e 004821 autorizada pela SEFAZ."
        },
        {
          id: "tl-6",
          orderId: "ord-1582",
          stage: "EXPEDITION",
          stageLabel: "Expedi\xE7\xE3o & Etiquetagem",
          status: "IN_PROGRESS",
          startedAt: dAgo(1.4),
          expectedSlaMinutes: 480,
          responsible: "Equipe Expedi\xE7\xE3o Doca 2",
          sourceSystem: "FABRICA_INTEGRADA",
          notes: "Aguardando confer\xEAncia de volumes e impress\xE3o de etiqueta QR Code."
        },
        {
          id: "tl-7",
          orderId: "ord-1582",
          stage: "CARRIER_DISPATCH",
          stageLabel: "Coleta Transportadora",
          status: "PENDING",
          expectedSlaMinutes: 360,
          sourceSystem: "TRANSPORTADORA",
          notes: "Coleta programada com Braspress."
        },
        {
          id: "tl-8",
          orderId: "ord-1582",
          stage: "IN_TRANSIT",
          stageLabel: "Em Tr\xE2nsito",
          status: "PENDING",
          expectedSlaMinutes: 1440,
          sourceSystem: "TRANSPORTADORA"
        },
        {
          id: "tl-9",
          orderId: "ord-1582",
          stage: "DELIVERED",
          stageLabel: "Entregue ao Cliente",
          status: "PENDING",
          expectedSlaMinutes: 2880,
          sourceSystem: "TRANSPORTADORA"
        }
      ]
    },
    // Pedido 2 - Excedeu SLA e violou regra de entrega
    {
      id: "ord-1583",
      orderNumber: "#1583",
      externalId: "TRAY-ORD-99420",
      source: "TRAY",
      customerId: "cust-2",
      deliveryAddressId: "addr-2-delivery",
      status: "EXPEDITION",
      totalAmount: 32600,
      subtotal: 31900,
      shippingCost: 700,
      discount: 0,
      paymentMethod: "BOLETO_BANCARIO_15D",
      paymentStatus: "PAID",
      invoiceNumber: "NF-004822",
      invoiceKey: "35260908921344000219550010000048221876543210",
      trackingToken: "trc_1583_b7d2f4a1",
      createdAt: dAgo(18),
      updatedAt: dAgo(2),
      items: [
        {
          id: "item-3a",
          orderId: "ord-1583",
          productId: "prod-201",
          sku: "FLIND-LEN-TNT-70",
          title: "Len\xE7ol Descart\xE1vel em Rolo TNT 70cm x 50m (Macas Est\xE9tica/Depila\xE7\xE3o) - Fardo c/ 10 rolos",
          quantity: 20,
          unitPrice: 800,
          totalPrice: 16e3,
          lotNumber: "LOTE-FLIND-2026-EST01",
          weightKg: 130
          // 20 * 130 = 2600 kg
        },
        {
          id: "item-3b",
          orderId: "ord-1583",
          productId: "prod-202",
          sku: "FLIND-LUV-NIT-PINK",
          title: "Luva Nitr\xEDlica Pink / Rosa Sem P\xF3 Tam M (Especial Cl\xEDnicas de Est\xE9tica) - Fardo c/ 50 cxs (5.000 un)",
          quantity: 10,
          unitPrice: 1590,
          totalPrice: 15900,
          lotNumber: "LOTE-FLIND-2026-EST02",
          weightKg: 200
          // 10 * 200 = 2000 kg -> Total: 4600 kg (excede 4000 kg)
        }
      ],
      timeline: [
        {
          id: "tl-10",
          orderId: "ord-1583",
          stage: "ORDER_RECEIVED",
          stageLabel: "Pedido Recebido",
          status: "COMPLETED",
          startedAt: dAgo(18),
          completedAt: dAgo(17.8),
          durationMinutes: 12,
          expectedSlaMinutes: 10,
          responsible: "Tray Webhook Sync",
          sourceSystem: "TRAY"
        },
        {
          id: "tl-11",
          orderId: "ord-1583",
          stage: "ERP_INTEGRATED",
          stageLabel: "Integrado ao ERP",
          status: "COMPLETED",
          startedAt: dAgo(17.8),
          completedAt: dAgo(17.6),
          durationMinutes: 12,
          expectedSlaMinutes: 30,
          responsible: "SINK ERP Provider",
          sourceSystem: "SINK_ERP"
        },
        {
          id: "tl-12",
          orderId: "ord-1583",
          stage: "SEPARATION",
          stageLabel: "Separa\xE7\xE3o",
          status: "COMPLETED",
          startedAt: dAgo(17.6),
          completedAt: dAgo(15),
          durationMinutes: 156,
          expectedSlaMinutes: 120,
          responsible: "Operador Almoxarifado L\xFAcio F.",
          sourceSystem: "FABRICA_INTEGRADA"
        },
        {
          id: "tl-13",
          orderId: "ord-1583",
          stage: "INVOICING",
          stageLabel: "Faturamento",
          status: "COMPLETED",
          startedAt: dAgo(15),
          completedAt: dAgo(12),
          durationMinutes: 180,
          expectedSlaMinutes: 240,
          responsible: "SINK ERP",
          sourceSystem: "SINK_ERP"
        },
        {
          id: "tl-14",
          orderId: "ord-1583",
          stage: "NFE_ISSUED",
          stageLabel: "NF-e Emitida",
          status: "COMPLETED",
          startedAt: dAgo(12),
          completedAt: dAgo(11.8),
          durationMinutes: 12,
          expectedSlaMinutes: 15,
          responsible: "SEFAZ-SP / SINK ERP",
          sourceSystem: "SINK_ERP"
        },
        {
          id: "tl-15",
          orderId: "ord-1583",
          stage: "EXPEDITION",
          stageLabel: "Expedi\xE7\xE3o & Etiquetagem",
          status: "DELAYED",
          startedAt: dAgo(11.8),
          durationMinutes: 588,
          // 9.8 horas vs SLA 8h (480m) -> ATRASADO
          expectedSlaMinutes: 480,
          responsible: "Doca de Carga 1",
          sourceSystem: "FABRICA_INTEGRADA",
          notes: "TRAVA OPERACIONAL EST\xC9TICA: Carga consolidada de len\xE7\xF3is TNT para macas e luvas pink (4600 kg) excede o limite da Doca de Distribui\xE7\xE3o das Cl\xEDnicas (4000 kg). Local exige agendamento pr\xE9vio com 24h e ve\xEDculo VUC."
        },
        {
          id: "tl-16",
          orderId: "ord-1583",
          stage: "CARRIER_DISPATCH",
          stageLabel: "Coleta Transportadora",
          status: "PENDING",
          expectedSlaMinutes: 360,
          sourceSystem: "TRANSPORTADORA"
        },
        {
          id: "tl-17",
          orderId: "ord-1583",
          stage: "IN_TRANSIT",
          stageLabel: "Em Tr\xE2nsito",
          status: "PENDING",
          expectedSlaMinutes: 1440,
          sourceSystem: "TRANSPORTADORA"
        },
        {
          id: "tl-18",
          orderId: "ord-1583",
          stage: "DELIVERED",
          stageLabel: "Entregue ao Cliente",
          status: "PENDING",
          expectedSlaMinutes: 2880,
          sourceSystem: "TRANSPORTADORA"
        }
      ]
    },
    // Pedido 3 - Novo, recebido agora (Salões e Barbearias)
    {
      id: "ord-1584",
      orderNumber: "#1584",
      externalId: "TRAY-ORD-99435",
      source: "TRAY",
      customerId: "cust-3",
      deliveryAddressId: "addr-3-delivery",
      status: "NEW",
      totalAmount: 4320,
      subtotal: 4100,
      shippingCost: 220,
      discount: 0,
      paymentMethod: "PIX_AVISTA",
      paymentStatus: "PAID",
      createdAt: dAgo(0.1),
      updatedAt: dAgo(0.1),
      items: [
        {
          id: "item-4a",
          orderId: "ord-1584",
          productId: "prod-301",
          sku: "FLIND-CAP-CORTE-50",
          title: "Capa de Corte Descart\xE1vel Transparente 120x150cm - Fardo c/ 20 pcts (1.000 un)",
          quantity: 4,
          unitPrice: 480,
          totalPrice: 1920,
          lotNumber: "LOTE-FLIND-2026-SAL01",
          weightKg: 7
        },
        {
          id: "item-4b",
          orderId: "ord-1584",
          productId: "prod-302",
          sku: "FLIND-GOL-BARB-100",
          title: "Gola Higi\xEAnica Descart\xE1vel para Barbearia e Sal\xE3o (Neck Paper Rolo c/ 100 un) - Fardo c/ 50 rolos",
          quantity: 2,
          unitPrice: 450,
          totalPrice: 900,
          lotNumber: "LOTE-FLIND-2026-SAL02",
          weightKg: 10
        },
        {
          id: "item-4c",
          orderId: "ord-1584",
          productId: "prod-303",
          sku: "FLIND-TOU-SANF-BR",
          title: "Touca Sanfonada Descart\xE1vel TNT Branca 100% Polipropileno - Fardo c/ 20 pcts (2.000 un)",
          quantity: 2,
          unitPrice: 640,
          totalPrice: 1280,
          lotNumber: "LOTE-FLIND-2026-SAL03",
          weightKg: 12
        }
      ],
      timeline: [
        {
          id: "tl-19",
          orderId: "ord-1584",
          stage: "ORDER_RECEIVED",
          stageLabel: "Pedido Recebido",
          status: "COMPLETED",
          startedAt: dAgo(0.1),
          completedAt: dAgo(0.08),
          durationMinutes: 1,
          expectedSlaMinutes: 10,
          responsible: "Tray Webhook Sync",
          sourceSystem: "TRAY",
          notes: "Recebido via Tray E-commerce \xE0s 09:54."
        },
        {
          id: "tl-20",
          orderId: "ord-1584",
          stage: "ERP_INTEGRATED",
          stageLabel: "Integrado ao ERP",
          status: "IN_PROGRESS",
          startedAt: dAgo(0.08),
          expectedSlaMinutes: 10,
          responsible: "SINK ERP Queue Worker",
          sourceSystem: "SINK_ERP",
          notes: "Fila de sincroniza\xE7\xE3o com SINK ERP aguardando handshake."
        },
        {
          id: "tl-21",
          orderId: "ord-1584",
          stage: "SEPARATION",
          stageLabel: "Separa\xE7\xE3o",
          status: "PENDING",
          expectedSlaMinutes: 120,
          sourceSystem: "FABRICA_INTEGRADA"
        },
        {
          id: "tl-22",
          orderId: "ord-1584",
          stage: "INVOICING",
          stageLabel: "Faturamento",
          status: "PENDING",
          expectedSlaMinutes: 240,
          sourceSystem: "SINK_ERP"
        },
        {
          id: "tl-23",
          orderId: "ord-1584",
          stage: "NFE_ISSUED",
          stageLabel: "NF-e Emitida",
          status: "PENDING",
          expectedSlaMinutes: 15,
          sourceSystem: "SINK_ERP"
        },
        {
          id: "tl-24",
          orderId: "ord-1584",
          stage: "EXPEDITION",
          stageLabel: "Expedi\xE7\xE3o & Etiquetagem",
          status: "PENDING",
          expectedSlaMinutes: 480,
          sourceSystem: "FABRICA_INTEGRADA"
        },
        {
          id: "tl-25",
          orderId: "ord-1584",
          stage: "CARRIER_DISPATCH",
          stageLabel: "Coleta Transportadora",
          status: "PENDING",
          expectedSlaMinutes: 360,
          sourceSystem: "TRANSPORTADORA"
        },
        {
          id: "tl-26",
          orderId: "ord-1584",
          stage: "IN_TRANSIT",
          stageLabel: "Em Tr\xE2nsito",
          status: "PENDING",
          expectedSlaMinutes: 1440,
          sourceSystem: "TRANSPORTADORA"
        },
        {
          id: "tl-27",
          orderId: "ord-1584",
          stage: "DELIVERED",
          stageLabel: "Entregue ao Cliente",
          status: "PENDING",
          expectedSlaMinutes: 2880,
          sourceSystem: "TRANSPORTADORA"
        }
      ]
    }
  ];
  const shipments = [
    {
      id: "ship-1",
      trackingToken: "trc_1582_a8f9c10e",
      orderId: "ord-1582",
      orderNumber: "#1582",
      invoiceNumber: "NF-004821",
      invoiceKey: "35260914285932000144550010000048211987654321",
      carrierName: "Braspress Log\xEDstica Hospitalar & Farma",
      trackingCode: "BP-SP-9923847",
      volumesCount: 3,
      totalWeightKg: 570,
      selectedVehicleType: "TRUCK",
      status: "WAITING_DISPATCH",
      notes: "Palete 1 (Aventais Cir\xFArgicos Imperme\xE1veis) + 2 caixas (M\xE1scaras Triplas). Lotes com laudo de esterilidade aprovado e Registro ANVISA validado.",
      createdAt: dAgo(1.2)
    }
  ];
  const alerts = [
    {
      id: "alt-1",
      severity: "CRITICAL",
      type: "SLA_BREACH",
      entityType: "ORDER",
      entityId: "ord-1582",
      message: "Faturamento do Pedido #1582 ultrapassou SLA configurado de 4h (dura\xE7\xE3o real: 5h30m). Atraso de 1h30m na homologa\xE7\xE3o do lote ANVISA e laudo de esterilidade cir\xFArgica.",
      ruleResponsible: "Separa\xE7\xE3o \u2192 Faturamento / NF-e (SLA 240min)",
      responsible: "Garantia da Qualidade & Fiscal / SINK ERP",
      status: "PENDING",
      createdAt: dAgo(2)
    },
    {
      id: "alt-2",
      severity: "CRITICAL",
      type: "DELIVERY_RULE_VIOLATION",
      entityType: "ORDER",
      entityId: "ord-1583",
      message: "Regra de Entrega Violada: CD das Cl\xEDnicas de Est\xE9tica (Campinas) exige agendamento obrigat\xF3rio com 24h e carga consolidada de len\xE7\xF3is TNT e luvas pink (4600kg) excede o limite da Doca (4000kg).",
      ruleResponsible: "Regra de Entrega: Bella Pelle Est\xE9tica (addr-2-delivery)",
      responsible: "Log\xEDstica de Distribui\xE7\xE3o / Expedi\xE7\xE3o",
      status: "PENDING",
      createdAt: dAgo(3)
    },
    {
      id: "alt-3",
      severity: "WARNING",
      type: "OVERDUE_RECEIVABLE",
      entityType: "RECEIVABLE",
      entityId: "rec-102",
      message: "T\xEDtulo NF-004750 (R$ 8.920,00) de Rede de Sal\xF5es Jacques Janine & Beauty Studio Ltda est\xE1 vencido h\xE1 5 dias. Automa\xE7\xE3o de cobran\xE7a D+3 executada via WhatsApp.",
      ruleResponsible: "Regra D+3: Alerta Financeiro e Cobran\xE7a WhatsApp",
      responsible: "Financeiro / Contas a Receber",
      status: "PENDING",
      createdAt: dAgo(12)
    }
  ];
  const receivables = [
    {
      id: "rec-101",
      customerId: "cust-1",
      customerName: "Rede Hospitalar S\xE3o Camilo S/A",
      orderId: "ord-1582",
      orderNumber: "#1582",
      documentNumber: "DUP-4821-01",
      invoiceNumber: "NF-004821",
      amount: 18450,
      dueDate: dFuture(18),
      // A vencer em 18 dias
      status: "OPEN",
      paymentMethod: "BOLETO",
      externalId: "SINK-DUP-10492",
      source: "SINK_ERP",
      barcode: "34191.79001 01043.510047 91020.150008 5 99420001845000",
      pixCode: "00020126580014br.gov.bcb.pix0136financeiro@flind.com.br520400005303986540818450.005802BR5920FLIND HOSPITALAR6009SAO PAULO62070503***6304ABCD",
      createdAt: dAgo(2),
      updatedAt: dAgo(2)
    },
    {
      id: "rec-102",
      customerId: "cust-3",
      customerName: "Rede de Sal\xF5es Jacques Janine & Beauty Studio Ltda",
      documentNumber: "DUP-4750-01",
      invoiceNumber: "NF-004750",
      amount: 8920,
      dueDate: dPast(5),
      // 5 dias atrasado (faixa 4-7 dias)
      status: "OVERDUE",
      paymentMethod: "BOLETO",
      externalId: "SINK-DUP-10310",
      source: "SINK_ERP",
      barcode: "34191.79001 01043.510047 91020.150008 5 99420000892000",
      createdAt: dPast(35),
      updatedAt: dAgo(12)
    },
    {
      id: "rec-103",
      customerId: "cust-2",
      customerName: "Rede Bella Pelle Est\xE9tica Avan\xE7ada & Spas Ltda",
      documentNumber: "DUP-4789-01",
      invoiceNumber: "NF-004789",
      amount: 14200,
      dueDate: dPast(2),
      // 2 dias atrasado (faixa 1-3 dias)
      status: "OVERDUE",
      paymentMethod: "BOLETO",
      externalId: "SINK-DUP-10388",
      source: "SINK_ERP",
      createdAt: dPast(32),
      updatedAt: dAgo(24)
    },
    {
      id: "rec-104",
      customerId: "cust-3",
      customerName: "Rede de Sal\xF5es Jacques Janine & Beauty Studio Ltda",
      documentNumber: "DUP-4620-01",
      invoiceNumber: "NF-004620",
      amount: 5400,
      dueDate: dPast(15),
      // 15 dias atrasado (faixa 8-30 dias)
      status: "OVERDUE",
      paymentMethod: "BOLETO",
      externalId: "SINK-DUP-10115",
      source: "SINK_ERP",
      createdAt: dPast(45),
      updatedAt: dPast(15)
    },
    {
      id: "rec-105",
      customerId: "cust-3",
      customerName: "Rede de Sal\xF5es Jacques Janine & Beauty Studio Ltda",
      documentNumber: "DUP-4500-01",
      invoiceNumber: "NF-004500",
      amount: 6780,
      dueDate: dPast(42),
      // 42 dias atrasado (faixa +30 dias)
      status: "OVERDUE",
      paymentMethod: "BOLETO",
      externalId: "SINK-DUP-9912",
      source: "SINK_ERP",
      createdAt: dPast(72),
      updatedAt: dPast(42)
    },
    {
      id: "rec-106",
      customerId: "cust-1",
      customerName: "Rede Hospitalar S\xE3o Camilo S/A",
      documentNumber: "DUP-4800-01",
      invoiceNumber: "NF-004800",
      amount: 9800,
      dueDate: now.toISOString().split("T")[0],
      // Vence HOJE
      status: "DUE_TODAY",
      paymentMethod: "BOLETO",
      externalId: "SINK-DUP-10420",
      source: "SINK_ERP",
      createdAt: dPast(30),
      updatedAt: dAgo(1)
    },
    {
      id: "rec-107",
      customerId: "cust-2",
      customerName: "Rede Bella Pelle Est\xE9tica Avan\xE7ada & Spas Ltda",
      documentNumber: "DUP-4700-01",
      invoiceNumber: "NF-004700",
      amount: 22150,
      dueDate: dPast(10),
      paymentDate: dPast(9),
      status: "PAID",
      paymentMethod: "PIX",
      externalId: "SINK-DUP-10200",
      source: "SINK_ERP",
      createdAt: dPast(40),
      updatedAt: dPast(9)
    },
    {
      id: "rec-108",
      customerId: "cust-1",
      customerName: "Rede Hospitalar S\xE3o Camilo S/A",
      documentNumber: "DUP-4850-01",
      invoiceNumber: "NF-004850",
      amount: 11200,
      dueDate: dFuture(10),
      // A vencer em 10 dias
      status: "OPEN",
      paymentMethod: "BOLETO",
      externalId: "SINK-DUP-10512",
      source: "SINK_ERP",
      createdAt: dAgo(1),
      updatedAt: dAgo(1)
    },
    {
      id: "rec-109",
      customerId: "cust-2",
      customerName: "Rede Bella Pelle Est\xE9tica Avan\xE7ada & Spas Ltda",
      documentNumber: "DUP-4860-01",
      invoiceNumber: "NF-004860",
      amount: 7450,
      dueDate: dFuture(3),
      // Vencimento próximo D-3
      status: "DUE_SOON",
      paymentMethod: "BOLETO",
      externalId: "SINK-DUP-10520",
      source: "SINK_ERP",
      createdAt: dAgo(1),
      updatedAt: dAgo(1)
    }
  ];
  const collectionRules = [
    {
      id: "crule-d5",
      name: "D-5: Alerta de Vencimento Pr\xF3ximo (5 Dias Antes)",
      daysOffset: -5,
      channel: "WHATSAPP",
      templateName: "alerta_vencimento_5dias",
      priority: "MEDIUM",
      targetAudience: "ALL",
      allowedTimeStart: "08:00",
      allowedTimeEnd: "18:00",
      active: true,
      createdAt: dAgo(720)
    },
    {
      id: "crule-d0",
      name: "D0: Lembrete de Vencimento no Dia",
      daysOffset: 0,
      channel: "WHATSAPP",
      templateName: "lembrete_vence_hoje",
      priority: "HIGH",
      targetAudience: "ALL",
      allowedTimeStart: "08:30",
      allowedTimeEnd: "17:30",
      active: true,
      createdAt: dAgo(720)
    },
    {
      id: "crule-daily-overdue",
      name: "P\xF3s-Vencimento: Cobran\xE7a Di\xE1ria Autom\xE1tica WhatsApp",
      daysOffset: 1,
      channel: "WHATSAPP",
      templateName: "cobranca_diaria_atraso",
      priority: "HIGH",
      targetAudience: "ALL",
      allowedTimeStart: "09:00",
      allowedTimeEnd: "18:00",
      active: true,
      createdAt: dAgo(720)
    }
  ];
  const whatsappLogs = [
    {
      id: "wlog-1",
      recipientPhone: "+55 31 99876-5432",
      customerName: "Rede de Sal\xF5es Jacques Janine & Beauty Studio Ltda",
      receivableId: "rec-102",
      templateName: "cobranca_renegociacao_d3",
      parameters: {
        cliente: "Rede de Sal\xF5es Jacques Janine & Beauty Studio Ltda",
        numero: "NF-004750 (DUP-4750-01)",
        valor: "R$ 8.920,00",
        data: dPast(5),
        dados_pagamento: "Chave PIX: financeiro@flind.com.br ou Linha Digit\xE1vel do Boleto."
      },
      status: "READ",
      providerMessageId: "wamid.HBgLNTUzMTk5ODc2NTQzMhUCMRIA",
      sentAt: dAgo(48),
      deliveredAt: dAgo(47.9),
      readAt: dAgo(40),
      direction: "OUTBOUND",
      createdAt: dAgo(48)
    }
  ];
  const auditLogs = [
    {
      id: "aud-1",
      action: "ORDER_IMPORTED_FROM_TRAY",
      origin: "TrayWebhookHandler",
      entity: "Order",
      entityId: "ord-1582",
      newValue: { orderNumber: "#1582", totalAmount: 18450, externalId: "TRAY-ORD-99412" },
      userOrService: "System Integration Worker",
      correlationId: "corr-tray-webhook-99412",
      createdAt: dAgo(9)
    },
    {
      id: "aud-2",
      action: "ORDER_SYNCED_TO_SINK_ERP",
      origin: "SinkERPAdapter",
      entity: "Order",
      entityId: "ord-1582",
      newValue: { sinkErpProtocol: "ERP-98124", status: "INTEGRATED_ERP" },
      userOrService: "ERP Integration Provider",
      correlationId: "corr-tray-webhook-99412",
      createdAt: dAgo(8.7)
    },
    {
      id: "aud-3",
      action: "SLA_BREACH_DETECTED",
      origin: "RuleEngine",
      entity: "Order",
      entityId: "ord-1582",
      newValue: { stage: "INVOICING", realDuration: 330, expectedSla: 240, delay: 90 },
      userOrService: "SlaWorkerDaemon",
      correlationId: "corr-sla-daemon-check-001",
      createdAt: dAgo(2)
    },
    {
      id: "aud-4",
      action: "DELIVERY_RULE_VALIDATION_FAILED",
      origin: "RuleEngine",
      entity: "Order",
      entityId: "ord-1583",
      newValue: {
        violations: [
          "Exige agendamento pr\xE9vio com 24h de anteced\xEAncia para recep\xE7\xE3o no CD de est\xE9tica",
          "Peso total do pedido (4600 kg) excede capacidade da doca do centro de est\xE9tica (4000 kg)"
        ]
      },
      userOrService: "ExpeditionValidator",
      correlationId: "corr-expedition-val-1583",
      createdAt: dAgo(3)
    }
  ];
  const integrationLogs = [
    {
      id: "intlog-1",
      integration: "TRAY",
      eventType: "order.created",
      externalId: "99412",
      idempotencyKey: "tray:order:99412:created",
      status: "SUCCESS",
      attempts: 1,
      payloadOriginal: { id: 99412, status: "approved", total: 18450 },
      createdAt: dAgo(9),
      updatedAt: dAgo(9)
    },
    {
      id: "intlog-2",
      integration: "SINK_ERP",
      eventType: "customer.sync",
      externalId: "cust-1",
      idempotencyKey: "sink:customer:cust-1:sync",
      status: "SUCCESS",
      attempts: 1,
      createdAt: dAgo(8.9),
      updatedAt: dAgo(8.9)
    }
  ];
  const suppliers = [
    {
      id: "supp-1",
      name: "Fibras & N\xE3o-Tecidos Brasil S/A",
      tradeName: "TNT Brasil Mat\xE9rias-Primas",
      taxId: "28.192.401/0001-85",
      stateRegistration: "114.892.401.110",
      contactName: "Marcos Vinicius (Diretor Comercial)",
      phone: "+55 19 3871-9900",
      whatsapp: "+55 19 99812-4400",
      email: "comercial@tntbrasil.com.br",
      category: "Tecidos N\xE3o-Tecidos (TNT SMS, Spunbond e Meltblown Hospitalar)",
      leadTimeDays: 3,
      city: "Americana",
      state: "SP",
      paymentTerms: "Boleto 28 DDL",
      status: "HOMOLOGATED",
      suppliedProductsCount: 4,
      createdAt: dAgo(1440)
    },
    {
      id: "supp-2",
      name: "Klabin Embalagens e Papel\xE3o Ondulado S/A",
      tradeName: "Klabin Embalagens Hospitalares",
      taxId: "89.231.114/0004-92",
      stateRegistration: "342.112.909.118",
      contactName: "Juliana Fontes (Key Account)",
      phone: "+55 11 4589-2200",
      whatsapp: "+55 11 98450-3321",
      email: "juliana.fontes@klabin.com.br",
      category: "Caixas de Papel\xE3o Ondulado Refor\xE7adas e Divis\xF3rias Flind",
      leadTimeDays: 4,
      city: "Jundia\xED",
      state: "SP",
      paymentTerms: "Boleto 30/60 DDL",
      status: "HOMOLOGATED",
      suppliedProductsCount: 6,
      createdAt: dAgo(1200)
    },
    {
      id: "supp-3",
      name: "SuperAbsorb Pol\xEDmeros & Qu\xEDmica Industrial Ltda",
      tradeName: "SuperAbsorb Brasil",
      taxId: "19.822.409/0001-33",
      stateRegistration: "419.008.231.119",
      contactName: "Dr. Roberto Campos (Qu\xEDmico Respons\xE1vel)",
      phone: "+55 11 4547-1188",
      whatsapp: "+55 11 97233-8899",
      email: "roberto.campos@superabsorb.com.br",
      category: "Pol\xEDmero Superabsorvente (SAP) e Fibras para Protetores Toalet",
      leadTimeDays: 5,
      city: "Mau\xE1",
      state: "SP",
      paymentTerms: "Boleto 30 DDL",
      status: "HOMOLOGATED",
      suppliedProductsCount: 2,
      createdAt: dAgo(960)
    },
    {
      id: "supp-4",
      name: "ElastoTech Componentes El\xE1sticos e Clips Ltda",
      tradeName: "ElastoTech Brasil",
      taxId: "45.109.843/0001-12",
      stateRegistration: "280.991.042.115",
      contactName: "Fernanda Nogueira (Vendas T\xE9cnicas)",
      phone: "+55 11 2468-5500",
      whatsapp: "+55 11 98111-7755",
      email: "vendas@elastotech.com.br",
      category: "El\xE1sticos Duplos Hipoalerg\xEAnicos e Clips Nasais Galvanizados",
      leadTimeDays: 2,
      city: "Guarulhos",
      state: "SP",
      paymentTerms: "Boleto 21 DDL",
      status: "HOMOLOGATED",
      suppliedProductsCount: 3,
      createdAt: dAgo(800)
    }
  ];
  const products = [
    {
      id: "prod-101",
      sku: "FLIND-AVT-CIR-50",
      name: "Avental Cir\xFArgico Imperme\xE1vel TNT 50g/m\xB2 Esterilizado",
      category: "Hospitalar & Cir\xFArgico",
      packagingUnit: "Caixa (CX)",
      unitsPerPackage: 50,
      unitWeightKg: 0.24,
      weightPerPackageKg: 12,
      manufactureDate: "2026-08-10",
      expiryDate: "2029-08-10",
      shelfLifeMonths: 36,
      lotNumber: "LOTE-FLIND-2026-A19",
      currentStockPackages: 140,
      currentStockUnits: 7e3,
      minStockPackages: 60,
      minStockUnits: 3e3,
      reorderQuantityPackages: 80,
      supplierId: "supp-1",
      supplierName: "Fibras & N\xE3o-Tecidos Brasil S/A",
      supplierPhone: "+55 19 99812-4400",
      costPrice: 195,
      salePrice: 320,
      location: "Galp\xE3o 1 \u2022 Rua A-04, N\xEDvel 2 (\xC1rea Limpa)",
      status: "NORMAL",
      autoReorderEnabled: true,
      lastRestockAt: dAgo(360),
      createdAt: dAgo(1200),
      updatedAt: dAgo(24)
    },
    {
      id: "prod-102",
      sku: "FLIND-MSC-TRIP-TIR",
      name: "M\xE1scara Cir\xFArgica Tripla com Tiras BFE\u226595%",
      category: "Hospitalar & Cir\xFArgico",
      packagingUnit: "Fardo (FD)",
      unitsPerPackage: 2e3,
      unitWeightKg: 35e-4,
      weightPerPackageKg: 7.5,
      manufactureDate: "2026-09-01",
      expiryDate: "2029-09-01",
      shelfLifeMonths: 36,
      lotNumber: "LOTE-FLIND-2026-B02",
      currentStockPackages: 22,
      currentStockUnits: 44e3,
      minStockPackages: 25,
      minStockUnits: 5e4,
      reorderQuantityPackages: 30,
      supplierId: "supp-1",
      supplierName: "Fibras & N\xE3o-Tecidos Brasil S/A",
      supplierPhone: "+55 19 99812-4400",
      costPrice: 140,
      salePrice: 250,
      location: "Galp\xE3o 1 \u2022 Rua B-02, N\xEDvel 1",
      status: "LOW",
      autoReorderEnabled: true,
      lastRestockAt: dAgo(500),
      createdAt: dAgo(1200),
      updatedAt: dAgo(12)
    },
    {
      id: "prod-103",
      sku: "FLIND-LNC-MAC-ELAST",
      name: "Len\xE7ol Descart\xE1vel com El\xE1stico TNT 30g/m\xB2 para Macas (2,20m x 0,90m)",
      category: "Est\xE9tica & Spas",
      packagingUnit: "Pacote (PCT)",
      unitsPerPackage: 10,
      unitWeightKg: 0.095,
      weightPerPackageKg: 0.98,
      manufactureDate: "2026-07-15",
      expiryDate: "2029-07-15",
      shelfLifeMonths: 36,
      lotNumber: "LOTE-FLIND-2026-C44",
      currentStockPackages: 8,
      currentStockUnits: 80,
      minStockPackages: 40,
      minStockUnits: 400,
      reorderQuantityPackages: 60,
      supplierId: "supp-1",
      supplierName: "Fibras & N\xE3o-Tecidos Brasil S/A",
      supplierPhone: "+55 19 99812-4400",
      costPrice: 42,
      salePrice: 79.9,
      location: "Galp\xE3o 2 \u2022 Rua C-01, N\xEDvel 3",
      status: "CRITICAL",
      autoReorderEnabled: true,
      lastRestockAt: dAgo(720),
      createdAt: dAgo(1100),
      updatedAt: dAgo(2)
    },
    {
      id: "prod-104",
      sku: "FLIND-PROT-TOALET-GEL",
      name: "Protetor Toalet Descart\xE1vel Imperme\xE1vel c/ Gel Superabsorvente",
      category: "Hospitalar & Cir\xFArgico",
      packagingUnit: "Caixa (CX)",
      unitsPerPackage: 100,
      unitWeightKg: 0.048,
      weightPerPackageKg: 5.1,
      manufactureDate: "2026-08-25",
      expiryDate: "2028-08-25",
      shelfLifeMonths: 24,
      lotNumber: "LOTE-FLIND-2026-T11",
      currentStockPackages: 12,
      currentStockUnits: 1200,
      minStockPackages: 35,
      minStockUnits: 3500,
      reorderQuantityPackages: 50,
      supplierId: "supp-3",
      supplierName: "SuperAbsorb Pol\xEDmeros & Qu\xEDmica Industrial Ltda",
      supplierPhone: "+55 11 97233-8899",
      costPrice: 65,
      salePrice: 128,
      location: "Galp\xE3o 1 \u2022 Rua D-05, N\xEDvel 1",
      status: "CRITICAL",
      autoReorderEnabled: true,
      lastRestockAt: dAgo(600),
      createdAt: dAgo(900),
      updatedAt: dAgo(4)
    },
    {
      id: "prod-105",
      sku: "FLIND-CAP-BARB-AJUST",
      name: "Capa Descart\xE1vel de Corte com Bot\xE3o Ajust\xE1vel (Barbearias e Sal\xF5es)",
      category: "Sal\xF5es & Barbearias",
      packagingUnit: "Caixa (CX)",
      unitsPerPackage: 100,
      unitWeightKg: 0.038,
      weightPerPackageKg: 4.1,
      manufactureDate: "2026-08-01",
      expiryDate: "2031-08-01",
      shelfLifeMonths: 60,
      lotNumber: "LOTE-FLIND-2026-S08",
      currentStockPackages: 75,
      currentStockUnits: 7500,
      minStockPackages: 25,
      minStockUnits: 2500,
      reorderQuantityPackages: 50,
      supplierId: "supp-1",
      supplierName: "Fibras & N\xE3o-Tecidos Brasil S/A",
      supplierPhone: "+55 19 99812-4400",
      costPrice: 48,
      salePrice: 94,
      location: "Galp\xE3o 2 \u2022 Rua B-03, N\xEDvel 2",
      status: "NORMAL",
      autoReorderEnabled: true,
      lastRestockAt: dAgo(400),
      createdAt: dAgo(800),
      updatedAt: dAgo(48)
    },
    {
      id: "prod-106",
      sku: "FLIND-TCA-SANF-100",
      name: "Touca Sanfonada Duplo El\xE1stico Hospitalar Branca",
      category: "Hospitalar & Cir\xFArgico",
      packagingUnit: "Pacote (PCT)",
      unitsPerPackage: 100,
      unitWeightKg: 32e-4,
      weightPerPackageKg: 0.35,
      manufactureDate: "2026-09-05",
      expiryDate: "2029-09-05",
      shelfLifeMonths: 36,
      lotNumber: "LOTE-FLIND-2026-T22",
      currentStockPackages: 210,
      currentStockUnits: 21e3,
      minStockPackages: 70,
      minStockUnits: 7e3,
      reorderQuantityPackages: 100,
      supplierId: "supp-4",
      supplierName: "ElastoTech Componentes El\xE1sticos e Clips Ltda",
      supplierPhone: "+55 11 98111-7755",
      costPrice: 9.8,
      salePrice: 19.9,
      location: "Galp\xE3o 1 \u2022 Rua A-01, N\xEDvel 1",
      status: "NORMAL",
      autoReorderEnabled: true,
      lastRestockAt: dAgo(200),
      createdAt: dAgo(1e3),
      updatedAt: dAgo(10)
    }
  ];
  const purchaseOrders = [
    {
      id: "po-flind-101",
      orderNumber: "PO-FLIND-2026-042",
      supplierId: "supp-1",
      supplierName: "Fibras & N\xE3o-Tecidos Brasil S/A",
      supplierWhatsapp: "+55 19 99812-4400",
      productId: "prod-103",
      productSku: "FLIND-LNC-MAC-ELAST",
      productName: "Len\xE7ol Descart\xE1vel com El\xE1stico TNT 30g/m\xB2 para Macas (2,20m x 0,90m)",
      quantityPackages: 60,
      quantityUnits: 600,
      packagingUnit: "Pacote (PCT)",
      estimatedCost: 2520,
      triggerReason: "AUTO_LOW_STOCK",
      status: "SENT_WHATSAPP",
      whatsappMessageId: "web.WA5519998124400-auto-po42",
      notes: "Disparo autom\xE1tico acionado: Estoque atingiu 8 pacotes (m\xEDnimo de seguran\xE7a: 40 pct).",
      expectedDeliveryDate: dFuture(3),
      createdAt: dAgo(2),
      updatedAt: dAgo(2)
    },
    {
      id: "po-flind-102",
      orderNumber: "PO-FLIND-2026-043",
      supplierId: "supp-3",
      supplierName: "SuperAbsorb Pol\xEDmeros & Qu\xEDmica Industrial Ltda",
      supplierWhatsapp: "+55 11 97233-8899",
      productId: "prod-104",
      productSku: "FLIND-PROT-TOALET-GEL",
      productName: "Protetor Toalet Descart\xE1vel Imperme\xE1vel c/ Gel Superabsorvente",
      quantityPackages: 50,
      quantityUnits: 5e3,
      packagingUnit: "Caixa (CX)",
      estimatedCost: 3250,
      triggerReason: "AUTO_LOW_STOCK",
      status: "SENT_WHATSAPP",
      whatsappMessageId: "web.WA5511972338899-auto-po43",
      notes: "Disparo autom\xE1tico acionado: Estoque atingiu 12 caixas (m\xEDnimo de seguran\xE7a: 35 cx).",
      expectedDeliveryDate: dFuture(4),
      createdAt: dAgo(4),
      updatedAt: dAgo(4)
    }
  ];
  const autoSettings = {
    autoWhatsAppExpedition: true,
    autoWhatsAppCollection: true,
    autoWhatsAppLowStock: true
  };
  return {
    version: 1,
    customers,
    addresses,
    deliveryRules,
    orders,
    slaRules,
    alerts,
    receivables,
    collectionRules,
    whatsappLogs,
    shipments,
    auditLogs,
    integrationLogs,
    products,
    suppliers,
    purchaseOrders,
    cancelledPurchaseOrders: [],
    autoSettings
  };
}
var DatabaseManager = class {
  constructor() {
    this.saveTimeout = null;
    this.cancelledCooldowns = /* @__PURE__ */ new Map();
    this.data = this.loadDatabase();
  }
  loadDatabase() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const bundledFile = path.resolve(process.cwd(), "data", "fabrica_integrada_db.json");
      let fileContent = "";
      if (fs.existsSync(DB_FILE)) {
        fileContent = fs.readFileSync(DB_FILE, "utf-8");
      } else if (fs.existsSync(bundledFile)) {
        fileContent = fs.readFileSync(bundledFile, "utf-8");
        try {
          fs.writeFileSync(DB_FILE, fileContent, "utf-8");
        } catch {
        }
      }
      if (fileContent) {
        const parsed = JSON.parse(fileContent);
        if (parsed && parsed.version) {
          const seed2 = getInitialSeed();
          if (!parsed.products || parsed.products.length === 0) parsed.products = seed2.products;
          if (!parsed.suppliers || parsed.suppliers.length === 0) parsed.suppliers = seed2.suppliers;
          if (!parsed.purchaseOrders) parsed.purchaseOrders = seed2.purchaseOrders;
          if (!parsed.cancelledPurchaseOrders) parsed.cancelledPurchaseOrders = [];
          if (!parsed.autoSettings) parsed.autoSettings = seed2.autoSettings;
          if (Array.isArray(parsed.purchaseOrders)) {
            const alreadyCancelled = parsed.purchaseOrders.filter((po) => po.status === "CANCELLED");
            if (alreadyCancelled.length > 0) {
              parsed.cancelledPurchaseOrders = [
                ...parsed.cancelledPurchaseOrders,
                ...alreadyCancelled
              ];
              parsed.purchaseOrders = parsed.purchaseOrders.filter((po) => po.status !== "CANCELLED");
            }
          }
          const catalogSpecsMap = {
            "FLIND-AVT-CIR-50": {
              barcode: "7898956000101",
              material: "TNT SMS 100% Polipropileno Tripla Camada (Spunbond-Meltblown-Spunbond)",
              technicalSpecs: "Tecido n\xE3o-tecido cir\xFArgico hidrorrepelente, at\xF3xico, hipoalerg\xEAnico, barreira bacteriana BFE \u2265 99%, solda ultrass\xF4nica e fechamento por tiras ajust\xE1veis.",
              dimensions: "Comprimento 1,40m x Largura 1,60m (Tamanho G/GG)",
              grammage: "50 g/m\xB2",
              anvisaRegistration: "Registro ANVISA 80123450001",
              packagingDimensions: "60 x 40 x 35 cm",
              stackingMax: 6,
              storageConditions: "Armazenar em local seco, arejado, protegido contra umidade e luz solar direta entre 15\xB0C e 30\xB0C.",
              flindCatalogUrl: "https://www.flind.com.br/produtos/avental-cirurgico-50g"
            },
            "FLIND-MSC-TRIP-TIR": {
              barcode: "7898956000102",
              material: "TNT Tripla Camada com Filtro Meltblown BFE \u2265 95% e Tiras de Amarra\xE7\xE3o 40cm",
              technicalSpecs: "M\xE1scara cir\xFArgica odontol\xF3gica e hospitalar de tripla camada com clipe nasal male\xE1vel revestido. Atende norma ABNT NBR 14853. Efici\xEAncia de filtragem bacteriana superior a 95%.",
              dimensions: "17,5cm x 9,5cm (Adulto padr\xE3o hospitalar)",
              grammage: "Tr\xEAs camadas: 20 + 20 + 25 g/m\xB2",
              anvisaRegistration: "Registro ANVISA 80123450002",
              packagingDimensions: "50 x 38 x 42 cm",
              stackingMax: 8,
              storageConditions: "Manter na embalagem original em ambiente est\xE9ril/limpo, umidade relativa < 80%.",
              flindCatalogUrl: "https://www.flind.com.br/produtos/mascara-cirurgica-tripla-tiras"
            },
            "FLIND-LNC-MAC-ELAST": {
              barcode: "7898956000103",
              material: "TNT 100% Polipropileno Spunbond com El\xE1stico Embutido em Todo o Per\xEDmetro",
              technicalSpecs: "Len\xE7ol descart\xE1vel ajust\xE1vel para macas cir\xFArgicas, est\xE9ticas e ginecol\xF3gicas. El\xE1stico refor\xE7ado nas 4 extremidades, toque macio, alta respirabilidade e barreira contra contamina\xE7\xE3o cruzada.",
              dimensions: "2,20m de comprimento x 0,90m de largura x 0,20m de aba el\xE1stica",
              grammage: "30 g/m\xB2",
              anvisaRegistration: "Notifica\xE7\xE3o ANVISA / RDC 356",
              packagingDimensions: "45 x 30 x 25 cm",
              stackingMax: 10,
              storageConditions: "Proteger contra umidade e agentes perfurocortantes.",
              flindCatalogUrl: "https://www.flind.com.br/produtos/lencol-descartavel-elastico-maca"
            },
            "FLIND-PROT-TOALET-GEL": {
              barcode: "7898956000104",
              material: "Celulose Virgem + Camada Pol\xEDmero Superabsorvente (SAP) + Filme Polietileno Imperme\xE1vel",
              technicalSpecs: "Toalete e protetor descart\xE1vel Flind para leitos hospitalares, exames e procedimentos. Gel superabsorvente que ret\xE9m l\xEDquidos e odores instantaneamente sem vazamento para a base.",
              dimensions: "40cm x 60cm (\xC1rea \xFAtil absorvente)",
              grammage: "Camada qu\xE1drupla absorvente com barreira imperme\xE1vel 25\xB5",
              anvisaRegistration: "Registro ANVISA 80123450004",
              packagingDimensions: "55 x 45 x 30 cm",
              stackingMax: 6,
              storageConditions: "Armazenar estritamente longe de umidade e fontes de calor excessivo.",
              flindCatalogUrl: "https://www.flind.com.br/produtos/toalete-descartavel-gel-superabsorvente"
            },
            "FLIND-CAP-BARB-AJUST": {
              barcode: "7898956000105",
              material: "TNT Spunbond Hidro-repelente com Fechamento Frontal por Bot\xF5es de Press\xE3o",
              technicalSpecs: "Capa de corte profissional para sal\xF5es e barbearias. Leve, ventilada, antiaderente a fios de cabelo e resistente a respingos de tinturas e \xE1gua.",
              dimensions: "1,50m x 1,20m com gola anat\xF4mica ajust\xE1vel",
              grammage: "40 g/m\xB2",
              anvisaRegistration: "Isento RDC Anvisa (Uso Est\xE9tico/Beleza)",
              packagingDimensions: "40 x 30 x 20 cm",
              stackingMax: 12,
              storageConditions: "Local arejado e limpo.",
              flindCatalogUrl: "https://www.flind.com.br/produtos/capa-corte-descartavel-barbearia"
            },
            "FLIND-TCA-SANF-100": {
              barcode: "7898956000106",
              material: "TNT 100% Polipropileno com Duplo El\xE1stico Termosselado",
              technicalSpecs: "Touca sanfonada descart\xE1vel de alta elasticidade. Proporciona conten\xE7\xE3o completa de fios capilares em centros cir\xFArgicos, salas limpas, ind\xFAstrias aliment\xEDcias e cl\xEDnicas.",
              dimensions: "Di\xE2metro expandido: 50cm (Tamanho \xDAnico Anat\xF4mico)",
              grammage: "20 g/m\xB2",
              anvisaRegistration: "Registro ANVISA 80123450006",
              packagingDimensions: "35 x 25 x 20 cm",
              stackingMax: 15,
              storageConditions: "Conservar na embalagem pl\xE1stica at\xE9 o momento do uso.",
              flindCatalogUrl: "https://www.flind.com.br/produtos/touca-sanfonada-duplo-elastico"
            },
            "FLIND-BOB-TNT-40": {
              barcode: "7898956000107",
              material: "Polipropileno 100% Grau Cir\xFArgico SMS em Bobina Industrial",
              technicalSpecs: "Mat\xE9ria-prima principal para convers\xE3o em aventais, campos operat\xF3rios e len\xE7\xF3is cir\xFArgicos. Homologada conforme normas ABNT NBR 16064.",
              dimensions: "Largura 1,60m x Comprimento 1.000m lineares",
              grammage: "40 g/m\xB2",
              anvisaRegistration: "Mat\xE9ria-Prima Certificada NBR 16064",
              packagingDimensions: "Bobina \xD8 0,60m x 1,60m",
              stackingMax: 3,
              storageConditions: "Estocagem vertical ou ber\xE7o palletizado.",
              flindCatalogUrl: "https://www.flind.com.br/insumos/bobina-tnt-sms-40g"
            },
            "FLIND-CX-KLABIN-60": {
              barcode: "7898956000108",
              material: "Papel\xE3o Ondulado Kraft Onda C (Coluna de compress\xE3o \u2265 5,2 kN/m)",
              technicalSpecs: "Embalagem secund\xE1ria padr\xE3o para transporte e expedi\xE7\xE3o de caixas cir\xFArgicas e descart\xE1veis Flind. Alta resist\xEAncia ao empilhamento e umidade.",
              dimensions: "60cm (C) x 40cm (L) x 40cm (A)",
              grammage: "480 g/m\xB2 estrutural",
              anvisaRegistration: "Embalagem Secund\xE1ria Conforme RDC 16",
              packagingDimensions: "Fardo com 25 unidades amarradas: 100 x 80 x 20 cm",
              stackingMax: 5,
              storageConditions: "Armaz\xE9m sobre pallets secos.",
              flindCatalogUrl: "https://www.flind.com.br/insumos/caixa-papelao-klabin-60x40x40"
            }
          };
          if (Array.isArray(parsed.products)) {
            parsed.products.forEach((p) => {
              const extra = catalogSpecsMap[p.sku];
              if (extra) {
                if (!p.barcode) p.barcode = extra.barcode;
                if (!p.material) p.material = extra.material;
                if (!p.technicalSpecs) p.technicalSpecs = extra.technicalSpecs;
                if (!p.dimensions) p.dimensions = extra.dimensions;
                if (!p.grammage) p.grammage = extra.grammage;
                if (!p.anvisaRegistration) p.anvisaRegistration = extra.anvisaRegistration;
                if (!p.packagingDimensions) p.packagingDimensions = extra.packagingDimensions;
                if (!p.stackingMax) p.stackingMax = extra.stackingMax;
                if (!p.storageConditions) p.storageConditions = extra.storageConditions;
                if (!p.flindCatalogUrl) p.flindCatalogUrl = extra.flindCatalogUrl;
              }
            });
            const existingSkus = new Set(parsed.products.map((p) => p.sku));
            seed2.products.forEach((sp) => {
              if (!existingSkus.has(sp.sku)) {
                parsed.products.push(sp);
              }
            });
          }
          if (Array.isArray(parsed.customers)) {
            parsed.customers.forEach((c) => {
              if (!c.segment) {
                const n = (c.name || "").toLowerCase();
                if (n.includes("hospital") || n.includes("alian\xE7a") || n.includes("sa\xFAde") || n.includes("m\xE9dic") || n.includes("santa")) {
                  c.segment = "Hospitalar & Cir\xFArgico";
                } else if (n.includes("est\xE9tica") || n.includes("pele") || n.includes("laser") || n.includes("progresso")) {
                  c.segment = "Est\xE9tica & Spas";
                } else if (n.includes("sal\xE3o") || n.includes("barbearia") || n.includes("ferramentas") || n.includes("beauty")) {
                  c.segment = "Sal\xF5es & Barbearias";
                } else {
                  c.segment = "Hospitalar & Cir\xFArgico";
                }
              }
              const isExplicitDirect = c.flindOrigin === "DIRETO_B2B" || c.flindOrigin === "BALCAO" || c.flindOrigin === "SINK_ERP" || c.id === "cust-1" || c.id === "cust-2" || c.id === "cust-3";
              if (isExplicitDirect) {
                if (!c.flindOrigin) c.flindOrigin = "DIRETO_B2B";
                c.flindWebId = void 0;
                c.flindPortalSync = void 0;
                c.flindWebProfileUrl = void 0;
              } else if (c.flindOrigin === "FLIND_ECOMMERCE_WEB" || c.flindOrigin === "TRAY" || c.id === "cust-tray-994" || c.id === "cust-mue6piye") {
                c.flindOrigin = c.flindOrigin || "FLIND_ECOMMERCE_WEB";
                if (!c.flindWebProfileUrl) {
                  c.flindWebProfileUrl = "https://www.flind.com.br/central-do-cliente";
                }
                if (!c.flindWebId) {
                  c.flindWebId = `FW-${Math.floor(1e4 + Math.random() * 9e4)}`;
                }
                if (!c.flindPortalSync) {
                  c.flindPortalSync = {
                    isRegisteredOnFlindWeb: true,
                    lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
                    accountEmail: c.email || "compras@flind.com.br",
                    totalFlindWebOrders: Array.isArray(parsed.orders) ? parsed.orders.filter((o) => o.customerId === c.id).length : 2,
                    flindTier: c.segment?.includes("Hospitalar") ? "OURO_HOSPITALAR" : "PRATA_CLINICAS",
                    customerProfileUrl: "https://www.flind.com.br/central-do-cliente",
                    catalogInterest: ["Descart\xE1veis Hospitalares", "Toalet Descart\xE1vel", "Len\xE7\xF3is TNT para Macas"]
                  };
                }
              }
            });
          }
          if (Array.isArray(parsed.receivables)) {
            const hasOverdue = parsed.receivables.some((r) => r.status === "OVERDUE");
            if (!hasOverdue) {
              seed2.receivables.forEach((sr) => {
                const target = parsed.receivables.find((pr) => pr.id === sr.id);
                if (target && (sr.status === "OVERDUE" || sr.status === "DUE_TODAY")) {
                  target.status = sr.status;
                  target.dueDate = sr.dueDate;
                  target.autoCleared = false;
                  delete target.paymentDate;
                }
              });
            }
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error("[DB] Erro ao carregar banco do disco, inicializando com sementes padr\xE3o:", err);
    }
    const seed = getInitialSeed();
    this.saveImmediate(seed);
    return seed;
  }
  saveImmediate(dataToSave) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (err) {
      console.warn("[DB] Operando com persist\xEAncia em mem\xF3ria (ambiente serverless/somente-leitura):", err);
    }
  }
  forceSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveImmediate(this.data);
    let sizeBytes = 0;
    try {
      if (fs.existsSync(DB_FILE)) {
        sizeBytes = fs.statSync(DB_FILE).size;
      }
    } catch {
    }
    return {
      success: true,
      path: DB_FILE,
      sizeBytes,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  getRawData() {
    return JSON.parse(JSON.stringify(this.data));
  }
  importRawData(incoming) {
    if (!incoming || typeof incoming !== "object") {
      throw new Error("Formato de dados inv\xE1lido para importa\xE7\xE3o.");
    }
    if (Array.isArray(incoming.customers)) this.data.customers = incoming.customers;
    if (Array.isArray(incoming.addresses)) this.data.addresses = incoming.addresses;
    if (Array.isArray(incoming.orders)) this.data.orders = incoming.orders;
    if (Array.isArray(incoming.deliveryRules)) this.data.deliveryRules = incoming.deliveryRules;
    if (Array.isArray(incoming.slaRules)) this.data.slaRules = incoming.slaRules;
    if (Array.isArray(incoming.alerts)) this.data.alerts = incoming.alerts;
    if (Array.isArray(incoming.receivables)) this.data.receivables = incoming.receivables;
    if (Array.isArray(incoming.collectionRules)) this.data.collectionRules = incoming.collectionRules;
    if (Array.isArray(incoming.whatsappLogs)) this.data.whatsappLogs = incoming.whatsappLogs;
    if (Array.isArray(incoming.shipments)) this.data.shipments = incoming.shipments;
    if (Array.isArray(incoming.auditLogs)) this.data.auditLogs = incoming.auditLogs;
    if (Array.isArray(incoming.products)) this.data.products = incoming.products;
    if (Array.isArray(incoming.suppliers)) this.data.suppliers = incoming.suppliers;
    if (Array.isArray(incoming.purchaseOrders)) this.data.purchaseOrders = incoming.purchaseOrders;
    if (incoming.autoSettings) this.data.autoSettings = { ...this.data.autoSettings, ...incoming.autoSettings };
    this.forceSave();
    return {
      success: true,
      message: "Banco de dados restaurado e gravado com sucesso no disco!",
      counts: {
        customers: this.data.customers.length,
        orders: this.data.orders.length,
        products: this.data.products.length,
        suppliers: this.data.suppliers.length,
        purchaseOrders: this.data.purchaseOrders.length,
        receivables: this.data.receivables.length,
        whatsappLogs: this.data.whatsappLogs.length
      }
    };
  }
  persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(this.data);
      this.saveTimeout = null;
    }, 200);
  }
  // --- GETTERS E MUTATORS ---
  getCustomers() {
    return this.data.customers.map((c) => ({
      ...c,
      addresses: this.data.addresses.filter((a) => a.customerId === c.id)
    }));
  }
  getCustomerById(id) {
    const cust = this.data.customers.find((c) => c.id === id);
    if (!cust) return void 0;
    return {
      ...cust,
      addresses: this.data.addresses.filter((a) => a.customerId === cust.id)
    };
  }
  upsertCustomer(customer) {
    const idx = this.data.customers.findIndex((c) => c.id === customer.id);
    if (idx >= 0) {
      this.data.customers[idx] = { ...customer, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      this.data.customers.push(customer);
    }
    this.persist();
    return customer;
  }
  deleteCustomer(id) {
    const prevLen = this.data.customers.length;
    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    this.data.addresses = this.data.addresses.filter((a) => a.customerId !== id);
    this.data.deliveryRules = this.data.deliveryRules.filter((r) => r.customerId !== id);
    this.persist();
    return this.data.customers.length < prevLen;
  }
  getAddresses(customerId) {
    if (customerId) {
      return this.data.addresses.filter((a) => a.customerId === customerId);
    }
    return this.data.addresses;
  }
  getAddressById(id) {
    return this.data.addresses.find((a) => a.id === id);
  }
  upsertAddress(address) {
    const idx = this.data.addresses.findIndex((a) => a.id === address.id);
    if (idx >= 0) {
      this.data.addresses[idx] = address;
    } else {
      this.data.addresses.push(address);
    }
    this.persist();
    return address;
  }
  deleteAddress(id) {
    const prevLen = this.data.addresses.length;
    this.data.addresses = this.data.addresses.filter((a) => a.id !== id);
    this.data.deliveryRules = this.data.deliveryRules.filter((r) => r.addressId !== id);
    this.persist();
    return this.data.addresses.length < prevLen;
  }
  getDeliveryRules(addressId) {
    if (addressId) {
      return this.data.deliveryRules.filter((r) => r.addressId === addressId);
    }
    return this.data.deliveryRules;
  }
  getDeliveryRuleByAddressId(addressId) {
    return this.data.deliveryRules.find((r) => r.addressId === addressId && r.active);
  }
  upsertDeliveryRule(rule) {
    const idx = this.data.deliveryRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.data.deliveryRules[idx] = rule;
    } else {
      this.data.deliveryRules.push(rule);
    }
    this.persist();
    return rule;
  }
  getOrders() {
    return this.data.orders.map((o) => ({
      ...o,
      customer: this.getCustomerById(o.customerId),
      deliveryAddress: this.getAddressById(o.deliveryAddressId)
    }));
  }
  getOrderById(id) {
    const order = this.data.orders.find((o) => o.id === id || o.orderNumber === id);
    if (!order) return void 0;
    return {
      ...order,
      customer: this.getCustomerById(order.customerId),
      deliveryAddress: this.getAddressById(order.deliveryAddressId)
    };
  }
  upsertOrder(order) {
    const idx = this.data.orders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      this.data.orders[idx] = { ...order, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      this.data.orders.push(order);
    }
    this.persist();
    return order;
  }
  getSlaRules() {
    return this.data.slaRules;
  }
  upsertSlaRule(rule) {
    const idx = this.data.slaRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.data.slaRules[idx] = rule;
    } else {
      this.data.slaRules.push(rule);
    }
    this.persist();
    return rule;
  }
  getAlerts() {
    return this.data.alerts;
  }
  addAlert(alert) {
    const existing = this.data.alerts.find(
      (a) => a.status === "PENDING" && a.type === alert.type && a.entityType === alert.entityType && a.entityId === alert.entityId
    );
    if (existing) {
      return existing;
    }
    this.data.alerts.unshift(alert);
    this.persist();
    return alert;
  }
  updateAlertStatus(alertId, status, responsible) {
    const alert = this.data.alerts.find((a) => a.id === alertId);
    if (!alert) return void 0;
    alert.status = status;
    if (responsible) alert.responsible = responsible;
    if (status === "ACKNOWLEDGED") alert.acknowledgedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (status === "RESOLVED") alert.resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.persist();
    return alert;
  }
  getReceivables() {
    return this.data.receivables;
  }
  getReceivableById(id) {
    return this.data.receivables.find((r) => r.id === id);
  }
  upsertReceivable(receivable) {
    const idx = this.data.receivables.findIndex((r) => r.id === receivable.id);
    if (idx >= 0) {
      this.data.receivables[idx] = { ...receivable, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    } else {
      this.data.receivables.push(receivable);
    }
    this.persist();
    return receivable;
  }
  /**
   * RECONHECIMENTO DE PAGAMENTO & BAIXA AUTOMÁTICA
   * Realiza a baixa imediata do título a receber, sincroniza status do pedido vinculado para PAGO,
   * resolve alertas operacionais/financeiros, cancela réguas futuras de cobrança
   * e gera trilha de auditoria e protocolo rastreável.
   */
  autoClearReceivablePayment(params) {
    let rec;
    if (params.receivableId) {
      rec = this.data.receivables.find((r) => r.id === params.receivableId);
    }
    if (!rec && params.documentNumber) {
      const docClean = params.documentNumber.trim().toLowerCase();
      rec = this.data.receivables.find((r) => r.documentNumber.trim().toLowerCase() === docClean);
    }
    if (!rec && params.orderId) {
      rec = this.data.receivables.find((r) => r.orderId === params.orderId);
    }
    if (!rec && params.pixCode) {
      rec = this.data.receivables.find((r) => r.pixCode === params.pixCode);
    }
    if (!rec) {
      throw new Error(`T\xEDtulo a receber n\xE3o encontrado para os par\xE2metros informados.`);
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const paymentDateStr = params.paymentDate || nowIso.split("T")[0];
    const channel = params.channel || "PIX_AUTOMATICO";
    const transactionCode = params.transactionCode || `AUT-${channel.slice(0, 3)}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const wasAlreadyPaid = rec.status === "PAID";
    rec.status = "PAID";
    rec.paymentDate = paymentDateStr;
    rec.autoCleared = true;
    rec.autoClearedAt = nowIso;
    rec.clearingChannel = channel;
    rec.transactionCode = transactionCode;
    if (params.payerName) rec.payerName = params.payerName;
    if (params.payerTaxId) rec.payerTaxId = params.payerTaxId;
    if (params.notes) rec.receiptNotes = params.notes;
    rec.updatedAt = nowIso;
    let orderUpdated = false;
    let orderNumber;
    let linkedOrderId;
    if (rec.orderId) {
      const order = this.data.orders.find((o) => o.id === rec.orderId);
      if (order) {
        orderUpdated = true;
        orderNumber = order.orderNumber;
        linkedOrderId = order.id;
        order.paymentStatus = "PAID";
        const channelLabel = channel === "PIX_AUTOMATICO" ? "Pix Instant\xE2neo" : channel === "RETORNO_BANCARIO_CNAB" ? "Retorno Banc\xE1rio CNAB" : channel === "SINK_ERP" ? "SINK ERP" : channel === "TRAY" ? "Tray E-commerce" : channel;
        const timelineNote = `[BAIXA AUTOM\xC1TICA] Pagamento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rec.amount)} reconhecido via ${channelLabel}. Autentica\xE7\xE3o: ${transactionCode}. Pedido liberado para faturamento/expedi\xE7\xE3o.`;
        const tlEvent = order.timeline.find((t) => t.stage === "INVOICING" || t.stage === "ORDER_RECEIVED");
        if (tlEvent) {
          tlEvent.notes = tlEvent.notes ? `${tlEvent.notes} | ${timelineNote}` : timelineNote;
        }
        order.updatedAt = nowIso;
      }
    }
    let resolvedAlertsCount = 0;
    for (const alert of this.data.alerts) {
      const isLinkedToReceivable = alert.entityId === rec.id;
      const isLinkedToOrder = Boolean(rec.orderId && alert.entityId === rec.orderId);
      if ((isLinkedToReceivable || isLinkedToOrder) && alert.status === "PENDING") {
        if (alert.type === "OVERDUE_RECEIVABLE" || alert.message.toLowerCase().includes("pagamento") || alert.message.toLowerCase().includes("t\xEDtulo") || alert.message.toLowerCase().includes("fatura") || alert.message.toLowerCase().includes("atrasado")) {
          alert.status = "RESOLVED";
          alert.resolvedAt = nowIso;
          alert.responsible = `Baixa Autom\xE1tica (${channel})`;
          resolvedAlertsCount++;
        }
      }
    }
    let cancelledCollectionCount = 0;
    for (const log of this.data.whatsappLogs) {
      if ((log.receivableId === rec.id || rec.orderId && log.orderId === rec.orderId) && log.status === "QUEUED") {
        log.status = "FAILED";
        log.errorMessage = "Cobran\xE7a cancelada: pagamento reconhecido e baixado automaticamente.";
        cancelledCollectionCount++;
      }
    }
    this.addAuditLog({
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: "PAYMENT_RECOGNIZED_AUTO_CLEARED",
      origin: `api.autoClearReceivablePayment (${channel})`,
      entity: "Receivable",
      entityId: rec.id,
      newValue: {
        documentNumber: rec.documentNumber,
        amount: rec.amount,
        status: "PAID",
        paymentDate: paymentDateStr,
        channel,
        transactionCode,
        orderId: rec.orderId,
        orderNumber,
        resolvedAlerts: resolvedAlertsCount
      },
      userOrService: params.operatorOrService || `Automa\xE7\xE3o Baixa ${channel}`,
      correlationId: `corr-autoclear-${transactionCode}`,
      createdAt: nowIso
    });
    this.persist();
    return {
      success: true,
      message: wasAlreadyPaid ? `T\xEDtulo ${rec.documentNumber} j\xE1 estava baixado. Dados e pedido revalidados com sucesso.` : `Pagamento reconhecido e baixado automaticamente com sucesso para o t\xEDtulo ${rec.documentNumber}! Pedido ${orderNumber || "vinculado"} liberado.`,
      receivable: rec,
      orderUpdated,
      orderNumber,
      orderId: linkedOrderId,
      resolvedAlertsCount,
      cancelledCollectionCount,
      clearingDetails: {
        transactionCode,
        clearingChannel: channel,
        clearedAt: nowIso,
        amount: rec.amount,
        payerName: params.payerName || rec.customerName
      }
    };
  }
  /**
   * Identificação e Baixa Autônoma de Pagamentos pelo Sistema (Sem necessidade de apertar botão)
   * Monitora confirmações de Pix PSP, Compensações Bancárias e liquidações do ERP/Tray
   */
  systemAutoDetectPayments() {
    let detected = 0;
    const clearedList = [];
    const openReceivables = this.data.receivables.filter(
      (r) => (r.status === "OPEN" || r.status === "DUE_SOON") && r.source === "TRAY" && r.orderId
    );
    for (const rec of openReceivables) {
      const order = this.data.orders.find((o) => o.id === rec.orderId);
      if (order && order.paymentStatus === "PAID") {
        const fakeE2eId = `AUTOPAY-${Date.now().toString(36).toUpperCase()}`;
        const res = this.autoClearReceivablePayment({
          receivableId: rec.id,
          channel: "PIX_AUTOMATICO",
          transactionCode: fakeE2eId,
          payerName: rec.customerName,
          notes: `Baixa Autom\xE1tica efetuada pelo sistema via Webhook Pix Instant\xE2neo.`,
          operatorOrService: "Sistema Aut\xF4nomo de Identifica\xE7\xE3o de Pagamentos"
        });
        detected++;
        clearedList.push(res);
      }
    }
    return { detected, clearedList };
  }
  getCollectionRules() {
    const rules = this.data.collectionRules || [];
    if (rules.some((r) => r.id === "crule-2" || r.daysOffset === -3 || r.daysOffset === 7 || r.daysOffset === 3)) {
      this.data.collectionRules = [
        {
          id: "crule-d5",
          name: "D-5: Alerta de Vencimento Pr\xF3ximo (5 Dias Antes)",
          daysOffset: -5,
          channel: "WHATSAPP",
          templateName: "alerta_vencimento_5dias",
          priority: "MEDIUM",
          targetAudience: "ALL",
          allowedTimeStart: "08:00",
          allowedTimeEnd: "18:00",
          active: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "crule-d0",
          name: "D0: Lembrete de Vencimento no Dia",
          daysOffset: 0,
          channel: "WHATSAPP",
          templateName: "lembrete_vence_hoje",
          priority: "HIGH",
          targetAudience: "ALL",
          allowedTimeStart: "08:30",
          allowedTimeEnd: "17:30",
          active: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "crule-daily-overdue",
          name: "P\xF3s-Vencimento: Cobran\xE7a Di\xE1ria Autom\xE1tica WhatsApp",
          daysOffset: 1,
          channel: "WHATSAPP",
          templateName: "cobranca_diaria_atraso",
          priority: "HIGH",
          targetAudience: "ALL",
          allowedTimeStart: "09:00",
          allowedTimeEnd: "18:00",
          active: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      ];
      this.persist();
    }
    return this.data.collectionRules;
  }
  upsertCollectionRule(rule) {
    const idx = this.data.collectionRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      this.data.collectionRules[idx] = rule;
    } else {
      this.data.collectionRules.push(rule);
    }
    this.persist();
    return rule;
  }
  getWhatsAppLogs() {
    return this.data.whatsappLogs;
  }
  addWhatsAppLog(log) {
    this.data.whatsappLogs.unshift(log);
    this.persist();
    return log;
  }
  updateWhatsAppLogStatus(providerMessageId, status, timestamp) {
    const log = this.data.whatsappLogs.find((l) => l.providerMessageId === providerMessageId);
    if (log) {
      log.status = status;
      const t = timestamp || (/* @__PURE__ */ new Date()).toISOString();
      if (status === "DELIVERED") log.deliveredAt = t;
      if (status === "READ") log.readAt = t;
      this.persist();
    }
  }
  getShipments() {
    return this.data.shipments;
  }
  getShipmentByToken(token) {
    return this.data.shipments.find((s) => s.trackingToken === token);
  }
  getShipmentByOrderId(orderId) {
    return this.data.shipments.find((s) => s.orderId === orderId);
  }
  upsertShipment(shipment) {
    const idx = this.data.shipments.findIndex((s) => s.id === shipment.id);
    if (idx >= 0) {
      this.data.shipments[idx] = shipment;
    } else {
      this.data.shipments.push(shipment);
    }
    this.persist();
    return shipment;
  }
  addAuditLog(log) {
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.length = 500;
    }
    this.persist();
    return log;
  }
  getAuditLogs(correlationId, entityId) {
    let logs = this.data.auditLogs;
    if (correlationId) {
      logs = logs.filter((l) => l.correlationId.toLowerCase().includes(correlationId.toLowerCase()));
    }
    if (entityId) {
      logs = logs.filter((l) => l.entityId === entityId);
    }
    return logs;
  }
  getIntegrationLogs() {
    return this.data.integrationLogs;
  }
  addIntegrationLog(log) {
    const existingIdx = this.data.integrationLogs.findIndex(
      (l) => l.idempotencyKey === log.idempotencyKey
    );
    if (existingIdx >= 0) {
      this.data.integrationLogs[existingIdx] = {
        ...log,
        attempts: this.data.integrationLogs[existingIdx].attempts + 1,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.persist();
      return this.data.integrationLogs[existingIdx];
    }
    this.data.integrationLogs.unshift(log);
    this.persist();
    return log;
  }
  findIdempotencyLog(idempotencyKey) {
    return this.data.integrationLogs.find((l) => l.idempotencyKey === idempotencyKey);
  }
  // ====================================================
  // MÉTODOS DE ESTOQUE, PRODUTOS, EMBALAGENS E VOLUMES
  // ====================================================
  getProducts() {
    return this.data.products;
  }
  getProductById(id) {
    return this.data.products.find((p) => p.id === id);
  }
  getProductBySku(sku) {
    return this.data.products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
  }
  upsertProduct(product) {
    const units = (product.currentStockPackages || 0) * (product.unitsPerPackage || 1);
    const minUnits = (product.minStockPackages || 0) * (product.unitsPerPackage || 1);
    const updated = {
      ...product,
      currentStockUnits: units,
      minStockUnits: minUnits,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updated.currentStockPackages <= 0) {
      updated.status = "OUT_OF_STOCK";
    } else if (updated.currentStockPackages <= Math.max(1, Math.floor(updated.minStockPackages * 0.4))) {
      updated.status = "CRITICAL";
    } else if (updated.currentStockPackages <= updated.minStockPackages) {
      updated.status = "LOW";
    } else {
      updated.status = "NORMAL";
    }
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = updated;
    } else {
      this.data.products.unshift(updated);
    }
    this.persist();
    if (updated.status === "LOW" || updated.status === "CRITICAL" || updated.status === "OUT_OF_STOCK") {
      this.triggerAutoReorderForProduct(updated);
    }
    return updated;
  }
  deleteProduct(id) {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }
  /**
   * Movimenta o estoque (positivo = entrada/reposição, negativo = saída/separação)
   */
  updateStock(productId, deltaPackages, reason) {
    const product = this.getProductById(productId);
    if (!product) {
      throw new Error(`Produto ${productId} n\xE3o encontrado.`);
    }
    const previousPackages = product.currentStockPackages;
    const newPackages = Math.max(0, previousPackages + deltaPackages);
    product.currentStockPackages = newPackages;
    product.currentStockUnits = newPackages * product.unitsPerPackage;
    if (deltaPackages > 0) {
      product.lastRestockAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (product.currentStockPackages <= 0) {
      product.status = "OUT_OF_STOCK";
    } else if (product.currentStockPackages <= Math.max(1, Math.floor(product.minStockPackages * 0.4))) {
      product.status = "CRITICAL";
    } else if (product.currentStockPackages <= product.minStockPackages) {
      product.status = "LOW";
    } else {
      product.status = "NORMAL";
    }
    product.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.addAuditLog({
      id: `aud-stk-${Date.now()}`,
      action: deltaPackages >= 0 ? "STOCK_RESTOCK" : "STOCK_DISPATCH",
      origin: "DatabaseManager.updateStock",
      entity: "ProductInventory",
      entityId: product.id,
      previousValue: { packages: previousPackages, units: previousPackages * product.unitsPerPackage },
      newValue: { packages: newPackages, units: product.currentStockUnits, reason },
      userOrService: "Almoxarifado & Estoque Flind",
      correlationId: `corr-stock-${product.sku}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.persist();
    let autoOrder;
    if (product.currentStockPackages <= product.minStockPackages) {
      autoOrder = this.triggerAutoReorderForProduct(product);
    }
    return { product, autoOrderTriggered: autoOrder };
  }
  // ====================================================
  // MÉTODOS DE FORNECEDORES
  // ====================================================
  getSuppliers() {
    return this.data.suppliers.map((s) => ({
      ...s,
      suppliedProductsCount: this.data.products.filter((p) => p.supplierId === s.id).length
    }));
  }
  getSupplierById(id) {
    return this.data.suppliers.find((s) => s.id === id);
  }
  upsertSupplier(supplier) {
    const idx = this.data.suppliers.findIndex((s) => s.id === supplier.id);
    if (idx >= 0) {
      this.data.suppliers[idx] = supplier;
    } else {
      this.data.suppliers.unshift(supplier);
    }
    this.persist();
    return supplier;
  }
  // ====================================================
  // MÉTODOS DE ORDENS DE COMPRA / REPOSIÇÃO (PURCHASE ORDERS)
  // ====================================================
  getPurchaseOrders() {
    return this.data.purchaseOrders.filter((po) => po.status !== "CANCELLED");
  }
  getCancelledPurchaseOrders() {
    return this.data.cancelledPurchaseOrders || [];
  }
  getPurchaseOrderById(id) {
    return this.data.purchaseOrders.find((po) => po.id === id) || (this.data.cancelledPurchaseOrders || []).find((po) => po.id === id);
  }
  addPurchaseOrder(po) {
    this.data.purchaseOrders.unshift(po);
    this.persist();
    return po;
  }
  cancelPurchaseOrder(id, reason) {
    const index = this.data.purchaseOrders.findIndex((p) => p.id === id);
    if (index === -1) {
      const already = (this.data.cancelledPurchaseOrders || []).find((p) => p.id === id);
      return already;
    }
    const [po] = this.data.purchaseOrders.splice(index, 1);
    po.status = "CANCELLED";
    const cancelNote = reason ? `Cancelamento: ${reason}` : "Cancelado pelo gestor";
    po.notes = po.notes ? `${po.notes} \u2022 ${cancelNote}` : cancelNote;
    po.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (!this.data.cancelledPurchaseOrders) {
      this.data.cancelledPurchaseOrders = [];
    }
    this.data.cancelledPurchaseOrders.unshift(po);
    if (po.productId) {
      this.cancelledCooldowns.set(po.productId, Date.now() + 24 * 60 * 60 * 1e3);
    }
    this.addAuditLog({
      id: `aud-po-cancel-${Date.now()}`,
      action: "PURCHASE_ORDER_CANCELLED",
      origin: "DatabaseManager.cancelPurchaseOrder",
      entity: "PurchaseOrder",
      entityId: po.id,
      newValue: {
        orderNumber: po.orderNumber,
        supplierName: po.supplierName,
        productName: po.productName,
        status: "CANCELLED",
        reason: reason || "Cancelamento solicitado pelo gestor de compras."
      },
      userOrService: "Gestor de Compras e Suprimentos",
      correlationId: `corr-po-cancel-${Date.now()}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.persist();
    return po;
  }
  clearCancelledPurchaseOrders() {
    const count = (this.data.cancelledPurchaseOrders || []).length;
    this.data.cancelledPurchaseOrders = [];
    this.cancelledCooldowns.clear();
    this.addAuditLog({
      id: `aud-po-clear-cancel-${Date.now()}`,
      action: "CANCELLED_PURCHASE_ORDERS_CLEARED",
      origin: "DatabaseManager.clearCancelledPurchaseOrders",
      entity: "PurchaseOrder",
      entityId: "ALL_CANCELLED",
      newValue: {
        clearedCount: count,
        message: "Hist\xF3rico de ordens de compra canceladas limpo pelo usu\xE1rio."
      },
      userOrService: "Gestor de Compras e Suprimentos",
      correlationId: `corr-po-clear-${Date.now()}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.persist();
    return count;
  }
  updatePurchaseOrderStatus(id, status, reason) {
    if (status === "CANCELLED") {
      return this.cancelPurchaseOrder(id, reason);
    }
    const po = this.data.purchaseOrders.find((p) => p.id === id);
    if (po) {
      po.status = status;
      po.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (status === "DELIVERED") {
        const prod = this.getProductById(po.productId);
        if (prod) {
          prod.currentStockPackages += po.quantityPackages;
          prod.currentStockUnits = prod.currentStockPackages * prod.unitsPerPackage;
          prod.lastRestockAt = (/* @__PURE__ */ new Date()).toISOString();
          if (prod.currentStockPackages >= prod.minStockPackages) {
            prod.status = "NORMAL";
          } else if (prod.currentStockPackages > Math.max(1, Math.floor(prod.minStockPackages * 0.35))) {
            prod.status = "LOW";
          } else {
            prod.status = "CRITICAL";
          }
          this.addAuditLog({
            id: `aud-po-deliv-${Date.now()}`,
            action: "PURCHASE_ORDER_DELIVERED",
            origin: "DatabaseManager.updatePurchaseOrderStatus",
            entity: "InventoryProduct",
            entityId: prod.id,
            newValue: {
              orderNumber: po.orderNumber,
              productSku: prod.sku,
              productName: prod.name,
              receivedPackages: po.quantityPackages,
              newStockPackages: prod.currentStockPackages,
              minStockPackages: prod.minStockPackages,
              status: prod.status
            },
            userOrService: "Recep\xE7\xE3o e Almoxarifado Flind",
            correlationId: `corr-po-deliv-${Date.now()}`,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
      }
      this.persist();
      return po;
    }
    return void 0;
  }
  // ====================================================
  // CONFIGURAÇÕES DE DISPARO AUTOMÁTICO
  // ====================================================
  getAutoSettings() {
    return this.data.autoSettings || {
      autoWhatsAppExpedition: true,
      autoWhatsAppCollection: true,
      autoWhatsAppLowStock: true
    };
  }
  updateAutoSettings(settings) {
    this.data.autoSettings = {
      ...this.getAutoSettings(),
      ...settings
    };
    this.persist();
    return this.data.autoSettings;
  }
  // ====================================================
  // AUTOMAÇÃO DE ESTOQUE ACABANDO & DISPARO WHATSAPP FORNECEDOR
  // ====================================================
  triggerAutoReorderForProduct(product) {
    if (!product.autoReorderEnabled) return void 0;
    const cooldown = this.cancelledCooldowns.get(product.id);
    if (cooldown && Date.now() < cooldown) {
      return void 0;
    }
    const existingPo = this.data.purchaseOrders.find(
      (po2) => po2.productId === product.id && (po2.status === "PENDING" || po2.status === "SENT_WHATSAPP")
    );
    if (existingPo) {
      return existingPo;
    }
    const supplier = this.getSupplierById(product.supplierId);
    const supplierPhone = supplier?.whatsapp || supplier?.phone || "+55 11 99999-0000";
    const supplierName = supplier?.tradeName || supplier?.name || product.supplierName || "Fornecedor Homologado";
    const orderNum = `PO-FLIND-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(this.data.purchaseOrders.length + 1).padStart(3, "0")}`;
    const qtyPackages = product.reorderQuantityPackages || Math.max(10, product.minStockPackages * 2);
    const qtyUnits = qtyPackages * product.unitsPerPackage;
    const estCost = qtyPackages * product.costPrice;
    const leadDays = supplier?.leadTimeDays || 3;
    const deliveryDate = new Date(Date.now() + leadDays * 864e5).toISOString().split("T")[0];
    const po = {
      id: `po-${Date.now()}`,
      orderNumber: orderNum,
      supplierId: product.supplierId,
      supplierName,
      supplierWhatsapp: supplierPhone,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      quantityPackages: qtyPackages,
      quantityUnits: qtyUnits,
      packagingUnit: product.packagingUnit,
      estimatedCost: estCost,
      triggerReason: "AUTO_LOW_STOCK",
      status: "SENT_WHATSAPP",
      whatsappMessageId: `auto.WA${supplierPhone.replace(/\D/g, "")}-${Date.now().toString(36)}`,
      notes: `GATILHO AUTOM\xC1TICO: Estoque em ${product.currentStockPackages} ${product.packagingUnit} (limite m\xEDnimo de seguran\xE7a: ${product.minStockPackages}). Disparo autom\xE1tico emitido ao fornecedor via WhatsApp.`,
      expectedDeliveryDate: deliveryDate,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.purchaseOrders.unshift(po);
    this.addAlert({
      id: `alt-stk-${product.id}-${Date.now()}`,
      severity: "CRITICAL",
      type: "SYSTEM_ERROR",
      entityType: "INTEGRATION",
      entityId: product.id,
      message: `ESTOQUE ACABANDO: Produto "${product.name}" (${product.sku}) atingiu ${product.currentStockPackages} ${product.packagingUnit} (${product.currentStockUnits} un). N\xEDvel m\xEDnimo: ${product.minStockPackages}. Ordem de Reposi\xE7\xE3o ${orderNum} gerada e notificada ao fornecedor ${supplierName}.`,
      ruleResponsible: "Automa\xE7\xE3o de Reposi\xE7\xE3o de Estoque",
      responsible: "PCP & Compras Flind",
      status: "PENDING",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.addWhatsAppLog({
      id: `walog-po-${po.id}`,
      recipientPhone: supplierPhone,
      customerName: supplierName,
      templateName: "notificacao_reposicao_estoque_fornecedor",
      parameters: {
        fornecedor: supplierName,
        numero_po: orderNum,
        produto: product.name,
        sku: product.sku,
        unidade_volume: product.packagingUnit,
        quantidade_volume: `${qtyPackages} volumes (${qtyUnits} un)`,
        estoque_atual: `${product.currentStockPackages} volumes`,
        prazo_previsto: new Date(deliveryDate).toLocaleDateString("pt-BR")
      },
      status: "SENT",
      providerMessageId: po.whatsappMessageId,
      sentAt: (/* @__PURE__ */ new Date()).toISOString(),
      direction: "OUTBOUND",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.addAuditLog({
      id: `aud-po-auto-${Date.now()}`,
      action: "AUTO_REORDER_TRIGGERED",
      origin: "DatabaseManager.triggerAutoReorderForProduct",
      entity: "PurchaseOrder",
      entityId: po.id,
      newValue: {
        orderNumber: po.orderNumber,
        productSku: po.productSku,
        qtyPackages,
        supplierName,
        whatsappSentTo: supplierPhone
      },
      userOrService: "Automa\xE7\xE3o Central Flind",
      correlationId: `corr-po-${po.id}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.persist();
    return po;
  }
  /**
   * Varredura geral de estoque para disparar ressuprimentos pendentes
   */
  scanAllLowStockAndTrigger() {
    const triggered = [];
    for (const product of this.data.products) {
      if (product.currentStockPackages <= product.minStockPackages && product.autoReorderEnabled) {
        const po = this.triggerAutoReorderForProduct(product);
        if (po) triggered.push(po);
      }
    }
    return triggered;
  }
  /**
   * Diagnóstico Automático e Pesquisa de Produtos Faltantes / Abaixo do Mínimo
   */
  getMissingProductsDiagnostic() {
    const products = this.getProducts();
    const openPos = this.getPurchaseOrders().filter((po) => po.status !== "DELIVERED" && po.status !== "CANCELLED");
    const openOrders = this.getOrders().filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
    const items = [];
    products.forEach((p) => {
      let committedUnits = 0;
      openOrders.forEach((ord) => {
        if (Array.isArray(ord.items)) {
          ord.items.forEach((item) => {
            if (item.productId === p.id || item.sku === p.sku) {
              committedUnits += item.quantity || 0;
            }
          });
        }
      });
      const committedPackages = Math.ceil(committedUnits / (p.unitsPerPackage || 1));
      const netAvailablePackages = p.currentStockPackages - committedPackages;
      const isMissing = p.currentStockPackages < p.minStockPackages || netAvailablePackages <= 0;
      if (isMissing) {
        const deficitPackages = Math.max(0, p.minStockPackages - p.currentStockPackages) + (netAvailablePackages < 0 ? Math.abs(netAvailablePackages) : 0);
        const deficitUnits = deficitPackages * (p.unitsPerPackage || 1);
        let severity = "LOW";
        if (p.currentStockPackages <= 0 || netAvailablePackages <= 0) {
          severity = "OUT_OF_STOCK";
        } else if (p.currentStockPackages <= Math.max(1, Math.floor(p.minStockPackages * 0.35))) {
          severity = "CRITICAL";
        }
        const relatedPos = openPos.filter((po) => po.productId === p.id || po.productSku === p.sku);
        const hasOpenPo = relatedPos.length > 0;
        const openPoNumbers = relatedPos.map((po) => po.orderNumber);
        const openPoTotalPackages = relatedPos.reduce((sum, po) => sum + po.quantityPackages, 0);
        const openPoList = relatedPos.map((po) => ({
          id: po.id,
          orderNumber: po.orderNumber,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          supplierWhatsapp: po.supplierWhatsapp,
          quantityPackages: po.quantityPackages,
          quantityUnits: po.quantityUnits,
          packagingUnit: po.packagingUnit,
          estimatedCost: po.estimatedCost,
          status: po.status,
          expectedDeliveryDate: po.expectedDeliveryDate,
          createdAt: po.createdAt
        }));
        const supplier = this.getSupplierById(p.supplierId);
        const supplierName = supplier?.tradeName || supplier?.name || p.supplierName || "Fornecedor Homologado";
        const supplierWhatsapp = supplier?.whatsapp || supplier?.phone || p.supplierPhone || "+55 11 99999-0000";
        const leadTimeDays = supplier?.leadTimeDays || 3;
        const suggestedReorderPackages = Math.max(
          p.reorderQuantityPackages || 30,
          deficitPackages + Math.ceil(p.minStockPackages * 0.5)
        );
        const estimatedTotalCost = suggestedReorderPackages * (p.costPrice || 50);
        items.push({
          productId: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          currentStockPackages: p.currentStockPackages,
          minStockPackages: p.minStockPackages,
          deficitPackages,
          currentStockUnits: p.currentStockUnits,
          minStockUnits: p.minStockUnits,
          deficitUnits,
          packagingUnit: p.packagingUnit,
          unitsPerPackage: p.unitsPerPackage,
          severity,
          committedInOrdersPackages: committedPackages,
          netAvailablePackages,
          supplierId: p.supplierId,
          supplierName,
          supplierWhatsapp,
          leadTimeDays,
          costPrice: p.costPrice || 0,
          suggestedReorderPackages,
          estimatedTotalCost,
          hasOpenPurchaseOrder: hasOpenPo,
          openPoNumbers,
          openPoTotalPackages,
          openPoList,
          technicalSpecs: p.technicalSpecs,
          material: p.material,
          anvisaRegistration: p.anvisaRegistration,
          barcode: p.barcode
        });
      }
    });
    const severityOrder = { OUT_OF_STOCK: 0, CRITICAL: 1, LOW: 2 };
    items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    const affectedSuppliers = new Set(items.map((i) => i.supplierId));
    return {
      scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
      totalProductsScanned: products.length,
      missingProductsCount: items.length,
      outOfStockCount: items.filter((i) => i.severity === "OUT_OF_STOCK").length,
      criticalCount: items.filter((i) => i.severity === "CRITICAL").length,
      lowStockCount: items.filter((i) => i.severity === "LOW").length,
      totalDeficitPackages: items.reduce((sum, i) => sum + i.deficitPackages, 0),
      totalEstimatedCost: items.reduce((sum, i) => sum + i.estimatedTotalCost, 0),
      affectedSuppliersCount: affectedSuppliers.size,
      items
    };
  }
  /**
   * Criação em Lote de Ordens de Compra para Reposição Automática
   */
  batchCreatePurchaseOrders(ordersToCreate) {
    const createdList = [];
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    ordersToCreate.forEach((item, index) => {
      const product = this.getProductById(item.productId);
      if (!product) return;
      const supplier = this.getSupplierById(product.supplierId);
      const supplierPhone = supplier?.whatsapp || supplier?.phone || product.supplierPhone || "+55 11 99999-0000";
      const supplierName = supplier?.tradeName || supplier?.name || product.supplierName || "Fornecedor Homologado";
      const leadDays = supplier?.leadTimeDays || 3;
      const deliveryDate = new Date(Date.now() + leadDays * 864e5).toISOString().split("T")[0];
      const seq = this.data.purchaseOrders.length + 1;
      const orderNum = `PO-FLIND-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(seq).padStart(3, "0")}`;
      const qtyPackages = item.quantityPackages && item.quantityPackages > 0 ? item.quantityPackages : product.reorderQuantityPackages || 50;
      const po = {
        id: `po-${Date.now()}-${index}`,
        orderNumber: orderNum,
        supplierId: product.supplierId,
        supplierName,
        supplierWhatsapp: supplierPhone,
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        quantityPackages: qtyPackages,
        quantityUnits: qtyPackages * (product.unitsPerPackage || 1),
        packagingUnit: product.packagingUnit || "Caixa (CX)",
        estimatedCost: qtyPackages * (product.costPrice || 50),
        triggerReason: "AUTO_LOW_STOCK",
        status: "SENT_WHATSAPP",
        whatsappMessageId: `auto.WA${supplierPhone.replace(/\D/g, "")}-${Date.now().toString(36)}`,
        notes: item.notes || `Ordem de Compra autom\xE1tica gerada pelo Diagn\xF3stico de Faltantes Flind. Estoque atual: ${product.currentStockPackages} ${product.packagingUnit}.`,
        expectedDeliveryDate: deliveryDate,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      this.data.purchaseOrders.unshift(po);
      createdList.push(po);
      this.addAuditLog({
        id: `aud-batch-po-${po.id}`,
        action: "BATCH_PURCHASE_ORDER_CREATED",
        origin: "DatabaseManager.batchCreatePurchaseOrders",
        entity: "PurchaseOrder",
        entityId: po.id,
        newValue: {
          orderNumber: po.orderNumber,
          productSku: po.productSku,
          qtyPackages,
          supplierName,
          whatsappSentTo: supplierPhone
        },
        userOrService: "Automa\xE7\xE3o Diagn\xF3stico Faltantes Flind",
        correlationId: `corr-batch-${po.id}`,
        createdAt: nowIso
      });
    });
    this.persist();
    return createdList;
  }
  /**
   * Pesquisa de Mercado & Matriz Comparativa de Cotações para Produtos Faltantes
   * Compara Valores, Tempo de Entrega, Fabricação e Validade do Produto
   */
  getMissingProductsQuotationComparisons(targetProductId) {
    const diagnostic = this.getMissingProductsDiagnostic();
    let missingItems = diagnostic.items;
    if (missingItems.length === 0) {
      const allProducts = this.getProducts();
      allProducts.sort((a, b) => a.currentStockPackages / (a.minStockPackages || 1) - b.currentStockPackages / (b.minStockPackages || 1));
      const sample = allProducts.slice(0, 3);
      missingItems = sample.map((p) => {
        const supp = this.getSupplierById(p.supplierId);
        return {
          productId: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          currentStockPackages: p.currentStockPackages,
          minStockPackages: p.minStockPackages,
          deficitPackages: Math.max(5, p.minStockPackages - p.currentStockPackages),
          currentStockUnits: p.currentStockUnits,
          minStockUnits: p.minStockUnits,
          deficitUnits: Math.max(5, p.minStockPackages - p.currentStockPackages) * (p.unitsPerPackage || 1),
          packagingUnit: p.packagingUnit,
          unitsPerPackage: p.unitsPerPackage,
          severity: "LOW",
          committedInOrdersPackages: 0,
          netAvailablePackages: p.currentStockPackages,
          supplierId: p.supplierId,
          supplierName: supp?.tradeName || p.supplierName || "Fornecedor",
          supplierWhatsapp: supp?.whatsapp || "+55 19 99812-4400",
          leadTimeDays: supp?.leadTimeDays || 3,
          costPrice: p.costPrice || 45,
          suggestedReorderPackages: p.reorderQuantityPackages || 30,
          estimatedTotalCost: (p.reorderQuantityPackages || 30) * (p.costPrice || 45),
          hasOpenPurchaseOrder: false,
          technicalSpecs: p.technicalSpecs,
          material: p.material,
          anvisaRegistration: p.anvisaRegistration,
          barcode: p.barcode
        };
      });
    }
    if (targetProductId) {
      missingItems = missingItems.filter((i) => i.productId === targetProductId);
    }
    const now = /* @__PURE__ */ new Date();
    const dFuture = (days) => new Date(now.getTime() + days * 864e5).toISOString().split("T")[0];
    const dPast = (days) => new Date(now.getTime() - days * 864e5).toISOString().split("T")[0];
    const dExpiry = (years, monthOffset = 0) => {
      const d = new Date(now.getTime() + years * 365 * 864e5);
      d.setMonth(d.getMonth() + monthOffset);
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };
    const comparisons = [];
    missingItems.forEach((item) => {
      const baseCost = item.costPrice > 0 ? item.costPrice : 45;
      const suggestedQty = item.suggestedReorderPackages > 0 ? item.suggestedReorderPackages : 30;
      let candidatesConfig = [];
      const lowerName = (item.name + " " + item.category).toLowerCase();
      const isTntOrSheetOrGown = lowerName.includes("len\xE7ol") || lowerName.includes("maca") || lowerName.includes("avental") || lowerName.includes("touca") || lowerName.includes("tnt") || lowerName.includes("cir\xFArgic") || lowerName.includes("est\xE9tica");
      const isToaletOrAbsorbent = lowerName.includes("toalet") || lowerName.includes("protetor") || lowerName.includes("absorv") || lowerName.includes("gel") || lowerName.includes("pol\xEDmero");
      if (isToaletOrAbsorbent) {
        candidatesConfig = [
          {
            supplierId: "supp-3",
            name: "SuperAbsorb Pol\xEDmeros & Qu\xEDmica Industrial Ltda",
            tradeName: "SuperAbsorb Brasil",
            city: "Mau\xE1",
            state: "SP",
            whatsapp: "+55 11 97233-8899",
            status: "HOMOLOGATED",
            priceFactor: 1,
            leadTimeDays: 4,
            paymentTerms: "Boleto 30 DDL",
            commercialDiscountPct: 4,
            freightType: "CIF",
            onTimeRate: 95,
            manufactureDaysAgo: 8,
            lotPrefix: "LOT-SAB-2026",
            capacity: "30.000 caixas/m\xEAs",
            rawMaterial: "Pol\xEDmero Superabsorvente (SAP) At\xF3xico + Fibras Naturais",
            anvisaOk: true,
            auditScore: 94,
            shelfLifeMonths: 36
          },
          {
            supplierId: "supp-alt-poly",
            name: "PolymerTech Insumos de Higiene Ltda",
            tradeName: "PolymerTech Brasil",
            city: "Cubat\xE3o",
            state: "SP",
            whatsapp: "+55 13 99755-4422",
            status: "HOMOLOGATED",
            priceFactor: 0.94,
            // Mais barato
            leadTimeDays: 3,
            paymentTerms: "Boleto 28 DDL",
            freightType: "CIF",
            onTimeRate: 96,
            manufactureDaysAgo: 12,
            lotPrefix: "LOT-PTK-2026",
            capacity: "22.000 caixas/m\xEAs",
            rawMaterial: "Gel Hidrof\xEDlico Absorvente e Filme Imperme\xE1vel PE",
            anvisaOk: true,
            auditScore: 91,
            shelfLifeMonths: 36
          },
          {
            supplierId: "supp-alt-abs",
            name: "AbsorveF\xE1cil Celulose & Absorventes Hospitalares S/A",
            tradeName: "AbsorveF\xE1cil Insumos",
            city: "Suzano",
            state: "SP",
            whatsapp: "+55 11 98311-6644",
            status: "ACTIVE",
            priceFactor: 1.06,
            leadTimeDays: 2,
            // Mais rápido
            paymentTerms: "Boleto 14 DDL",
            freightType: "CIF",
            onTimeRate: 92,
            manufactureDaysAgo: 25,
            lotPrefix: "LOT-ABF-2026",
            capacity: "15.000 caixas/m\xEAs",
            rawMaterial: "Celulose Desfibrada e Poliacrilato de S\xF3dio",
            anvisaOk: true,
            auditScore: 86,
            shelfLifeMonths: 24
          }
        ];
      } else if (isTntOrSheetOrGown) {
        candidatesConfig = [
          {
            supplierId: "supp-1",
            name: "Fibras & N\xE3o-Tecidos Brasil S/A",
            tradeName: "TNT Brasil Mat\xE9rias-Primas",
            city: "Americana",
            state: "SP",
            whatsapp: "+55 19 99812-4400",
            status: "HOMOLOGATED",
            priceFactor: 1,
            leadTimeDays: 3,
            paymentTerms: "Boleto 28 DDL",
            commercialDiscountPct: 3,
            freightType: "CIF",
            onTimeRate: 98,
            manufactureDaysAgo: 6,
            lotPrefix: "LOT-TNT-2026",
            capacity: "25.000 caixas/m\xEAs",
            rawMaterial: "TNT SMS 100% Polipropileno Virgem M\xE9dico (Tripla Camada)",
            anvisaOk: true,
            auditScore: 96,
            shelfLifeMonths: 36
          },
          {
            supplierId: "supp-alt-fit",
            name: "Fitesa Fibras M\xE9dicas do Brasil Ltda",
            tradeName: "Fitesa Hospitalar",
            city: "Paul\xEDnia",
            state: "SP",
            whatsapp: "+55 19 98411-2299",
            status: "HOMOLOGATED",
            priceFactor: 1.08,
            leadTimeDays: 2,
            // Entrega mais rápida
            paymentTerms: "Boleto 30/60 DDL",
            freightType: "CIF",
            onTimeRate: 99,
            manufactureDaysAgo: 3,
            lotPrefix: "LOT-FIT-2026",
            capacity: "40.000 caixas/m\xEAs",
            rawMaterial: "Tecido N\xE3o-Tecido Spunbond Cir\xFArgico Calandrado",
            anvisaOk: true,
            auditScore: 98,
            shelfLifeMonths: 36
          },
          {
            supplierId: "supp-alt-bio",
            name: "Cir\xFArgica BioT\xEAxtil Insumos Hospitalares S/A",
            tradeName: "BioT\xEAxtil Cir\xFArgica",
            city: "Joinville",
            state: "SC",
            whatsapp: "+55 47 99123-5588",
            status: "ACTIVE",
            priceFactor: 0.91,
            // Menor Preço
            leadTimeDays: 7,
            // Mais distante
            paymentTerms: "Boleto 15 DDL",
            freightType: "FOB",
            onTimeRate: 88,
            manufactureDaysAgo: 45,
            lotPrefix: "LOT-BIO-2026",
            capacity: "12.000 caixas/m\xEAs",
            rawMaterial: "TNT Convencional Hidrorrepelente 30g/m\xB2",
            anvisaOk: true,
            auditScore: 82,
            shelfLifeMonths: 24
          }
        ];
      } else {
        candidatesConfig = [
          {
            supplierId: "supp-2",
            name: "Klabin Embalagens e Papel\xE3o Ondulado S/A",
            tradeName: "Klabin Embalagens Hospitalares",
            city: "Jundia\xED",
            state: "SP",
            whatsapp: "+55 11 98450-3321",
            status: "HOMOLOGATED",
            priceFactor: 1,
            leadTimeDays: 4,
            paymentTerms: "Boleto 30/60 DDL",
            commercialDiscountPct: 5,
            freightType: "CIF",
            onTimeRate: 97,
            manufactureDaysAgo: 7,
            lotPrefix: "LOT-KLB-2026",
            capacity: "50.000 caixas/m\xEAs",
            rawMaterial: "Papel\xE3o Ondulado Onda B/C Kraft 100% Virgem Recicl\xE1vel",
            anvisaOk: true,
            auditScore: 95,
            shelfLifeMonths: 48
          },
          {
            supplierId: "supp-alt-suz",
            name: "Suzano Papel & Embalagens Bio S/A",
            tradeName: "Suzano Embalagens",
            city: "Limeira",
            state: "SP",
            whatsapp: "+55 19 99644-8833",
            status: "HOMOLOGATED",
            priceFactor: 0.95,
            leadTimeDays: 3,
            paymentTerms: "Boleto 28 DDL",
            freightType: "CIF",
            onTimeRate: 98,
            manufactureDaysAgo: 5,
            lotPrefix: "LOT-SUZ-2026",
            capacity: "60.000 caixas/m\xEAs",
            rawMaterial: "Kraftliner Celulose Certificada FSC",
            anvisaOk: true,
            auditScore: 96,
            shelfLifeMonths: 48
          },
          {
            supplierId: "supp-alt-rig",
            name: "Rigesa Embalagens Caneladas Ltda",
            tradeName: "Rigesa Caixas",
            city: "Valinhos",
            state: "SP",
            whatsapp: "+55 19 98111-9922",
            status: "ACTIVE",
            priceFactor: 0.9,
            leadTimeDays: 6,
            paymentTerms: "Boleto 21 DDL",
            freightType: "FOB",
            onTimeRate: 89,
            manufactureDaysAgo: 30,
            lotPrefix: "LOT-RIG-2026",
            capacity: "18.000 caixas/m\xEAs",
            rawMaterial: "Papel\xE3o Reciclado Misto Semi-Kraft",
            anvisaOk: false,
            auditScore: 80,
            shelfLifeMonths: 36
          }
        ];
      }
      const rawOffers = candidatesConfig.map((cfg, idx) => {
        const unitPrice = Math.round(baseCost * cfg.priceFactor * 100) / 100;
        const totalCost = Math.round(unitPrice * suggestedQty * 100) / 100;
        const mfgDate = dPast(cfg.manufactureDaysAgo);
        const expDate = dExpiry(Math.floor(cfg.shelfLifeMonths / 12), cfg.shelfLifeMonths % 12);
        const expectedDelivery = dFuture(cfg.leadTimeDays);
        const freshnessLabel = cfg.manufactureDaysAgo <= 7 ? `Lote fresqu\xEDssimo (Fabricado h\xE1 ${cfg.manufactureDaysAgo} dias)` : cfg.manufactureDaysAgo <= 20 ? `Lote recente (Fabricado h\xE1 ${cfg.manufactureDaysAgo} dias)` : `Lote estocado h\xE1 ${cfg.manufactureDaysAgo} dias`;
        return {
          id: `quot-${item.productId}-${cfg.supplierId}`,
          supplierId: cfg.supplierId,
          supplierName: cfg.name,
          supplierTradeName: cfg.tradeName,
          supplierCity: cfg.city,
          supplierState: cfg.state,
          supplierWhatsapp: cfg.whatsapp,
          supplierStatus: cfg.status,
          unitPrice,
          totalCost,
          paymentTerms: cfg.paymentTerms,
          commercialDiscountPct: cfg.commercialDiscountPct,
          leadTimeDays: cfg.leadTimeDays,
          expectedDeliveryDate: expectedDelivery,
          freightType: cfg.freightType,
          onTimeDeliveryRatePct: cfg.onTimeRate,
          manufacturingDate: mfgDate,
          manufacturingLot: `${cfg.lotPrefix}-${String(100 + idx * 23)}`,
          manufacturingCapacity: cfg.capacity,
          rawMaterialOrigin: cfg.rawMaterial,
          anvisaCompliant: cfg.anvisaOk,
          qualityAuditScore: cfg.auditScore,
          shelfLifeMonths: cfg.shelfLifeMonths,
          expiryDate: expDate,
          freshnessLabel,
          priceScore: 0,
          deliveryScore: 0,
          manufacturingScore: 0,
          shelfLifeScore: 0,
          compositeScore: 0,
          isBestChoice: false,
          badges: []
        };
      });
      const minPrice = Math.min(...rawOffers.map((o) => o.unitPrice));
      const maxPrice = Math.max(...rawOffers.map((o) => o.unitPrice));
      const minLead = Math.min(...rawOffers.map((o) => o.leadTimeDays));
      const maxLead = Math.max(...rawOffers.map((o) => o.leadTimeDays));
      const maxShelf = Math.max(...rawOffers.map((o) => o.shelfLifeMonths));
      rawOffers.forEach((o) => {
        o.priceScore = Math.round(100 * (minPrice / o.unitPrice));
        o.deliveryScore = Math.round(100 * (minLead / o.leadTimeDays));
        const freshnessBonus = o.freshnessLabel.includes("fresqu\xEDssimo") ? 10 : o.freshnessLabel.includes("recente") ? 5 : 0;
        o.shelfLifeScore = Math.min(100, Math.round(100 * (o.shelfLifeMonths / maxShelf)) + freshnessBonus);
        o.manufacturingScore = Math.round(o.qualityAuditScore * (o.anvisaCompliant ? 1 : 0.7));
        o.compositeScore = Math.round(
          o.priceScore * 0.4 + o.deliveryScore * 0.25 + o.shelfLifeScore * 0.2 + o.manufacturingScore * 0.15
        );
        if (o.unitPrice === minPrice) o.badges.push("Menor Pre\xE7o");
        if (o.leadTimeDays === minLead) o.badges.push("Entrega Mais R\xE1pida");
        if (o.shelfLifeMonths === maxShelf) o.badges.push("Maior Validade");
        if (o.freightType === "CIF") o.badges.push("Frete CIF Gr\xE1tis");
      });
      rawOffers.sort((a, b) => b.compositeScore - a.compositeScore);
      const bestOffer = rawOffers[0];
      bestOffer.isBestChoice = true;
      bestOffer.badges.unshift("\u{1F3C6} Melhor Op\xE7\xE3o Flind");
      bestOffer.bestChoiceHighlight = `Melhor pontua\xE7\xE3o geral (${bestOffer.compositeScore}/100): Equil\xEDbrio perfeito entre valor (R$ ${bestOffer.unitPrice.toFixed(2)}), entrega em ${bestOffer.leadTimeDays} dias e lote com ${bestOffer.shelfLifeMonths} meses de validade.`;
      const priceSavingsVsWorstPct = Math.round((maxPrice - bestOffer.unitPrice) / maxPrice * 100);
      const leadTimeAdvantageDays = maxLead - bestOffer.leadTimeDays;
      comparisons.push({
        productId: item.productId,
        sku: item.sku,
        name: item.name,
        category: item.category,
        packagingUnit: item.packagingUnit,
        unitsPerPackage: item.unitsPerPackage,
        currentStockPackages: item.currentStockPackages,
        minStockPackages: item.minStockPackages,
        deficitPackages: item.deficitPackages,
        suggestedPackages: suggestedQty,
        severity: item.severity,
        hasOpenPurchaseOrder: item.hasOpenPurchaseOrder,
        openPoNumbers: item.openPoNumbers,
        openPoTotalPackages: item.openPoTotalPackages,
        openPoList: item.openPoList,
        offers: rawOffers,
        recommendedSupplierId: bestOffer.supplierId,
        recommendedSupplierName: bestOffer.supplierTradeName,
        recommendedOfferId: bestOffer.id,
        recommendationReason: `O sistema selecionou ${bestOffer.supplierTradeName} com nota ${bestOffer.compositeScore}/100. Oferece o menor risco de ruptura com prazo de ${bestOffer.leadTimeDays} dia(s), economia de ${priceSavingsVsWorstPct}% em rela\xE7\xE3o \xE0 cota\xE7\xE3o mais cara, lote fabricado h\xE1 poucos dias e garantia integral de conformidade ANVISA.`,
        priceSavingsVsWorstPct,
        leadTimeAdvantageDays
      });
    });
    return comparisons;
  }
  /**
   * Criação direta de Ordem de Compra a partir da Cotação Selecionada no Comparativo
   */
  createPurchaseOrderFromQuotation(params) {
    const product = this.getProductById(params.productId);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const leadDays = params.leadTimeDays || 3;
    const deliveryDate = new Date(Date.now() + leadDays * 864e5).toISOString().split("T")[0];
    const seq = this.data.purchaseOrders.length + 1;
    const orderNum = `PO-FLIND-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(seq).padStart(3, "0")}`;
    const packagingUnit = product?.packagingUnit || "Caixa (CX)";
    const qtyPackages = params.quantityPackages;
    const unitsPerPkg = product?.unitsPerPackage || 1;
    const estimatedCost = qtyPackages * params.unitPrice;
    const po = {
      id: `po-quot-${Date.now()}`,
      orderNumber: orderNum,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      supplierWhatsapp: params.supplierWhatsapp,
      productId: params.productId,
      productSku: product?.sku || "SKU-FLIND",
      productName: product?.name || "Insumo Flind",
      quantityPackages: qtyPackages,
      quantityUnits: qtyPackages * unitsPerPkg,
      packagingUnit,
      estimatedCost,
      triggerReason: "AUTO_LOW_STOCK",
      status: "SENT_WHATSAPP",
      whatsappMessageId: `quot.WA${params.supplierWhatsapp.replace(/\D/g, "")}-${Date.now().toString(36)}`,
      notes: params.notes || `Ordem de Compra gerada pelo Comparativo Inteligente Flind. Condi\xE7\xE3o: ${params.paymentTerms}, Prazo: ${leadDays} dias \xFAteis, Pre\xE7o Unit\xE1rio: R$ ${params.unitPrice.toFixed(2)}.`,
      expectedDeliveryDate: deliveryDate,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    this.data.purchaseOrders.unshift(po);
    this.addAuditLog({
      id: `aud-quot-po-${po.id}`,
      action: "PURCHASE_ORDER_FROM_QUOTATION_CREATED",
      origin: "DatabaseManager.createPurchaseOrderFromQuotation",
      entity: "PurchaseOrder",
      entityId: po.id,
      newValue: {
        orderNumber: po.orderNumber,
        productSku: po.productSku,
        qtyPackages,
        supplierName: po.supplierName,
        unitPrice: params.unitPrice,
        estimatedCost,
        whatsappSentTo: po.supplierWhatsapp
      },
      userOrService: "Comparativo Inteligente de Fornecedores",
      correlationId: `corr-quot-${po.id}`,
      createdAt: nowIso
    });
    this.persist();
    return po;
  }
  // ====================================================
  // IMPORTAÇÃO DE ESTOQUE E VOLUMES VIA PLANILHA XLSX
  // ====================================================
  importInventoryItems(rows, options) {
    const mode = options?.mode || "UPSERT";
    const triggerAutoReorder = options?.triggerAutoReorder !== false;
    const userOrService = options?.userOrService || "Importa\xE7\xE3o Planilha XLSX";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    let totalPackagesUpdated = 0;
    let totalUnitsCalculated = 0;
    const itemsResult = [];
    const autoOrdersTriggered = [];
    for (const row of rows) {
      const sku = (row.sku || "").trim();
      const name = (row.name || "").trim();
      if (!sku && !name) continue;
      const existing = this.getProductBySku(sku) || (name ? this.data.products.find((p) => p.name.toLowerCase() === name.toLowerCase()) : void 0);
      const packagingUnit = row.packagingUnit || existing?.packagingUnit || "Caixa (CX)";
      const unitsPerPackage = Math.max(1, Number(row.unitsPerPackage) || existing?.unitsPerPackage || 1);
      let newPackages = existing?.currentStockPackages ?? 0;
      if (row.currentStockPackages !== void 0 && !isNaN(Number(row.currentStockPackages))) {
        newPackages = Math.max(0, Math.round(Number(row.currentStockPackages)));
      } else if (row.currentStockUnits !== void 0 && !isNaN(Number(row.currentStockUnits))) {
        newPackages = Math.ceil(Math.max(0, Number(row.currentStockUnits)) / unitsPerPackage);
      }
      const newUnits = newPackages * unitsPerPackage;
      totalPackagesUpdated += newPackages;
      totalUnitsCalculated += newUnits;
      const minStockPackages = row.minStockPackages !== void 0 && !isNaN(Number(row.minStockPackages)) ? Math.max(0, Math.round(Number(row.minStockPackages))) : existing?.minStockPackages ?? 20;
      let status = "NORMAL";
      if (newPackages <= 0) {
        status = "OUT_OF_STOCK";
      } else if (newPackages <= Math.max(1, Math.floor(minStockPackages * 0.4))) {
        status = "CRITICAL";
      } else if (newPackages <= minStockPackages) {
        status = "LOW";
      }
      let supplierId = existing?.supplierId || "supp-1";
      let supplierName = existing?.supplierName || "Fornecedor Homologado";
      let supplierPhone = existing?.supplierPhone || "+55 11 99999-9999";
      if (row.supplierName) {
        const foundSupp = this.data.suppliers.find(
          (s) => s.name.toLowerCase().includes(row.supplierName.toLowerCase()) || s.tradeName.toLowerCase().includes(row.supplierName.toLowerCase())
        );
        if (foundSupp) {
          supplierId = foundSupp.id;
          supplierName = foundSupp.tradeName || foundSupp.name;
          supplierPhone = foundSupp.whatsapp || foundSupp.phone || supplierPhone;
        } else {
          supplierName = row.supplierName;
        }
      }
      if (existing) {
        const previousPackages = existing.currentStockPackages;
        const previousUnits = existing.currentStockUnits;
        const hasChanged = previousPackages !== newPackages || existing.packagingUnit !== packagingUnit || existing.unitsPerPackage !== unitsPerPackage || row.costPrice !== void 0 && existing.costPrice !== row.costPrice || row.salePrice !== void 0 && existing.salePrice !== row.salePrice;
        existing.currentStockPackages = newPackages;
        existing.currentStockUnits = newUnits;
        existing.packagingUnit = packagingUnit;
        existing.unitsPerPackage = unitsPerPackage;
        existing.minStockPackages = minStockPackages;
        existing.minStockUnits = minStockPackages * unitsPerPackage;
        existing.status = status;
        existing.updatedAt = nowIso;
        if (row.unitWeightKg !== void 0 && row.unitWeightKg > 0) existing.unitWeightKg = row.unitWeightKg;
        if (row.weightPerPackageKg !== void 0 && row.weightPerPackageKg > 0) existing.weightPerPackageKg = row.weightPerPackageKg;
        if (row.costPrice !== void 0 && row.costPrice > 0) existing.costPrice = row.costPrice;
        if (row.salePrice !== void 0 && row.salePrice > 0) existing.salePrice = row.salePrice;
        if (row.lotNumber) existing.lotNumber = row.lotNumber;
        if (row.manufactureDate) existing.manufactureDate = row.manufactureDate;
        if (row.expiryDate) existing.expiryDate = row.expiryDate;
        if (row.shelfLifeMonths) existing.shelfLifeMonths = row.shelfLifeMonths;
        if (row.location) existing.location = row.location;
        if (row.barcode) existing.barcode = row.barcode;
        if (row.category) existing.category = row.category;
        if (supplierName) existing.supplierName = supplierName;
        if (supplierId) existing.supplierId = supplierId;
        if (hasChanged) {
          updatedCount++;
        } else {
          unchangedCount++;
        }
        itemsResult.push({
          id: existing.id,
          sku: existing.sku,
          name: existing.name,
          action: hasChanged ? "UPDATED" : "UNCHANGED",
          previousPackages,
          newPackages,
          previousUnits,
          newUnits,
          packagingUnit,
          unitsPerPackage,
          status
        });
        if (triggerAutoReorder && (status === "LOW" || status === "CRITICAL" || status === "OUT_OF_STOCK")) {
          const autoPo = this.triggerAutoReorderForProduct(existing);
          if (autoPo) autoOrdersTriggered.push(autoPo);
        }
      } else if (mode === "UPSERT") {
        const newProduct = {
          id: `prod-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sku,
          name: name || sku,
          category: row.category || "Hospitalar & Cir\xFArgico",
          packagingUnit,
          unitsPerPackage,
          unitWeightKg: Number(row.unitWeightKg) || 0.1,
          weightPerPackageKg: Number(row.weightPerPackageKg) || (Number(row.unitWeightKg) || 0.1) * unitsPerPackage,
          manufactureDate: row.manufactureDate || nowIso.split("T")[0],
          expiryDate: row.expiryDate || new Date(Date.now() + 365 * 864e5 * 3).toISOString().split("T")[0],
          shelfLifeMonths: Number(row.shelfLifeMonths) || 36,
          lotNumber: row.lotNumber || `LOTE-${(/* @__PURE__ */ new Date()).getFullYear()}-IMP`,
          currentStockPackages: newPackages,
          currentStockUnits: newUnits,
          minStockPackages,
          minStockUnits: minStockPackages * unitsPerPackage,
          reorderQuantityPackages: Math.max(10, minStockPackages * 2),
          supplierId,
          supplierName,
          supplierPhone,
          costPrice: Number(row.costPrice) || 0,
          salePrice: Number(row.salePrice) || 0,
          location: row.location || "Almoxarifado Geral",
          status,
          autoReorderEnabled: true,
          barcode: row.barcode,
          createdAt: nowIso,
          updatedAt: nowIso
        };
        this.data.products.push(newProduct);
        createdCount++;
        itemsResult.push({
          id: newProduct.id,
          sku: newProduct.sku,
          name: newProduct.name,
          action: "CREATED",
          previousPackages: 0,
          newPackages,
          previousUnits: 0,
          newUnits,
          packagingUnit,
          unitsPerPackage,
          status
        });
        if (triggerAutoReorder && (status === "LOW" || status === "CRITICAL" || status === "OUT_OF_STOCK")) {
          const autoPo = this.triggerAutoReorderForProduct(newProduct);
          if (autoPo) autoOrdersTriggered.push(autoPo);
        }
      }
    }
    const auditLogId = `aud-imp-${Date.now()}`;
    this.addAuditLog({
      id: auditLogId,
      action: "INVENTORY_IMPORTED_EXCEL",
      origin: "DatabaseManager.importInventoryItems",
      entity: "ProductInventory",
      entityId: "BATCH_IMPORT",
      newValue: {
        totalProcessed: rows.length,
        createdCount,
        updatedCount,
        unchangedCount,
        totalPackagesUpdated,
        totalUnitsCalculated,
        autoOrdersTriggeredCount: autoOrdersTriggered.length
      },
      userOrService,
      correlationId: `corr-imp-${Date.now()}`,
      createdAt: nowIso
    });
    this.persist();
    return {
      success: true,
      totalProcessed: rows.length,
      createdCount,
      updatedCount,
      unchangedCount,
      totalPackagesUpdated,
      totalUnitsCalculated,
      items: itemsResult,
      autoOrdersTriggered,
      auditLogId,
      message: `Importa\xE7\xE3o de estoque XLSX processada com sucesso! ${updatedCount} produto(s) atualizado(s), ${createdCount} novo(s) produto(s) cadastrado(s). Total em volumes: ${totalPackagesUpdated.toLocaleString("pt-BR")}, total em unidades: ${totalUnitsCalculated.toLocaleString("pt-BR")}.`
    };
  }
  // ====================================================
  // METADADOS E ESTATÍSTICAS DAS TABELAS (GITHUB & VERCEL)
  // ====================================================
  getDatabaseTableStats() {
    const { file, isReadOnlyEnv } = getDatabaseFilePaths();
    const tables = [
      {
        tableName: "suppliers",
        displayName: "Fornecedores Homologados",
        description: "Cadastro completo de fornecedores de mat\xE9rias-primas e insumos com contato WhatsApp.",
        recordCount: this.data.suppliers.length,
        primaryKey: "id",
        columnsCount: 17,
        columns: ["id", "name", "trade_name", "tax_id", "state_registration", "whatsapp", "email", "category", "lead_time_days", "city", "state", "status"]
      },
      {
        tableName: "products",
        displayName: "Produtos & Cat\xE1logo T\xE9cnico",
        description: "Estoque f\xEDsico em caixas/unidades, ponto de ressuprimento, lotes e fichas t\xE9cnicas Flind.",
        recordCount: this.data.products.length,
        primaryKey: "id",
        columnsCount: 28,
        columns: ["id", "sku", "name", "category", "packaging_unit", "units_per_package", "current_stock_packages", "min_stock_packages", "cost_price", "status"]
      },
      {
        tableName: "orders",
        displayName: "Pedidos de Venda",
        description: "Ordens de venda integradas do ERP/E-commerce, valores, prazos e esteira de expedi\xE7\xE3o.",
        recordCount: this.data.orders.length,
        primaryKey: "id",
        columnsCount: 16,
        columns: ["id", "order_number", "customer_id", "origin", "status", "total_amount", "packages_count", "sla_status"]
      },
      {
        tableName: "purchase_orders",
        displayName: "Ordens de Compra Ativas",
        description: "Ordens de compra emitidas para reposi\xE7\xE3o de mat\xE9ria-prima junto aos fornecedores.",
        recordCount: this.data.purchaseOrders.filter((p) => p.status !== "CANCELLED").length,
        primaryKey: "id",
        columnsCount: 15,
        columns: ["id", "order_number", "supplier_id", "product_id", "quantity_packages", "estimated_cost", "status"]
      },
      {
        tableName: "cancelled_purchase_orders",
        displayName: "Hist\xF3rico de Compras Canceladas",
        description: "Arquivo isolado de ordens de reposi\xE7\xE3o canceladas para n\xE3o poluir a listagem ativa.",
        recordCount: (this.data.cancelledPurchaseOrders || []).length,
        primaryKey: "id",
        columnsCount: 14,
        columns: ["id", "order_number", "supplier_name", "product_name", "cancel_reason", "cancelled_at"]
      },
      {
        tableName: "customers",
        displayName: "Clientes & Contas B2B",
        description: "Rede hospitalar, cl\xEDnicas de est\xE9tica, sal\xF5es de beleza e contas e-commerce Flind.",
        recordCount: this.data.customers.length,
        primaryKey: "id",
        columnsCount: 14,
        columns: ["id", "name", "trade_name", "tax_id", "email", "phone", "flind_origin", "segment"]
      },
      {
        tableName: "receivables",
        displayName: "Contas a Receber & Baixa Autom\xE1tica",
        description: "T\xEDtulos financeiros, vencimentos, concilia\xE7\xE3o e baixas autom\xE1ticas de pagamentos.",
        recordCount: this.data.receivables.length,
        primaryKey: "id",
        columnsCount: 14,
        columns: ["id", "order_id", "customer_name", "document_number", "due_date", "amount", "status"]
      },
      {
        tableName: "delivery_rules",
        displayName: "Regras de Entrega Operacionais",
        description: "Janelas hor\xE1rias de recebimento, agendamento de docas e restri\xE7\xF5es de ve\xEDculos (VUC/Carreta).",
        recordCount: this.data.deliveryRules.length,
        primaryKey: "id",
        columnsCount: 13,
        columns: ["id", "customer_id", "allowed_time_start", "allowed_time_end", "vehicle_type_allowed", "requires_scheduling"]
      },
      {
        tableName: "alerts",
        displayName: "Alertas Operacionais & SLA",
        description: "Incidentes de separa\xE7\xE3o, atrasos de fornecedor e riscos de estoque.",
        recordCount: this.data.alerts.length,
        primaryKey: "id",
        columnsCount: 9,
        columns: ["id", "type", "message", "severity", "status", "responsible"]
      },
      {
        tableName: "audit_logs",
        displayName: "Trilha de Auditoria & Compliance",
        description: "Registro cronol\xF3gico imut\xE1vel de todas as a\xE7\xF5es no sistema (compras, cancelamentos, baixas).",
        recordCount: this.data.auditLogs.length,
        primaryKey: "id",
        columnsCount: 8,
        columns: ["id", "action", "entity", "entity_id", "user_or_service", "created_at"]
      }
    ];
    return {
      success: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: process.env.VERCEL ? "Vercel Serverless" : "Node.js Runtime",
      storageEngine: isReadOnlyEnv ? "In-Memory State + /tmp Persistent Mirror" : "JSON Persistent Engine / Data Dir",
      storagePath: file,
      tablesCount: tables.length,
      totalRecords: tables.reduce((acc, t) => acc + t.recordCount, 0),
      tables
    };
  }
};
var db = new DatabaseManager();

// src/server/integrations/tray/tray-adapter.ts
var TrayAdapter = class {
  constructor() {
    this.accessToken = null;
    this.tokenExpiresAt = 0;
    this.apiUrl = process.env.TRAY_API_URL || "https://api.commerce.tray.com.br";
    this.consumerKey = process.env.TRAY_CONSUMER_KEY || "";
    this.consumerSecret = process.env.TRAY_CONSUMER_SECRET || "";
    this.code = process.env.TRAY_CODE || "";
  }
  /**
   * Autenticação OAuth 2.0 da Tray
   * POST /auth com consumer_key, consumer_secret e code
   */
  async authenticate() {
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 6e4) {
      return this.accessToken;
    }
    if (!this.consumerKey || !this.consumerSecret) {
      console.warn("[TrayAdapter] Credenciais TRAY_CONSUMER_KEY/SECRET n\xE3o configuradas em ambiente.");
      return "MOCK_TRAY_ACCESS_TOKEN";
    }
    const endpoint = `${this.apiUrl}/auth`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumer_key: this.consumerKey,
        consumer_secret: this.consumerSecret,
        code: this.code
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Falha na autentica\xE7\xE3o da API Tray: ${response.status} - ${errText}`);
    }
    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in ? data.expires_in * 1e3 : 36e5 * 3);
    return this.accessToken;
  }
  /**
   * Consulta pedido completo na API oficial da Tray
   * GET /orders/{order_id}/complete
   */
  async getOrderDetails(orderId) {
    const token = await this.authenticate();
    if (token === "MOCK_TRAY_ACCESS_TOKEN") {
      return this.buildStandardOrderMock(orderId);
    }
    const endpoint = `${this.apiUrl}/orders/${orderId}/complete?access_token=${token}`;
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Erro ao consultar pedido Tray #${orderId}: ${response.status} - ${err}`);
    }
    return await response.json();
  }
  /**
   * Processador de Webhook com Garantia de Idempotência
   * O mesmo evento/pedido não é processado duas vezes.
   */
  async handleWebhook(payload, correlationId) {
    const externalOrderId = String(payload.order_id);
    const eventType = payload.event || "order.created";
    const idempotencyKey = `tray:order:${externalOrderId}:${eventType}`;
    const existingLog = db.findIdempotencyLog(idempotencyKey);
    if (existingLog && existingLog.status === "SUCCESS") {
      console.log(`[TrayAdapter] [IDEMPOT\xCANCIA] Evento ${idempotencyKey} j\xE1 processado anteriormente. Ignorando duplicata.`);
      return {
        success: true,
        message: "Evento j\xE1 processado com sucesso anteriormente (Idempotente).",
        orderId: existingLog.externalId,
        alreadyProcessed: true
      };
    }
    db.addIntegrationLog({
      id: `intlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      integration: "TRAY",
      eventType,
      externalId: externalOrderId,
      idempotencyKey,
      status: "PENDING",
      attempts: (existingLog?.attempts || 0) + 1,
      payloadOriginal: payload,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    try {
      const details = await this.getOrderDetails(externalOrderId);
      const rawOrder = details.Order;
      const customerTaxId = rawOrder.Customer.cnpj || rawOrder.Customer.cpf || "00.000.000/0000-00";
      let customer = db.getCustomers().find((c) => c.taxId === customerTaxId);
      if (!customer) {
        let detectedSegment = "Hospitalar & Cir\xFArgico";
        const nameLower = (rawOrder.Customer.name || "").toLowerCase();
        if (nameLower.includes("est\xE9tica") || nameLower.includes("spa") || nameLower.includes("laser") || nameLower.includes("dermato")) {
          detectedSegment = "Est\xE9tica & Spas";
        } else if (nameLower.includes("sal\xE3o") || nameLower.includes("salao") || nameLower.includes("barbearia") || nameLower.includes("beauty")) {
          detectedSegment = "Sal\xF5es & Barbearias";
        }
        customer = {
          id: `cust-tray-${rawOrder.Customer.id}`,
          externalId: `TRAY-${rawOrder.Customer.id}`,
          name: rawOrder.Customer.name,
          segment: detectedSegment,
          taxId: customerTaxId,
          email: rawOrder.Customer.email,
          phone: rawOrder.Customer.phone || rawOrder.Customer.cellphone || "",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        db.upsertCustomer(customer);
      }
      const deliveryAddressId = `addr-del-${customer.id}-${Date.now().toString(36)}`;
      const deliveryAddress = {
        id: deliveryAddressId,
        customerId: customer.id,
        type: "DELIVERY",
        street: rawOrder.Customer.address || "Logradouro n\xE3o informado",
        number: rawOrder.Customer.number || "S/N",
        complement: rawOrder.Customer.complement,
        neighborhood: rawOrder.Customer.neighborhood || "Centro",
        city: rawOrder.Customer.city || "S\xE3o Paulo",
        state: rawOrder.Customer.state || "SP",
        zipCode: rawOrder.Customer.zip_code || "00000-000",
        country: "Brasil",
        isDefault: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      db.upsertAddress(deliveryAddress);
      const items = (rawOrder.ProductsOrder || []).map((item, idx) => {
        const p = item.ProductOrder;
        return {
          id: `item-${externalOrderId}-${idx + 1}`,
          orderId: `ord-tray-${externalOrderId}`,
          productId: String(p.product_id),
          sku: p.reference || `SKU-${p.product_id}`,
          title: p.name,
          quantity: Number(p.quantity) || 1,
          unitPrice: Number(p.price) || 0,
          totalPrice: (Number(p.quantity) || 1) * (Number(p.price) || 0),
          weightKg: p.weight ? Number(p.weight) : 1
        };
      });
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const initialTimeline = [
        {
          id: `tl-tray-${externalOrderId}-1`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: "ORDER_RECEIVED",
          stageLabel: "Pedido Recebido",
          status: "COMPLETED",
          startedAt: nowIso,
          completedAt: nowIso,
          durationMinutes: 1,
          expectedSlaMinutes: 10,
          responsible: "Tray Webhook Sync",
          sourceSystem: "TRAY",
          notes: `Importado da Tray E-commerce via webhook (${eventType}). Total: R$ ${rawOrder.total}.`
        },
        {
          id: `tl-tray-${externalOrderId}-2`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: "ERP_INTEGRATED",
          stageLabel: "Integrado ao ERP",
          status: "IN_PROGRESS",
          startedAt: nowIso,
          expectedSlaMinutes: 30,
          responsible: "SINK ERP Queue Worker",
          sourceSystem: "SINK_ERP",
          notes: "Encaminhado para a fila de sincroniza\xE7\xE3o com o SINK ERP."
        },
        {
          id: `tl-tray-${externalOrderId}-3`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: "SEPARATION",
          stageLabel: "Separa\xE7\xE3o",
          status: "PENDING",
          expectedSlaMinutes: 120,
          sourceSystem: "FABRICA_INTEGRADA"
        },
        {
          id: `tl-tray-${externalOrderId}-4`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: "INVOICING",
          stageLabel: "Faturamento",
          status: "PENDING",
          expectedSlaMinutes: 240,
          sourceSystem: "SINK_ERP"
        },
        {
          id: `tl-tray-${externalOrderId}-5`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: "NFE_ISSUED",
          stageLabel: "NF-e Emitida",
          status: "PENDING",
          expectedSlaMinutes: 15,
          sourceSystem: "SINK_ERP"
        },
        {
          id: `tl-tray-${externalOrderId}-6`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: "EXPEDITION",
          stageLabel: "Expedi\xE7\xE3o & Etiquetagem",
          status: "PENDING",
          expectedSlaMinutes: 480,
          sourceSystem: "FABRICA_INTEGRADA"
        },
        {
          id: `tl-tray-${externalOrderId}-7`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: "CARRIER_DISPATCH",
          stageLabel: "Coleta Transportadora",
          status: "PENDING",
          expectedSlaMinutes: 360,
          sourceSystem: "TRANSPORTADORA"
        },
        {
          id: `tl-tray-${externalOrderId}-8`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: "IN_TRANSIT",
          stageLabel: "Em Tr\xE2nsito",
          status: "PENDING",
          expectedSlaMinutes: 1440,
          sourceSystem: "TRANSPORTADORA"
        },
        {
          id: `tl-tray-${externalOrderId}-9`,
          orderId: `ord-tray-${externalOrderId}`,
          stage: "DELIVERED",
          stageLabel: "Entregue ao Cliente",
          status: "PENDING",
          expectedSlaMinutes: 2880,
          sourceSystem: "TRANSPORTADORA"
        }
      ];
      const order = {
        id: `ord-tray-${externalOrderId}`,
        orderNumber: `#${externalOrderId}`,
        externalId: `TRAY-ORD-${externalOrderId}`,
        source: "TRAY",
        customerId: customer.id,
        deliveryAddressId,
        status: "NEW",
        totalAmount: Number(rawOrder.total) || 0,
        subtotal: Number(rawOrder.subtotal) || Number(rawOrder.total) || 0,
        shippingCost: Number(rawOrder.shipment_value) || 0,
        discount: Number(rawOrder.discount) || 0,
        paymentMethod: rawOrder.payment_method_type || "CARTAO_CREDITO",
        paymentStatus: "PAID",
        items,
        timeline: initialTimeline,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      db.upsertOrder(order);
      const recId = `rec-tray-${externalOrderId}`;
      const existingRec = db.getReceivableById(recId);
      if (!existingRec) {
        db.upsertReceivable({
          id: recId,
          customerId: customer.id,
          customerName: customer.name,
          orderId: order.id,
          orderNumber: order.orderNumber,
          documentNumber: `DUP-TRAY-${externalOrderId}`,
          invoiceNumber: `NF-${externalOrderId}`,
          amount: order.totalAmount,
          dueDate: nowIso.split("T")[0],
          paymentDate: nowIso.split("T")[0],
          status: "PAID",
          paymentMethod: order.paymentMethod,
          source: "TRAY",
          autoCleared: true,
          autoClearedAt: nowIso,
          clearingChannel: "TRAY",
          transactionCode: `TRAY-PAY-${externalOrderId}`,
          createdAt: nowIso,
          updatedAt: nowIso
        });
      } else if (existingRec.status !== "PAID") {
        db.autoClearReceivablePayment({
          receivableId: existingRec.id,
          channel: "TRAY",
          transactionCode: `TRAY-PAY-${externalOrderId}`,
          notes: "Baixa autom\xE1tica disparada via Webhook Tray E-commerce (order.paid)",
          operatorOrService: "Webhook Tray"
        });
      }
      db.addIntegrationLog({
        id: `intlog-${Date.now()}`,
        integration: "TRAY",
        eventType,
        externalId: externalOrderId,
        idempotencyKey,
        status: "SUCCESS",
        attempts: (existingLog?.attempts || 0) + 1,
        payloadOriginal: payload,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      db.addAuditLog({
        id: `aud-${Date.now()}`,
        action: "TRAY_ORDER_SYNCED",
        origin: "TrayAdapter.handleWebhook",
        entity: "Order",
        entityId: order.id,
        newValue: {
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          customer: customer.name
        },
        userOrService: "Tray Webhook Service",
        correlationId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return {
        success: true,
        message: `Pedido #${externalOrderId} da Tray processado e integrado com sucesso.`,
        orderId: order.id,
        alreadyProcessed: false
      };
    } catch (err) {
      console.error(`[TrayAdapter] Erro ao processar webhook da Tray #${externalOrderId}:`, err);
      db.addIntegrationLog({
        id: `intlog-${Date.now()}`,
        integration: "TRAY",
        eventType,
        externalId: externalOrderId,
        idempotencyKey,
        status: "FAILED",
        attempts: (existingLog?.attempts || 0) + 1,
        payloadOriginal: payload,
        errorMessage: err.message,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      throw err;
    }
  }
  buildStandardOrderMock(orderId) {
    return {
      Order: {
        id: orderId,
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        hour: "10:15:00",
        status: "approved",
        total: 7850,
        subtotal: 7500,
        taxes: 0,
        discount: 0,
        shipment_value: 120,
        shipment: "Flind Express Transportes",
        payment_method_type: "BOLETO_BANCARIO",
        Customer: {
          id: 994,
          name: "Hospital S\xE3o Camilo - Centro Cir\xFArgico & CAF",
          cnpj: "14.285.932/0001-44",
          email: "suprimentos@saocamilo.org.br",
          phone: "+55 11 98452-1100",
          address: "Av. Paulista",
          number: "1842",
          complement: "Galp\xE3o CAF - Insumos e Descart\xE1veis",
          neighborhood: "Bela Vista",
          city: "S\xE3o Paulo",
          state: "SP",
          zip_code: "01310-200"
        },
        ProductsOrder: [
          {
            ProductOrder: {
              product_id: 8820,
              reference: "FLIND-TOALET-CX6",
              name: "Saco de Urina, V\xF4mito, Enjoo - Caixa com 6 Toalet Descart\xE1vel Flind",
              quantity: 50,
              cost_price: 38.5,
              price: 65.15,
              weight: 12
            }
          },
          {
            ProductOrder: {
              product_id: 8821,
              reference: "FLIND-MSC-TRIP-MEDIX",
              name: "M\xE1scara Tripla Descart\xE1vel Medix - Cx c/ 50 un",
              quantity: 30,
              cost_price: 4.8,
              price: 7.75,
              weight: 4.5
            }
          }
        ]
      }
    };
  }
};
var trayAdapter = new TrayAdapter();

// src/server/integrations/sink-erp/sink-erp-adapter.ts
var SinkERPProvider = class {
  constructor() {
    this.providerName = "SINK_ERP";
    this.apiUrl = process.env.SINK_ERP_API_URL || "";
    this.apiKey = process.env.SINK_ERP_API_KEY || "";
    this.token = process.env.SINK_ERP_TOKEN || "";
    this.isConfigured = Boolean(this.apiUrl && (this.apiKey || this.token));
  }
  /**
   * Helper para requisições seguras com timeout e headers
   */
  async request(endpoint, options = {}) {
    if (!this.isConfigured) {
      console.warn(
        `[SinkERPProvider] Integra\xE7\xE3o SINK ERP em modo aguardando documenta\xE7\xE3o oficial. Endpoint solicitado: ${endpoint}`
      );
      return null;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...this.apiKey ? { "X-API-KEY": this.apiKey } : {},
          ...this.token ? { Authorization: `Bearer ${this.token}` } : {},
          ...options.headers || {}
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `[SINK ERP API ERROR] HTTP ${response.status} em ${endpoint}: ${errorText}`
        );
      }
      return await response.json();
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error(`[SINK ERP TIMEOUT] Tempo limite de 10s esgotado para o endpoint: ${endpoint}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  /**
   * Sincronização de Clientes no SINK ERP
   */
  async syncCustomer(customer) {
    if (this.isConfigured) {
      try {
        const result = await this.request("/customers/sync", {
          method: "POST",
          body: JSON.stringify({
            codigo_integracao: customer.id,
            razao_social: customer.name,
            nome_fantasia: customer.tradeName || customer.name,
            cnpj_cpf: customer.taxId,
            email: customer.email,
            telefone: customer.phone
          })
        });
        return {
          erpCustomerId: result?.erpId || `SINK-CUST-${customer.id}`,
          synced: true
        };
      } catch (err) {
        console.error("[SinkERPProvider] Falha ao sincronizar cliente com SINK ERP:", err);
        throw err;
      }
    }
    return {
      erpCustomerId: `SINK-CUST-${customer.taxId.replace(/\D/g, "").slice(0, 8)}`,
      synced: false
    };
  }
  /**
   * Sincronização de Produtos e Catálogo Fabril
   */
  async syncProducts() {
    if (this.isConfigured) {
      const data = await this.request("/products");
      if (data && Array.isArray(data)) {
        return data.map((item) => ({
          sku: item.codigo_sku,
          name: item.descricao,
          unit: item.unidade_medida || "UN",
          currentStock: Number(item.saldo_estoque) || 0,
          reservedStock: Number(item.saldo_reservado) || 0,
          costPrice: Number(item.preco_custo) || 0,
          salePrice: Number(item.preco_venda) || 0
        }));
      }
    }
    return [
      {
        sku: "FLIND-TOALET-CX6",
        name: "Saco de Urina, V\xF4mito, Enjoo - Caixa com 6 Toalet Descart\xE1vel",
        unit: "CX",
        currentStock: 480,
        reservedStock: 35,
        costPrice: 38.5,
        salePrice: 65.15
      },
      {
        sku: "FLIND-TOALET-PCT10",
        name: "Saco de Enjoo - Toalet Descart\xE1vel Pacote com 10 Unid",
        unit: "PCT",
        currentStock: 320,
        reservedStock: 25,
        costPrice: 58,
        salePrice: 95.75
      },
      {
        sku: "FLIND-TOALET-KIT10-SUP",
        name: "Saco de Urina, V\xF4mito, Enjoo - Kit 10 Toalet Descart\xE1vel + 1 Suporte",
        unit: "KIT",
        currentStock: 190,
        reservedStock: 15,
        costPrice: 64,
        salePrice: 104.85
      },
      {
        sku: "FLIND-EQP-MULTIVIAS-2V",
        name: "Equipo Multivias 2 Vias com Clamp (Extensor)",
        unit: "UN",
        currentStock: 2400,
        reservedStock: 300,
        costPrice: 0.65,
        salePrice: 1.17
      },
      {
        sku: "FLIND-EQP-MACRO-LUER",
        name: "Equipo Macrogotas Luer Slip c/ Filtro e Inj.",
        unit: "UN",
        currentStock: 1850,
        reservedStock: 200,
        costPrice: 0.95,
        salePrice: 1.67
      },
      {
        sku: "FLIND-LUV-LIMP-AMAR",
        name: "Luva de Limpeza Amarela Multiuso",
        unit: "PAR",
        currentStock: 820,
        reservedStock: 80,
        costPrice: 1.4,
        salePrice: 2.53
      },
      {
        sku: "FLIND-ABA-LINGUA-MD",
        name: "Abaixador de L\xEDngua em Madeira - Pacote c/ 100 un",
        unit: "PCT",
        currentStock: 640,
        reservedStock: 45,
        costPrice: 4.1,
        salePrice: 6.95
      },
      {
        sku: "FLIND-MSC-TRIP-MEDIX",
        name: "M\xE1scara Tripla Descart\xE1vel | Medix - Cx c/ 50 un",
        unit: "CX",
        currentStock: 520,
        reservedStock: 60,
        costPrice: 4.8,
        salePrice: 7.75
      },
      {
        sku: "FLIND-MSC-CIR-DESCARPACK",
        name: "M\xE1scara Cir\xFArgica Tripla com Tiras Descarpack - Cx c/ 50 un",
        unit: "CX",
        currentStock: 410,
        reservedStock: 50,
        costPrice: 5.9,
        salePrice: 9.5
      },
      {
        sku: "FLIND-PRO-PE-TNT",
        name: "Pro P\xE9 TNT Descart\xE1vel com El\xE1stico - Pacote c/ 100 un",
        unit: "PCT",
        currentStock: 780,
        reservedStock: 70,
        costPrice: 8.5,
        salePrice: 14.9
      },
      {
        sku: "FLIND-LUV-VINIL-SPO",
        name: "Luvas de Vinil sem P\xF3 para Procedimento - Cx c/ 100 un",
        unit: "CX",
        currentStock: 390,
        reservedStock: 40,
        costPrice: 16,
        salePrice: 26.5
      },
      {
        sku: "FLIND-LEN-TNT-ELAST",
        name: "Len\xE7ol em TNT com El\xE1stico Descarpack - Pacote c/ 10 un",
        unit: "PCT",
        currentStock: 260,
        reservedStock: 30,
        costPrice: 22,
        salePrice: 38
      },
      {
        sku: "FLIND-ENX-ROUPA-ENF",
        name: "Roupa para Profissionais de Sa\xFAde / Enfermeiro (Scrub)",
        unit: "CONJ",
        currentStock: 140,
        reservedStock: 12,
        costPrice: 42,
        salePrice: 79.9
      },
      {
        sku: "FLIND-ENX-CAMISOLA-PAC",
        name: "Camisola para Pacientes Hospitalar",
        unit: "UN",
        currentStock: 210,
        reservedStock: 20,
        costPrice: 18,
        salePrice: 34.5
      },
      {
        sku: "FLIND-ENX-TOALHA-HOSP",
        name: "Toalha de Banho Hospitalar Alta Absor\xE7\xE3o",
        unit: "UN",
        currentStock: 310,
        reservedStock: 25,
        costPrice: 14.5,
        salePrice: 28
      }
    ];
  }
  /**
   * Sincronização de Saldos de Estoque em Tempo Real
   */
  async syncInventory(skus) {
    if (this.isConfigured) {
      const query = skus && skus.length > 0 ? `?skus=${skus.join(",")}` : "";
      const data = await this.request(`/inventory/balances${query}`);
      if (data && Array.isArray(data)) {
        return data;
      }
    }
    return [
      { sku: "FLIND-TOALET-CX6", warehouseId: "GALPAO-TOALET", availableQuantity: 445, updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
      { sku: "FLIND-MSC-TRIP-MEDIX", warehouseId: "ALMOX-DESCARTAVEIS", availableQuantity: 460, updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
      { sku: "FLIND-EQP-MULTIVIAS-2V", warehouseId: "ALMOX-DESCARTAVEIS", availableQuantity: 2100, updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
      { sku: "FLIND-ENX-ROUPA-ENF", warehouseId: "DEPOSITO-ENXOVAL", availableQuantity: 128, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }
    ];
  }
  /**
   * Envia Pedido para faturamento no SINK ERP
   */
  async createOrder(order) {
    if (this.isConfigured) {
      const payload = {
        numero_pedido_origem: order.orderNumber,
        canal: order.source,
        cliente_id: order.customerId,
        valor_total: order.totalAmount,
        itens: order.items.map((i) => ({
          sku: i.sku,
          quantidade: i.quantity,
          preco_unitario: i.unitPrice
        }))
      };
      const result = await this.request("/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      return {
        erpProtocol: result?.protocolo || `ERP-${Math.floor(1e4 + Math.random() * 9e4)}`,
        erpOrderId: result?.id || `SINK-ORD-${order.id}`,
        status: result?.status || "RECEBIDO",
        synchronizedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const protocolNumber = `ERP-${Math.floor(1e4 + Math.random() * 9e4)}`;
    return {
      erpProtocol: protocolNumber,
      erpOrderId: `SINK-ORD-${order.orderNumber.replace("#", "")}`,
      status: "RECEBIDO_FILA_FATURAMENTO",
      synchronizedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Consulta de NF-e e Faturamento
   */
  async getInvoiceByOrder(orderId) {
    const order = db.getOrderById(orderId);
    if (!order || !order.invoiceNumber) {
      return null;
    }
    if (this.isConfigured) {
      const data = await this.request(`/orders/${orderId}/invoice`);
      if (data) return data;
    }
    return {
      invoiceNumber: order.invoiceNumber,
      series: "1",
      accessKey: order.invoiceKey || `352609000000000001005500100000${order.invoiceNumber.replace(/\D/g, "")}1234567890`,
      issuedAt: order.updatedAt,
      totalAmount: order.totalAmount,
      taxAmount: order.totalAmount * 0.12
      // Exemplo ICMS/IPI
    };
  }
  /**
   * Sincronização de Títulos e Duplicatas a Receber
   */
  async syncReceivables() {
    if (this.isConfigured) {
      const data = await this.request("/financial/receivables");
      if (data && Array.isArray(data)) {
        return data;
      }
    }
    return db.getReceivables();
  }
  /**
   * Consulta de Ordens de Produção (Rastreabilidade de Chão de Fábrica)
   */
  async syncProductionOrders() {
    if (this.isConfigured) {
      const data = await this.request("/pcp/production-orders");
      if (data && Array.isArray(data)) {
        return data;
      }
    }
    return [
      {
        productionOrderId: "OP-2026-901",
        productSku: "FLIND-TOALET-CX6",
        batchNumber: "LOTE-FLIND-TOA-01",
        plannedQuantity: 500,
        producedQuantity: 500,
        status: "COMPLETED",
        startedAt: "2026-09-18T07:00:00Z",
        completedAt: "2026-09-19T16:30:00Z"
      },
      {
        productionOrderId: "OP-2026-905",
        productSku: "FLIND-MSC-TRIP-MEDIX",
        batchNumber: "LOTE-FLIND-MSC-02",
        plannedQuantity: 600,
        producedQuantity: 600,
        status: "COMPLETED",
        startedAt: "2026-09-19T08:00:00Z",
        completedAt: "2026-09-20T14:00:00Z"
      },
      {
        productionOrderId: "OP-2026-912",
        productSku: "FLIND-ENX-ROUPA-ENF",
        batchNumber: "LOTE-FLIND-ENX-04",
        plannedQuantity: 200,
        producedQuantity: 140,
        status: "IN_PRODUCTION",
        startedAt: "2026-09-22T06:30:00Z"
      }
    ];
  }
  /**
   * Consulta de Apropriação de Custos Industriais
   */
  async syncProductionCosts() {
    if (this.isConfigured) {
      const data = await this.request("/costs/industrial");
      if (data && Array.isArray(data)) {
        return data;
      }
    }
    return [
      { costCenter: "CC-ENVASAMENTO-01", category: "MATERIA_PRIMA", sku: "FLIND-TOALET-CX6", amount: 9800, date: "2026-09-21" },
      { costCenter: "CC-SOLDA-TERMO", category: "MAO_DE_OBRA_DIRETA", sku: "FLIND-MSC-TRIP-MEDIX", amount: 3250, date: "2026-09-20" },
      { costCenter: "CC-COSTURA-ENXOVAL", category: "ENERGIA_ELETRICA", sku: "FLIND-ENX-ROUPA-ENF", amount: 4100, date: "2026-09-19" }
    ];
  }
  /**
   * Verificação de Conectividade e Saúde da Integração
   */
  async checkHealth() {
    if (!this.isConfigured) {
      return {
        status: "PENDING_DOCS",
        message: "Adapter SINK ERP pronto. Aguardando documenta\xE7\xE3o oficial e credenciais em vari\xE1veis de ambiente (SINK_ERP_API_URL, SINK_ERP_API_KEY)."
      };
    }
    const tStart = Date.now();
    try {
      await this.request("/health");
      return {
        status: "CONNECTED",
        latencyMs: Date.now() - tStart,
        message: "Conex\xE3o ativa com a API do SINK ERP."
      };
    } catch (err) {
      return {
        status: "DISCONNECTED",
        latencyMs: Date.now() - tStart,
        message: `Falha ao conectar \xE0 API do SINK ERP: ${err.message}`
      };
    }
  }
};
var sinkERPProvider = new SinkERPProvider();

// src/server/integrations/whatsapp/whatsapp-provider.ts
function normalizePhoneForWhatsApp(phone) {
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "";
  if ((cleaned.length === 10 || cleaned.length === 11) && !cleaned.startsWith("55")) {
    cleaned = "55" + cleaned;
  }
  return cleaned;
}
var WhatsAppProvider = class {
  constructor() {
    this.providerName = "WHATSAPP_BUSINESS_CLOUD";
    this.apiUrl = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v21.0";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "fabrica_integrada_token_2026";
  }
  isConfigured() {
    return Boolean(this.accessToken && this.phoneNumberId);
  }
  getConfig() {
    return {
      isConfigured: this.isConfigured(),
      apiUrl: this.apiUrl,
      phoneNumberId: this.phoneNumberId,
      hasToken: Boolean(this.accessToken),
      maskedToken: this.accessToken ? `${this.accessToken.slice(0, 6)}...${this.accessToken.slice(-4)}` : "",
      webhookVerifyToken: this.webhookVerifyToken
    };
  }
  updateConfig(config2) {
    if (typeof config2.apiUrl === "string" && config2.apiUrl.trim()) this.apiUrl = config2.apiUrl.trim();
    if (typeof config2.accessToken === "string") this.accessToken = config2.accessToken.trim();
    if (typeof config2.phoneNumberId === "string") this.phoneNumberId = config2.phoneNumberId.trim();
    if (typeof config2.webhookVerifyToken === "string") this.webhookVerifyToken = config2.webhookVerifyToken.trim();
    return this.getConfig();
  }
  /**
   * Registra disparo manual/direto executado via WhatsApp Web ou App pelo operador
   */
  registerDirectSend(params) {
    const cleanPhone = normalizePhoneForWhatsApp(params.toPhone);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const providerMessageId = `web.WA${cleanPhone}-${Date.now().toString(36)}`;
    const log = {
      id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipientPhone: params.toPhone,
      customerName: params.customerName || "Cliente",
      receivableId: params.receivableId,
      orderId: params.orderId,
      templateName: params.templateName,
      parameters: params.parameters,
      status: "SENT",
      providerMessageId,
      sentAt: nowIso,
      direction: "OUTBOUND",
      createdAt: nowIso
    };
    db.addWhatsAppLog(log);
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "WHATSAPP_DIRECT_WEB_SENT",
      origin: "WhatsAppProvider.registerDirectSend",
      entity: "WhatsAppMessageLog",
      entityId: log.id,
      newValue: {
        template: params.templateName,
        recipient: params.toPhone,
        receivableId: params.receivableId,
        providerMessageId
      },
      userOrService: "UserOperator",
      correlationId: `corr-wpp-direct-${Date.now()}`,
      createdAt: nowIso
    });
    return log;
  }
  /**
   * Envio de mensagem com template aprovado pelo WhatsApp
   */
  async sendTemplateMessage(dto) {
    const cleanPhone = normalizePhoneForWhatsApp(dto.toPhone);
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    if (dto.mode === "meta" && !this.isConfigured()) {
      return {
        success: false,
        status: "FAILED",
        errorMessage: "Credenciais da Meta Cloud API (Access Token ou Phone Number ID) n\xE3o est\xE3o configuradas no servidor.",
        needsConfiguration: true
      };
    }
    const bodyParameters = Object.entries(dto.parameters).map(([key, val]) => ({
      type: "text",
      text: String(val)
    }));
    const customerName = dto.parameters.cliente || dto.parameters.nome || "Cliente";
    if (dto.mode !== "sandbox" && this.isConfigured()) {
      try {
        const endpoint = `${this.apiUrl}/${this.phoneNumberId}/messages`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.accessToken}`
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "template",
            template: {
              name: dto.templateName,
              language: { code: dto.languageCode || "pt_BR" },
              components: [
                {
                  type: "body",
                  parameters: bodyParameters
                }
              ]
            }
          })
        });
        const resData = await response.json();
        if (!response.ok) {
          const errMessage = resData?.error?.message || `HTTP ${response.status}: Falha na Meta API`;
          const errorLog = {
            id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            recipientPhone: dto.toPhone,
            customerName,
            receivableId: dto.receivableId,
            orderId: dto.orderId,
            templateName: dto.templateName,
            parameters: dto.parameters,
            status: "FAILED",
            errorMessage: errMessage,
            direction: "OUTBOUND",
            createdAt: nowIso
          };
          db.addWhatsAppLog(errorLog);
          return {
            success: false,
            status: "FAILED",
            errorMessage: errMessage,
            metaDetails: resData?.error
          };
        }
        const providerMessageId = resData?.messages?.[0]?.id || `wamid.${Date.now()}`;
        const successLog = {
          id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          recipientPhone: dto.toPhone,
          customerName,
          receivableId: dto.receivableId,
          orderId: dto.orderId,
          templateName: dto.templateName,
          parameters: dto.parameters,
          status: "SENT",
          providerMessageId,
          sentAt: nowIso,
          direction: "OUTBOUND",
          createdAt: nowIso
        };
        db.addWhatsAppLog(successLog);
        return {
          success: true,
          providerMessageId,
          status: "SENT",
          isSandbox: false
        };
      } catch (err) {
        console.error("[WhatsAppProvider] Erro ao comunicar com API da Meta:", err);
        return {
          success: false,
          status: "FAILED",
          errorMessage: `Erro de conex\xE3o com Meta Graph API: ${err.message}`
        };
      }
    }
    const mockMessageId = `wamid.HBgL${cleanPhone}MRIA${Date.now().toString(36)}`;
    const log = {
      id: `wlog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      recipientPhone: dto.toPhone,
      customerName,
      receivableId: dto.receivableId,
      orderId: dto.orderId,
      templateName: dto.templateName,
      parameters: dto.parameters,
      status: "SENT",
      providerMessageId: mockMessageId,
      sentAt: nowIso,
      deliveredAt: new Date(Date.now() + 2e3).toISOString(),
      direction: "OUTBOUND",
      createdAt: nowIso
    };
    db.addWhatsAppLog(log);
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "WHATSAPP_MESSAGE_SENT",
      origin: "WhatsAppProvider.sendTemplateMessage",
      entity: "WhatsAppMessageLog",
      entityId: log.id,
      newValue: {
        template: dto.templateName,
        recipient: dto.toPhone,
        receivableId: dto.receivableId,
        isSandbox: true
      },
      userOrService: "CollectionAutomationService",
      correlationId: `corr-wpp-${Date.now()}`,
      createdAt: nowIso
    });
    return {
      success: true,
      providerMessageId: mockMessageId,
      status: "SENT",
      isSandbox: true
    };
  }
  /**
   * Validação de Verificação do Webhook da Meta
   * GET /api/integrations/whatsapp/webhook?hub.mode=subscribe&hub.challenge=...
   */
  verifyWebhookChallenge(mode, token, challenge) {
    if (mode === "subscribe" && token === this.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }
  /**
   * Processador de Eventos de Status Recebidos via Webhook
   * POST /api/integrations/whatsapp/webhook
   */
  async handleWebhookStatus(body) {
    const updates = [];
    try {
      const entries = body?.entry || [];
      for (const entry of entries) {
        const changes = entry?.changes || [];
        for (const change of changes) {
          if (change?.value?.statuses) {
            for (const statusObj of change.value.statuses) {
              const msgId = statusObj.id;
              const statusName = statusObj.status;
              const timestamp = statusObj.timestamp ? new Date(Number(statusObj.timestamp) * 1e3).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
              const updateDTO = {
                providerMessageId: msgId,
                status: statusName,
                timestamp,
                recipientId: statusObj.recipient_id
              };
              if (statusObj.errors && statusObj.errors.length > 0) {
                updateDTO.error = {
                  code: statusObj.errors[0].code,
                  message: statusObj.errors[0].title || statusObj.errors[0].message
                };
              }
              updates.push(updateDTO);
              const mappedStatus = statusName === "sent" ? "SENT" : statusName === "delivered" ? "DELIVERED" : statusName === "read" ? "READ" : "FAILED";
              db.updateWhatsAppLogStatus(msgId, mappedStatus, timestamp);
            }
          }
        }
      }
    } catch (err) {
      console.error("[WhatsAppProvider] Erro ao decodificar webhook da Meta:", err);
    }
    return updates;
  }
};
var whatsappProvider = new WhatsAppProvider();

// src/server/services/rule-engine.ts
var RuleEngine = class {
  /**
   * Avalia todas as regras de SLA para pedidos em andamento
   */
  evaluateOrderSlas() {
    const orders = db.getOrders();
    const slaRules = db.getSlaRules().filter((r) => r.active);
    const generatedAlerts = [];
    const now = Date.now();
    for (const order of orders) {
      if (order.status === "DELIVERED" || order.status === "CANCELLED") {
        continue;
      }
      for (const event of order.timeline) {
        if (event.status === "IN_PROGRESS" || event.status === "DELAYED") {
          const rule = slaRules.find((r) => r.fromStage === event.stage || r.toStage === event.stage);
          const slaLimitMinutes = event.expectedSlaMinutes || rule?.slaMinutes || 120;
          if (event.startedAt) {
            const startMs = new Date(event.startedAt).getTime();
            const elapsedMinutes = Math.floor((now - startMs) / 6e4);
            if (elapsedMinutes > slaLimitMinutes) {
              event.status = "DELAYED";
              event.durationMinutes = elapsedMinutes;
              const delayMinutes = elapsedMinutes - slaLimitMinutes;
              const severity = delayMinutes > 120 ? "CRITICAL" : "WARNING";
              const alert = {
                id: `alt-sla-${order.id}-${event.stage}`,
                severity,
                type: "SLA_BREACH",
                entityType: "ORDER",
                entityId: order.id,
                message: `Etapa "${event.stageLabel}" do Pedido ${order.orderNumber} ultrapassou o SLA de ${slaLimitMinutes} min (tempo atual: ${elapsedMinutes} min, atraso: +${delayMinutes} min).`,
                ruleResponsible: rule?.name || `SLA ${slaLimitMinutes}m para ${event.stageLabel}`,
                responsible: event.responsible || "Equipe Operacional",
                status: "PENDING",
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              };
              const savedAlert = db.addAlert(alert);
              generatedAlerts.push(savedAlert);
              db.upsertOrder(order);
            }
          }
        }
      }
    }
    return generatedAlerts;
  }
  /**
   * Validação de Regras de Entrega para o Local de Destino
   * Executado antes da expedição e faturamento
   */
  validateDeliveryRules(order, shipmentOptions) {
    const errors = [];
    const warnings = [];
    const deliveryAddressId = order.deliveryAddressId;
    const rule = db.getDeliveryRuleByAddressId(deliveryAddressId);
    if (!rule) {
      return { valid: true, errors: [], warnings: [] };
    }
    if (rule.requiresScheduling) {
      const scheduledAt = shipmentOptions?.schedulingScheduledAt;
      if (!scheduledAt) {
        errors.push(
          `Destino exige agendamento obrigat\xF3rio com anteced\xEAncia e nenhum agendamento foi registrado para o endere\xE7o (${rule.entryGate || "Recep\xE7\xE3o"}).`
        );
      }
    }
    const totalOrderWeight = order.items.reduce((sum, item) => sum + (item.weightKg || 0) * item.quantity, 0);
    if (rule.maxWeightKg && totalOrderWeight > rule.maxWeightKg) {
      errors.push(
        `Peso total do pedido (${totalOrderWeight.toLocaleString("pt-BR")} kg) excede o limite m\xE1ximo permitido pelo local (${rule.maxWeightKg.toLocaleString("pt-BR")} kg).`
      );
    }
    const vehicleRanking = {
      QUALQUER: 0,
      VUC: 1,
      TOCO: 2,
      TRUCK: 3,
      CARRETA: 4
    };
    if (shipmentOptions?.selectedVehicleType && rule.vehicleTypeAllowed !== "QUALQUER") {
      const allowedRank = vehicleRanking[rule.vehicleTypeAllowed] || 0;
      const selectedRank = vehicleRanking[shipmentOptions.selectedVehicleType] || 0;
      if (selectedRank > allowedRank) {
        warnings.push(
          `Ve\xEDculo selecionado (${shipmentOptions.selectedVehicleType}) \xE9 superior ao padr\xE3o m\xE1ximo autorizado para este destino (${rule.vehicleTypeAllowed}). Risco de recusa na portaria.`
        );
      }
    }
    if (rule.requiresDocumentation && !order.invoiceNumber) {
      warnings.push(
        `Local de entrega exige documenta\xE7\xE3o fiscal impressa completa no momento da recep\xE7\xE3o (${rule.notes || "EPI e Documenta\xE7\xE3o"}).`
      );
    }
    const isValid = errors.length === 0;
    if (!isValid) {
      db.addAlert({
        id: `alt-deliv-${order.id}`,
        severity: "CRITICAL",
        type: "DELIVERY_RULE_VIOLATION",
        entityType: "ORDER",
        entityId: order.id,
        message: `Bloqueio de Expedi\xE7\xE3o: ${errors.join(" | ")}`,
        ruleResponsible: `Regra de Entrega: ${rule.entryGate || rule.addressId}`,
        responsible: rule.contactName,
        status: "PENDING",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    return {
      valid: isValid,
      errors,
      warnings,
      deliveryRule: rule
    };
  }
  /**
   * Motor de Automação de Cobrança (Collection Engine)
   * Processa:
   * 1. Alerta com 5 dias de antecedência do vencimento (D-5)
   * 2. Lembrete no dia do vencimento (D0)
   * 3. Disparo diário automático para todos os títulos pós-vencimento (D+1, D+2, D+3... diário)
   * Garante:
   * 1. Idempotência por dia e por evento
   * 2. Cancelamento automático caso o título já tenha sido pago pelo cliente
   * 3. Verificação de horário comercial permitido
   */
  async executeCollectionAutomation() {
    const receivables = db.getReceivables();
    const now = /* @__PURE__ */ new Date();
    const todayStr = now.toISOString().split("T")[0];
    const currentHourStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    let processed = 0;
    let messagesSent = 0;
    let alertsCreated = 0;
    let cancelledDueToPaid = 0;
    for (const rec of receivables) {
      processed++;
      if (rec.status === "PAID" || rec.status === "CANCELLED") {
        cancelledDueToPaid++;
        continue;
      }
      const dueTime = new Date(rec.dueDate).getTime();
      const todayTime = new Date(todayStr).getTime();
      const diffDays = Math.round((todayTime - dueTime) / 864e5);
      if (diffDays === 0 && rec.status !== "DUE_TODAY") {
        rec.status = "DUE_TODAY";
        db.upsertReceivable(rec);
      } else if (diffDays > 0 && rec.status !== "OVERDUE") {
        rec.status = "OVERDUE";
        db.upsertReceivable(rec);
      } else if (diffDays < 0 && diffDays >= -5 && rec.status === "OPEN") {
        rec.status = "DUE_SOON";
        db.upsertReceivable(rec);
      }
      const customer = db.getCustomerById(rec.customerId);
      const customerName = rec.customerName || customer?.name || "Cliente";
      const customerPhone = customer?.phone || "+55 11 99999-0000";
      const formattedAmount = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(rec.amount);
      const baseParams = {
        cliente: customerName,
        numero: rec.documentNumber,
        valor: formattedAmount,
        data: new Date(rec.dueDate).toLocaleDateString("pt-BR"),
        dados_pagamento: rec.pixCode ? `Chave PIX: ${rec.pixCode.slice(0, 32)}...` : rec.barcode ? `Linha Digit\xE1vel: ${rec.barcode}` : "Consulte o portal financeiro para emiss\xE3o da 2\xAA via."
      };
      if (diffDays === -5) {
        const alreadySentD5 = db.getWhatsAppLogs().some(
          (w) => w.receivableId === rec.id && (w.templateName === "alerta_vencimento_5dias" || w.templateName.includes("5dias"))
        );
        if (!alreadySentD5) {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customerPhone,
            templateName: "alerta_vencimento_5dias",
            parameters: {
              ...baseParams,
              aviso: "Lembrete amig\xE1vel: sua fatura vence em 5 dias.",
              dias_para_vencer: "5"
            },
            receivableId: rec.id,
            orderId: rec.orderId
          });
          messagesSent++;
        }
      } else if (diffDays === 0) {
        const alreadySentD0 = db.getWhatsAppLogs().some(
          (w) => w.receivableId === rec.id && (w.templateName === "lembrete_vence_hoje" || w.templateName.includes("vence_hoje"))
        );
        if (!alreadySentD0) {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customerPhone,
            templateName: "lembrete_vence_hoje",
            parameters: {
              ...baseParams,
              aviso: "Sua fatura vence hoje. Efetue o pagamento para evitar encargos."
            },
            receivableId: rec.id,
            orderId: rec.orderId
          });
          messagesSent++;
        }
      } else if (diffDays > 0) {
        const sentToday = db.getWhatsAppLogs().some(
          (w) => w.receivableId === rec.id && w.createdAt && w.createdAt.startsWith(todayStr)
        );
        if (!sentToday) {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customerPhone,
            templateName: "cobranca_diaria_atraso",
            parameters: {
              ...baseParams,
              dias_atraso: `${diffDays} dia(s)`,
              aviso: `T\xEDtulo vencido h\xE1 ${diffDays} dia(s). Regularize via Pix para libera\xE7\xE3o imediata.`
            },
            receivableId: rec.id,
            orderId: rec.orderId
          });
          messagesSent++;
        }
        if (diffDays >= 7) {
          const existingAlert = db.getAlerts().find((a) => a.id === `alt-rec-overdue-${rec.id}` && a.status === "PENDING");
          if (!existingAlert) {
            db.addAlert({
              id: `alt-rec-overdue-${rec.id}`,
              severity: "CRITICAL",
              type: "OVERDUE_RECEIVABLE",
              entityType: "RECEIVABLE",
              entityId: rec.id,
              message: `Cobran\xE7a Di\xE1ria Ativa: T\xEDtulo ${rec.documentNumber} (${formattedAmount}) do cliente ${customerName} est\xE1 ${diffDays} dias em atraso.`,
              ruleResponsible: "Cobran\xE7a Di\xE1ria P\xF3s-Vencimento WhatsApp",
              responsible: "Cobran\xE7a Financeira",
              status: "PENDING",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            });
            alertsCreated++;
          }
        }
      }
    }
    return {
      processed,
      messagesSent,
      alertsCreated,
      cancelledDueToPaid
    };
  }
};
var ruleEngine = new RuleEngine();

// src/server/services/shipping-service.ts
import QRCode from "qrcode";
import crypto from "crypto";
var ShippingService = class {
  /**
   * Gera ou recupera a expedição/rastreabilidade de um pedido com token único e seguro
   */
  async getOrCreateShipment(orderId, options) {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error(`Pedido ${orderId} n\xE3o encontrado.`);
    }
    let shipment = db.getShipmentByOrderId(orderId);
    if (shipment) {
      if (options) {
        if (options.carrierName) shipment.carrierName = options.carrierName;
        if (options.volumesCount) shipment.volumesCount = options.volumesCount;
        if (options.selectedVehicleType) shipment.selectedVehicleType = options.selectedVehicleType;
        if (options.notes) shipment.notes = options.notes;
        db.upsertShipment(shipment);
      }
      return shipment;
    }
    const randomHex = crypto.randomBytes(6).toString("hex");
    const orderShortNum = order.orderNumber.replace("#", "");
    const trackingToken = `trc_${orderShortNum}_${randomHex}`;
    const totalWeightKg = order.items.reduce(
      (acc, item) => acc + (item.weightKg || 1) * item.quantity,
      0
    );
    shipment = {
      id: `ship-${Date.now()}-${randomHex}`,
      trackingToken,
      orderId: order.id,
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber || "NF-PENDENTE",
      invoiceKey: order.invoiceKey,
      carrierName: options?.carrierName || "Braspress Transportes Urgentes",
      trackingCode: `TRK-${Math.floor(1e6 + Math.random() * 9e6)}`,
      volumesCount: options?.volumesCount || Math.max(1, Math.ceil(order.items.length / 2)),
      totalWeightKg: totalWeightKg || 50,
      selectedVehicleType: options?.selectedVehicleType || "TRUCK",
      status: "WAITING_DISPATCH",
      notes: options?.notes || "Carga paletizada. Manusear com cuidado.",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    db.upsertShipment(shipment);
    order.trackingToken = trackingToken;
    db.upsertOrder(order);
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "SHIPMENT_CREATED",
      origin: "ShippingService.getOrCreateShipment",
      entity: "Shipment",
      entityId: shipment.id,
      newValue: {
        orderNumber: shipment.orderNumber,
        trackingToken: shipment.trackingToken,
        carrierName: shipment.carrierName
      },
      userOrService: "Expedition Operator",
      correlationId: `corr-ship-${shipment.id}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    return shipment;
  }
  /**
   * Gera os dados completos da Etiqueta de Expedição com QR Code embutido
   */
  async generateShippingLabel(orderId) {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error(`Pedido ${orderId} n\xE3o encontrado.`);
    }
    const shipment = await this.getOrCreateShipment(orderId);
    const customer = db.getCustomerById(order.customerId);
    const address = db.getAddressById(order.deliveryAddressId);
    const rule = address ? db.getDeliveryRuleByAddressId(address.id) : void 0;
    const appUrl = process.env.APP_URL || "";
    const trackingUrl = appUrl ? `${appUrl}/trace/${shipment.trackingToken}` : `/trace/${shipment.trackingToken}`;
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 260,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    });
    const labelItems = order.items.map((it) => {
      const prod = db.getProductBySku(it.sku) || db.getProductById(it.productId);
      const packagingUnit = it.packagingUnit || prod?.packagingUnit || "Caixa (CX)";
      const unitsPerPackage = it.unitsPerPackage || prod?.unitsPerPackage || 50;
      const weightKg = (it.weightKg || prod?.weightPerPackageKg || 12) * it.quantity;
      const lotNumber = it.lotNumber || prod?.lotNumber || "LOTE-FLIND-2026";
      const manufactureDate = it.manufactureDate || prod?.manufactureDate || "2026-08-15";
      const expiryDate = it.expiryDate || prod?.expiryDate || "2029-08-15";
      const totalUnitsInVolume = it.quantity * unitsPerPackage;
      return {
        sku: it.sku,
        title: it.title,
        quantity: it.quantity,
        packagingUnit,
        unitsPerPackage,
        totalUnitsInVolume,
        weightKg,
        lotNumber,
        manufactureDate,
        expiryDate
      };
    });
    return {
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber || "NF-e em Emiss\xE3o",
      invoiceKey: order.invoiceKey,
      customerName: customer?.name || "Cliente F\xE1brica Integrada",
      customerTaxId: customer?.taxId || "CNPJ n\xE3o informado",
      carrierName: shipment.carrierName,
      trackingCode: shipment.trackingCode,
      deliveryAddress: {
        street: address?.street || "Endere\xE7o Principal",
        number: address?.number || "S/N",
        complement: address?.complement,
        neighborhood: address?.neighborhood || "",
        city: address?.city || "S\xE3o Paulo",
        state: address?.state || "SP",
        zipCode: address?.zipCode || "00000-000",
        entryGate: rule?.entryGate
      },
      volumesCount: shipment.volumesCount,
      totalWeightKg: shipment.totalWeightKg,
      notes: shipment.notes || rule?.notes || "Conferir no ato da entrega.",
      trackingToken: shipment.trackingToken,
      trackingUrl,
      qrCodeDataUrl,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      items: labelItems,
      primaryItem: labelItems[0]
    };
  }
  /**
   * Consulta pública autorizada via token de rastreabilidade
   * /trace/{token}
   */
  getTraceabilityByToken(token) {
    const shipment = db.getShipmentByToken(token);
    if (!shipment) {
      return null;
    }
    const order = db.getOrderById(shipment.orderId);
    if (!order) {
      return null;
    }
    const customer = db.getCustomerById(order.customerId);
    const address = db.getAddressById(order.deliveryAddressId);
    return {
      token: shipment.trackingToken,
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber,
      carrierName: shipment.carrierName,
      trackingCode: shipment.trackingCode,
      status: shipment.status,
      volumesCount: shipment.volumesCount,
      totalWeightKg: shipment.totalWeightKg,
      destinationCityState: address ? `${address.city} - ${address.state}` : "N\xE3o informado",
      recipientName: customer?.name ? `${customer.name.slice(0, 15)}... (Protegido LGPD)` : "Destinat\xE1rio Autorizado",
      timeline: order.timeline.map((t) => ({
        stageLabel: t.stageLabel,
        status: t.status,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
        notes: t.notes
      })),
      products: order.items.map((i) => ({
        sku: i.sku,
        title: i.title,
        quantity: i.quantity,
        lotNumber: i.lotNumber
      })),
      updatedAt: order.updatedAt
    };
  }
};
var shippingService = new ShippingService();

// src/server/routes/api.ts
import * as XLSX2 from "xlsx";

// src/server/services/excel-inventory-service.ts
import * as XLSX from "xlsx";
function normalizeHeaderKey(header) {
  return String(header || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}
var FIELD_ALIASES = {
  sku: [
    "sku",
    "codigo",
    "cod",
    "codproduto",
    "codigoproduto",
    "coddoproduto",
    "codigodoproduto",
    "coditem",
    "codigoitem",
    "coddoitem",
    "codigodoitem",
    "referencia",
    "ref",
    "referenciadoproduto",
    "partnumber",
    "idproduto",
    "id",
    "material",
    "codigomaterial",
    "coderp",
    "codigoerp",
    "codigointerno",
    "codinterno",
    "c\xF3digo",
    "c\xF3d",
    "itemcode",
    "productcode"
  ],
  name: [
    "nome",
    "descricao",
    "descricaoproduto",
    "descricaodoproduto",
    "produto",
    "item",
    "titulo",
    "descricaodoitem",
    "nomedoproduto",
    "descricaocomercial",
    "nomecomercial",
    "especificacao",
    "mercadoria",
    "detalhes",
    "designacao",
    "productname",
    "description"
  ],
  category: [
    "categoria",
    "segmento",
    "departamento",
    "linha",
    "tipo",
    "grupodeproduto",
    "familiadeproduto",
    "grupo",
    "familia",
    "subgrupo",
    "classe",
    "category"
  ],
  packagingUnit: [
    "embalagem",
    "unidade",
    "unid",
    "und",
    "tipovolume",
    "packagingunit",
    "tipoembalagem",
    "unidadevolume",
    "volume",
    "unidadedemedida",
    "unidademedida",
    "um",
    "medida",
    "tipodevolume",
    "siglaum",
    "un",
    "unit"
  ],
  unitsPerPackage: [
    "unidadesporvolume",
    "unidadesporembalagem",
    "itensporcaixa",
    "fator",
    "fatorconversao",
    "fatorembalagem",
    "unitsperpackage",
    "unidadesporcaixa",
    "qtdporvolume",
    "fatorcaixa",
    "qtdvolume",
    "quantidadeporvolume",
    "multiplo",
    "unidadesporfardo",
    "fatorentrada",
    "embalagemfator",
    "qtdembalagem",
    "fatorunidades"
  ],
  currentStockPackages: [
    "estoquevolumes",
    "volumes",
    "saldovolumes",
    "caixas",
    "fardos",
    "pacotes",
    "currentstockpackages",
    "estoqueembalagens",
    "qtdvolumes",
    "qtdevolumes",
    "saldocaixas",
    "quantidadedevolumes",
    "estoqueatualvolumes",
    "saldo",
    "estoque",
    "qtd",
    "quantidade",
    "qtde",
    "saldoatual",
    "estoqueatual",
    "disponivel",
    "saldofisico",
    "estoquefisico",
    "posicao",
    "posicaofisica",
    "qtdestoque",
    "quant",
    "quantidadeatual",
    "estoquedisponivel",
    "saldofinal",
    "stock",
    "balance"
  ],
  currentStockUnits: [
    "estoqueunidades",
    "unidades",
    "saldounidades",
    "qtdunidades",
    "qtdeunidades",
    "currentstockunits",
    "saldounid",
    "pecas",
    "estoquetotalunidades",
    "quantidadedeunidades",
    "estoqueatualunidades",
    "saldoun",
    "qtdun",
    "unidestoque",
    "totalpecas",
    "unidadesestoque"
  ],
  minStockPackages: [
    "estoqueminimo",
    "minimovolumes",
    "pontopedido",
    "minstockpackages",
    "minimo",
    "estminimo",
    "estoqueminimovolumes",
    "minimocaixas",
    "estoquedeseguranca",
    "estseguranca",
    "pontoressuprimento",
    "min",
    "saldominimo",
    "qtdminima"
  ],
  unitWeightKg: [
    "pesounitario",
    "pesounit",
    "pesoliquido",
    "unitweightkg",
    "pesounitariokg",
    "pesounitkg",
    "pesokg",
    "pesoun",
    "pesoporunidade"
  ],
  weightPerPackageKg: [
    "pesovolume",
    "pesobruto",
    "pesocaixa",
    "weightperpackagekg",
    "pesofardo",
    "pesobrutokg",
    "pesoporvolume",
    "pesoporembalagem"
  ],
  costPrice: [
    "precocusto",
    "custo",
    "valorcusto",
    "custounitario",
    "costprice",
    "custounit",
    "precocustounitario",
    "customedio",
    "custoatual",
    "vlrcusto",
    "vlcusto",
    "precodecusto",
    "valorunitariocusto"
  ],
  salePrice: [
    "precovenda",
    "venda",
    "valorvenda",
    "saleprice",
    "preco",
    "precotabela",
    "precofinal",
    "valortabela",
    "precodevenda",
    "vlrvenda",
    "vlvenda",
    "precounitario",
    "valorunitario"
  ],
  lotNumber: [
    "lote",
    "numerolote",
    "lotnumber",
    "lotefabricacao",
    "partida",
    "numlote",
    "numerodelote",
    "lotes"
  ],
  manufactureDate: [
    "datafabricacao",
    "fabricacao",
    "datafab",
    "manufacturedate",
    "dtfabricacao",
    "dtfab",
    "datadefabricacao"
  ],
  expiryDate: [
    "datavalidade",
    "validade",
    "dataval",
    "vencimento",
    "expirydate",
    "dtvalidade",
    "dtvencimento",
    "dtval",
    "datadevalidade",
    "venc"
  ],
  shelfLifeMonths: [
    "vidautil",
    "mesesvalidade",
    "shelflifemonths",
    "validademeses",
    "prazoanos",
    "meses"
  ],
  location: [
    "localizacao",
    "local",
    "posicao",
    "rua",
    "enderecoestoque",
    "location",
    "deposito",
    "prateleira",
    "almoxarifado",
    "doca",
    "galpao",
    "box",
    "predio"
  ],
  supplierName: [
    "fornecedor",
    "nomefornecedor",
    "fabricante",
    "suppliername",
    "razaofornecedor",
    "fornecedorhomologado",
    "marca",
    "fornecedorprincipal",
    "razaosocial"
  ],
  barcode: [
    "ean",
    "barcode",
    "codigobarras",
    "gtin",
    "codigodebarras",
    "ean13",
    "codbarras",
    "codbarra"
  ]
};
function parseExcelDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? "" : val.toISOString().split("T")[0];
  }
  if (typeof val === "number") {
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1e3);
    if (!isNaN(dateInfo.getTime())) {
      return dateInfo.toISOString().split("T")[0];
    }
  }
  const str = String(val).trim();
  const brMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
  if (brMatch) {
    const [, d, m, y] = brMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const isoMatch = str.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return str;
}
function parseNumber(val, fallback = 0) {
  if (val === null || val === void 0 || val === "") return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  let str = String(val).replace(/R\$/gi, "").replace(/[$€£]/g, "").trim();
  if (!str) return fallback;
  const hasComma = str.includes(",");
  const hasDot = str.includes(".");
  if (hasComma && hasDot) {
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    if (lastComma > lastDot) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (hasComma) {
    str = str.replace(",", ".");
  } else if (hasDot) {
    const parts = str.split(".");
    if (parts.length > 2) {
      str = str.replace(/\./g, "");
    }
  }
  str = str.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}
function findBestInventorySheet(workbook) {
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return null;
  }
  const preferredNames = ["estoque", "produtos", "itens", "inventario", "saldos", "planilha1", "sheet1", "dados"];
  for (const preferred of preferredNames) {
    const found = workbook.SheetNames.find((s) => s.toLowerCase().includes(preferred));
    if (found) {
      const sheet = workbook.Sheets[found];
      if (sheet && sheet["!ref"]) {
        return { sheetName: found, sheet };
      }
    }
  }
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (sheet && sheet["!ref"]) {
      return { sheetName: name, sheet };
    }
  }
  const defaultName = workbook.SheetNames[0];
  return { sheetName: defaultName, sheet: workbook.Sheets[defaultName] };
}
function detectHeaderRowIndex(rows2D) {
  if (!rows2D || rows2D.length === 0) return 0;
  let bestIndex = 0;
  let maxScore = 0;
  const checkLimit = Math.min(25, rows2D.length);
  for (let i = 0; i < checkLimit; i++) {
    const row = rows2D[i];
    if (!Array.isArray(row) || row.length === 0) continue;
    let matchCount = 0;
    for (const cell of row) {
      if (cell === null || cell === void 0 || cell === "") continue;
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
function parseExcelWorkbook(workbook) {
  const sheetInfo = findBestInventorySheet(workbook);
  if (!sheetInfo || !sheetInfo.sheet) {
    return {
      success: false,
      sheetName: "",
      totalRows: 0,
      validRowsCount: 0,
      invalidRowsCount: 0,
      detectedColumns: {},
      rows: [],
      errors: ["O arquivo Excel n\xE3o cont\xE9m nenhuma planilha leg\xEDvel com dados."]
    };
  }
  const { sheetName, sheet } = sheetInfo;
  const raw2D = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (!raw2D || raw2D.length === 0) {
    return {
      success: false,
      sheetName,
      totalRows: 0,
      validRowsCount: 0,
      invalidRowsCount: 0,
      detectedColumns: {},
      rows: [],
      errors: ["A planilha est\xE1 vazia ou sem linhas de dados."]
    };
  }
  const headerRowIndex = detectHeaderRowIndex(raw2D);
  const headerRow = raw2D[headerRowIndex] || [];
  const normalizedToOriginalHeader = {};
  headerRow.forEach((col) => {
    if (col !== null && col !== void 0 && String(col).trim() !== "") {
      normalizedToOriginalHeader[normalizeHeaderKey(String(col))] = String(col).trim();
    }
  });
  const fieldToHeader = {};
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      if (normalizedToOriginalHeader[alias]) {
        fieldToHeader[field] = normalizedToOriginalHeader[alias];
        break;
      }
    }
  }
  const rawRows = XLSX.utils.sheet_to_json(sheet, {
    range: headerRowIndex,
    defval: ""
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
      errors: ["Nenhuma linha de produto encontrada abaixo da linha de cabe\xE7alho da planilha."]
    };
  }
  const parsedRows = [];
  let validCount = 0;
  let invalidCount = 0;
  rawRows.forEach((row, index) => {
    const rowNumber = headerRowIndex + index + 2;
    const errors = [];
    const rowNormalizedKeys = {};
    for (const k of Object.keys(row)) {
      rowNormalizedKeys[normalizeHeaderKey(k)] = k;
    }
    const getVal = (field) => {
      const header = fieldToHeader[field];
      if (header !== void 0 && row[header] !== void 0 && row[header] !== "") {
        return row[header];
      }
      const aliases = FIELD_ALIASES[field] || [];
      for (const alias of aliases) {
        const origKey = rowNormalizedKeys[alias];
        if (origKey && row[origKey] !== void 0 && row[origKey] !== "") {
          return row[origKey];
        }
      }
      return void 0;
    };
    let rawSku = String(getVal("sku") || "").trim();
    let rawName = String(getVal("name") || "").trim();
    const hasAnyContent = Object.values(row).some((val) => val !== null && val !== void 0 && String(val).trim() !== "");
    if (!hasAnyContent) {
      return;
    }
    if (!rawSku && !rawName) {
      const firstCol = String(Object.values(row)[0] || "").toLowerCase();
      if (firstCol.includes("total") || firstCol.includes("somat\xF3ria") || firstCol.includes("resumo")) {
        return;
      }
      return;
    }
    if (!rawSku && rawName) {
      const cleanSlug = normalizeHeaderKey(rawName).slice(0, 12).toUpperCase();
      rawSku = `FLIND-${cleanSlug || "ITEM"}-${rowNumber}`;
    }
    if (rawSku && !rawName) {
      rawName = `Item ${rawSku}`;
    }
    const rawCat = String(getVal("category") || "").trim();
    let category = "Hospitalar & Cir\xFArgico";
    if (rawCat.toLowerCase().includes("est") || rawCat.toLowerCase().includes("spa")) {
      category = "Est\xE9tica & Spas";
    } else if (rawCat.toLowerCase().includes("sal") || rawCat.toLowerCase().includes("barb")) {
      category = "Sal\xF5es & Barbearias";
    } else if (rawCat.toLowerCase().includes("insumo") || rawCat.toLowerCase().includes("mat")) {
      category = "Insumo & Mat\xE9ria-Prima";
    }
    let packagingUnit = String(getVal("packagingUnit") || "Caixa (CX)").trim();
    const pkgUpper = packagingUnit.toUpperCase();
    if (pkgUpper === "CX" || pkgUpper === "CAIXA") packagingUnit = "Caixa (CX)";
    else if (pkgUpper === "FD" || pkgUpper === "FARDO") packagingUnit = "Fardo (FD)";
    else if (pkgUpper === "PCT" || pkgUpper === "PACOTE") packagingUnit = "Pacote (PCT)";
    else if (pkgUpper === "RL" || pkgUpper === "ROLO") packagingUnit = "Rolo (RL)";
    else if (pkgUpper === "UN" || pkgUpper === "UND" || pkgUpper === "UNID") packagingUnit = "Unidade (UN)";
    let unitsPerPackage = parseNumber(getVal("unitsPerPackage"), 0);
    const rawPackages = getVal("currentStockPackages");
    const rawUnits = getVal("currentStockUnits");
    let currentStockPackages = 0;
    let currentStockUnits = 0;
    if (rawPackages !== void 0 && rawPackages !== "") {
      currentStockPackages = Math.max(0, Math.round(parseNumber(rawPackages, 0)));
      if (unitsPerPackage > 0) {
        currentStockUnits = currentStockPackages * unitsPerPackage;
      } else if (rawUnits !== void 0 && rawUnits !== "") {
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
    } else if (rawUnits !== void 0 && rawUnits !== "") {
      currentStockUnits = Math.max(0, Math.round(parseNumber(rawUnits, 0)));
      if (unitsPerPackage <= 0) unitsPerPackage = 1;
      currentStockPackages = Math.ceil(currentStockUnits / unitsPerPackage);
    } else {
      currentStockPackages = 0;
      currentStockUnits = 0;
      if (unitsPerPackage <= 0) unitsPerPackage = 1;
    }
    if (unitsPerPackage <= 0) unitsPerPackage = 1;
    const minStockPackages = Math.max(0, Math.round(parseNumber(getVal("minStockPackages"), 15)));
    let unitWeightKg = parseNumber(getVal("unitWeightKg"), 0);
    let weightPerPackageKg = parseNumber(getVal("weightPerPackageKg"), 0);
    if (weightPerPackageKg <= 0 && unitWeightKg > 0) {
      weightPerPackageKg = Number((unitWeightKg * unitsPerPackage).toFixed(3));
    } else if (unitWeightKg <= 0 && weightPerPackageKg > 0 && unitsPerPackage > 0) {
      unitWeightKg = Number((weightPerPackageKg / unitsPerPackage).toFixed(4));
    }
    const costPrice = Math.max(0, parseNumber(getVal("costPrice"), 0));
    const salePrice = Math.max(0, parseNumber(getVal("salePrice"), 0));
    const lotNumber = String(getVal("lotNumber") || `LOTE-${(/* @__PURE__ */ new Date()).getFullYear()}-IMP`).trim();
    const manufactureDate = parseExcelDate(getVal("manufactureDate")) || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const expiryDate = parseExcelDate(getVal("expiryDate")) || new Date(Date.now() + 365 * 864e5 * 3).toISOString().split("T")[0];
    const shelfLifeMonths = parseNumber(getVal("shelfLifeMonths"), 36);
    const location = String(getVal("location") || "Almoxarifado Geral").trim();
    const supplierName = String(getVal("supplierName") || "Fornecedor Homologado").trim();
    const barcode = String(getVal("barcode") || "").trim();
    let status = "NORMAL";
    if (currentStockPackages <= 0) {
      status = "OUT_OF_STOCK";
    } else if (currentStockPackages <= Math.max(1, Math.floor(minStockPackages * 0.4))) {
      status = "CRITICAL";
    } else if (currentStockPackages <= minStockPackages) {
      status = "LOW";
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
      barcode: barcode || void 0,
      status,
      isValid,
      validationErrors: errors
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
    errors: parsedRows.length === 0 ? ["Nenhum produto v\xE1lido encontrado na planilha."] : []
  };
}
function generateInventoryTemplateWorkbook() {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    {
      "SKU / C\xF3digo": "FLIND-AVT-CIR-50",
      "Nome do Produto": "Avental Cir\xFArgico Imperme\xE1vel TNT 50g/m\xB2 Esterilizado",
      "Categoria": "Hospitalar & Cir\xFArgico",
      "Tipo de Volume (Embalagem)": "Caixa (CX)",
      "Unidades por Volume": 50,
      "Estoque Atual (Volumes)": 140,
      "Estoque Atual (Unidades)": 7e3,
      "Estoque M\xEDnimo (Volumes)": 60,
      "Peso Unit\xE1rio (kg)": 0.24,
      "Peso por Volume (kg)": 12,
      "Pre\xE7o de Custo (R$)": 195,
      "Pre\xE7o de Venda (R$)": 320,
      "Lote": "LOTE-FLIND-2026-A19",
      "Data de Fabrica\xE7\xE3o": "2026-08-10",
      "Data de Validade": "2029-08-10",
      "Localiza\xE7\xE3o Almoxarifado": "Galp\xE3o 1 \u2022 Rua A-04, N\xEDvel 2",
      "Fornecedor": "Fibras & N\xE3o-Tecidos Brasil S/A",
      "C\xF3digo de Barras (EAN)": "7898912340012"
    },
    {
      "SKU / C\xF3digo": "FLIND-MSC-TRIP-TIR",
      "Nome do Produto": "M\xE1scara Cir\xFArgica Tripla com Tiras BFE\u226595%",
      "Categoria": "Hospitalar & Cir\xFArgico",
      "Tipo de Volume (Embalagem)": "Fardo (FD)",
      "Unidades por Volume": 2e3,
      "Estoque Atual (Volumes)": 45,
      "Estoque Atual (Unidades)": 9e4,
      "Estoque M\xEDnimo (Volumes)": 25,
      "Peso Unit\xE1rio (kg)": 35e-4,
      "Peso por Volume (kg)": 7.5,
      "Pre\xE7o de Custo (R$)": 140,
      "Pre\xE7o de Venda (R$)": 250,
      "Lote": "LOTE-FLIND-2026-B02",
      "Data de Fabrica\xE7\xE3o": "2026-09-01",
      "Data de Validade": "2029-09-01",
      "Localiza\xE7\xE3o Almoxarifado": "Galp\xE3o 1 \u2022 Rua B-02, N\xEDvel 1",
      "Fornecedor": "Fibras & N\xE3o-Tecidos Brasil S/A",
      "C\xF3digo de Barras (EAN)": "7898912340029"
    },
    {
      "SKU / C\xF3digo": "FLIND-LEN-TNT-70",
      "Nome do Produto": "Len\xE7ol Descart\xE1vel em Rolo TNT 70cm x 50m para Macas",
      "Categoria": "Est\xE9tica & Spas",
      "Tipo de Volume (Embalagem)": "Fardo (FD)",
      "Unidades por Volume": 10,
      "Estoque Atual (Volumes)": 80,
      "Estoque Atual (Unidades)": 800,
      "Estoque M\xEDnimo (Volumes)": 30,
      "Peso Unit\xE1rio (kg)": 1.3,
      "Peso por Volume (kg)": 13,
      "Pre\xE7o de Custo (R$)": 45,
      "Pre\xE7o de Venda (R$)": 85,
      "Lote": "LOTE-FLIND-2026-EST01",
      "Data de Fabrica\xE7\xE3o": "2026-08-15",
      "Data de Validade": "2029-08-15",
      "Localiza\xE7\xE3o Almoxarifado": "Galp\xE3o 2 \u2022 Rua E-01",
      "Fornecedor": "Fibras & N\xE3o-Tecidos Brasil S/A",
      "C\xF3digo de Barras (EAN)": "7898912340036"
    },
    {
      "SKU / C\xF3digo": "FLIND-LUV-NIT-PINK",
      "Nome do Produto": "Luva Nitr\xEDlica Pink Tam M Especial Cl\xEDnicas de Est\xE9tica",
      "Categoria": "Est\xE9tica & Spas",
      "Tipo de Volume (Embalagem)": "Fardo (FD)",
      "Unidades por Volume": 5e3,
      "Estoque Atual (Volumes)": 35,
      "Estoque Atual (Unidades)": 175e3,
      "Estoque M\xEDnimo (Volumes)": 20,
      "Peso Unit\xE1rio (kg)": 4e-3,
      "Peso por Volume (kg)": 20,
      "Pre\xE7o de Custo (R$)": 950,
      "Pre\xE7o de Venda (R$)": 1590,
      "Lote": "LOTE-FLIND-2026-EST02",
      "Data de Fabrica\xE7\xE3o": "2026-07-20",
      "Data de Validade": "2029-07-20",
      "Localiza\xE7\xE3o Almoxarifado": "Galp\xE3o 2 \u2022 Rua F-03",
      "Fornecedor": "SuperAbsorb Brasil",
      "C\xF3digo de Barras (EAN)": "7898912340043"
    },
    {
      "SKU / C\xF3digo": "FLIND-CAP-CORTE-BARB",
      "Nome do Produto": "Capa de Corte Descart\xE1vel TNT Imperme\xE1vel c/ El\xE1stico",
      "Categoria": "Sal\xF5es & Barbearias",
      "Tipo de Volume (Embalagem)": "Pacote (PCT)",
      "Unidades por Volume": 50,
      "Estoque Atual (Volumes)": 120,
      "Estoque Atual (Unidades)": 6e3,
      "Estoque M\xEDnimo (Volumes)": 40,
      "Peso Unit\xE1rio (kg)": 0.025,
      "Peso por Volume (kg)": 1.25,
      "Pre\xE7o de Custo (R$)": 28,
      "Pre\xE7o de Venda (R$)": 55,
      "Lote": "LOTE-FLIND-2026-BB01",
      "Data de Fabrica\xE7\xE3o": "2026-08-01",
      "Data de Validade": "2029-08-01",
      "Localiza\xE7\xE3o Almoxarifado": "Galp\xE3o 3 \u2022 Rua C-02",
      "Fornecedor": "Klabin Embalagens Hospitalares",
      "C\xF3digo de Barras (EAN)": "7898912340050"
    }
  ];
  const ws = XLSX.utils.json_to_sheet(sampleData);
  ws["!cols"] = [
    { wch: 22 },
    // SKU
    { wch: 50 },
    // Nome
    { wch: 24 },
    // Categoria
    { wch: 26 },
    // Tipo de Volume
    { wch: 20 },
    // Unidades por Volume
    { wch: 22 },
    // Estoque Volumes
    { wch: 22 },
    // Estoque Unidades
    { wch: 22 },
    // Estoque Mínimo
    { wch: 18 },
    // Peso Unit
    { wch: 20 },
    // Peso Volume
    { wch: 18 },
    // Preço Custo
    { wch: 18 },
    // Preço Venda
    { wch: 22 },
    // Lote
    { wch: 18 },
    // Fabricação
    { wch: 18 },
    // Validade
    { wch: 30 },
    // Localização
    { wch: 32 },
    // Fornecedor
    { wch: 22 }
    // EAN
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Estoque e Volumes");
  const instructions = [
    {
      "Instru\xE7\xE3o": "1. SKU / C\xF3digo",
      "Regra de Preenchimento": "Identificador \xFAnico do produto ou insumo no sistema."
    },
    {
      "Instru\xE7\xE3o": "2. Nome do Produto",
      "Regra de Preenchimento": "Descri\xE7\xE3o completa do produto. Se n\xE3o houver SKU, o sistema gera automaticamente."
    },
    {
      "Instru\xE7\xE3o": "3. Tipo de Volume (Embalagem)",
      "Regra de Preenchimento": "Caixa (CX), Fardo (FD), Pacote (PCT), Rolo (RL), Palete (PAL) ou Unidade (UN)."
    },
    {
      "Instru\xE7\xE3o": "4. Unidades por Volume",
      "Regra de Preenchimento": "Quantidade de unidades dentro de cada caixa/fardo. O padr\xE3o \xE9 1 se n\xE3o informado."
    },
    {
      "Instru\xE7\xE3o": "5. Estoque Atual (Volumes)",
      "Regra de Preenchimento": "Quantidade f\xEDsica em caixas/fardos. O sistema calcula automaticamente o total em unidades."
    },
    {
      "Instru\xE7\xE3o": "6. Estoque Atual (Unidades)",
      "Regra de Preenchimento": "Opcional se preenchido em volumes. Se informado apenas unidades, o sistema calcula os volumes."
    },
    {
      "Instru\xE7\xE3o": "7. Estoque M\xEDnimo",
      "Regra de Preenchimento": "Ponto de pedido / estoque de seguran\xE7a em volumes. Aciona alertas e reposi\xE7\xF5es autom\xE1ticas."
    },
    {
      "Instru\xE7\xE3o": "8. Atualiza\xE7\xE3o Inteligente",
      "Regra de Preenchimento": "Se o SKU ou Nome j\xE1 existir, o saldo ser\xE1 atualizado. Se n\xE3o existir, um novo item ser\xE1 cadastrado."
    }
  ];
  const wsInst = XLSX.utils.json_to_sheet(instructions);
  wsInst["!cols"] = [{ wch: 30 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsInst, "Como Preencher");
  return wb;
}

// src/server/routes/api.ts
var apiRouter = Router();
apiRouter.get("/dashboard/metrics", (req, res) => {
  ruleEngine.evaluateOrderSlas();
  const orders = db.getOrders();
  const receivables = db.getReceivables();
  const shipments = db.getShipments();
  const alerts = db.getAlerts();
  const now = /* @__PURE__ */ new Date();
  const todayStr = now.toISOString().split("T")[0];
  const orderMetrics = {
    total: orders.length,
    new: orders.filter((o) => o.status === "NEW").length,
    processing: orders.filter((o) => ["INTEGRATED_ERP", "SEPARATION"].includes(o.status)).length,
    billed: orders.filter((o) => ["BILLED", "NFE_ISSUED"].includes(o.status)).length,
    waitingExpedition: orders.filter((o) => o.status === "EXPEDITION").length,
    delayed: orders.filter((o) => o.timeline.some((t) => t.status === "DELAYED")).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length
  };
  const agingBuckets = {
    dueSoon: { count: 0, amount: 0 },
    dueToday: { count: 0, amount: 0 },
    overdue1to3: { count: 0, amount: 0 },
    overdue4to7: { count: 0, amount: 0 },
    overdue8to30: { count: 0, amount: 0 },
    overdue30Plus: { count: 0, amount: 0 }
  };
  let totalOverdueAmount = 0;
  let totalPendingAmount = 0;
  let dueSoonCount = 0;
  let dueTodayCount = 0;
  let overdueCount = 0;
  let paidCount = 0;
  for (const r of receivables) {
    if (r.status === "PAID") {
      paidCount++;
      continue;
    }
    if (r.status === "CANCELLED") {
      continue;
    }
    totalPendingAmount += r.amount;
    const diffDays = Math.round((new Date(todayStr).getTime() - new Date(r.dueDate).getTime()) / 864e5);
    if (diffDays < 0) {
      dueSoonCount++;
      agingBuckets.dueSoon.count++;
      agingBuckets.dueSoon.amount += r.amount;
    } else if (diffDays === 0) {
      dueTodayCount++;
      agingBuckets.dueToday.count++;
      agingBuckets.dueToday.amount += r.amount;
    } else {
      overdueCount++;
      totalOverdueAmount += r.amount;
      if (diffDays >= 1 && diffDays <= 3) {
        agingBuckets.overdue1to3.count++;
        agingBuckets.overdue1to3.amount += r.amount;
      } else if (diffDays >= 4 && diffDays <= 7) {
        agingBuckets.overdue4to7.count++;
        agingBuckets.overdue4to7.amount += r.amount;
      } else if (diffDays >= 8 && diffDays <= 30) {
        agingBuckets.overdue8to30.count++;
        agingBuckets.overdue8to30.amount += r.amount;
      } else {
        agingBuckets.overdue30Plus.count++;
        agingBuckets.overdue30Plus.amount += r.amount;
      }
    }
  }
  const logisticsMetrics = {
    waitingExpedition: shipments.filter((s) => s.status === "WAITING_DISPATCH").length,
    inTransit: shipments.filter((s) => ["DISPATCHED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(s.status)).length,
    delivered: shipments.filter((s) => s.status === "DELIVERED").length,
    issuesCount: shipments.filter((s) => s.status === "ISSUE").length,
    delayedDeliveries: orders.filter(
      (o) => o.timeline.some((t) => t.stage === "EXPEDITION" && t.status === "DELAYED")
    ).length
  };
  const alertMetrics = {
    totalPending: alerts.filter((a) => a.status === "PENDING").length,
    criticalCount: alerts.filter((a) => a.status === "PENDING" && a.severity === "CRITICAL").length,
    warningCount: alerts.filter((a) => a.status === "PENDING" && a.severity === "WARNING").length,
    infoCount: alerts.filter((a) => a.status === "PENDING" && a.severity === "INFO").length,
    resolvedCount: alerts.filter((a) => a.status === "RESOLVED").length
  };
  const products = db.getProducts();
  const suppliers = db.getSuppliers();
  const purchaseOrders = db.getPurchaseOrders();
  const inventoryMetrics = {
    totalItems: products.length,
    totalPackages: products.reduce((acc, p) => acc + (p.currentStockPackages || 0), 0),
    totalUnits: products.reduce((acc, p) => acc + (p.currentStockUnits || 0), 0),
    normalStockCount: products.filter((p) => p.status === "NORMAL").length,
    lowStockCount: products.filter((p) => p.status === "LOW").length,
    criticalStockCount: products.filter((p) => p.status === "CRITICAL" || p.status === "OUT_OF_STOCK").length,
    autoReordersCount: purchaseOrders.filter((po) => po.triggerReason === "AUTO_LOW_STOCK").length
  };
  const suppliersMetrics = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter((s) => s.status === "HOMOLOGATED" || s.status === "ACTIVE").length,
    openPurchaseOrders: purchaseOrders.filter((po) => po.status === "PENDING" || po.status === "SENT_WHATSAPP").length
  };
  const metrics = {
    orders: orderMetrics,
    financial: {
      totalOverdueAmount,
      totalPendingAmount,
      dueSoonCount,
      dueTodayCount,
      overdueCount,
      paidCount,
      agingBuckets
    },
    logistics: logisticsMetrics,
    alerts: alertMetrics,
    inventory: inventoryMetrics,
    suppliers: suppliersMetrics
  };
  res.json(metrics);
});
apiRouter.get("/orders", (req, res) => {
  const { status, search, delayed } = req.query;
  let orders = db.getOrders();
  if (status && typeof status === "string") {
    orders = orders.filter((o) => o.status === status);
  }
  if (delayed === "true") {
    orders = orders.filter((o) => o.timeline.some((t) => t.status === "DELAYED"));
  }
  if (search && typeof search === "string") {
    const s = search.toLowerCase();
    orders = orders.filter(
      (o) => o.orderNumber.toLowerCase().includes(s) || o.customer?.name.toLowerCase().includes(s) || o.invoiceNumber?.toLowerCase().includes(s)
    );
  }
  res.json(orders);
});
apiRouter.get("/orders/:id", (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Pedido n\xE3o encontrado." });
  }
  const deliveryValidation = ruleEngine.validateDeliveryRules(order);
  const shipment = db.getShipmentByOrderId(order.id);
  res.json({
    order,
    deliveryValidation,
    shipment
  });
});
apiRouter.post("/orders/:id/advance-stage", (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Pedido n\xE3o encontrado." });
  }
  const { targetStage, responsible, notes } = req.body;
  const stages = [
    "ORDER_RECEIVED",
    "ERP_INTEGRATED",
    "SEPARATION",
    "INVOICING",
    "NFE_ISSUED",
    "EXPEDITION",
    "CARRIER_DISPATCH",
    "IN_TRANSIT",
    "DELIVERED"
  ];
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  let currentActiveIndex = order.timeline.findIndex(
    (t) => t.status === "IN_PROGRESS" || t.status === "DELAYED"
  );
  if (currentActiveIndex === -1) {
    currentActiveIndex = order.timeline.findIndex((t) => t.status === "COMPLETED");
  }
  if (currentActiveIndex >= 0 && order.timeline[currentActiveIndex]) {
    const curr = order.timeline[currentActiveIndex];
    curr.status = "COMPLETED";
    curr.completedAt = nowIso;
    if (curr.startedAt) {
      const dur = Math.round((new Date(nowIso).getTime() - new Date(curr.startedAt).getTime()) / 6e4);
      curr.durationMinutes = Math.max(1, dur);
    }
  }
  const nextIndex = currentActiveIndex + 1;
  if (nextIndex < order.timeline.length) {
    const next = order.timeline[nextIndex];
    next.status = "IN_PROGRESS";
    next.startedAt = nowIso;
    if (responsible) next.responsible = responsible;
    if (notes) next.notes = notes;
    const stageToOrderStatusMap = {
      ORDER_RECEIVED: "NEW",
      ERP_INTEGRATED: "INTEGRATED_ERP",
      SEPARATION: "SEPARATION",
      INVOICING: "BILLED",
      NFE_ISSUED: "NFE_ISSUED",
      EXPEDITION: "EXPEDITION",
      CARRIER_DISPATCH: "SHIPPED",
      IN_TRANSIT: "IN_TRANSIT",
      DELIVERED: "DELIVERED"
    };
    order.status = stageToOrderStatusMap[next.stage] || order.status;
    if (next.stage === "NFE_ISSUED" && !order.invoiceNumber) {
      const nfeNum = Math.floor(1e3 + Math.random() * 9e3);
      order.invoiceNumber = `NF-00${nfeNum}`;
      order.invoiceKey = `352609${order.customerId.replace(/\D/g, "").padEnd(14, "0")}5500100000${nfeNum}1098765432`;
    }
    if (next.stage === "SEPARATION") {
      for (const item of order.items) {
        const prod = db.getProductBySku(item.sku) || db.getProductById(item.productId);
        if (prod) {
          try {
            db.updateStock(prod.id, -item.quantity, `Separa\xE7\xE3o do Pedido ${order.orderNumber}`);
          } catch (err) {
            console.error("[Estoque] Falha ao dar baixa de item:", err);
          }
        }
      }
    }
    if (next.stage === "CARRIER_DISPATCH" || order.status === "SHIPPED") {
      const customer = db.getCustomerById(order.customerId);
      const phone = customer?.phone;
      if (phone && db.getAutoSettings().autoWhatsAppExpedition) {
        shippingService.getOrCreateShipment(order.id).then((shipment) => {
          return whatsappProvider.sendTemplateMessage({
            toPhone: phone,
            templateName: "notificacao_despacho_rastreio",
            orderId: order.id,
            parameters: {
              cliente: customer.name,
              pedido: order.orderNumber,
              nf: order.invoiceNumber || "NF-e Autorizada",
              transportadora: shipment.carrierName,
              codigo_rastreio: shipment.trackingCode || "TRK-EXPEDICAO",
              link_rastreio: `/trace/${shipment.trackingToken}`
            }
          });
        }).catch((err) => console.error("[WhatsApp] Falha no disparo autom\xE1tico de expedi\xE7\xE3o:", err));
      }
    }
  }
  db.upsertOrder(order);
  db.addAuditLog({
    id: `aud-${Date.now()}`,
    action: "ORDER_STAGE_ADVANCED",
    origin: "api.advance-stage",
    entity: "Order",
    entityId: order.id,
    newValue: { status: order.status, stage: order.timeline[nextIndex]?.stageLabel },
    userOrService: responsible || "Operador Web",
    correlationId: `corr-adv-${order.id}`,
    createdAt: nowIso
  });
  res.json(order);
});
apiRouter.post("/orders/:id/validate-delivery", (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Pedido n\xE3o encontrado." });
  }
  const { selectedVehicleType, schedulingScheduledAt } = req.body;
  const result = ruleEngine.validateDeliveryRules(order, {
    selectedVehicleType,
    schedulingScheduledAt
  });
  res.json(result);
});
apiRouter.get("/customers", (req, res) => {
  let list = db.getCustomers();
  const originFilter = req.query.origin;
  if (originFilter === "site") {
    list = list.filter((c) => c.flindOrigin === "FLIND_ECOMMERCE_WEB" || c.flindOrigin === "TRAY" || Boolean(c.flindWebId));
  } else if (originFilter === "direct") {
    list = list.filter((c) => c.flindOrigin === "DIRETO_B2B" || c.flindOrigin === "BALCAO" || !c.flindWebId && c.flindOrigin !== "FLIND_ECOMMERCE_WEB");
  }
  res.json(list);
});
apiRouter.post("/customers/:id/toggle-site-origin", (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Cliente n\xE3o encontrado." });
  }
  const currentlySite = customer.flindOrigin === "FLIND_ECOMMERCE_WEB" || customer.flindOrigin === "TRAY" || Boolean(customer.flindWebId);
  const updated = { ...customer, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
  if (currentlySite) {
    updated.flindOrigin = "DIRETO_B2B";
    updated.flindWebId = void 0;
    updated.flindWebProfileUrl = void 0;
    updated.flindPortalSync = void 0;
    updated.notes = updated.notes || "Cliente Direto da F\xE1brica (B2B / Sem Site) - Atendimento via Televendas, Representante ou Contrato Fabril.";
  } else {
    updated.flindOrigin = "FLIND_ECOMMERCE_WEB";
    updated.flindWebId = `FW-${Math.floor(1e4 + Math.random() * 9e4)}`;
    updated.flindWebProfileUrl = "https://www.flind.com.br/central-do-cliente";
    updated.flindPortalSync = {
      isRegisteredOnFlindWeb: true,
      lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
      accountEmail: customer.email || "compras@flind.com.br",
      totalFlindWebOrders: 1,
      flindTier: customer.segment?.includes("Hospitalar") ? "OURO_HOSPITALAR" : "PRATA_CLINICAS",
      customerProfileUrl: "https://www.flind.com.br/central-do-cliente",
      catalogInterest: ["Descart\xE1veis Hospitalares", "Toalet Descart\xE1vel"]
    };
  }
  db.upsertCustomer(updated);
  db.addAuditLog({
    id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    correlationId: `cor-cust-origin-${updated.id}-${Date.now().toString(36)}`,
    action: currentlySite ? "CUSTOMER_DISCONNECTED_FROM_WEB" : "CUSTOMER_LINKED_TO_WEB",
    origin: "api.customers.toggle-origin",
    entity: "Customer",
    entityId: updated.id,
    newValue: {
      flindOrigin: updated.flindOrigin,
      flindWebId: updated.flindWebId,
      isWebCustomer: !currentlySite
    },
    userOrService: "Operador Comercial",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({
    success: true,
    message: currentlySite ? "Cliente agora est\xE1 classificado como Venda Direta / F\xE1brica (N\xE3o-Web)." : "Cliente vinculado com sucesso ao portal www.flind.com.br (Cliente do Site).",
    customer: updated
  });
});
apiRouter.get("/customers/flind-web-lookup", (req, res) => {
  const query = String(req.query.query || "").trim().toLowerCase();
  if (!query) {
    return res.status(400).json({ error: "Par\xE2metro query (CNPJ, CPF ou e-mail) \xE9 obrigat\xF3rio." });
  }
  const cleanQ = query.replace(/\D/g, "");
  const existing = db.getCustomers().find(
    (c) => cleanQ.length > 5 && c.taxId.replace(/\D/g, "").includes(cleanQ) || c.email && c.email.toLowerCase().includes(query)
  );
  if (existing) {
    return res.json({
      found: true,
      alreadyInLocalDb: true,
      message: "Cliente j\xE1 registrado na F\xE1brica Integrada!",
      customer: existing
    });
  }
  const mockWebProfiles = [
    {
      matchKey: "09123456000188",
      name: "Centro Hospitalar & Cir\xFArgico Santa Helena Ltda",
      tradeName: "Hospital Santa Helena - CAF Insumos",
      taxId: "09.123.456/0001-88",
      segment: "Hospitalar & Cir\xFArgico",
      stateRegistration: "112.890.456.110",
      email: "compras.hospitalar@santahelena.med.br",
      phone: "+55 11 97755-4433",
      contactPerson: "Dra. Fernanda Lemos (Coord. CAF)",
      address: {
        type: "DELIVERY",
        street: "Avenida Brigadeiro Lu\xEDs Ant\xF4nio",
        number: "2400",
        complement: "Doca 2 - CAF Farm\xE1cia Central",
        neighborhood: "Bela Vista",
        city: "S\xE3o Paulo",
        state: "SP",
        zipCode: "01402-000"
      },
      flindTier: "OURO_HOSPITALAR",
      totalFlindWebOrders: 14
    },
    {
      matchKey: "18492044000155",
      name: "Cl\xEDnica Dermatol\xF3gica & Est\xE9tica Harmonia Ltda",
      tradeName: "Harmonia Est\xE9tica & Laser",
      taxId: "18.492.044/0001-55",
      segment: "Est\xE9tica & Spas",
      stateRegistration: "144.321.908.765",
      email: "suprimentos@harmoniaestetica.com.br",
      phone: "+55 19 98844-3322",
      contactPerson: "Juliana Paes (Gerente de Compras)",
      address: {
        type: "DELIVERY",
        street: "Avenida Jos\xE9 de Souza Campos",
        number: "1250",
        complement: "Bloco B - Recep\xE7\xE3o de Suprimentos",
        neighborhood: "Cambu\xED",
        city: "Campinas",
        state: "SP",
        zipCode: "13025-320"
      },
      flindTier: "PRATA_CLINICAS",
      totalFlindWebOrders: 6
    },
    {
      matchKey: "27889102000133",
      name: "Studio & Barbershop Vintage Gold Eireli",
      tradeName: "Vintage Gold Barbearia & Hair Club",
      taxId: "27.889.102/0001-33",
      segment: "Sal\xF5es & Barbearias",
      stateRegistration: "Isento",
      email: "contato@vintagebarbershop.com.br",
      phone: "+55 31 99122-8877",
      contactPerson: "Marcos Vin\xEDcius (S\xF3cio)",
      address: {
        type: "DELIVERY",
        street: "Rua Fernandes Tourinho",
        number: "480",
        complement: "Loja 3 - T\xE9rreo",
        neighborhood: "Savassi",
        city: "Belo Horizonte",
        state: "MG",
        zipCode: "30112-000"
      },
      flindTier: "BRONZE_ESTETICA",
      totalFlindWebOrders: 4
    }
  ];
  const matched = mockWebProfiles.find(
    (p) => cleanQ.length > 5 && p.matchKey.includes(cleanQ) || p.email.toLowerCase().includes(query) || p.taxId.includes(query)
  );
  if (matched) {
    return res.json({
      found: true,
      alreadyInLocalDb: false,
      source: "PORTAL_FLIND_WEB",
      flindWebId: `FW-${Math.floor(1e4 + Math.random() * 9e4)}`,
      customer: {
        ...matched,
        flindWebProfileUrl: "https://www.flind.com.br/central-do-cliente",
        flindOrigin: "FLIND_ECOMMERCE_WEB"
      }
    });
  }
  return res.json({
    found: false,
    message: "Nenhum perfil direto localizado no portal www.flind.com.br para esta busca. Prossiga com o preenchimento."
  });
});
apiRouter.get("/customers/:id", (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Cliente n\xE3o encontrado." });
  }
  res.json(customer);
});
apiRouter.post("/customers", (req, res) => {
  const {
    name,
    tradeName,
    taxId,
    segment,
    stateRegistration,
    email,
    phone,
    contactPerson,
    notes,
    flindOrigin,
    flindWebId,
    flindTier,
    linkFlindWeb,
    initialAddress,
    initialDeliveryRule
  } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Raz\xE3o Social ou Nome Completo \xE9 obrigat\xF3rio." });
  }
  if (!taxId || !taxId.trim()) {
    return res.status(400).json({ error: "CPF ou CNPJ \xE9 obrigat\xF3rio." });
  }
  const cleanTax = taxId.replace(/\D/g, "");
  const existingCust = db.getCustomers().find((c) => c.taxId.replace(/\D/g, "") === cleanTax);
  if (existingCust) {
    return res.status(409).json({
      error: `J\xE1 existe um cliente cadastrado com este documento: ${existingCust.name} (${existingCust.taxId}).`,
      existingCustomerId: existingCust.id
    });
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const customerId = `cust-${Date.now().toString(36)}`;
  const resolvedFlindWebId = flindWebId || `FW-${Math.floor(1e4 + Math.random() * 9e4)}`;
  const isLinkedToWeb = linkFlindWeb !== false;
  const customer = {
    id: customerId,
    externalId: `ERP-${customerId.toUpperCase()}`,
    name: name.trim(),
    tradeName: (tradeName || "").trim() || name.trim(),
    taxId: taxId.trim(),
    segment: segment || "Hospitalar & Cir\xFArgico",
    stateRegistration: (stateRegistration || "").trim() || "Isento",
    email: (email || "").trim(),
    phone: (phone || "").trim(),
    contactPerson: (contactPerson || "").trim(),
    notes: (notes || "").trim(),
    flindOrigin: flindOrigin || (isLinkedToWeb ? "FLIND_ECOMMERCE_WEB" : "DIRETO_B2B"),
    flindWebId: isLinkedToWeb ? resolvedFlindWebId : void 0,
    flindWebProfileUrl: isLinkedToWeb ? "https://www.flind.com.br/central-do-cliente" : void 0,
    flindPortalSync: isLinkedToWeb ? {
      isRegisteredOnFlindWeb: true,
      lastSyncedAt: nowIso,
      accountEmail: email || "compras@flind.com.br",
      totalFlindWebOrders: 0,
      flindTier: flindTier || (segment?.includes("Hospitalar") ? "OURO_HOSPITALAR" : "PRATA_CLINICAS"),
      customerProfileUrl: "https://www.flind.com.br/central-do-cliente",
      catalogInterest: [segment || "Descart\xE1veis Hospitalares & Toalet"]
    } : void 0,
    createdAt: nowIso,
    updatedAt: nowIso
  };
  db.upsertCustomer(customer);
  if (initialAddress && initialAddress.street) {
    const addressId = `addr-${customerId}-1`;
    const createdAddress = {
      id: addressId,
      customerId,
      type: initialAddress.type || "FISCAL",
      street: initialAddress.street.trim(),
      number: initialAddress.number ? String(initialAddress.number).trim() : "S/N",
      complement: (initialAddress.complement || "").trim(),
      neighborhood: (initialAddress.neighborhood || "").trim(),
      city: (initialAddress.city || "").trim(),
      state: (initialAddress.state || "SP").trim().toUpperCase(),
      zipCode: (initialAddress.zipCode || "").trim(),
      country: "Brasil",
      isDefault: true,
      createdAt: nowIso
    };
    db.upsertAddress(createdAddress);
    if (createdAddress.type === "DELIVERY") {
      const defaultRule = {
        id: `delrule-${customerId}-1`,
        addressId: createdAddress.id,
        customerId,
        allowedTimeStart: initialDeliveryRule?.allowedTimeStart || "08:00",
        allowedTimeEnd: initialDeliveryRule?.allowedTimeEnd || "17:00",
        allowedWeekdays: initialDeliveryRule?.allowedWeekdays || [1, 2, 3, 4, 5],
        requiresScheduling: Boolean(initialDeliveryRule?.requiresScheduling),
        maxWeightKg: Number(initialDeliveryRule?.maxWeightKg) || 1e4,
        vehicleTypeAllowed: initialDeliveryRule?.vehicleTypeAllowed || "TRUCK",
        entryGate: initialDeliveryRule?.entryGate || "Doca Principal de Recebimento",
        contactName: initialDeliveryRule?.contactName || contactPerson || name,
        contactPhone: initialDeliveryRule?.contactPhone || phone || "",
        requiresDocumentation: initialDeliveryRule?.requiresDocumentation !== false,
        notes: initialDeliveryRule?.notes || "Hor\xE1rio padr\xE3o de recebimento da f\xE1brica.",
        active: true
      };
      db.upsertDeliveryRule(defaultRule);
    }
  }
  try {
    db.addAuditLog({
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      action: "CUSTOMER_REGISTERED",
      origin: "api.customers.create",
      entity: "Customer",
      entityId: customer.id,
      newValue: {
        name: customer.name,
        taxId: customer.taxId,
        segment: customer.segment,
        flindOrigin: customer.flindOrigin,
        flindWebId: customer.flindWebId,
        linkedWeb: isLinkedToWeb
      },
      userOrService: "Operador Comercial / Flind Web",
      correlationId: `cust-reg-${customer.id}`,
      createdAt: nowIso
    });
  } catch {
  }
  const fullCustomer = db.getCustomerById(customerId);
  res.status(201).json(fullCustomer);
});
apiRouter.put("/customers/:id", (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Cliente n\xE3o encontrado." });
  }
  const {
    name,
    tradeName,
    taxId,
    segment,
    stateRegistration,
    email,
    phone,
    contactPerson,
    notes,
    flindOrigin,
    flindWebId,
    flindTier,
    linkFlindWeb
  } = req.body;
  const willBeSite = linkFlindWeb === true || flindOrigin === "FLIND_ECOMMERCE_WEB" || flindOrigin === "TRAY" || linkFlindWeb === void 0 && flindOrigin !== "DIRETO_B2B" && flindOrigin !== "BALCAO" && flindOrigin !== "SINK_ERP" && (Boolean(flindWebId) || customer.flindOrigin === "FLIND_ECOMMERCE_WEB" || customer.flindOrigin === "TRAY");
  const finalOrigin = willBeSite ? flindOrigin || (customer.flindOrigin === "TRAY" ? "TRAY" : "FLIND_ECOMMERCE_WEB") : flindOrigin || "DIRETO_B2B";
  const updated = {
    ...customer,
    name: name !== void 0 ? name.trim() : customer.name,
    tradeName: tradeName !== void 0 ? tradeName.trim() : customer.tradeName,
    taxId: taxId !== void 0 ? taxId.trim() : customer.taxId,
    segment: segment !== void 0 ? segment : customer.segment,
    stateRegistration: stateRegistration !== void 0 ? stateRegistration : customer.stateRegistration,
    email: email !== void 0 ? email.trim() : customer.email,
    phone: phone !== void 0 ? phone.trim() : customer.phone,
    contactPerson: contactPerson !== void 0 ? contactPerson.trim() : customer.contactPerson,
    notes: notes !== void 0 ? notes.trim() : customer.notes,
    flindOrigin: finalOrigin,
    flindWebId: willBeSite ? flindWebId !== void 0 ? flindWebId : customer.flindWebId || `FW-${Math.floor(1e4 + Math.random() * 9e4)}` : void 0,
    flindWebProfileUrl: willBeSite ? "https://www.flind.com.br/central-do-cliente" : void 0,
    flindPortalSync: willBeSite ? {
      ...customer.flindPortalSync || {},
      isRegisteredOnFlindWeb: true,
      lastSyncedAt: (/* @__PURE__ */ new Date()).toISOString(),
      accountEmail: email || customer.email || "compras@flind.com.br",
      totalFlindWebOrders: customer.flindPortalSync?.totalFlindWebOrders || 1,
      flindTier: flindTier || customer.flindPortalSync?.flindTier || "OURO_HOSPITALAR",
      customerProfileUrl: "https://www.flind.com.br/central-do-cliente",
      catalogInterest: customer.flindPortalSync?.catalogInterest || ["Descart\xE1veis Hospitalares"]
    } : void 0,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.upsertCustomer(updated);
  try {
    db.addAuditLog({
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      action: "CUSTOMER_UPDATED",
      origin: "api.customers.update",
      entity: "Customer",
      entityId: updated.id,
      newValue: {
        name: updated.name,
        taxId: updated.taxId,
        segment: updated.segment
      },
      userOrService: "Operador Comercial",
      correlationId: `cust-upd-${updated.id}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch {
  }
  res.json(db.getCustomerById(req.params.id));
});
apiRouter.delete("/customers/:id", (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Cliente n\xE3o encontrado." });
  }
  const orders = db.getOrders().filter((o) => o.customerId === req.params.id);
  if (orders.length > 0) {
    return res.status(400).json({
      error: `N\xE3o \xE9 poss\xEDvel excluir o cliente pois existem ${orders.length} pedido(s) associados a ele.`
    });
  }
  db.deleteCustomer(req.params.id);
  res.json({ success: true, message: "Cliente removido com sucesso." });
});
apiRouter.post("/customers/:id/sync-flind-web", (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Cliente n\xE3o encontrado." });
  }
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const customerOrders = db.getOrders().filter((o) => o.customerId === customer.id);
  const webOrdersCount = customerOrders.filter((o) => o.source === "TRAY" || o.source === "MANUAL").length || 1;
  const updatedPortalSync = {
    isRegisteredOnFlindWeb: true,
    lastSyncedAt: nowIso,
    accountEmail: customer.email || "compras@flind.com.br",
    totalFlindWebOrders: webOrdersCount,
    flindTier: customer.segment?.includes("Hospitalar") ? "OURO_HOSPITALAR" : customer.segment?.includes("Est\xE9tica") ? "PRATA_CLINICAS" : "BRONZE_ESTETICA",
    customerProfileUrl: "https://www.flind.com.br/central-do-cliente",
    catalogInterest: [
      customer.segment || "Descart\xE1veis Hospitalares",
      "Toalete Descart\xE1vel Flind",
      "Len\xE7\xF3is TNT Cir\xFArgicos e Macas"
    ]
  };
  const updatedCustomer = {
    ...customer,
    flindOrigin: customer.flindOrigin || "FLIND_ECOMMERCE_WEB",
    flindWebId: customer.flindWebId || `FW-${Math.floor(1e4 + Math.random() * 9e4)}`,
    flindWebProfileUrl: "https://www.flind.com.br/central-do-cliente",
    flindPortalSync: updatedPortalSync,
    updatedAt: nowIso
  };
  db.upsertCustomer(updatedCustomer);
  try {
    db.addAuditLog({
      id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      action: "CUSTOMER_SYNCED_FLIND_WEB",
      origin: "api.customers.syncFlindWeb",
      entity: "Customer",
      entityId: customer.id,
      newValue: {
        lastSyncedAt: nowIso,
        webOrdersCount,
        portalUrl: "https://www.flind.com.br/central-do-cliente"
      },
      userOrService: "Sincronizador www.flind.com.br",
      correlationId: `sync-flind-${customer.id}`,
      createdAt: nowIso
    });
  } catch {
  }
  res.json({
    success: true,
    message: "Dados sincronizados com o portal www.flind.com.br com sucesso!",
    customer: db.getCustomerById(req.params.id)
  });
});
apiRouter.post("/customers/:id/addresses", (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Cliente n\xE3o encontrado." });
  }
  const { type, street, number, complement, neighborhood, city, state, zipCode, isDefault, deliveryRule } = req.body;
  if (!street) {
    return res.status(400).json({ error: "Logradouro / Rua \xE9 obrigat\xF3rio." });
  }
  const address = {
    id: `addr-${customer.id}-${Date.now().toString(36)}`,
    customerId: customer.id,
    type: type || "DELIVERY",
    street: street.trim(),
    number: number ? String(number).trim() : "S/N",
    complement: (complement || "").trim(),
    neighborhood: (neighborhood || "").trim(),
    city: (city || "").trim(),
    state: (state || "SP").trim().toUpperCase(),
    zipCode: (zipCode || "").trim(),
    country: "Brasil",
    isDefault: Boolean(isDefault),
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.upsertAddress(address);
  if (address.type === "DELIVERY") {
    const rule = {
      id: `delrule-${address.id}`,
      addressId: address.id,
      customerId: customer.id,
      allowedTimeStart: deliveryRule?.allowedTimeStart || "08:00",
      allowedTimeEnd: deliveryRule?.allowedTimeEnd || "17:00",
      allowedWeekdays: deliveryRule?.allowedWeekdays || [1, 2, 3, 4, 5],
      requiresScheduling: Boolean(deliveryRule?.requiresScheduling),
      maxWeightKg: Number(deliveryRule?.maxWeightKg) || 1e4,
      vehicleTypeAllowed: deliveryRule?.vehicleTypeAllowed || "TRUCK",
      entryGate: deliveryRule?.entryGate || "Doca de Recebimento",
      contactName: deliveryRule?.contactName || customer.contactPerson || customer.name,
      contactPhone: deliveryRule?.contactPhone || customer.phone || "",
      requiresDocumentation: deliveryRule?.requiresDocumentation !== false,
      notes: deliveryRule?.notes || "",
      active: true
    };
    db.upsertDeliveryRule(rule);
  }
  res.status(201).json(address);
});
apiRouter.delete("/customers/:id/addresses/:addressId", (req, res) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: "Cliente n\xE3o encontrado." });
  }
  const address = db.getAddressById(req.params.addressId);
  if (!address || address.customerId !== customer.id) {
    return res.status(404).json({ error: "Endere\xE7o n\xE3o encontrado para este cliente." });
  }
  db.deleteAddress(req.params.addressId);
  res.json({ success: true, message: "Endere\xE7o removido com sucesso." });
});
apiRouter.get("/delivery-rules", (req, res) => {
  res.json(db.getDeliveryRules());
});
apiRouter.post("/delivery-rules", (req, res) => {
  const {
    id,
    addressId,
    customerId,
    allowedTimeStart,
    allowedTimeEnd,
    allowedWeekdays,
    requiresScheduling,
    maxWeightKg,
    vehicleTypeAllowed,
    entryGate,
    contactName,
    contactPhone,
    requiresDocumentation,
    notes,
    active
  } = req.body;
  const rule = {
    id: id || `delrule-${Date.now().toString(36)}`,
    addressId,
    customerId,
    allowedTimeStart: allowedTimeStart || "08:00",
    allowedTimeEnd: allowedTimeEnd || "17:00",
    allowedWeekdays: allowedWeekdays || [1, 2, 3, 4, 5],
    requiresScheduling: Boolean(requiresScheduling),
    maxWeightKg: Number(maxWeightKg) || 1e4,
    vehicleTypeAllowed: vehicleTypeAllowed || "QUALQUER",
    entryGate: entryGate || "Portaria Principal",
    contactName: contactName || "Recep\xE7\xE3o",
    contactPhone: contactPhone || "",
    requiresDocumentation: Boolean(requiresDocumentation),
    notes: notes || "",
    active: active !== void 0 ? Boolean(active) : true
  };
  db.upsertDeliveryRule(rule);
  res.json(rule);
});
apiRouter.get("/receivables", (req, res) => {
  const { status, customerId } = req.query;
  let list = db.getReceivables();
  if (status && typeof status === "string") {
    list = list.filter((r) => r.status === status);
  }
  if (customerId && typeof customerId === "string") {
    list = list.filter((r) => r.customerId === customerId);
  }
  res.json(list);
});
apiRouter.post("/receivables/:id/pay", async (req, res) => {
  try {
    const { channel, transactionCode, paymentDate, notes, sendConfirmationWhatsApp } = req.body;
    const result = db.autoClearReceivablePayment({
      receivableId: req.params.id,
      channel: channel || "MANUAL",
      transactionCode,
      paymentDate,
      notes,
      operatorOrService: "Operador Financeiro / Baixa Caixa"
    });
    let confirmationWhatsAppSent = false;
    if (sendConfirmationWhatsApp !== false) {
      const customer = db.getCustomerById(result.receivable.customerId);
      if (customer && customer.phone) {
        try {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customer.phone,
            templateName: "confirmacao_pagamento_recebido",
            parameters: {
              cliente: customer.name,
              numero: result.receivable.documentNumber,
              valor: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(result.receivable.amount),
              data: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
              dados_pagamento: `Autentica\xE7\xE3o: ${result.clearingDetails.transactionCode} (${result.clearingDetails.clearingChannel})`
            },
            receivableId: result.receivable.id,
            orderId: result.receivable.orderId
          });
          confirmationWhatsAppSent = true;
        } catch (e) {
          console.warn("Falha no envio de confirma\xE7\xE3o WhatsApp:", e);
        }
      }
    }
    res.json({
      ...result,
      confirmationWhatsAppSent
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Erro ao realizar baixa do t\xEDtulo." });
  }
});
apiRouter.post("/financial/recognize-payment", async (req, res) => {
  try {
    const {
      receivableId,
      documentNumber,
      orderId,
      pixCode,
      amount,
      channel,
      transactionCode,
      paymentDate,
      payerName,
      payerTaxId,
      notes,
      sendConfirmationWhatsApp
    } = req.body;
    const result = db.autoClearReceivablePayment({
      receivableId,
      documentNumber,
      orderId,
      pixCode,
      amount: amount ? Number(amount) : void 0,
      channel: channel || "PIX_AUTOMATICO",
      transactionCode,
      paymentDate,
      payerName,
      payerTaxId,
      notes,
      operatorOrService: `Motor de Reconhecimento Autom\xE1tico (${channel || "PIX"})`
    });
    let confirmationWhatsAppSent = false;
    if (sendConfirmationWhatsApp !== false) {
      const customer = db.getCustomerById(result.receivable.customerId);
      if (customer && customer.phone) {
        try {
          await whatsappProvider.sendTemplateMessage({
            toPhone: customer.phone,
            templateName: "confirmacao_pagamento_recebido",
            parameters: {
              cliente: customer.name,
              numero: result.receivable.documentNumber,
              valor: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(result.receivable.amount),
              data: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
              dados_pagamento: `Autentica\xE7\xE3o: ${result.clearingDetails.transactionCode} (${result.clearingDetails.clearingChannel})`
            },
            receivableId: result.receivable.id,
            orderId: result.receivable.orderId
          });
          confirmationWhatsAppSent = true;
        } catch (e) {
          console.warn("Falha no envio de confirma\xE7\xE3o WhatsApp:", e);
        }
      }
    }
    res.json({
      ...result,
      confirmationWhatsAppSent
    });
  } catch (err) {
    res.status(400).json({ error: err.message || "Erro ao reconhecer e baixar pagamento." });
  }
});
apiRouter.post("/financial/simulate-pix/:id", async (req, res) => {
  try {
    const rec = db.getReceivableById(req.params.id);
    if (!rec) {
      return res.status(404).json({ error: "T\xEDtulo n\xE3o encontrado." });
    }
    const fakeE2eId = `E00416968${(/* @__PURE__ */ new Date()).toISOString().replace(/\D/g, "").slice(0, 14)}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const result = db.autoClearReceivablePayment({
      receivableId: rec.id,
      channel: "PIX_AUTOMATICO",
      transactionCode: fakeE2eId,
      payerName: rec.customerName || "Cliente Flind Hospitalar",
      notes: `Reconhecimento instant\xE2neo Pix via Gateway PSP Banc\xE1rio (Simula\xE7\xE3o Homologada). EndToEndId: ${fakeE2eId}`,
      operatorOrService: "Webhook Pix PSP Banco Central"
    });
    let confirmationWhatsAppSent = false;
    const customer = db.getCustomerById(rec.customerId);
    if (customer && customer.phone) {
      try {
        await whatsappProvider.sendTemplateMessage({
          toPhone: customer.phone,
          templateName: "confirmacao_pagamento_recebido",
          parameters: {
            cliente: customer.name,
            numero: rec.documentNumber,
            valor: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rec.amount),
            data: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
            dados_pagamento: `Pix EndToEndId: ${fakeE2eId}`
          },
          receivableId: rec.id,
          orderId: rec.orderId
        });
        confirmationWhatsAppSent = true;
      } catch (e) {
        console.warn("Erro ao disparar recibo WhatsApp:", e);
      }
    }
    res.json({
      ...result,
      confirmationWhatsAppSent
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.post("/financial/webhook/pix", async (req, res) => {
  try {
    const body = req.body;
    const txid = body.txid || body.pix?.[0]?.txid || body.id;
    const endToEndId = body.endToEndId || body.pix?.[0]?.endToEndId || `E2E-${Date.now()}`;
    const valor = body.valor || body.pix?.[0]?.valor || body.amount;
    const documentNumber = body.documentNumber || body.solicitacaoPagador || body.infoAdicional;
    const orderId = body.orderId || body.external_reference;
    let targetRec = db.getReceivables().find(
      (r) => txid && (r.transactionCode === txid || r.pixCode?.includes(txid)) || documentNumber && r.documentNumber.toLowerCase() === String(documentNumber).toLowerCase() || orderId && r.orderId === orderId
    );
    if (!targetRec && valor) {
      targetRec = db.getReceivables().find((r) => r.status !== "PAID" && Math.abs(r.amount - Number(valor)) < 0.05);
    }
    if (!targetRec) {
      const firstOpen = db.getReceivables().find((r) => r.status !== "PAID");
      if (firstOpen) targetRec = firstOpen;
    }
    if (!targetRec) {
      return res.status(200).json({ received: true, cleared: false, message: "Nenhum t\xEDtulo pendente localizado para este Pix." });
    }
    const result = db.autoClearReceivablePayment({
      receivableId: targetRec.id,
      channel: "PIX_AUTOMATICO",
      transactionCode: endToEndId,
      amount: valor ? Number(valor) : targetRec.amount,
      payerName: body.pagador?.nome || body.payer?.name,
      payerTaxId: body.pagador?.cpf || body.pagador?.cnpj,
      notes: `Baixa Autom\xE1tica disparada por Webhook Pix do PSP (${endToEndId})`,
      operatorOrService: "Webhook Pix Instant\xE2neo PSP"
    });
    res.status(200).json({
      received: true,
      cleared: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/financial/batch-cnab-return", (req, res) => {
  try {
    const { fileType, selectedReceivableIds } = req.body;
    let clearedCount = 0;
    const clearedList = [];
    const targetIds = Array.isArray(selectedReceivableIds) && selectedReceivableIds.length > 0 ? selectedReceivableIds : db.getReceivables().filter((r) => r.status === "OVERDUE" || r.status === "OPEN").slice(0, 3).map((r) => r.id);
    for (const recId of targetIds) {
      try {
        const cnabProtocol = `RET-CNAB240-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
        const clearing = db.autoClearReceivablePayment({
          receivableId: recId,
          channel: "RETORNO_BANCARIO_CNAB",
          transactionCode: cnabProtocol,
          notes: `Baixa Autom\xE1tica por Arquivo de Retorno Banc\xE1rio (${fileType || "CNAB 240"}). Ocorr\xEAncia 06 - Liquida\xE7\xE3o Normal.`,
          operatorOrService: "M\xF3dulo de Concilia\xE7\xE3o Banc\xE1ria CNAB"
        });
        clearedCount++;
        clearedList.push(clearing);
      } catch (e) {
      }
    }
    res.json({
      success: true,
      message: `Arquivo de retorno processado com sucesso. ${clearedCount} t\xEDtulo(s) baixado(s) automaticamente no Contas a Receber e Pedidos!`,
      clearedCount,
      clearedList
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.post("/receivables/trigger-collection", async (req, res) => {
  try {
    const result = await ruleEngine.executeCollectionAutomation();
    res.json({
      success: true,
      message: "Motor de automa\xE7\xE3o de cobran\xE7a executado com sucesso.",
      stats: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/collection-rules", (req, res) => {
  res.json(db.getCollectionRules());
});
apiRouter.put("/collection-rules/:id", (req, res) => {
  const existing = db.getCollectionRules().find((r) => r.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Regra de cobran\xE7a n\xE3o encontrada." });
  }
  const updated = {
    ...existing,
    ...req.body
  };
  db.upsertCollectionRule(updated);
  res.json(updated);
});
apiRouter.get("/alerts", (req, res) => {
  res.json(db.getAlerts());
});
apiRouter.post("/alerts/:id/acknowledge", (req, res) => {
  const { responsible } = req.body;
  const updated = db.updateAlertStatus(req.params.id, "ACKNOWLEDGED", responsible || "Operador");
  if (!updated) {
    return res.status(404).json({ error: "Alerta n\xE3o encontrado." });
  }
  res.json(updated);
});
apiRouter.post("/alerts/:id/resolve", (req, res) => {
  const { responsible } = req.body;
  const updated = db.updateAlertStatus(req.params.id, "RESOLVED", responsible || "Operador");
  if (!updated) {
    return res.status(404).json({ error: "Alerta n\xE3o encontrado." });
  }
  res.json(updated);
});
apiRouter.get("/sla-rules", (req, res) => {
  res.json(db.getSlaRules());
});
apiRouter.put("/sla-rules/:id", (req, res) => {
  const existing = db.getSlaRules().find((r) => r.id === req.params.id);
  if (!existing) {
    return res.status(404).json({ error: "Regra de SLA n\xE3o encontrada." });
  }
  const updated = {
    ...existing,
    ...req.body
  };
  db.upsertSlaRule(updated);
  res.json(updated);
});
apiRouter.post("/sla-rules/run-check", (req, res) => {
  const generatedAlerts = ruleEngine.evaluateOrderSlas();
  res.json({
    success: true,
    alertsGeneratedCount: generatedAlerts.length,
    alerts: generatedAlerts
  });
});
apiRouter.get("/shipments", (req, res) => {
  res.json(db.getShipments());
});
apiRouter.get("/shipments/:orderId/label", async (req, res) => {
  try {
    const labelData = await shippingService.generateShippingLabel(req.params.orderId);
    res.json(labelData);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});
apiRouter.post("/shipments/:orderId", async (req, res) => {
  try {
    const { carrierName, volumesCount, selectedVehicleType, notes } = req.body;
    const shipment = await shippingService.getOrCreateShipment(req.params.orderId, {
      carrierName,
      volumesCount: Number(volumesCount) || 1,
      selectedVehicleType,
      notes
    });
    res.json(shipment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
apiRouter.get("/trace/:token", (req, res) => {
  const trace = shippingService.getTraceabilityByToken(req.params.token);
  if (!trace) {
    return res.status(404).json({ error: "Rastreabilidade n\xE3o localizada para o token fornecido." });
  }
  res.json(trace);
});
apiRouter.post("/integrations/tray/webhook", async (req, res) => {
  const correlationId = `corr-tray-${Date.now()}`;
  try {
    const payload = req.body;
    if (!payload || !payload.order_id) {
      return res.status(400).json({ error: "Payload de webhook inv\xE1lido. order_id obrigat\xF3rio." });
    }
    const result = await trayAdapter.handleWebhook(payload, correlationId);
    res.json(result);
  } catch (err) {
    console.error("[API] Erro no webhook da Tray:", err);
    res.status(500).json({ error: err.message, correlationId });
  }
});
apiRouter.post("/integrations/tray/simulate-order", async (req, res) => {
  const correlationId = `corr-sim-tray-${Date.now()}`;
  const randomOrderNum = Math.floor(1e4 + Math.random() * 9e4);
  const fakePayload = {
    event: "order.created",
    scope_id: "9841",
    act: "order_create",
    order_id: randomOrderNum
  };
  try {
    const result = await trayAdapter.handleWebhook(fakePayload, correlationId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/integrations/sink-erp/health", async (req, res) => {
  const health = await sinkERPProvider.checkHealth();
  res.json(health);
});
apiRouter.post("/integrations/sink-erp/sync-order/:id", async (req, res) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: "Pedido n\xE3o encontrado." });
  }
  try {
    const result = await sinkERPProvider.createOrder(order);
    const erpEvent = order.timeline.find((t) => t.stage === "ERP_INTEGRATED");
    if (erpEvent) {
      erpEvent.status = "COMPLETED";
      erpEvent.completedAt = (/* @__PURE__ */ new Date()).toISOString();
      erpEvent.notes = `Protocolo SINK ERP: ${result.erpProtocol}`;
      order.status = "INTEGRATED_ERP";
      db.upsertOrder(order);
    }
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      action: "ORDER_SYNCED_SINK_ERP",
      origin: "api.syncSinkOrder",
      entity: "Order",
      entityId: order.id,
      newValue: result,
      userOrService: "SINK Integration Handler",
      correlationId: `corr-sink-${result.erpProtocol}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/integrations/sink-erp/production", async (req, res) => {
  const orders = await sinkERPProvider.syncProductionOrders();
  res.json(orders);
});
apiRouter.get("/integrations/sink-erp/costs", async (req, res) => {
  const costs = await sinkERPProvider.syncProductionCosts();
  res.json(costs);
});
apiRouter.get("/integrations/whatsapp/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const validChallenge = whatsappProvider.verifyWebhookChallenge(mode, token, challenge);
  if (validChallenge) {
    return res.status(200).send(validChallenge);
  }
  return res.status(403).send("Forbidden");
});
apiRouter.post("/integrations/whatsapp/webhook", async (req, res) => {
  const updates = await whatsappProvider.handleWebhookStatus(req.body);
  res.status(200).json({ received: true, updatesCount: updates.length });
});
apiRouter.get("/integrations/whatsapp/config", (req, res) => {
  res.json(whatsappProvider.getConfig());
});
apiRouter.post("/integrations/whatsapp/config", (req, res) => {
  const { apiUrl, accessToken, phoneNumberId, webhookVerifyToken } = req.body;
  const updated = whatsappProvider.updateConfig({
    apiUrl,
    accessToken,
    phoneNumberId,
    webhookVerifyToken
  });
  res.json({ success: true, config: updated });
});
apiRouter.post("/integrations/whatsapp/send-test", async (req, res) => {
  const { toPhone, templateName, customerName, documentNumber, amount, dueDate, paymentData, mode } = req.body;
  const result = await whatsappProvider.sendTemplateMessage({
    toPhone: toPhone || "+55 11 98888-7777",
    templateName: templateName || "lembrete_fatura_vencimento",
    mode: mode || (whatsappProvider.isConfigured() ? "meta" : "sandbox"),
    parameters: {
      cliente: customerName || "Hospital S\xE3o Camilo - CAF",
      numero: documentNumber || "DUP-4821-01",
      valor: amount || "R$ 18.450,00",
      data: dueDate || (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
      dados_pagamento: paymentData || "Chave PIX: financeiro@flind.com.br"
    }
  });
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});
apiRouter.post("/integrations/whatsapp/register-direct-send", (req, res) => {
  const { toPhone, customerName, templateName, parameters, receivableId, orderId } = req.body;
  const log = whatsappProvider.registerDirectSend({
    toPhone: toPhone || "+55 11 98888-7777",
    customerName: customerName || "Cliente Flind",
    templateName: templateName || "lembrete_fatura_vencimento",
    parameters: parameters || {},
    receivableId,
    orderId
  });
  res.json({ success: true, log });
});
apiRouter.get("/integrations/whatsapp/logs", (req, res) => {
  res.json(db.getWhatsAppLogs());
});
apiRouter.get("/integrations/sync-logs", (req, res) => {
  res.json(db.getIntegrationLogs());
});
apiRouter.get("/audit", (req, res) => {
  const { correlationId, entityId } = req.query;
  const logs = db.getAuditLogs(
    typeof correlationId === "string" ? correlationId : void 0,
    typeof entityId === "string" ? entityId : void 0
  );
  res.json(logs);
});
apiRouter.get("/inventory", (req, res) => {
  const products = db.getProducts();
  const lowStock = products.filter((p) => p.status === "LOW" || p.status === "CRITICAL" || p.status === "OUT_OF_STOCK");
  res.json({
    products,
    totalProducts: products.length,
    lowStockCount: lowStock.length,
    totalPackages: products.reduce((acc, p) => acc + (p.currentStockPackages || 0), 0),
    totalUnits: products.reduce((acc, p) => acc + (p.currentStockUnits || 0), 0)
  });
});
apiRouter.post("/inventory", (req, res) => {
  const data = req.body;
  if (!data.name || !data.sku) {
    return res.status(400).json({ error: "Nome e SKU do produto s\xE3o obrigat\xF3rios." });
  }
  const existing = data.id ? db.getProductById(data.id) : void 0;
  const product = {
    id: data.id || `prod-${Date.now()}`,
    sku: data.sku,
    name: data.name,
    category: data.category || "Hospitalar & Cir\xFArgico",
    packagingUnit: data.packagingUnit || "Caixa (CX)",
    unitsPerPackage: Number(data.unitsPerPackage) || 1,
    unitWeightKg: Number(data.unitWeightKg) || 0.1,
    weightPerPackageKg: Number(data.weightPerPackageKg) || (Number(data.unitWeightKg) || 0.1) * (Number(data.unitsPerPackage) || 1),
    manufactureDate: data.manufactureDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    expiryDate: data.expiryDate || new Date(Date.now() + 365 * 864e5 * 3).toISOString().split("T")[0],
    shelfLifeMonths: Number(data.shelfLifeMonths) || 36,
    lotNumber: data.lotNumber || `LOTE-FLIND-${(/* @__PURE__ */ new Date()).getFullYear()}-01`,
    currentStockPackages: Number(data.currentStockPackages) || 0,
    currentStockUnits: (Number(data.currentStockPackages) || 0) * (Number(data.unitsPerPackage) || 1),
    minStockPackages: Number(data.minStockPackages) || 20,
    minStockUnits: (Number(data.minStockPackages) || 20) * (Number(data.unitsPerPackage) || 1),
    reorderQuantityPackages: Number(data.reorderQuantityPackages) || 50,
    supplierId: data.supplierId || "supp-1",
    supplierName: data.supplierName || "Fornecedor Homologado",
    supplierPhone: data.supplierPhone || "+55 11 99999-9999",
    costPrice: Number(data.costPrice) || 0,
    salePrice: Number(data.salePrice) || 0,
    location: data.location || "Galp\xE3o 1",
    status: "NORMAL",
    autoReorderEnabled: data.autoReorderEnabled !== false,
    createdAt: existing?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const saved = db.upsertProduct(product);
  res.json(saved);
});
apiRouter.delete("/inventory/:id", (req, res) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ error: "Produto n\xE3o encontrado." });
  }
  res.json({ success: true, message: "Produto exclu\xEDdo do estoque com sucesso." });
});
apiRouter.post("/inventory/:id/movement", (req, res) => {
  const { deltaPackages, reason } = req.body;
  if (typeof deltaPackages !== "number") {
    return res.status(400).json({ error: "deltaPackages deve ser um n\xFAmero inteiro (positivo para entrada, negativo para sa\xEDda)." });
  }
  try {
    const result = db.updateStock(req.params.id, deltaPackages, reason || "Ajuste manual de estoque");
    res.json({
      success: true,
      product: result.product,
      autoOrderTriggered: result.autoOrderTriggered,
      message: result.autoOrderTriggered ? `Estoque atualizado para ${result.product.currentStockPackages} volumes. ATEN\xC7\xC3O: N\xEDvel cr\xEDtico atingido! Ordem de reposi\xE7\xE3o ${result.autoOrderTriggered.orderNumber} disparada automaticamente para o fornecedor via WhatsApp!` : `Estoque atualizado com sucesso (${deltaPackages > 0 ? "+" : ""}${deltaPackages} volumes).`
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});
apiRouter.post("/inventory/scan-reorder", (req, res) => {
  const triggered = db.scanAllLowStockAndTrigger();
  res.json({
    success: true,
    triggeredCount: triggered.length,
    orders: triggered,
    message: triggered.length > 0 ? `Varredura de estoque conclu\xEDda: ${triggered.length} ordens de ressuprimento geradas com disparos autom\xE1ticos de WhatsApp aos fornecedores!` : "Varredura conclu\xEDda: Todos os produtos est\xE3o com n\xEDveis de estoque saud\xE1veis."
  });
});
apiRouter.get("/inventory/template-xlsx", (req, res) => {
  try {
    const wb = generateInventoryTemplateWorkbook();
    const buffer = XLSX2.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="modelo_estoque_volumes_flind.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error("Erro ao gerar template XLSX:", err);
    res.status(500).json({ error: `Erro ao gerar modelo XLSX: ${err.message}` });
  }
});
apiRouter.get("/inventory/export-xlsx", (req, res) => {
  try {
    const products = db.getProducts();
    const rows = products.map((p) => ({
      "SKU / C\xF3digo": p.sku,
      "Nome do Produto": p.name,
      "Categoria": p.category,
      "Tipo de Volume (Embalagem)": p.packagingUnit,
      "Unidades por Volume": p.unitsPerPackage,
      "Estoque Atual (Volumes)": p.currentStockPackages,
      "Estoque Atual (Unidades)": p.currentStockUnits,
      "Estoque M\xEDnimo (Volumes)": p.minStockPackages,
      "Estoque M\xEDnimo (Unidades)": p.minStockUnits,
      "Status": p.status === "NORMAL" ? "Normal" : p.status === "LOW" ? "Baixo" : p.status === "CRITICAL" ? "Cr\xEDtico" : "Esgotado",
      "Peso Unit\xE1rio (kg)": p.unitWeightKg,
      "Peso por Volume (kg)": p.weightPerPackageKg,
      "Pre\xE7o de Custo (R$)": p.costPrice,
      "Pre\xE7o de Venda (R$)": p.salePrice,
      "Lote": p.lotNumber,
      "Data de Fabrica\xE7\xE3o": p.manufactureDate,
      "Data de Validade": p.expiryDate,
      "Localiza\xE7\xE3o Almoxarifado": p.location,
      "Fornecedor": p.supplierName,
      "EAN / C\xF3digo de Barras": p.barcode || ""
    }));
    const wb = XLSX2.utils.book_new();
    const ws = XLSX2.utils.json_to_sheet(rows);
    XLSX2.utils.book_append_sheet(wb, ws, "Estoque Flind Atual");
    const buffer = XLSX2.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="estoque_flind_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    console.error("Erro ao exportar estoque XLSX:", err);
    res.status(500).json({ error: `Erro ao exportar estoque XLSX: ${err.message}` });
  }
});
apiRouter.post("/inventory/preview-xlsx", (req, res) => {
  try {
    const { base64, rows, fileName } = req.body || {};
    let parsedRows = [];
    let sheetName = "Planilha";
    let detectedColumns = {};
    let errors = [];
    if (Array.isArray(rows) && rows.length > 0) {
      parsedRows = rows;
    } else if (base64) {
      const cleanBase64 = String(base64).replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: "Arquivo recebido est\xE1 corrompido ou vazio." });
      }
      const workbook = XLSX2.read(buffer, { type: "buffer", cellDates: true, raw: false });
      const parseResult = parseExcelWorkbook(workbook);
      sheetName = parseResult.sheetName;
      detectedColumns = parseResult.detectedColumns;
      errors = parseResult.errors;
      if (!parseResult.success || parseResult.rows.length === 0) {
        return res.status(400).json({
          error: parseResult.errors[0] || "Nenhum produto v\xE1lido foi identificado na planilha.",
          details: parseResult.errors
        });
      }
      parsedRows = parseResult.rows;
    } else {
      return res.status(400).json({ error: "Nenhum dado ou arquivo recebido para leitura." });
    }
    const currentProducts = db.getProducts();
    const previewComparison = parsedRows.map((row) => {
      const match = currentProducts.find(
        (p) => p.sku.toLowerCase() === String(row.sku || "").toLowerCase() || row.name && p.name.toLowerCase() === String(row.name || "").toLowerCase()
      );
      return {
        ...row,
        action: match ? "UPDATE" : "CREATE",
        existingProduct: match ? {
          id: match.id,
          name: match.name,
          currentStockPackages: match.currentStockPackages,
          currentStockUnits: match.currentStockUnits,
          packagingUnit: match.packagingUnit,
          unitsPerPackage: match.unitsPerPackage,
          status: match.status
        } : void 0
      };
    });
    const willUpdateCount = previewComparison.filter((p) => p.action === "UPDATE").length;
    const willCreateCount = previewComparison.filter((p) => p.action === "CREATE").length;
    const validRowsCount = previewComparison.filter((p) => p.isValid !== false).length;
    const invalidRowsCount = previewComparison.filter((p) => p.isValid === false).length;
    res.json({
      success: true,
      fileName: fileName || "planilha.xlsx",
      sheetName,
      totalRows: previewComparison.length,
      validRowsCount,
      invalidRowsCount,
      detectedColumns,
      errors,
      rows: previewComparison,
      willUpdateCount,
      willCreateCount
    });
  } catch (err) {
    console.error("Erro ao processar pr\xE9via XLSX:", err);
    res.status(400).json({
      error: `Falha ao interpretar arquivo XLSX: ${err.message || "Formato n\xE3o reconhecido"}`
    });
  }
});
apiRouter.post("/inventory/import-xlsx", (req, res) => {
  try {
    const { base64, rows, mode, triggerAutoReorder, fileName } = req.body || {};
    let itemsToImport = [];
    if (Array.isArray(rows) && rows.length > 0) {
      itemsToImport = rows;
    } else if (base64) {
      const cleanBase64 = String(base64).replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      const workbook = XLSX2.read(buffer, { type: "buffer", cellDates: true, raw: false });
      const parseResult = parseExcelWorkbook(workbook);
      if (!parseResult.success || parseResult.rows.length === 0) {
        return res.status(400).json({
          error: parseResult.errors[0] || "Nenhum dado leg\xEDvel de estoque ou volumes foi localizado no arquivo.",
          details: parseResult.errors
        });
      }
      itemsToImport = parseResult.rows.filter((r) => r.isValid);
    } else {
      return res.status(400).json({ error: "Nenhum dado ou arquivo enviado para importa\xE7\xE3o." });
    }
    if (itemsToImport.length === 0) {
      return res.status(400).json({ error: "Nenhum item v\xE1lido para atualizar no estoque." });
    }
    const result = db.importInventoryItems(itemsToImport, {
      mode: mode || "UPSERT",
      triggerAutoReorder: triggerAutoReorder !== false,
      userOrService: fileName ? `Importa\xE7\xE3o XLSX (${fileName})` : "Importa\xE7\xE3o Planilha XLSX"
    });
    res.json(result);
  } catch (err) {
    console.error("Erro ao importar estoque XLSX:", err);
    res.status(500).json({ error: `Erro no processamento da importa\xE7\xE3o: ${err.message}` });
  }
});
apiRouter.get("/suppliers", (req, res) => {
  res.json(db.getSuppliers());
});
apiRouter.post("/suppliers", (req, res) => {
  const data = req.body || {};
  const name = (data.name || data.tradeName || "").trim();
  const taxId = (data.taxId || "").trim();
  if (!name) {
    return res.status(400).json({ error: "Raz\xE3o Social ou Nome do Fornecedor \xE9 obrigat\xF3rio." });
  }
  const finalTaxId = taxId || `ISENTO-${Date.now().toString().slice(-8)}`;
  const existing = data.id ? db.getSupplierById(data.id) : void 0;
  const supplier = {
    id: data.id || `supp-${Date.now()}`,
    name,
    tradeName: (data.tradeName || name).trim(),
    taxId: finalTaxId,
    stateRegistration: (data.stateRegistration || "Isento").trim(),
    contactName: (data.contactName || "Respons\xE1vel Comercial").trim(),
    phone: (data.phone || data.whatsapp || "").trim(),
    whatsapp: (data.whatsapp || data.phone || "+55 11 99999-0000").trim(),
    email: (data.email || "comercial@fornecedor.com.br").trim(),
    category: (data.category || "Insumos e Mat\xE9rias-Primas").trim(),
    leadTimeDays: Math.max(1, Number(data.leadTimeDays) || 3),
    city: (data.city || "S\xE3o Paulo").trim(),
    state: (data.state || "SP").trim().toUpperCase(),
    paymentTerms: (data.paymentTerms || "30 DDL").trim(),
    status: data.status || "HOMOLOGATED",
    notes: data.notes || "",
    suppliedProductsCount: existing?.suppliedProductsCount || 0,
    createdAt: existing?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  const saved = db.upsertSupplier(supplier);
  res.status(201).json(saved);
});
apiRouter.get("/purchase-orders", (req, res) => {
  res.json(db.getPurchaseOrders());
});
apiRouter.get("/purchase-orders/cancelled", (req, res) => {
  res.json(db.getCancelledPurchaseOrders());
});
apiRouter.post("/purchase-orders/cancelled/clear", (req, res) => {
  const count = db.clearCancelledPurchaseOrders();
  res.json({
    success: true,
    clearedCount: count,
    message: `${count} ordens de compra canceladas foram removidas com sucesso do arquivo.`
  });
});
apiRouter.delete("/purchase-orders/cancelled", (req, res) => {
  const count = db.clearCancelledPurchaseOrders();
  res.json({
    success: true,
    clearedCount: count,
    message: `${count} ordens de compra canceladas foram removidas com sucesso do arquivo.`
  });
});
apiRouter.get("/database/tables", (req, res) => {
  res.json(db.getDatabaseTableStats());
});
apiRouter.post("/database/init", (req, res) => {
  const stats = db.getDatabaseTableStats();
  res.json({
    success: true,
    message: "Estrutura das tabelas de banco de dados verificada e sincronizada!",
    stats
  });
});
apiRouter.get("/purchase-orders/missing-diagnostic", (req, res) => {
  const diagnostic = db.getMissingProductsDiagnostic();
  res.json(diagnostic);
});
apiRouter.post("/purchase-orders/batch-reorder", async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Lista de itens para reposi\xE7\xE3o n\xE3o fornecida." });
  }
  const createdOrders = db.batchCreatePurchaseOrders(items);
  for (const po of createdOrders) {
    whatsappProvider.sendTemplateMessage({
      toPhone: po.supplierWhatsapp,
      templateName: "notificacao_reposicao_estoque_fornecedor",
      parameters: {
        fornecedor: po.supplierName,
        numero_po: po.orderNumber,
        produto: po.productName,
        sku: po.productSku,
        unidade_volume: po.packagingUnit,
        quantidade_volume: `${po.quantityPackages} volumes (${po.quantityUnits} un)`,
        estoque_atual: `Gatilho Autom\xE1tico Faltantes Flind`,
        prazo_previsto: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString("pt-BR") : "Urgente"
      }
    }).catch((err) => console.error("Erro envio PO WhatsApp em lote:", err));
  }
  res.json({
    success: true,
    count: createdOrders.length,
    orders: createdOrders,
    message: `${createdOrders.length} Ordens de Compra emitidas e enviadas aos fornecedores via WhatsApp.`
  });
});
apiRouter.get("/suppliers/quotations/missing-comparison", (req, res) => {
  const { productId } = req.query;
  const comparisons = db.getMissingProductsQuotationComparisons(productId ? String(productId) : void 0);
  res.json({
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    totalProductsCompared: comparisons.length,
    comparisons
  });
});
apiRouter.post("/purchase-orders/create-from-quotation", async (req, res) => {
  const {
    productId,
    supplierId,
    supplierName,
    supplierWhatsapp,
    quantityPackages,
    unitPrice,
    leadTimeDays,
    paymentTerms,
    notes
  } = req.body;
  if (!productId || !supplierId || !quantityPackages) {
    return res.status(400).json({ error: "Par\xE2metros obrigat\xF3rios ausentes para criar a Ordem de Compra." });
  }
  const po = db.createPurchaseOrderFromQuotation({
    productId,
    supplierId,
    supplierName: supplierName || "Fornecedor Homologado",
    supplierWhatsapp: supplierWhatsapp || "+55 19 99812-4400",
    quantityPackages: Number(quantityPackages),
    unitPrice: Number(unitPrice) || 50,
    leadTimeDays: Number(leadTimeDays) || 3,
    paymentTerms: paymentTerms || "Boleto 28 DDL",
    notes: notes || "Ordem gerada atrav\xE9s do Comparativo Inteligente de Cota\xE7\xF5es Flind."
  });
  whatsappProvider.sendTemplateMessage({
    toPhone: po.supplierWhatsapp,
    templateName: "notificacao_reposicao_estoque_fornecedor",
    parameters: {
      fornecedor: po.supplierName,
      numero_po: po.orderNumber,
      produto: po.productName,
      sku: po.productSku,
      unidade_volume: po.packagingUnit,
      quantidade_volume: `${po.quantityPackages} volumes (${po.quantityUnits} un)`,
      estoque_atual: `Cota\xE7\xE3o Aprovada - Melhor Escolha Flind`,
      prazo_previsto: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString("pt-BR") : "Urgente"
    }
  }).catch((err) => console.error("Erro envio PO WhatsApp cota\xE7\xE3o:", err));
  res.json({
    success: true,
    purchaseOrder: po,
    message: `Ordem de Compra ${po.orderNumber} emitida com sucesso para ${po.supplierName} e disparada no WhatsApp.`
  });
});
apiRouter.get("/products/catalog", (req, res) => {
  const { category, search, stockStatus } = req.query;
  let products = db.getProducts();
  if (category && category !== "ALL") {
    products = products.filter((p) => p.category === category);
  }
  if (stockStatus && stockStatus !== "ALL") {
    products = products.filter((p) => p.status === stockStatus);
  }
  if (search) {
    const s = String(search).toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.material && p.material.toLowerCase().includes(s) || p.barcode && p.barcode.includes(s) || p.supplierName && p.supplierName.toLowerCase().includes(s)
    );
  }
  res.json({
    total: products.length,
    products,
    categories: ["Hospitalar & Cir\xFArgico", "Est\xE9tica & Spas", "Sal\xF5es & Barbearias", "Insumo & Mat\xE9ria-Prima"]
  });
});
apiRouter.get("/products/:id/catalog-specs", (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Produto n\xE3o encontrado no cat\xE1logo." });
  }
  const supplier = db.getSupplierById(product.supplierId);
  const openPos = db.getPurchaseOrders().filter(
    (po) => (po.productId === product.id || po.productSku === product.sku) && po.status !== "DELIVERED"
  );
  res.json({
    product,
    supplier,
    openOrdersCount: openPos.length,
    openOrders: openPos
  });
});
apiRouter.post("/purchase-orders", (req, res) => {
  const data = req.body;
  const product = db.getProductById(data.productId);
  const supplier = db.getSupplierById(data.supplierId || product?.supplierId || "");
  const qtyPackages = Number(data.quantityPackages) || 50;
  const unitsPerPkg = product?.unitsPerPackage || 1;
  const supplierPhone = supplier?.whatsapp || supplier?.phone || data.supplierWhatsapp || "+55 11 99999-0000";
  const supplierName = supplier?.tradeName || supplier?.name || data.supplierName || "Fornecedor Homologado";
  const leadDays = supplier?.leadTimeDays || 3;
  const deliveryDate = new Date(Date.now() + leadDays * 864e5).toISOString().split("T")[0];
  const orderNum = `PO-FLIND-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(db.getPurchaseOrders().length + 1).padStart(3, "0")}`;
  const po = {
    id: `po-${Date.now()}`,
    orderNumber: orderNum,
    supplierId: supplier?.id || "supp-1",
    supplierName,
    supplierWhatsapp: supplierPhone,
    productId: product?.id || data.productId,
    productSku: product?.sku || data.productSku || "FLIND-INSUMO",
    productName: product?.name || data.productName || "Mat\xE9ria-Prima Flind",
    quantityPackages: qtyPackages,
    quantityUnits: qtyPackages * unitsPerPkg,
    packagingUnit: product?.packagingUnit || data.packagingUnit || "Caixa (CX)",
    estimatedCost: qtyPackages * (product?.costPrice || Number(data.unitCost) || 50),
    triggerReason: data.triggerReason || "MANUAL",
    status: "SENT_WHATSAPP",
    whatsappMessageId: `manual.WA${supplierPhone.replace(/\D/g, "")}-${Date.now().toString(36)}`,
    notes: data.notes || `Ordem de Compra emitida pelo PCP Flind para reposi\xE7\xE3o de estoque.`,
    expectedDeliveryDate: data.expectedDeliveryDate || deliveryDate,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.addPurchaseOrder(po);
  whatsappProvider.sendTemplateMessage({
    toPhone: supplierPhone,
    templateName: "notificacao_reposicao_estoque_fornecedor",
    parameters: {
      fornecedor: supplierName,
      numero_po: orderNum,
      produto: po.productName,
      sku: po.productSku,
      unidade_volume: po.packagingUnit,
      quantidade_volume: `${po.quantityPackages} volumes (${po.quantityUnits} un)`,
      estoque_atual: `${product?.currentStockPackages || 0} volumes`,
      prazo_previsto: new Date(po.expectedDeliveryDate || "").toLocaleDateString("pt-BR")
    }
  }).catch((err) => console.error("Erro envio PO WhatsApp:", err));
  res.json(po);
});
apiRouter.post("/purchase-orders/:id/status", (req, res) => {
  const { status, reason } = req.body;
  const updated = db.updatePurchaseOrderStatus(req.params.id, status, reason);
  if (!updated) {
    return res.status(404).json({ error: "Ordem de compra n\xE3o encontrada." });
  }
  res.json(updated);
});
apiRouter.post("/purchase-orders/:id/cancel", async (req, res) => {
  const { reason, notifySupplier } = req.body;
  const po = db.getPurchaseOrderById(req.params.id);
  if (!po) {
    return res.status(404).json({ error: "Ordem de compra n\xE3o encontrada." });
  }
  if (po.status === "CANCELLED") {
    return res.status(400).json({ error: "Esta ordem de compra j\xE1 est\xE1 cancelada." });
  }
  if (po.status === "DELIVERED") {
    return res.status(400).json({ error: "N\xE3o \xE9 poss\xEDvel cancelar uma ordem de compra que j\xE1 foi entregue no estoque." });
  }
  const updated = db.updatePurchaseOrderStatus(req.params.id, "CANCELLED", reason);
  let whatsappNotificationSent = false;
  if (notifySupplier && po.supplierWhatsapp) {
    try {
      await whatsappProvider.sendTemplateMessage({
        toPhone: po.supplierWhatsapp,
        templateName: "cancelamento_ordem_compra_fornecedor",
        parameters: {
          fornecedor: po.supplierName,
          numero_po: po.orderNumber,
          produto: po.productName,
          quantidade_volume: `${po.quantityPackages} volumes`,
          motivo: reason || "Cancelamento solicitado pelo setor de compras"
        }
      });
      whatsappNotificationSent = true;
    } catch (err) {
      console.error("[PO Cancel] Falha ao enviar WhatsApp de cancelamento:", err);
    }
  }
  res.json({
    success: true,
    message: `Ordem de compra ${po.orderNumber} cancelada com sucesso.`,
    purchaseOrder: updated,
    whatsappNotificationSent
  });
});
apiRouter.post("/purchase-orders/:id/send-whatsapp", async (req, res) => {
  const po = db.getPurchaseOrderById(req.params.id);
  if (!po) {
    return res.status(404).json({ error: "Ordem de compra n\xE3o encontrada." });
  }
  const result = await whatsappProvider.sendTemplateMessage({
    toPhone: po.supplierWhatsapp,
    templateName: "notificacao_reposicao_estoque_fornecedor",
    parameters: {
      fornecedor: po.supplierName,
      numero_po: po.orderNumber,
      produto: po.productName,
      sku: po.productSku,
      unidade_volume: po.packagingUnit,
      quantidade_volume: `${po.quantityPackages} volumes (${po.quantityUnits} un)`,
      estoque_atual: `Verifica\xE7\xE3o de estoque Flind`,
      prazo_previsto: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString("pt-BR") : "Urgente"
    }
  });
  if (result.success) {
    po.status = "SENT_WHATSAPP";
    po.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    db.persist();
  }
  res.json(result);
});
apiRouter.get("/automation/settings", (req, res) => {
  res.json(db.getAutoSettings());
});
apiRouter.post("/automation/settings", (req, res) => {
  const updated = db.updateAutoSettings(req.body);
  res.json({ success: true, settings: updated });
});
apiRouter.post("/automation/run-all", async (req, res) => {
  try {
    const slaViolations = ruleEngine.evaluateOrderSlas();
    const collectionStats = await ruleEngine.executeCollectionAutomation();
    const stockReorders = db.scanAllLowStockAndTrigger();
    res.json({
      success: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      results: {
        slaViolationsCount: slaViolations.length,
        collectionStats,
        stockReordersCount: stockReorders.length,
        stockReorders
      },
      message: `Automa\xE7\xE3o executada: ${collectionStats.messagesSent} WhatsApps de cobran\xE7a enviados | ${stockReorders.length} ressuprimentos de estoque acionados.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.get("/backup/export", (req, res) => {
  try {
    const rawData = db.getRawData();
    const dateStr = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
    const filename = `backup-flind-fabrica-${dateStr}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(rawData, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/backup/save", (req, res) => {
  try {
    const saveResult = db.forceSave();
    res.json({
      message: "Todos os dados da F\xE1brica Integrada foram salvos e gravados com sucesso no disco.",
      ...saveResult
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
apiRouter.post("/backup/import", (req, res) => {
  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ error: "Nenhum dado de backup fornecido." });
    }
    const result = db.importRawData(backupData);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// src/server/api-handler.ts
var app = express();
app.use((req, _res, next) => {
  if (req.body !== void 0 && typeof req.body === "object") {
    req._body = true;
  }
  next();
});
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use("/api", apiRouter);
app.use("/", apiRouter);
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: process.env.VERCEL ? "vercel-serverless" : "node",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use((err, _req, res, _next) => {
  console.error("[Vercel Serverless Function Error]:", err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.message || "Erro interno no servidor Vercel ao processar a requisi\xE7\xE3o.",
      details: String(err.stack || err)
    });
  }
});
var config = {
  api: {
    bodyParser: false
  }
};
function handler(req, res) {
  return app(req, res);
}
export {
  config,
  handler as default
};
