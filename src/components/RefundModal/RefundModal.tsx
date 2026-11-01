import React, { useState } from 'react';
import { Dialog, Flex, Text, Badge, IconButton } from '@radix-ui/themes';
import type {
  Order,
  RefundSelection,
  RefundReason,
  RefundChannel,
  ProcessRefundPayload,
} from '../../types/refund.ts';
import {
  calculateRefund,
  createEmptySelection,
} from '../../utils/refundCalculation.ts';
import { Step1ItemSelection } from './Step1ItemSelection.tsx';
import { Step2ReviewDetails } from './Step2ReviewDetails.tsx';
import { ConfirmationDialog } from './ConfirmationDialog.tsx';
import { refundApi } from '../../api/refundApi.ts';

interface RefundModalProps {
  isOpen: boolean;
  order: Order;
  onClose: () => void;
  onRefundSuccess: (updatedOrder: Order, message: string) => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  order,
  onClose,
  onRefundSuccess,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selection, setSelection] = useState<RefundSelection>(createEmptySelection);
  const [reason, setReason] = useState<RefundReason | ''>('');
  const [channel, setChannel] = useState<RefundChannel | ''>(
    'Original payment method'
  );
  const [notes, setNotes] = useState('');
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculation = calculateRefund(order, selection);

  const handleResetAndClose = () => {
    if (isSubmitting) return;
    setStep(1);
    setSelection(createEmptySelection());
    setReason('');
    setNotes('');
    setIsConfirmationOpen(false);
    setErrorMessage(null);
    onClose();
  };

  const handleSubmitRefund = async () => {
    if (!reason || !channel) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: ProcessRefundPayload = {
      orderId: order.order_id,
      reason,
      channel,
      selection,
      calculation,
      notes,
    };

    try {
      const response = await refundApi.processRefund(payload);
      setIsSubmitting(false);
      setIsConfirmationOpen(false);
      handleResetAndClose();
      onRefundSuccess(response.updatedOrder, response.message || 'Refund successfully processed.');
    } catch (err: unknown) {
      setIsSubmitting(false);
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(message);
    }
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleResetAndClose()}>
        <Dialog.Content maxWidth="680px" className="p-0 overflow-hidden">
          <Flex
            justify="between"
            align="center"
            px="5"
            py="3"
            className="border-b border-slate-200 bg-white"
          >
            <Flex align="center" gap="3">
              <span className="w-7 h-7 rounded bg-[#002B49] text-white flex items-center justify-center font-bold text-xs inline-flex">
                {step}
              </span>
              <div>
                <Dialog.Title size="3" mb="0">
                  {step === 1 ? 'Process Order Refund' : 'Review Refund Summary'}
                </Dialog.Title>
                <Text size="1" color="gray">
                  Order {order.order_id} • Step {step} of 2
                </Text>
              </div>
            </Flex>

            <Flex align="center" gap="3">
              <Flex align="center" gap="1" className="hidden sm:flex text-xs">
                <Badge
                  color={step === 1 ? 'indigo' : 'gray'}
                  variant={step === 1 ? 'solid' : 'surface'}
                  size="1"
                >
                  1. Select Items
                </Badge>
                <Text size="1" color="gray">
                  &rarr;
                </Text>
                <Badge
                  color={step === 2 ? 'indigo' : 'gray'}
                  variant={step === 2 ? 'solid' : 'surface'}
                  size="1"
                >
                  2. Review & Submit
                </Badge>
              </Flex>

              <Dialog.Close>
                <IconButton
                  variant="ghost"
                  color="gray"
                  size="1"
                  onClick={handleResetAndClose}
                  className="cursor-pointer"
                >
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </IconButton>
              </Dialog.Close>
            </Flex>
          </Flex>

          <div className="overflow-hidden">
            {step === 1 ? (
              <Step1ItemSelection
                order={order}
                selection={selection}
                calculation={calculation}
                onSelectionChange={setSelection}
                onCancel={handleResetAndClose}
                onNext={() => setStep(2)}
              />
            ) : (
              <Step2ReviewDetails
                order={order}
                calculation={calculation}
                refundDeliveryFee={selection.refundDeliveryFee}
                reason={reason}
                channel={channel}
                notes={notes}
                onReasonChange={setReason}
                onChannelChange={setChannel}
                onNotesChange={setNotes}
                onBack={() => setStep(1)}
                onConfirm={() => setIsConfirmationOpen(true)}
              />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Root>

      <ConfirmationDialog
        isOpen={isConfirmationOpen}
        order={order}
        calculation={calculation}
        reason={reason as RefundReason}
        channel={channel as RefundChannel}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onCancel={() => setIsConfirmationOpen(false)}
        onSubmit={handleSubmitRefund}
        onClearError={() => setErrorMessage(null)}
      />
    </>
  );
};
