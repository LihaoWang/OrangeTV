import React from 'react';

import { AppFilterTabs } from './ui/HeroPrimitives';

interface CapsuleSwitchProps {
  options: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;
}

const CapsuleSwitch: React.FC<CapsuleSwitchProps> = ({
  options,
  active,
  onChange,
  className,
  compact = false,
}) => {
  const compactClasses =
    'mx-auto w-fit [&_.tabs__list]:w-fit [&_.tabs__tab]:h-9 [&_.tabs__tab]:w-auto [&_.tabs__tab]:min-w-16 [&_.tabs__tab]:px-4 [&_.tabs__tab]:text-sm';

  return (
    <AppFilterTabs
      ariaLabel='内容切换'
      className={[compact ? compactClasses : '', className]
        .filter(Boolean)
        .join(' ')}
      items={options.map((opt) => ({ key: opt.value, label: opt.label }))}
      selectedKey={active}
      variant={compact ? 'primary' : 'secondary'}
      onSelectionChange={onChange}
    />
  );
};

export default CapsuleSwitch;
