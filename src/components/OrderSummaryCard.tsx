import React from 'react';
import { Card, Flex, Heading, Text, Button, Grid, Box } from '@radix-ui/themes';
import type { Order } from '../types/refund.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { formatCurrency, hasRefundableItems } from '../utils/refundCalculation.ts';

interface OrderSummaryCardProps {
  order: Order;
  onOpenRefund: () => void;
}

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  order,
  onOpenRefund,
}) => {
  const isRefundable = hasRefundableItems(order);

  let orderTotalCents = 0;
  let paidTotalCents = 0;
  let refundedTotalCents = 0;

  for (const line of order.items) {
    for (const unit of line.units) {
      const lineCents = Math.round(line.unit_price * 100);
      let unitCents = lineCents;
      for (const addon of unit.addons) {
        unitCents += Math.round(addon.unit_price * 100);
      }

      orderTotalCents += unitCents;
      if (unit.status === 'refunded') {
        refundedTotalCents += unitCents;
      } else {
        paidTotalCents += unitCents;
      }
    }
  }

  const deliveryCents = Math.round(order.delivery_fee * 100);
  orderTotalCents += deliveryCents;
  if (order.delivery_fee_status === 'refunded') {
    refundedTotalCents += deliveryCents;
  } else {
    paidTotalCents += deliveryCents;
  }

  const grandTotal = orderTotalCents / 100;
  const refundedTotal = refundedTotalCents / 100;

  return (
    <Card size="3" className="mb-6 shadow-sm">
      <Flex
        direction={{ initial: 'column', md: 'row' }}
        justify="between"
        align={{ initial: 'start', md: 'center' }}
        gap="4"
        pb="4"
        className="border-b border-slate-100"
      >
        <Box>
          <Flex align="center" gap="3" mb="1">
            <Heading size="6" weight="bold">
              Order {order.order_id}
            </Heading>
            <StatusBadge status={order.status} size="2" />
          </Flex>
          <Text size="2" color="gray">
            Placed on 26 Oct 2026, 09:42 AM • Branch: Mid Valley, Kuala Lumpur • Channel: Mobile App
          </Text>
        </Box>

        <Button
          type="button"
          onClick={onOpenRefund}
          disabled={!isRefundable}
          size="3"
          variant="solid"
          color={isRefundable ? 'indigo' : 'gray'}
          className="cursor-pointer"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 15v-1a4 4 0 00-4-4H4m0 0l4-4m-4 4l4 4m6 4v1a3 3 0 003 3h3"
            />
          </svg>
          {isRefundable ? 'Initiate Refund' : 'Order Fully Refunded'}
        </Button>
      </Flex>

      <Grid columns={{ initial: '2', sm: '4' }} gap="3" pt="4">
        <Card variant="surface" size="1">
          <Text size="1" color="gray" weight="medium" as="p" mb="1">
            Order Grand Total
          </Text>
          <Text size="4" weight="bold">
            {formatCurrency(grandTotal, order.currency)}
          </Text>
        </Card>

        <Card variant="surface" size="1">
          <Text size="1" color="gray" weight="medium" as="p" mb="1">
            Delivery Fee
          </Text>
          <Flex justify="between" align="center">
            <Text size="4" weight="bold">
              {formatCurrency(order.delivery_fee, order.currency)}
            </Text>
            <StatusBadge status={order.delivery_fee_status} size="1" />
          </Flex>
        </Card>

        <Card variant="surface" size="1">
          <Text size="1" color="gray" weight="medium" as="p" mb="1">
            Total Refunded
          </Text>
          <Text
            size="4"
            weight="bold"
            color={refundedTotal > 0 ? 'red' : 'gray'}
          >
            {formatCurrency(refundedTotal, order.currency)}
          </Text>
        </Card>

        <Card variant="surface" size="1">
          <Text size="1" color="gray" weight="medium" as="p" mb="1">
            Net Paid Balance
          </Text>
          <Text size="4" weight="bold" color="green">
            {formatCurrency(paidTotalCents / 100, order.currency)}
          </Text>
        </Card>
      </Grid>
    </Card>
  );
};
