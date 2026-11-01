import React from 'react';
import { Badge } from '@radix-ui/themes';
import type { RefundStatus } from '../types/refund.ts';

interface StatusBadgeProps {
  status: RefundStatus | 'completed' | 'partially_refunded';
  size?: '1' | '2' | 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = '2',
}) => {
  const badgeSize = size === 'sm' || size === '1' ? '1' : '2';

  switch (status) {
    case 'paid':
      return (
        <Badge color="green" variant="soft" radius="full" size={badgeSize}>
          <span className="w-1.5 h-1.5 mr-1 rounded-full bg-emerald-500 inline-block" />
          Paid
        </Badge>
      );
    case 'refunded':
      return (
        <Badge color="red" variant="soft" radius="full" size={badgeSize}>
          <span className="w-1.5 h-1.5 mr-1 rounded-full bg-rose-500 inline-block" />
          Refunded
        </Badge>
      );
    case 'partially_refunded':
      return (
        <Badge color="amber" variant="soft" radius="full" size={badgeSize}>
          <span className="w-1.5 h-1.5 mr-1 rounded-full bg-amber-500 inline-block" />
          Partially Refunded
        </Badge>
      );
    case 'completed':
      return (
        <Badge color="blue" variant="soft" radius="full" size={badgeSize}>
          <span className="w-1.5 h-1.5 mr-1 rounded-full bg-blue-500 inline-block" />
          Completed
        </Badge>
      );
    default:
      return null;
  }
};
