import React from 'react';
import {
  AlertDialog,
  Button,
  Flex,
  Text,
  Callout,
  Spinner,
  Card,
  Box,
} from '@radix-ui/themes';
import type {
  Order,
  RefundCalculationResult,
  RefundReason,
  RefundChannel,
} from '../../types/refund.ts';
import { formatCurrency } from '../../utils/refundCalculation.ts';

interface ConfirmationDialogProps {
  isOpen: boolean;
  order: Order;
  calculation: RefundCalculationResult;
  reason: RefundReason;
  channel: RefundChannel;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onSubmit: () => void;
  onClearError: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  order,
  calculation,
  reason,
  channel,
  isSubmitting,
  errorMessage,
  onCancel,
  onSubmit,
  onClearError,
}) => {
  return (
    <AlertDialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>
          <Flex align="center" gap="2">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center inline-flex">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </span>
            <span>Confirm Refund Submission?</span>
          </Flex>
        </AlertDialog.Title>

        <AlertDialog.Description size="2" color="gray" className="mt-2">
          You are about to issue a refund for order{' '}
          <strong className="text-slate-800">{order.order_id}</strong>. This
          operation is irreversible once processed by the payment provider.
        </AlertDialog.Description>

        <Card variant="surface" size="1" className="mt-4 space-y-2">
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Refund Amount:
            </Text>
            <Text size="3" weight="bold">
              {formatCurrency(calculation.totalRefund, order.currency)}
            </Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Selected Items:
            </Text>
            <Text size="2" weight="medium">
              {calculation.selectedCount} units
              {calculation.deliveryFee > 0 ? ' + delivery fee' : ''}
            </Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Reason:
            </Text>
            <Text size="2" weight="medium">
              {reason}
            </Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2" color="gray">
              Destination:
            </Text>
            <Text size="2" weight="bold" color="indigo">
              {channel}
            </Text>
          </Flex>
        </Card>

        {errorMessage && (
          <Box mt="3">
            <Callout.Root color="red" size="1">
              <Callout.Icon>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </Callout.Icon>
              <Flex justify="between" align="center" className="w-full">
                <Callout.Text size="1">
                  <strong>Refund Failed:</strong> {errorMessage}
                </Callout.Text>
                <button
                  type="button"
                  onClick={onClearError}
                  className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
                >
                  &times;
                </button>
              </Flex>
            </Callout.Root>
          </Box>
        )}

        <Flex gap="3" mt="5" justify="end">
          <AlertDialog.Cancel>
            <Button
              variant="surface"
              color="gray"
              onClick={onCancel}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel (Keep Editing)
            </Button>
          </AlertDialog.Cancel>
          <Button
            variant="solid"
            color="red"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {isSubmitting ? (
              <Flex align="center" gap="2">
                <Spinner size="1" />
                <span>Processing...</span>
              </Flex>
            ) : errorMessage ? (
              'Retry Submission'
            ) : (
              'Confirm & Submit'
            )}
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};
