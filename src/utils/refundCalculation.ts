import type {
  Order,
  RefundSelection,
  RefundCalculationResult,
  RefundBreakdownItem,
  UnitItem,
  AddonItem,
} from "../types/refund.ts";

export function getAddonKey(unitId: string, addonId: string): string {
  return `${unitId}:${addonId}`;
}

export function isUnitRefundable(unit: UnitItem): boolean {
  return unit.status === "paid";
}

export function isAddonRefundable(unit: UnitItem, addon: AddonItem): boolean {
  return unit.status === "paid" && addon.status === "paid";
}

export function hasRefundableItems(order: Order): boolean {
  const hasUnits = order.items.some((line) =>
    line.units.some((u) => isUnitRefundable(u)),
  );
  const hasDelivery =
    order.delivery_fee_status === "paid" && order.delivery_fee > 0;
  return hasUnits || hasDelivery;
}

export function selectAllRefundable(order: Order): RefundSelection {
  const selectedUnitIds: string[] = [];
  const selectedAddonKeys: string[] = [];

  for (const line of order.items) {
    for (const unit of line.units) {
      if (isUnitRefundable(unit)) {
        selectedUnitIds.push(unit.unit_id);
        for (const addon of unit.addons) {
          if (isAddonRefundable(unit, addon)) {
            selectedAddonKeys.push(getAddonKey(unit.unit_id, addon.addon_id));
          }
        }
      }
    }
  }

  return {
    selectedUnitIds,
    selectedAddonKeys,
    refundDeliveryFee:
      order.delivery_fee_status === "paid" && order.delivery_fee > 0,
  };
}

export function createEmptySelection(): RefundSelection {
  return {
    selectedUnitIds: [],
    selectedAddonKeys: [],
    refundDeliveryFee: false,
  };
}

export function toggleUnit(
  selection: RefundSelection,
  unit: UnitItem,
): RefundSelection {
  const isCurrentlySelected = selection.selectedUnitIds.includes(unit.unit_id);
  const nextUnitIds = isCurrentlySelected
    ? selection.selectedUnitIds.filter((id) => id !== unit.unit_id)
    : [...selection.selectedUnitIds, unit.unit_id];

  let nextAddonKeys = [...selection.selectedAddonKeys];

  if (isCurrentlySelected) {
    nextAddonKeys = nextAddonKeys.filter(
      (key) => !key.startsWith(`${unit.unit_id}:`),
    );
  } else {
    for (const addon of unit.addons) {
      if (isAddonRefundable(unit, addon)) {
        const key = getAddonKey(unit.unit_id, addon.addon_id);
        if (!nextAddonKeys.includes(key)) {
          nextAddonKeys.push(key);
        }
      }
    }
  }

  return {
    ...selection,
    selectedUnitIds: nextUnitIds,
    selectedAddonKeys: nextAddonKeys,
  };
}

export function toggleAddon(
  selection: RefundSelection,
  unit: UnitItem,
  addon: AddonItem,
): RefundSelection {
  if (!isAddonRefundable(unit, addon)) {
    return selection;
  }

  const addonKey = getAddonKey(unit.unit_id, addon.addon_id);
  const isAddonSelected = selection.selectedAddonKeys.includes(addonKey);

  let nextUnitIds = [...selection.selectedUnitIds];
  let nextAddonKeys = [...selection.selectedAddonKeys];

  if (isAddonSelected) {
    nextAddonKeys = nextAddonKeys.filter((k) => k !== addonKey);
  } else {
    nextAddonKeys.push(addonKey);
    if (!nextUnitIds.includes(unit.unit_id)) {
      nextUnitIds.push(unit.unit_id);
    }
  }

  return {
    ...selection,
    selectedUnitIds: nextUnitIds,
    selectedAddonKeys: nextAddonKeys,
  };
}

export function calculateRefund(
  order: Order,
  selection: RefundSelection,
): RefundCalculationResult {
  let itemsCents = 0;
  const breakdown: RefundBreakdownItem[] = [];

  let totalRefundableUnits = 0;
  let totalSelectedUnits = 0;
  let allPossibleRefundableItemsSelected = true;

  for (const line of order.items) {
    for (const unit of line.units) {
      const unitRefundable = isUnitRefundable(unit);
      if (unitRefundable) {
        totalRefundableUnits += 1;
      }

      const isUnitSelected = selection.selectedUnitIds.includes(unit.unit_id);

      if (unitRefundable && !isUnitSelected) {
        allPossibleRefundableItemsSelected = false;
      }

      if (isUnitSelected && unitRefundable) {
        totalSelectedUnits += 1;
        let unitSubtotalCents = Math.round(line.unit_price * 100);

        const selectedAddons: {
          addonId: string;
          name: string;
          unitPrice: number;
        }[] = [];

        for (const addon of unit.addons) {
          const addonKey = getAddonKey(unit.unit_id, addon.addon_id);
          const isAddonSelected =
            selection.selectedAddonKeys.includes(addonKey);
          const addonRefundable = isAddonRefundable(unit, addon);

          if (addonRefundable && !isAddonSelected) {
            allPossibleRefundableItemsSelected = false;
          }

          if (isAddonSelected && addonRefundable) {
            const addonCents = Math.round(addon.unit_price * 100);
            unitSubtotalCents += addonCents;
            selectedAddons.push({
              addonId: addon.addon_id,
              name: addon.name,
              unitPrice: addon.unit_price,
            });
          }
        }

        itemsCents += unitSubtotalCents;

        breakdown.push({
          unitId: unit.unit_id,
          lineName: line.name,
          unitPrice: line.unit_price,
          selectedAddons,
          subtotal: unitSubtotalCents / 100,
        });
      }
    }
  }

  let deliveryFeeCents = 0;
  const deliveryRefundable =
    order.delivery_fee_status === "paid" && order.delivery_fee > 0;

  if (selection.refundDeliveryFee && deliveryRefundable) {
    deliveryFeeCents = Math.round(order.delivery_fee * 100);
  }

  if (deliveryRefundable && !selection.refundDeliveryFee) {
    allPossibleRefundableItemsSelected = false;
  }

  const totalRefundCents = itemsCents + deliveryFeeCents;
  const totalRefund = totalRefundCents / 100;
  const itemsSubtotal = itemsCents / 100;
  const deliveryFee = deliveryFeeCents / 100;

  const isFullRefund =
    totalRefundableUnits > 0 &&
    allPossibleRefundableItemsSelected &&
    totalRefund > 0;

  return {
    itemsSubtotal,
    deliveryFee,
    totalRefund,
    isFullRefund,
    selectedCount: totalSelectedUnits,
    totalRefundableUnits,
    breakdown,
  };
}

export function formatCurrency(
  amount: number,
  currency: string = "MYR",
): string {
  return `${currency} ${amount.toFixed(2)}`;
}
