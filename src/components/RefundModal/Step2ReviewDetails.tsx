import {
  Card,
  Flex,
  Text,
  Button,
  Badge,
  Box,
  Select,
  RadioGroup,
  TextArea,
} from '@radix-ui/themes';
import type {
  Order,
  RefundCalculationResult,
  RefundReason,
  RefundChannel,
} from '../../types/refund.ts';
import { formatCurrency } from '../../utils/refundCalculation.ts';

interface Step2ReviewDetailsProps {
  order: Order;
  calculation: RefundCalculationResult;
  refundDeliveryFee: boolean;
  reason: RefundReason | '';
  channel: RefundChannel | '';
  notes: string;
  onReasonChange: (reason: RefundReason) => void;
  onChannelChange: (channel: RefundChannel) => void;
  onNotesChange: (notes: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}

const REASON_OPTIONS: RefundReason[] = [
  'Wrong item',
  'Missing item',
  'Quality issue',
  'Late delivery',
  'Other',
];

const CHANNEL_OPTIONS: {
  value: RefundChannel;
  title: string;
  description: string;
}[] = [
    {
      value: 'Original payment method',
      title: 'Original Payment Method',
      description: 'Refunds directly back to the customer’s card/e-wallet (3-5 business days).',
    },
    {
      value: 'In-app credit',
      title: 'In-App Credit (ZUS Balance)',
      description: 'Instant credit applied to the customer’s ZUS app account wallet.',
    },
  ];

export const Step2ReviewDetails = ({
  order,
  calculation,
  refundDeliveryFee,
  reason,
  channel,
  notes,
  onReasonChange,
  onChannelChange,
  onNotesChange,
  onBack,
  onConfirm,
}: Step2ReviewDetailsProps) => {
  const isFormValid = reason !== '' && channel !== '';

  return (
    <Flex direction="column" className="h-full">
      <Box px="5" py="3" className="bg-slate-50 border-b border-slate-200">
        <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider">
          Step 2: Review & Details
        </Text>
        <Text size="1" color="gray" as="p">
          Verify the refund breakdown, specify the reason, and select the payout channel.
        </Text>
      </Box>

      <Box px="5" py="4" className="flex-1 overflow-y-auto space-y-4 max-h-[56vh]">
        <Card size="1" variant="surface">
          <Flex
            justify="between"
            align="center"
            px="3"
            py="2"
            className="bg-slate-100/60 border-b border-slate-200"
          >
            <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider">
              Refund Summary ({calculation.breakdown.length} units
              {refundDeliveryFee ? ' + delivery' : ''})
            </Text>
            {calculation.isFullRefund && (
              <Badge color="blue" variant="solid" radius="full" size="1">
                Full Order Refund
              </Badge>
            )}
          </Flex>

          <div className="divide-y divide-slate-100 p-2">
            {calculation.breakdown.map((item) => (
              <Box key={item.unitId} p="2">
                <Flex justify="between" align="center">
                  <Flex align="center" gap="2">
                    <Text size="2" weight="bold">
                      {item.lineName}
                    </Text>
                    <Badge color="gray" variant="surface" size="1">
                      {item.unitId}
                    </Badge>
                  </Flex>
                  <Text size="2" weight="medium">
                    {formatCurrency(item.unitPrice, order.currency)}
                  </Text>
                </Flex>

                {item.selectedAddons.length > 0 && (
                  <Box pl="3" mt="1" className="space-y-0.5">
                    {item.selectedAddons.map((add) => (
                      <Flex
                        key={add.addonId}
                        justify="between"
                        align="center"
                      >
                        <Text size="1" color="gray">
                          + {add.name}
                        </Text>
                        <Text size="1" color="gray">
                          +{formatCurrency(add.unitPrice, order.currency)}
                        </Text>
                      </Flex>
                    ))}
                  </Box>
                )}
              </Box>
            ))}

            {refundDeliveryFee && (
              <Flex justify="between" align="center" p="2" className="bg-slate-50/50 rounded">
                <Flex align="center" gap="2">
                  <Text size="2" weight="bold">
                    Delivery Service Fee
                  </Text>
                  <Badge color="gray" variant="surface" size="1">
                    Courier
                  </Badge>
                </Flex>
                <Text size="2" weight="bold">
                  {formatCurrency(calculation.deliveryFee, order.currency)}
                </Text>
              </Flex>
            )}
          </div>
        </Card>

        <Box className="space-y-1.5">
          <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider block">
            Refund Reason <span className="text-rose-500">*</span>
          </Text>
          <Select.Root
            value={reason}
            onValueChange={(val) => onReasonChange(val as RefundReason)}
          >
            <Select.Trigger
              placeholder="Select a reason for this refund..."
              className="w-full cursor-pointer"
            />
            <Select.Content>
              {REASON_OPTIONS.map((opt) => (
                <Select.Item key={opt} value={opt}>
                  {opt}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>

        <Box className="space-y-2">
          <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider block">
            Refund Destination Channel <span className="text-rose-500">*</span>
          </Text>
          <RadioGroup.Root
            value={channel}
            onValueChange={(val) => onChannelChange(val as RefundChannel)}
          >
            <Flex direction={{ initial: 'column', sm: 'row' }} gap="3">
              {CHANNEL_OPTIONS.map((ch) => {
                const isSelected = channel === ch.value;
                return (
                  <Card
                    key={ch.value}
                    size="1"
                    variant={isSelected ? 'surface' : 'classic'}
                    onClick={() => onChannelChange(ch.value)}
                    className={`flex-1 cursor-pointer transition select-none ${isSelected ? 'border-indigo-600 bg-sky-50/30 ring-1 ring-indigo-500' : ''
                      }`}
                  >
                    <Flex align="start" gap="2">
                      <RadioGroup.Item value={ch.value} className="mt-0.5" />
                      <Box>
                        <Text size="2" weight="bold" as="p">
                          {ch.title}
                        </Text>
                        <Text size="1" color="gray" className="leading-relaxed">
                          {ch.description}
                        </Text>
                      </Box>
                    </Flex>
                  </Card>
                );
              })}
            </Flex>
          </RadioGroup.Root>
        </Box>

        <Box className="space-y-1.5">
          <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider block">
            Internal Staff Notes (Optional)
          </Text>
          <TextArea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={2}
            placeholder="Add any additional details or customer ticket reference numbers..."
            size="2"
          />
        </Box>
      </Box>

      <Flex
        justify="between"
        align="center"
        px="5"
        py="3"
        className="bg-slate-50 border-t border-slate-200"
      >
        <Box>
          <Text size="1" weight="bold" color="gray" className="uppercase tracking-wider block">
            Final Refund Total:
          </Text>
          <Text size="6" weight="bold">
            {formatCurrency(calculation.totalRefund, order.currency)}
          </Text>
        </Box>

        <Flex gap="3">
          <Button
            type="button"
            onClick={onBack}
            variant="surface"
            color="gray"
            size="2"
            className="cursor-pointer"
          >
            &larr; Back
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={!isFormValid}
            variant="solid"
            color="indigo"
            size="2"
            className="cursor-pointer"
          >
            Confirm Refund
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
