import { Flex, Text, Button, Checkbox } from '@radix-ui/themes';

interface HeaderProps {
  simulateFailure: boolean;
  onToggleSimulateFailure: () => void;
  onResetData: () => void;
}

export const Header = ({
  simulateFailure,
  onToggleSimulateFailure,
  onResetData,
}: HeaderProps) => {
  return (
    <header className="bg-[#002B49] text-white shadow-md sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
        <Flex align="center" gap="3">
          <label className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-md cursor-pointer transition border border-white/10 select-none">
            <Checkbox
              checked={simulateFailure}
              onCheckedChange={onToggleSimulateFailure}
              color="ruby"
              size="1"
            />
            <Text
              size="1"
              weight="medium"
              className={
                simulateFailure
                  ? 'text-rose-300'
                  : 'text-gray-300 hover:text-white'
              }
            >
              Simulate API Error
            </Text>
          </label>

          <Button
            type="button"
            onClick={onResetData}
            variant="surface"
            color="gray"
            size="2"
            className="cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reset Demo Data
          </Button>
        </Flex>
      </div>
    </header>
  );
};
