import React from 'react';

import { AppFilterTabs } from './ui/HeroPrimitives';

interface CapsuleSwitchProps {
  options: { label: string; value: string }[];
  active: string;
  onChange: (value: string) => void;
  className?: string;
}

const CapsuleSwitch: React.FC<CapsuleSwitchProps> = ({
  options,
  active,
  onChange,
  className,
}) => {
  return (
    <AppFilterTabs
      ariaLabel='内容切换'
      className={className}
      items={options.map((opt) => ({ key: opt.value, label: opt.label }))}
      selectedKey={active}
      onSelectionChange={onChange}
    />
  );
};

export default CapsuleSwitch;
