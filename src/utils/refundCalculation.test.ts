import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { initialOrder } from '../data/orderData.ts';
import {
  calculateRefund,
  selectAllRefundable,
  createEmptySelection,
  toggleUnit,
  toggleAddon,
  isUnitRefundable,
  isAddonRefundable,
  getAddonKey,
} from './refundCalculation.ts';
import type { RefundSelection } from '../types/refund.ts';

describe('Refund Calculation and Business Rules', () => {
  it('correctly reports empty selection as RM 0.00', () => {
    const selection = createEmptySelection();
    const result = calculateRefund(initialOrder, selection);

    assert.equal(result.totalRefund, 0);
    assert.equal(result.itemsSubtotal, 0);
    assert.equal(result.deliveryFee, 0);
    assert.equal(result.isFullRefund, false);
    assert.equal(result.breakdown.length, 0);
  });

  it('calculates refund for a single paid unit (Butter Croissant L3-1)', () => {
    const selection: RefundSelection = {
      selectedUnitIds: ['L3-1'],
      selectedAddonKeys: [],
      refundDeliveryFee: false,
    };
    const result = calculateRefund(initialOrder, selection);

    assert.equal(result.totalRefund, 7.9);
    assert.equal(result.itemsSubtotal, 7.9);
    assert.equal(result.deliveryFee, 0);
    assert.equal(result.isFullRefund, false);
    assert.equal(result.breakdown.length, 1);
    assert.equal(result.breakdown[0].unitId, 'L3-1');
  });

  it('calculates refund for a unit with add-ons (Hazelnut Americano L2-1)', () => {
    // L2 unit price = 11.90, Oat Milk A2 = 1.50, Brown Sugar Syrup A3 = 1.00
    // Total should be 11.90 + 1.50 + 1.00 = 14.40
    const selection: RefundSelection = {
      selectedUnitIds: ['L2-1'],
      selectedAddonKeys: [getAddonKey('L2-1', 'A2'), getAddonKey('L2-1', 'A3')],
      refundDeliveryFee: false,
    };
    const result = calculateRefund(initialOrder, selection);

    assert.equal(result.itemsSubtotal, 14.4);
    assert.equal(result.totalRefund, 14.4);
    assert.equal(result.breakdown[0].selectedAddons.length, 2);
  });

  it('calculates refund including optional delivery fee', () => {
    const selection: RefundSelection = {
      selectedUnitIds: ['L3-1'],
      selectedAddonKeys: [],
      refundDeliveryFee: true, // 5.00
    };
    const result = calculateRefund(initialOrder, selection);

    // 7.90 + 5.00 = 12.90
    assert.equal(result.itemsSubtotal, 7.9);
    assert.equal(result.deliveryFee, 5.0);
    assert.equal(result.totalRefund, 12.9);
  });

  it('ignores already refunded units and add-ons', () => {
    // L1-1 is already refunded in initialOrder. Selecting it should yield 0.
    const selection: RefundSelection = {
      selectedUnitIds: ['L1-1'],
      selectedAddonKeys: [getAddonKey('L1-1', 'A1')],
      refundDeliveryFee: false,
    };
    const result = calculateRefund(initialOrder, selection);

    assert.equal(result.totalRefund, 0);
    assert.equal(result.breakdown.length, 0);
  });

  it('correctly handles full refund when selecting all refundable items', () => {
    const fullSelection = selectAllRefundable(initialOrder);
    const result = calculateRefund(initialOrder, fullSelection);

    // Initial order refundable units:
    // L1-2: 13.90 + A1(2.00) = 15.90
    // L2-1: 11.90 + A2(1.50) + A3(1.00) = 14.40
    // L3-1: 7.90
    // L3-2: 7.90
    // L3-3: 7.90
    // Items subtotal: 15.90 + 14.40 + 7.90 + 7.90 + 7.90 = 54.00
    // Delivery fee: 5.00
    // Total refund: 59.00
    assert.equal(result.itemsSubtotal, 54.0);
    assert.equal(result.deliveryFee, 5.0);
    assert.equal(result.totalRefund, 59.0);
    assert.equal(result.isFullRefund, true);
  });

  it('unselecting a unit automatically unselects its add-ons', () => {
    const unit = initialOrder.items[1].units[0]; // L2-1
    let selection = createEmptySelection();

    // Select unit -> auto selects addons
    selection = toggleUnit(selection, unit);
    assert.ok(selection.selectedUnitIds.includes('L2-1'));
    assert.ok(selection.selectedAddonKeys.includes(getAddonKey('L2-1', 'A2')));

    // Unselect unit -> addons must be removed
    selection = toggleUnit(selection, unit);
    assert.ok(!selection.selectedUnitIds.includes('L2-1'));
    assert.equal(selection.selectedAddonKeys.length, 0);
  });

  it('selecting an add-on automatically selects the parent drink', () => {
    const unit = initialOrder.items[0].units[1]; // L1-2
    const addon = unit.addons[0]; // A1 Extra shot
    const selection = createEmptySelection();

    const updated = toggleAddon(selection, unit, addon);
    assert.ok(updated.selectedAddonKeys.includes(getAddonKey('L1-2', 'A1')));
    assert.ok(updated.selectedUnitIds.includes('L1-2'));
  });

  it('cannot select add-ons of already refunded unit', () => {
    const refundedUnit = initialOrder.items[0].units[0]; // L1-1 (refunded)
    const addon = refundedUnit.addons[0];
    const selection = createEmptySelection();

    const updated = toggleAddon(selection, refundedUnit, addon);
    assert.equal(updated.selectedAddonKeys.length, 0);
    assert.equal(updated.selectedUnitIds.length, 0);
  });

  it('accurately identifies refund eligibility for units and add-ons', () => {
    const paidUnit = initialOrder.items[0].units[1]; // L1-2 (paid)
    const refundedUnit = initialOrder.items[0].units[0]; // L1-1 (refunded)
    const paidAddon = paidUnit.addons[0]; // A1 (paid)
    const refundedAddon = refundedUnit.addons[0]; // A1 (refunded)

    assert.equal(isUnitRefundable(paidUnit), true);
    assert.equal(isUnitRefundable(refundedUnit), false);
    assert.equal(isAddonRefundable(paidUnit, paidAddon), true);
    assert.equal(isAddonRefundable(refundedUnit, refundedAddon), false);
  });
});
