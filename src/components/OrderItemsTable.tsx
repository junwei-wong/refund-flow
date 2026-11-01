import React from 'react';
import { Card, Flex, Text, Badge, Box } from '@radix-ui/themes';
import type { Order } from '../types/refund.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { formatCurrency } from '../utils/refundCalculation.ts';

interface OrderItemsTableProps {
  order: Order;
}

export const OrderItemsTable: React.FC<OrderItemsTableProps> = ({ order }) => {
  const totalUnits = order.items.reduce(
    (acc, curr) => acc + curr.units.length,
    0
  );

  return (
    <Card size="3" className="shadow-sm mb-8">
      <Flex justify="between" align="center" pb="3" mb="3" className="border-b border-slate-100">
        <Text weight="bold" size="3">
          Order Items & Units Breakdown
        </Text>
        <Text size="1" color="gray">
          {totalUnits} Units in Total
        </Text>
      </Flex>

      <div className="divide-y divide-slate-100">
        {order.items.map((line) => {
          return (
            <div key={line.line_id} className="py-4 first:pt-0 last:pb-0">
              <Flex justify="between" align="center" mb="2">
                <Flex align="center" gap="2">
                  <Text weight="bold" size="3">
                    {line.name}
                  </Text>
                  <Badge color="gray" variant="surface" size="1">
                    Line {line.line_id}
                  </Badge>
                </Flex>
                <Text size="2" color="gray" weight="medium">
                  Base: {formatCurrency(line.unit_price, order.currency)} / unit
                </Text>
              </Flex>

              <div className="space-y-2.5 pl-3 border-l-2 border-slate-200 mt-2">
                {line.units.map((unit, unitIndex) => {
                  return (
                    <Card
                      key={unit.unit_id}
                      size="1"
                      variant={unit.status === 'refunded' ? 'ghost' : 'surface'}
                      className={unit.status === 'refunded' ? 'bg-rose-50/30' : ''}
                    >
                      <Flex justify="between" align="center">
                        <Flex align="center" gap="2">
                          <Badge variant="solid" color="gray" size="1">
                            Unit {unitIndex + 1} ({unit.unit_id})
                          </Badge>
                          <Text size="2" weight="medium">
                            {formatCurrency(line.unit_price, order.currency)}
                          </Text>
                        </Flex>
                        <StatusBadge status={unit.status} size="1" />
                      </Flex>

                      {unit.addons.length > 0 && (
                        <Box pt="2" mt="2" className="border-t border-slate-100 pl-2 space-y-1">
                          <Text size="1" color="gray" weight="medium" as="p">
                            Add-ons:
                          </Text>
                          {unit.addons.map((addon) => (
                            <Flex
                              key={addon.addon_id}
                              justify="between"
                              align="center"
                            >
                              <Flex align="center" gap="1">
                                <Text size="1" color="gray">
                                  • {addon.name}
                                </Text>
                                <Text size="1" color="gray">
                                  (+{formatCurrency(addon.unit_price, order.currency)})
                                </Text>
                              </Flex>
                              <StatusBadge status={addon.status} size="1" />
                            </Flex>
                          ))}
                        </Box>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        <Flex justify="between" align="center" pt="4">
          <Box>
            <Text weight="bold" size="2" as="p">
              Delivery & Service Fee
            </Text>
            <Text size="1" color="gray">
              Courier Standard Express
            </Text>
          </Box>
          <Flex align="center" gap="3">
            <Text size="3" weight="bold">
              {formatCurrency(order.delivery_fee, order.currency)}
            </Text>
            <StatusBadge status={order.delivery_fee_status} size="1" />
          </Flex>
        </Flex>
      </div>
    </Card>
  );
};
