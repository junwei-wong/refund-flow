import { Card, Flex, Text, Button, Checkbox, Badge, Box } from '@radix-ui/themes';
import type {
  Order,
  RefundSelection,
  RefundCalculationResult,
  UnitItem,
  AddonItem,
} from '../../types/refund.ts';
import {
  isUnitRefundable,
  isAddonRefundable,
  getAddonKey,
  toggleUnit,
  toggleAddon,
  selectAllRefundable,
  createEmptySelection,
  formatCurrency,
} from '../../utils/refundCalculation.ts';
import { StatusBadge } from '../StatusBadge.tsx';

interface Step1ItemSelectionProps {
  order: Order;
  selection: RefundSelection;
  calculation: RefundCalculationResult;
  onSelectionChange: (next: RefundSelection) => void;
  onCancel: () => void;
  onNext: () => void;
}

export const Step1ItemSelection = ({
  order,
  selection,
  calculation,
  onSelectionChange,
  onCancel,
  onNext,
}: Step1ItemSelectionProps) => {
  const isAllSelected = calculation.isFullRefund;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange(createEmptySelection());
    } else {
      onSelectionChange(selectAllRefundable(order));
    }
  };

  const handleUnitClick = (unit: UnitItem) => {
    if (!isUnitRefundable(unit)) return;
    const next = toggleUnit(selection, unit);
    onSelectionChange(next);
  };

  const handleAddonClick = (unit: UnitItem, addon: AddonItem) => {
    if (!isAddonRefundable(unit, addon)) return;
    const next = toggleAddon(selection, unit, addon);
    onSelectionChange(next);
  };

  const handleDeliveryToggle = () => {
    if (order.delivery_fee_status !== 'paid') return;
    onSelectionChange({
      ...selection,
      refundDeliveryFee: !selection.refundDeliveryFee,
    });
  };

  return (
    <Flex direction="column" className="h-full">
      <Flex
        justify="between"
        align="center"
        px="5"
        py="3"
        className="bg-slate-50 border-b border-slate-200"
      >
        <Box>
          <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider">
            Select items to refund
          </Text>
          <Text size="1" color="gray" as="p">
            Choose individual units and their respective add-ons.
          </Text>
        </Box>
        <Button
          type="button"
          onClick={handleToggleSelectAll}
          variant="outline"
          color="gray"
          size="1"
          className="cursor-pointer"
        >
          {isAllSelected ? 'Deselect All' : 'Select All (Full Refund)'}
        </Button>
      </Flex>

      <Box px="5" py="4" className="flex-1 overflow-y-auto space-y-3 max-h-[56vh]">
        {order.items.map((line) => {
          return (
            <Card key={line.line_id} size="1" variant="surface" className="overflow-hidden">
              <Flex
                justify="between"
                align="center"
                px="3"
                py="2"
                className="bg-slate-100/60 border-b border-slate-200"
              >
                <Text weight="bold" size="2">
                  {line.name}
                </Text>
                <Text size="1" color="gray">
                  Base: {formatCurrency(line.unit_price, order.currency)}
                </Text>
              </Flex>

              <div className="divide-y divide-slate-100">
                {line.units.map((unit, unitIndex) => {
                  const unitRefundable = isUnitRefundable(unit);
                  const isUnitChecked = selection.selectedUnitIds.includes(
                    unit.unit_id
                  );

                  return (
                    <Box
                      key={unit.unit_id}
                      p="3"
                      className={`transition ${!unitRefundable
                        ? 'bg-slate-50/60 opacity-70'
                        : isUnitChecked
                          ? 'bg-sky-50/30'
                          : 'hover:bg-slate-50/40'
                        }`}
                    >
                      <Flex
                        justify="between"
                        align="start"
                        onClick={() => handleUnitClick(unit)}
                        className={`cursor-pointer select-none ${!unitRefundable ? 'cursor-not-allowed' : ''
                          }`}
                      >
                        <Flex align="start" gap="3">
                          <Checkbox
                            checked={isUnitChecked}
                            disabled={!unitRefundable}
                            onCheckedChange={() => handleUnitClick(unit)}
                            color="indigo"
                            size="2"
                            className="mt-0.5"
                          />
                          <Box>
                            <Flex align="center" gap="2">
                              <Text weight="bold" size="2">
                                Unit {unitIndex + 1}
                              </Text>
                              <Text size="1" color="gray">
                                ({unit.unit_id})
                              </Text>
                            </Flex>
                            <Text size="1" color="gray">
                              Main Drink/Item
                            </Text>
                          </Box>
                        </Flex>

                        <Flex align="center" gap="2">
                          <Text weight="bold" size="2">
                            {formatCurrency(line.unit_price, order.currency)}
                          </Text>
                          {!unitRefundable && (
                            <StatusBadge status={unit.status} size="1" />
                          )}
                        </Flex>
                      </Flex>

                      {unit.addons.length > 0 && (
                        <Box pl="6" mt="2" className="border-l-2 border-slate-200 ml-2 space-y-1.5">
                          <Text size="1" color="gray" weight="medium" className="uppercase tracking-wider" as="p">
                            Add-ons (Requires unit to be selected)
                          </Text>
                          {unit.addons.map((addon) => {
                            const addonRefundable = isAddonRefundable(
                              unit,
                              addon
                            );
                            const addonKey = getAddonKey(
                              unit.unit_id,
                              addon.addon_id
                            );
                            const isAddonChecked =
                              selection.selectedAddonKeys.includes(addonKey);
                            const isDisabled =
                              !addonRefundable || !isUnitChecked;

                            return (
                              <Flex
                                key={addon.addon_id}
                                justify="between"
                                align="center"
                                p="2"
                                onClick={() => {
                                  if (!isDisabled) handleAddonClick(unit, addon);
                                }}
                                className={`rounded transition select-none ${isDisabled
                                  ? 'cursor-not-allowed opacity-60 bg-slate-50'
                                  : 'cursor-pointer hover:bg-slate-100/70'
                                  }`}
                              >
                                <Flex align="center" gap="2">
                                  <Checkbox
                                    checked={isAddonChecked}
                                    disabled={isDisabled}
                                    onCheckedChange={() => {
                                      if (!isDisabled) handleAddonClick(unit, addon);
                                    }}
                                    color="indigo"
                                    size="1"
                                  />
                                  <Text size="1" weight="medium">
                                    {addon.name}
                                  </Text>
                                </Flex>
                                <Flex align="center" gap="2">
                                  <Text size="1" color="gray">
                                    +{formatCurrency(addon.unit_price, order.currency)}
                                  </Text>
                                  {!addonRefundable && (
                                    <StatusBadge
                                      status={addon.status}
                                      size="1"
                                    />
                                  )}
                                </Flex>
                              </Flex>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {order.delivery_fee > 0 && (
          <Card size="1" variant="surface" className="p-3">
            <Flex
              justify="between"
              align="center"
              onClick={handleDeliveryToggle}
              className={`select-none ${order.delivery_fee_status !== 'paid'
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-pointer'
                }`}
            >
              <Flex align="center" gap="3">
                <Checkbox
                  checked={selection.refundDeliveryFee}
                  disabled={order.delivery_fee_status !== 'paid'}
                  onCheckedChange={handleDeliveryToggle}
                  color="indigo"
                  size="2"
                />
                <Box>
                  <Text weight="bold" size="2">
                    Refund Delivery Fee (Optional)
                  </Text>
                  <Text size="1" color="gray" as="p">
                    Delivery service fee charged at checkout
                  </Text>
                </Box>
              </Flex>

              <Flex align="center" gap="2">
                <Text weight="bold" size="2">
                  {formatCurrency(order.delivery_fee, order.currency)}
                </Text>
                {order.delivery_fee_status !== 'paid' && (
                  <StatusBadge status={order.delivery_fee_status} size="1" />
                )}
              </Flex>
            </Flex>
          </Card>
        )}
      </Box>

      <Flex
        justify="between"
        align="center"
        px="5"
        py="3"
        className="bg-slate-50 border-t border-slate-200"
      >
        <Box>
          <Flex align="center" gap="2">
            <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider">
              Refund Amount:
            </Text>
            {calculation.isFullRefund && (
              <Badge color="blue" variant="solid" radius="full" size="1">
                Full Refund
              </Badge>
            )}
          </Flex>
          <Text size="6" weight="bold">
            {formatCurrency(calculation.totalRefund, order.currency)}
          </Text>
          <Text size="1" color="gray" as="p">
            {calculation.selectedCount} units selected
            {selection.refundDeliveryFee ? ' + delivery fee' : ''}
          </Text>
        </Box>

        <Flex gap="3">
          <Button
            type="button"
            onClick={onCancel}
            variant="surface"
            color="gray"
            size="2"
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onNext}
            disabled={calculation.totalRefund <= 0}
            variant="solid"
            color="indigo"
            size="2"
            className="cursor-pointer"
          >
            Next: Review Details &rarr;
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
