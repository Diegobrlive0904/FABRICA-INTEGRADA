import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Grid, OrbitControls, Text } from '@react-three/drei';
import type { Group, Mesh } from 'three';

type ZoneId = 'sales' | 'machines' | 'stock' | 'financial' | 'suppliers' | 'expedition' | 'alerts' | 'integrations';

type Product = {
  id: string;
  sku: string;
  name: string;
  status?: string;
  currentStockPackages?: number;
  currentStockUnits?: number;
  lotNumber?: string;
};

type PurchaseOrder = {
  id: string;
  orderNumber: string;
  supplierName: string;
  productName: string;
  status: string;
  quantityPackages: number;
};

type Shipment = {
  id: string;
  orderNumber: string;
  carrierName?: string;
  status: string;
  volumesCount?: number;
};

type Sale = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
};

type Bill = {
  id: string;
  documentNumber: string;
  customerName: string;
  status: string;
  amount: number;
  dueDate: string;
};

type FloorAlert = {
  id: string;
  severity: string;
  status: string;
  message: string;
};

type IntegrationNode = {
  id: string;
  name: string;
  status: string;
  detail: string;
};

const MACHINE_LAYOUT = [
  {
    id: 'corte',
    name: 'Corte',
    position: [-2.7, 0.55, -3.05] as [number, number, number],
    product: {
      id: 'mock-corte',
      sku: 'FLIND-AVT-CIR-50',
      name: 'Avental Cirúrgico Impermeável TNT 50g/m²',
      status: 'NORMAL',
      currentStockPackages: 140,
      currentStockUnits: 7000,
      lotNumber: 'LOTE-FLIND-2026-A19',
    },
  },
  {
    id: 'solda',
    name: 'Solda',
    position: [-0.9, 0.55, -3.05] as [number, number, number],
    product: {
      id: 'mock-solda',
      sku: 'FLIND-MSC-TRIP-TIR',
      name: 'Máscara Cirúrgica Tripla com Tiras',
      status: 'LOW',
      currentStockPackages: 22,
      currentStockUnits: 44000,
      lotNumber: 'LOTE-FLIND-2026-B02',
    },
  },
  {
    id: 'dobra',
    name: 'Dobra',
    position: [0.9, 0.55, -3.05] as [number, number, number],
    product: {
      id: 'mock-dobra',
      sku: 'FLIND-LEN-TNT-MACA',
      name: 'Lençol Descartável TNT com Elástico',
      status: 'NORMAL',
      currentStockPackages: 86,
      currentStockUnits: 860,
      lotNumber: 'LOTE-FLIND-2026-C11',
    },
  },
  {
    id: 'embalagem',
    name: 'Embalagem',
    position: [2.7, 0.55, -3.05] as [number, number, number],
    product: {
      id: 'mock-embalagem',
      sku: 'FLIND-TOALET-GEL',
      name: 'Protetor Toalet Descartável com Gel',
      status: 'CRITICAL',
      currentStockPackages: 8,
      currentStockUnits: 480,
      lotNumber: 'LOTE-FLIND-2026-D04',
    },
  },
];

const FALLBACK_SALES: Sale[] = [
  { id: 'sale-1584', orderNumber: '#1584', customerName: 'Jacques Janine', status: 'NEW', totalAmount: 6420 },
  { id: 'sale-1582', orderNumber: '#1582', customerName: 'São Camilo', status: 'BILLED', totalAmount: 18450 },
  { id: 'sale-1583', orderNumber: '#1583', customerName: 'Bella Pelle', status: 'EXPEDITION', totalAmount: 9780 },
];

const FALLBACK_BILLS: Bill[] = [
  { id: 'bill-1', documentNumber: 'NF-004821', customerName: 'São Camilo', status: 'OPEN', amount: 18450, dueDate: '2026-09-30' },
  { id: 'bill-2', documentNumber: 'NF-004790', customerName: 'Bella Pelle', status: 'OVERDUE', amount: 9780, dueDate: '2026-09-12' },
];

const FALLBACK_ORDERS: PurchaseOrder[] = [
  { id: 'po-mock-1', orderNumber: 'PO-FLIND-2026-042', supplierName: 'Fibras & Não-Tecidos Brasil', productName: 'Bobina TNT SMS 40g', status: 'SENT_WHATSAPP', quantityPackages: 40 },
  { id: 'po-mock-2', orderNumber: 'PO-FLIND-2026-043', supplierName: 'Klabin Embalagens', productName: 'Caixa de papelão 60x40', status: 'PENDING', quantityPackages: 120 },
];

const FALLBACK_SHIPMENTS: Shipment[] = [
  { id: 'ship-mock-1', orderNumber: '#1582', carrierName: 'TransHospitalar', status: 'WAITING_DISPATCH', volumesCount: 12 },
  { id: 'ship-mock-2', orderNumber: '#1583', carrierName: 'RodoClínica', status: 'IN_TRANSIT', volumesCount: 18 },
];

const FALLBACK_ALERTS: FloorAlert[] = [
  { id: 'alert-1', severity: 'CRITICAL', status: 'PENDING', message: 'Pedido #1583 bloqueado pela regra de entrega' },
  { id: 'alert-2', severity: 'WARNING', status: 'PENDING', message: 'Estoque baixo na solda' },
];

const FALLBACK_INTEGRATIONS: IntegrationNode[] = [
  { id: 'tray', name: 'Tray', status: 'CONNECTED', detail: 'Pedidos simulados da loja' },
  { id: 'sink', name: 'SINK ERP', status: 'CONNECTED', detail: 'Catálogo e produção locais' },
  { id: 'whatsapp', name: 'WhatsApp', status: 'CONNECTED', detail: 'Mensagens só no protótipo' },
];

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function statusColor(status?: string) {
  if (status === 'LOW' || status === 'DUE_SOON' || status === 'DUE_TODAY' || status === 'WARNING') return '#d97706';
  if (status === 'CRITICAL' || status === 'OUT_OF_STOCK' || status === 'OVERDUE') return '#e11d48';
  if (status === 'NORMAL' || status === 'PAID' || status === 'BILLED' || status === 'CONNECTED' || status === 'INFO') return '#059669';
  return '#4f46e5';
}

export function FactoryFloor() {
  const [products, setProducts] = useState<Product[]>(MACHINE_LAYOUT.map((machine) => machine.product));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(FALLBACK_ORDERS);
  const [shipments, setShipments] = useState<Shipment[]>(FALLBACK_SHIPMENTS);
  const [sales, setSales] = useState<Sale[]>(FALLBACK_SALES);
  const [bills, setBills] = useState<Bill[]>(FALLBACK_BILLS);
  const [alerts, setAlerts] = useState<FloorAlert[]>(FALLBACK_ALERTS);
  const [integrations, setIntegrations] = useState<IntegrationNode[]>(FALLBACK_INTEGRATIONS);
  const [zone, setZone] = useState<ZoneId>('sales');
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/inventory').then((res) => res.json()),
      fetch('/api/purchase-orders').then((res) => res.json()),
      fetch('/api/shipments').then((res) => res.json()),
      fetch('/api/orders').then((res) => res.json()),
      fetch('/api/receivables').then((res) => res.json()),
      fetch('/api/alerts').then((res) => res.json()),
      fetch('/api/integrations/sink-erp/health').then((res) => res.json()),
    ])
      .then(([inventory, orders, loads, salesData, billsData, alertsData, sinkHealth]) => {
        if (cancelled) return;
        const productList = Array.isArray(inventory) ? inventory : inventory?.products;
        if (Array.isArray(productList) && productList.length > 0) setProducts(productList);
        if (Array.isArray(orders) && orders.length > 0) setPurchaseOrders(orders);
        if (Array.isArray(loads) && loads.length > 0) setShipments(loads);
        if (Array.isArray(salesData) && salesData.length > 0) {
          setSales(
            salesData.slice(0, 6).map((order) => ({
              id: order.id,
              orderNumber: order.orderNumber,
              customerName: order.customer?.name || 'Cliente',
              status: order.status,
              totalAmount: order.totalAmount || 0,
            }))
          );
        }
        if (Array.isArray(billsData) && billsData.length > 0) {
          setBills(
            billsData.slice(0, 6).map((bill) => ({
              id: bill.id,
              documentNumber: bill.documentNumber || bill.invoiceNumber || 'Título',
              customerName: bill.customerName || 'Cliente',
              status: bill.status,
              amount: bill.amount || 0,
              dueDate: bill.dueDate || '',
            }))
          );
        }
        if (Array.isArray(alertsData) && alertsData.length > 0) {
          setAlerts(
            alertsData.slice(0, 4).map((alert) => ({
              id: alert.id,
              severity: alert.severity || 'INFO',
              status: alert.status || 'PENDING',
              message: alert.message || 'Alerta simulado',
            }))
          );
        }
        if (sinkHealth) {
          setIntegrations((current) =>
            current.map((item) =>
              item.id === 'sink'
                ? {
                    ...item,
                    status: sinkHealth.status || item.status,
                    detail: sinkHealth.message || item.detail,
                  }
                : item
            )
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const machines = useMemo(
    () =>
      MACHINE_LAYOUT.map((machine, index) => ({
        ...machine,
        product: products[index] || machine.product,
      })),
    [products]
  );

  const select = (nextZone: ZoneId, id: string | null = null) => {
    setZone(nextZone);
    setFocusId(id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] gap-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Chão de fábrica</h3>
          <p className="text-xs text-slate-500 mt-0.5">Arraste para girar. Clique numa área para ver os dados dela.</p>
        </div>
        <div className="h-[480px] bg-slate-200">
          <Canvas camera={{ position: [0.4, 7.4, 11.2], fov: 38 }}>
            <color attach="background" args={['#e2e8f0']} />
            <ambientLight intensity={0.8} />
            <directionalLight position={[6, 10, 6]} intensity={1.1} />
            <FactoryScene
              machines={machines}
              products={products}
              purchaseOrders={purchaseOrders}
              shipments={shipments}
              sales={sales}
              bills={bills}
              alerts={alerts}
              integrations={integrations}
              zone={zone}
              focusId={focusId}
              onSelect={select}
            />
            <OrbitControls
              enablePan={false}
              minDistance={7}
              maxDistance={20}
              maxPolarAngle={Math.PI / 2.2}
              target={[0.4, 0, 0.2]}
            />
          </Canvas>
        </div>
      </div>

      <ZonePanel
        zone={zone}
        focusId={focusId}
        machines={machines}
        products={products}
        purchaseOrders={purchaseOrders}
        shipments={shipments}
        sales={sales}
        bills={bills}
        alerts={alerts}
        integrations={integrations}
        onClearFocus={() => setFocusId(null)}
      />
    </div>
  );
}

type Lamp = 'operating' | 'alert' | 'stopped' | 'maintenance';

function lampOf(status?: string): Lamp {
  if (status === 'CRITICAL' || status === 'OUT_OF_STOCK' || status === 'OVERDUE') return 'stopped';
  if (status === 'LOW' || status === 'WARNING' || status === 'DUE_SOON' || status === 'DUE_TODAY') return 'alert';
  if (status === 'MAINTENANCE') return 'maintenance';
  return 'operating';
}

const LAMP_COLOR: Record<Lamp, string> = {
  operating: '#4ade80',
  alert: '#facc15',
  stopped: '#fb7185',
  maintenance: '#60a5fa',
};

const LAMP_WORD: Record<Lamp, string> = {
  operating: 'OPERANDO',
  alert: 'ALERTA',
  stopped: 'PARADA',
  maintenance: 'MANUTENÇÃO',
};

function FactoryScene({
  machines,
  bills,
  alerts,
  zone,
  focusId,
  onSelect,
}: {
  machines: Array<(typeof MACHINE_LAYOUT)[number] & { product?: Product }>;
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  shipments: Shipment[];
  sales: Sale[];
  bills: Bill[];
  alerts: FloorAlert[];
  integrations: IntegrationNode[];
  zone: ZoneId;
  focusId: string | null;
  onSelect: (zone: ZoneId, id?: string | null) => void;
}) {
  const alertLamp: Lamp = alerts.some((item) => item.severity === 'CRITICAL' && item.status === 'PENDING')
    ? 'stopped'
    : alerts.some((item) => item.status === 'PENDING')
      ? 'alert'
      : 'operating';
  const financeLamp: Lamp = bills.some((bill) => bill.status === 'OVERDUE') ? 'alert' : 'operating';
  const machineX = [-4.2, -1.8, 0.6, 3];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[22, 12]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <Grid
        position={[0, 0.01, 0]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#cbd5e1"
        sectionSize={2.5}
        sectionThickness={1}
        sectionColor="#94a3b8"
        fadeDistance={18}
        fadeStrength={1.2}
        infiniteGrid={false}
      />

      <FloorTint position={[-6.7, 0.02, -1.15]} size={[3.1, 2.3]} color="#ede9fe" />
      <FloorTint position={[-3, 0.02, -1.15]} size={[4.2, 2.3]} color="#e0e7ff" />
      <FloorTint position={[1.8, 0.02, -1.15]} size={[3.2, 2.3]} color="#ddd6fe" />
      <FloorTint position={[5.2, 0.02, -1.15]} size={[2.6, 2.3]} color="#dbeafe" />
      <FloorTint position={[-4.2, 0.02, 1.4]} size={[2.6, 2.2]} color="#dcfce7" />
      <FloorTint position={[-1.5, 0.02, 1.4]} size={[2.4, 2.2]} color="#d1fae5" />
      <FloorTint position={[1.1, 0.02, 1.4]} size={[2.2, 2.2]} color="#fef3c7" />
      <FloorTint position={[3.5, 0.02, 1.4]} size={[2.2, 2.2]} color="#fee2e2" />
      <FloorTint position={[5.8, 0.02, 1.4]} size={[2.2, 2.2]} color="#cffafe" />

      <Belt z={-1.15} />
      <Belt z={1.4} />

      <Crate position={[-7.15, 0.28, -1.35]} color="#7c3aed" onClick={() => onSelect('stock', null)} />
      <Crate position={[-6.35, 0.28, -0.85]} color="#8b5cf6" onClick={() => onSelect('stock', null)} />
      <BeltTag position={[-6.7, 0.42, -1.85]} text="ESTOQUE" />

      {machines.map((machine, index) => {
        const lamp = lampOf(machine.product?.status);
        return (
          <Station
            key={machine.id}
            position={[machineX[index], 0, -1.15]}
            title={`${machine.name.toUpperCase()} · ${LAMP_WORD[lamp]}`}
            lamp={lamp}
            panel={statusColor(machine.product?.status)}
            selected={zone === 'machines' && focusId === machine.id}
            onClick={() => onSelect('machines', machine.id)}
          />
        );
      })}

      <BeltTag position={[-3, 0.42, -0.55]} text="PRODUÇÃO" />
      <BeltTag position={[1.8, 0.42, -0.55]} text="QUALIDADE" />
      <BeltTag position={[3, 0.42, -1.75]} text="EMBALAGEM" />

      <Station
        position={[5.5, 0, -1.15]}
        title="EXPEDIÇÃO · OPERANDO"
        lamp="operating"
        panel="#2563eb"
        selected={zone === 'expedition'}
        onClick={() => onSelect('expedition', null)}
      />

      <Station
        position={[-4.2, 0, 1.4]}
        title="VENDAS · OPERANDO"
        lamp="operating"
        panel="#16a34a"
        selected={zone === 'sales'}
        onClick={() => onSelect('sales', null)}
      />
      <Station
        position={[-1.6, 0, 1.4]}
        title={`FINANCEIRO · ${LAMP_WORD[financeLamp]}`}
        lamp={financeLamp}
        panel={financeLamp === 'alert' ? '#d97706' : '#059669'}
        selected={zone === 'financial'}
        onClick={() => onSelect('financial', null)}
      />
      <Station
        position={[1, 0, 1.4]}
        title="FORNECEDORES · OPERANDO"
        lamp="operating"
        panel="#d97706"
        selected={zone === 'suppliers'}
        onClick={() => onSelect('suppliers', null)}
      />
      <Station
        position={[3.5, 0, 1.4]}
        title={`ALERTAS · ${LAMP_WORD[alertLamp]}`}
        lamp={alertLamp}
        panel={alertLamp === 'stopped' ? '#e11d48' : '#d97706'}
        selected={zone === 'alerts'}
        onClick={() => onSelect('alerts', null)}
      />
      <Station
        position={[6, 0, 1.4]}
        title="INTEGRAÇÕES · OPERANDO"
        lamp="operating"
        panel="#0891b2"
        selected={zone === 'integrations'}
        onClick={() => onSelect('integrations', null)}
      />

      {[-5.4, -2.6, 0.1, 2.8, 5.2].map((x) => (
        <mesh key={x} position={[x, 1.7, -2.85]}>
          <cylinderGeometry args={[0.055, 0.055, 3.4, 10]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      ))}

      <BeltLoad z={-1.15} offset={0} />
      <BeltLoad z={-1.15} offset={0.42} />
      <BeltLoad z={1.4} offset={0.18} />
      <BeltLoad z={1.4} offset={0.66} />
    </group>
  );
}

function FloorTint({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number];
  color: string;
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Belt({ z }: { z: number }) {
  return (
    <mesh position={[0.2, 0.08, z]}>
      <boxGeometry args={[14.2, 0.08, 0.28]} />
      <meshStandardMaterial color="#64748b" />
    </mesh>
  );
}

function BeltTag({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Billboard position={position}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[text.length * 0.09 + 0.28, 0.26]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <Text fontSize={0.11} color="#334155" anchorX="center" anchorY="middle">
        {text}
      </Text>
    </Billboard>
  );
}

function Crate({
  position,
  color,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  onClick: () => void;
}) {
  return (
    <mesh
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <boxGeometry args={[0.55, 0.5, 0.55]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Station({
  position,
  title,
  lamp,
  panel,
  selected,
  onClick,
}: {
  position: [number, number, number];
  title: string;
  lamp: Lamp;
  panel: string;
  selected: boolean;
  onClick: () => void;
}) {
  const light = useRef<Mesh>(null);
  const color = LAMP_COLOR[lamp];

  useFrame(({ clock }) => {
    if (!light.current) return;
    const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
    light.current.scale.setScalar(scale);
  });

  return (
    <group position={position}>
      {(lamp === 'stopped' || lamp === 'alert') && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.52, 0.66, 32]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
      <mesh
        position={[0, 0.42, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
      >
        <boxGeometry args={[0.82, 0.68, 0.82]} />
        <meshStandardMaterial color={selected ? '#312e81' : panel} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.62, 0.1, 0.62]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh ref={light} position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      <Billboard position={[0, 1.42, 0]}>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[Math.min(2.4, title.length * 0.075 + 0.25), 0.28]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <Text fontSize={0.1} color="#0f172a" anchorX="center" anchorY="middle">
          {title}
        </Text>
      </Billboard>
    </group>
  );
}

function BeltLoad({ z, offset }: { z: number; offset: number }) {
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const progress = (clock.elapsedTime * 0.12 + offset) % 1;
    group.current.position.set(-6.4 + progress * 12.6, 0.22, z);
  });

  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[0.28, 0.2, 0.22]} />
        <meshStandardMaterial color="#4338ca" />
      </mesh>
    </group>
  );
}


function ZonePanel({
  zone,
  focusId,
  machines,
  products,
  purchaseOrders,
  shipments,
  sales,
  bills,
  alerts,
  integrations,
  onClearFocus,
}: {
  zone: ZoneId;
  focusId: string | null;
  machines: Array<(typeof MACHINE_LAYOUT)[number] & { product?: Product }>;
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  shipments: Shipment[];
  sales: Sale[];
  bills: Bill[];
  alerts: FloorAlert[];
  integrations: IntegrationNode[];
  onClearFocus: () => void;
}) {
  const titles: Record<ZoneId, string> = {
    sales: 'Vendas',
    machines: 'Máquinas',
    stock: 'Estoque',
    financial: 'Financeiro',
    suppliers: 'Fornecedores',
    expedition: 'Expedição',
    alerts: 'Alertas',
    integrations: 'Integrações',
  };

  let lines: Array<{ id: string; title: string; detail: string }> = [];

  if (zone === 'sales') {
    const visible = focusId ? sales.filter((sale) => sale.id === focusId) : sales;
    lines = visible.map((sale) => ({
      id: sale.id,
      title: `${sale.orderNumber} · ${sale.customerName}`,
      detail: `${sale.status} · ${money(sale.totalAmount)}`,
    }));
  } else if (zone === 'machines') {
    const visible = focusId ? machines.filter((machine) => machine.id === focusId) : machines;
    lines = visible.map((machine) => ({
      id: machine.id,
      title: machine.name,
      detail: machine.product
        ? `Em produção · ${machine.product.name} · lote ${machine.product.lotNumber || 'simulado'} · ${machine.product.currentStockPackages ?? 0} volumes`
        : 'Em produção · lote simulado',
    }));
  } else if (zone === 'stock') {
    const visible = focusId ? products.filter((product) => product.id === focusId) : products;
    lines = visible.map((product) => ({
      id: product.id,
      title: `${product.sku} · ${product.name}`,
      detail: `${product.status || 'NORMAL'} · ${product.currentStockPackages ?? 0} volumes · ${product.currentStockUnits ?? 0} un`,
    }));
  } else if (zone === 'financial') {
    const visible = focusId ? bills.filter((bill) => bill.id === focusId) : bills;
    lines = visible.map((bill) => ({
      id: bill.id,
      title: `${bill.documentNumber} · ${bill.customerName}`,
      detail: `${bill.status} · vence ${bill.dueDate} · ${money(bill.amount)}`,
    }));
  } else if (zone === 'suppliers') {
    const visible = focusId ? purchaseOrders.filter((order) => order.id === focusId) : purchaseOrders;
    lines = visible.map((order) => ({
      id: order.id,
      title: `${order.orderNumber} · ${order.supplierName}`,
      detail: `${order.productName} · ${order.quantityPackages} volumes · ${order.status}`,
    }));
  } else if (zone === 'expedition') {
    const visible = focusId ? shipments.filter((shipment) => shipment.id === focusId) : shipments;
    lines = visible.map((shipment) => ({
      id: shipment.id,
      title: `${shipment.orderNumber} · ${shipment.carrierName || 'Transportadora'}`,
      detail: `${shipment.status} · ${shipment.volumesCount || 0} volumes`,
    }));
  } else if (zone === 'alerts') {
    const visible = focusId ? alerts.filter((alert) => alert.id === focusId) : alerts;
    lines = visible.map((alert) => ({
      id: alert.id,
      title: `${alert.severity} · ${alert.status}`,
      detail: alert.message,
    }));
  } else {
    const visible = focusId ? integrations.filter((item) => item.id === focusId) : integrations;
    lines = visible.map((item) => ({
      id: item.id,
      title: item.name,
      detail: `${item.status} · ${item.detail}`,
    }));
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 flex flex-col min-h-[420px]">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{titles[zone]}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Dados simulados desta área.</p>
        </div>
        {focusId && (
          <button type="button" onClick={onClearFocus} className="text-xs font-medium text-indigo-600">
            Ver tudo
          </button>
        )}
      </div>
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[460px]">
        {lines.length === 0 && <div className="px-4 py-6 text-sm text-slate-500">Nenhum dado nesta área.</div>}
        {lines.map((line) => (
          <div key={line.id} className="px-4 py-3">
            <div className="text-sm text-slate-900">{line.title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{line.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
