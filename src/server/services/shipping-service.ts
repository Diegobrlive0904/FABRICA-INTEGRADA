/**
 * Serviço de Expedição, Etiquetagem com QR Code e Rastreabilidade
 */

import QRCode from 'qrcode';
import crypto from 'crypto';
import { db } from '../database/db';
import { Order, Shipment, VehicleType } from '../../types';

export interface ShippingLabelItemDetail {
  sku: string;
  title: string;
  quantity: number;
  packagingUnit: string;
  unitsPerPackage: number;
  totalUnitsInVolume: number;
  weightKg: number;
  lotNumber: string;
  manufactureDate: string;
  expiryDate: string;
}

export interface ShippingLabelData {
  orderNumber: string;
  invoiceNumber: string;
  invoiceKey?: string;
  customerName: string;
  customerTaxId: string;
  carrierName: string;
  trackingCode?: string;
  deliveryAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    entryGate?: string;
  };
  volumesCount: number;
  totalWeightKg: number;
  notes?: string;
  trackingToken: string;
  trackingUrl: string;
  qrCodeDataUrl: string;
  generatedAt: string;
  items: ShippingLabelItemDetail[];
  primaryItem?: ShippingLabelItemDetail;
}

export class ShippingService {
  /**
   * Gera ou recupera a expedição/rastreabilidade de um pedido com token único e seguro
   */
  public async getOrCreateShipment(
    orderId: string,
    options?: {
      carrierName?: string;
      volumesCount?: number;
      selectedVehicleType?: VehicleType;
      notes?: string;
    }
  ): Promise<Shipment> {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error(`Pedido ${orderId} não encontrado.`);
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

    // Gerar token seguro de rastreabilidade
    const randomHex = crypto.randomBytes(6).toString('hex');
    const orderShortNum = order.orderNumber.replace('#', '');
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
      invoiceNumber: order.invoiceNumber || 'NF-PENDENTE',
      invoiceKey: order.invoiceKey,
      carrierName: options?.carrierName || 'Braspress Transportes Urgentes',
      trackingCode: `TRK-${Math.floor(1000000 + Math.random() * 9000000)}`,
      volumesCount: options?.volumesCount || Math.max(1, Math.ceil(order.items.length / 2)),
      totalWeightKg: totalWeightKg || 50,
      selectedVehicleType: options?.selectedVehicleType || 'TRUCK',
      status: 'WAITING_DISPATCH',
      notes: options?.notes || 'Carga paletizada. Manusear com cuidado.',
      createdAt: new Date().toISOString(),
    };

    db.upsertShipment(shipment);

    // Salvar token no pedido
    order.trackingToken = trackingToken;
    db.upsertOrder(order);

    // Registrar auditoria
    db.addAuditLog({
      id: `aud-${Date.now()}`,
      action: 'SHIPMENT_CREATED',
      origin: 'ShippingService.getOrCreateShipment',
      entity: 'Shipment',
      entityId: shipment.id,
      newValue: {
        orderNumber: shipment.orderNumber,
        trackingToken: shipment.trackingToken,
        carrierName: shipment.carrierName,
      },
      userOrService: 'Expedition Operator',
      correlationId: `corr-ship-${shipment.id}`,
      createdAt: new Date().toISOString(),
    });

    return shipment;
  }

  /**
   * Gera os dados completos da Etiqueta de Expedição com QR Code embutido
   */
  public async generateShippingLabel(orderId: string): Promise<ShippingLabelData> {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new Error(`Pedido ${orderId} não encontrado.`);
    }

    const shipment = await this.getOrCreateShipment(orderId);
    const customer = db.getCustomerById(order.customerId);
    const address = db.getAddressById(order.deliveryAddressId);
    const rule = address ? db.getDeliveryRuleByAddressId(address.id) : undefined;

    // URL pública segura do QR Code (sem expor dados sensíveis no QR Code bruto)
    const appUrl = process.env.APP_URL || '';
    const trackingUrl = appUrl ? `${appUrl}/trace/${shipment.trackingToken}` : `/trace/${shipment.trackingToken}`;

    // Gerar QR Code Data URL com alta legibilidade
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 260,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    });

    // Enriquecer itens com dados de embalagem, peso, fabricação e validade do estoque
    const labelItems: ShippingLabelItemDetail[] = order.items.map((it) => {
      const prod = db.getProductBySku(it.sku) || db.getProductById(it.productId);
      const packagingUnit = it.packagingUnit || prod?.packagingUnit || 'Caixa (CX)';
      const unitsPerPackage = it.unitsPerPackage || prod?.unitsPerPackage || 50;
      const weightKg = (it.weightKg || prod?.weightPerPackageKg || 12.0) * it.quantity;
      const lotNumber = it.lotNumber || prod?.lotNumber || 'LOTE-FLIND-2026';
      const manufactureDate = it.manufactureDate || prod?.manufactureDate || '2026-08-15';
      const expiryDate = it.expiryDate || prod?.expiryDate || '2029-08-15';
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
        expiryDate,
      };
    });

    return {
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber || 'NF-e em Emissão',
      invoiceKey: order.invoiceKey,
      customerName: customer?.name || 'Cliente Fábrica Integrada',
      customerTaxId: customer?.taxId || 'CNPJ não informado',
      carrierName: shipment.carrierName,
      trackingCode: shipment.trackingCode,
      deliveryAddress: {
        street: address?.street || 'Endereço Principal',
        number: address?.number || 'S/N',
        complement: address?.complement,
        neighborhood: address?.neighborhood || '',
        city: address?.city || 'São Paulo',
        state: address?.state || 'SP',
        zipCode: address?.zipCode || '00000-000',
        entryGate: rule?.entryGate,
      },
      volumesCount: shipment.volumesCount,
      totalWeightKg: shipment.totalWeightKg,
      notes: shipment.notes || rule?.notes || 'Conferir no ato da entrega.',
      trackingToken: shipment.trackingToken,
      trackingUrl,
      qrCodeDataUrl,
      generatedAt: new Date().toISOString(),
      items: labelItems,
      primaryItem: labelItems[0],
    };
  }

  /**
   * Consulta pública autorizada via token de rastreabilidade
   * /trace/{token}
   */
  public getTraceabilityByToken(token: string) {
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
      destinationCityState: address ? `${address.city} - ${address.state}` : 'Não informado',
      recipientName: customer?.name ? `${customer.name.slice(0, 15)}... (Protegido LGPD)` : 'Destinatário Autorizado',
      timeline: order.timeline.map((t) => ({
        stageLabel: t.stageLabel,
        status: t.status,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
        notes: t.notes,
      })),
      products: order.items.map((i) => ({
        sku: i.sku,
        title: i.title,
        quantity: i.quantity,
        lotNumber: i.lotNumber,
      })),
      updatedAt: order.updatedAt,
    };
  }
}

export const shippingService = new ShippingService();
