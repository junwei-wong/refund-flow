import { initialOrder } from "../data/orderData.ts";
import type {
  Order,
  ProcessRefundPayload,
  ProcessRefundResponse,
} from "../types/refund.ts";

let currentOrder: Order = JSON.parse(JSON.stringify(initialOrder));
let forceFailure = false;

export const refundApi = {
  setForceFailure(shouldFail: boolean) {
    forceFailure = shouldFail;
  },

  resetOrder(): Order {
    currentOrder = JSON.parse(JSON.stringify(initialOrder));
    return JSON.parse(JSON.stringify(currentOrder));
  },

  async getOrder(orderId: string): Promise<Order> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (forceFailure) {
      throw new Error("Network error: Unable to fetch order details.");
    }
    if (currentOrder.order_id !== orderId) {
      throw new Error(`Order ${orderId} not found.`);
    }
    return JSON.parse(JSON.stringify(currentOrder));
  },

  async processRefund(
    payload: ProcessRefundPayload,
  ): Promise<ProcessRefundResponse> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (forceFailure) {
      throw new Error(
        "Payment Gateway Error: The refund transaction was rejected by the upstream payment provider (Error Code: PG_502).",
      );
    }

    if (payload.calculation.totalRefund <= 0) {
      throw new Error(
        "Validation error: Refund amount must be greater than RM 0.00.",
      );
    }

    const updatedOrder: Order = JSON.parse(JSON.stringify(currentOrder));

    for (const line of updatedOrder.items) {
      for (const unit of line.units) {
        if (payload.selection.selectedUnitIds.includes(unit.unit_id)) {
          unit.status = "refunded";
        }
        for (const addon of unit.addons) {
          const key = `${unit.unit_id}:${addon.addon_id}`;
          if (payload.selection.selectedAddonKeys.includes(key)) {
            addon.status = "refunded";
          }
        }
      }
    }

    if (payload.selection.refundDeliveryFee) {
      updatedOrder.delivery_fee_status = "refunded";
    }

    const allUnitsRefunded = updatedOrder.items.every((line) =>
      line.units.every((u) => u.status === "refunded"),
    );
    const someUnitRefunded = updatedOrder.items.some((line) =>
      line.units.some((u) => u.status === "refunded"),
    );

    if (allUnitsRefunded) {
      updatedOrder.status = "refunded";
    } else if (someUnitRefunded) {
      updatedOrder.status = "partially_refunded";
    }

    currentOrder = updatedOrder;

    const refundId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      success: true,
      refundId,
      refundedAt: new Date().toISOString(),
      updatedOrder: JSON.parse(JSON.stringify(currentOrder)),
      message: `Successfully processed refund ${refundId} of ${currentOrder.currency} ${payload.calculation.totalRefund.toFixed(2)} via ${payload.channel}.`,
    };
  },
};
