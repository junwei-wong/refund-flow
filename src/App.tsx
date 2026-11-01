import { useState, useEffect } from 'react';
import { Callout, Flex } from '@radix-ui/themes';
import type { Order } from './types/refund.ts';
import { initialOrder } from './data/orderData.ts';
import { refundApi } from './api/refundApi.ts';
import { Header } from './components/Header.tsx';
import { OrderSummaryCard } from './components/OrderSummaryCard.tsx';
import { OrderItemsTable } from './components/OrderItemsTable.tsx';
import { RefundModal } from './components/RefundModal/RefundModal.tsx';

function App() {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    refundApi.setForceFailure(simulateFailure);
  }, [simulateFailure]);

  const handleResetData = () => {
    const freshOrder = refundApi.resetOrder();
    setOrder(freshOrder);
    setToastMessage('Order data reset back to initial assessment seed.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRefundSuccess = (updatedOrder: Order, message: string) => {
    setOrder(updatedOrder);
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      <Header
        simulateFailure={simulateFailure}
        onToggleSimulateFailure={() => setSimulateFailure((prev) => !prev)}
        onResetData={handleResetData}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {toastMessage && (
          <div className="mb-6">
            <Callout.Root color="green" size="2" className="!flex !items-center w-full">
              <Callout.Icon className="!self-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </Callout.Icon>
              <Flex justify="between" align="center" className="w-full flex-1">
                <div>
                  <Callout.Text weight="bold">Action Completed</Callout.Text>
                  <Callout.Text size="2">{toastMessage}</Callout.Text>
                </div>
                <button
                  type="button"
                  onClick={() => setToastMessage(null)}
                  className="text-emerald-700 hover:text-emerald-900 font-bold text-base px-2 py-1 cursor-pointer ml-auto"
                >
                  &times;
                </button>
              </Flex>
            </Callout.Root>
          </div>
        )}

        <OrderSummaryCard
          order={order}
          onOpenRefund={() => setIsRefundModalOpen(true)}
        />

        <OrderItemsTable order={order} />
      </main>

      <RefundModal
        isOpen={isRefundModalOpen}
        order={order}
        onClose={() => setIsRefundModalOpen(false)}
        onRefundSuccess={handleRefundSuccess}
      />
    </div>
  );
}

export default App;
