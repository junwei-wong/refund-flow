export type RefundStatus = 'paid' | 'refunded';

export type RefundReason =
  | 'Wrong item'
  | 'Missing item'
  | 'Quality issue'
  | 'Late delivery'
  | 'Other';

export type RefundChannel = 'Original payment method' | 'In-app credit';

export interface AddonItem {
  addon_id: string;
  name: string;
  unit_price: number;
  status: RefundStatus;
}

export interface UnitItem {
  unit_id: string;
  status: RefundStatus;
  addons: AddonItem[];
}

export interface LineItem {
  line_id: string;
  name: string;
  unit_price: number;
  units: UnitItem[];
}

export interface Order {
  order_id: string;
  status: 'completed' | 'refunded' | 'partially_refunded';
  currency: string;
  delivery_fee: number;
  delivery_fee_status: RefundStatus;
  items: LineItem[];
}

export interface RefundSelection {
  selectedUnitIds: string[];
  selectedAddonKeys: string[];
  refundDeliveryFee: boolean;
}

export interface RefundBreakdownItem {
  unitId: string;
  lineName: string;
  unitPrice: number;
  selectedAddons: {
    addonId: string;
    name: string;
    unitPrice: number;
  }[];
  subtotal: number;
}

export interface RefundCalculationResult {
  itemsSubtotal: number;
  deliveryFee: number;
  totalRefund: number;
  isFullRefund: boolean;
  selectedCount: number;
  totalRefundableUnits: number;
  breakdown: RefundBreakdownItem[];
}

export interface ProcessRefundPayload {
  orderId: string;
  reason: RefundReason;
  channel: RefundChannel;
  selection: RefundSelection;
  calculation: RefundCalculationResult;
  notes?: string;
}

export interface ProcessRefundResponse {
  success: boolean;
  refundId: string;
  refundedAt: string;
  updatedOrder: Order;
  message?: string;
}

