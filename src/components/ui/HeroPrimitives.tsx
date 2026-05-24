'use client';

import {
  Button,
  Card,
  Drawer,
  Label,
  ListBox,
  Modal,
  ScrollShadow,
  Select,
  Spinner,
  Tabs,
  useOverlayState,
} from '@heroui/react';
import type {
  ButtonProps,
  CardProps,
  ScrollShadowProps,
  SpinnerProps,
  TabsProps,
} from '@heroui/react';
import { forwardRef, useEffect } from 'react';
import type { Key, ReactNode } from 'react';

type AppButtonProps = ButtonProps;

let activeRootOverlayCount = 0;

function releaseRootScrollLockIfIdle() {
  if (activeRootOverlayCount > 0 || typeof document === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;

  if (html.style.overflow === 'hidden') {
    html.style.overflow = '';
  }

  if (body.style.overflow === 'hidden') {
    body.style.overflow = '';
  }
}

function useRootOverlayCleanup(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return undefined;

    activeRootOverlayCount += 1;

    return () => {
      activeRootOverlayCount = Math.max(0, activeRootOverlayCount - 1);
      releaseRootScrollLockIfIdle();
    };
  }, [isOpen]);
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  function AppButton(props, ref) {
    return <Button ref={ref} {...props} />;
  }
);

export const AppIconButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  function AppIconButton(props, ref) {
    return <Button ref={ref} isIconOnly variant='tertiary' {...props} />;
  }
);

export function AppSurface(props: CardProps) {
  return <Card variant='default' {...props} />;
}

export function AppScrollShadow(props: ScrollShadowProps) {
  return <ScrollShadow hideScrollBar {...props} />;
}

export interface AppFilterSelectOption {
  label: string;
  value: string;
  isDisabled?: boolean;
}

interface AppFilterSelectProps {
  label: string;
  value?: string;
  options: AppFilterSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  isDisabled?: boolean;
}

export function AppFilterSelect({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  className,
  isDisabled,
}: AppFilterSelectProps) {
  return (
    <Select
      className={className}
      fullWidth
      isDisabled={isDisabled}
      placeholder={placeholder ?? `选择${label}`}
      value={value ?? null}
      variant='secondary'
      onChange={(nextValue) => {
        if (Array.isArray(nextValue) || nextValue == null) return;
        onChange(String(nextValue));
      }}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ScrollShadow className='max-h-[min(52vh,22rem)]' hideScrollBar>
          <ListBox aria-label={ariaLabel ?? `${label}选项`} selectionMode='single'>
            {options.map((option) => (
              <ListBox.Item
                key={option.value}
                id={option.value}
                isDisabled={option.isDisabled}
                textValue={option.label}
              >
                <Label>{option.label}</Label>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </ScrollShadow>
      </Select.Popover>
    </Select>
  );
}

export function AppLoading({
  label = '加载中...',
  ...props
}: SpinnerProps & { label?: string }) {
  return (
    <div className='flex items-center justify-center gap-2 text-muted'>
      <Spinner size='sm' {...props} />
      {label ? <span className='text-sm'>{label}</span> : null}
    </div>
  );
}

interface AppDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'cover' | 'full';
  placement?: 'auto' | 'top' | 'center' | 'bottom';
  isDismissable?: boolean;
}

export function AppDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  icon,
  className,
  size = 'md',
  placement = 'center',
  isDismissable = true,
}: AppDialogProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  useRootOverlayCleanup(isOpen);

  return (
    <Modal state={state}>
      <Modal.Backdrop variant='blur' isDismissable={isDismissable}>
        <Modal.Container placement={placement} scroll='inside' size={size}>
          <Modal.Dialog aria-label={String(title)} className={className}>
            <Modal.CloseTrigger />
            <Modal.Header>
              {icon ? <Modal.Icon>{icon}</Modal.Icon> : null}
              <div>
                <Modal.Heading>{title}</Modal.Heading>
                {description ? (
                  <p className='mt-1 text-sm leading-5 text-muted'>
                    {description}
                  </p>
                ) : null}
              </div>
            </Modal.Header>
            {children ? <Modal.Body>{children}</Modal.Body> : null}
            {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

interface AppDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  isDismissable?: boolean;
}

export function AppDrawer({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  placement = 'bottom',
  isDismissable = true,
}: AppDrawerProps) {
  const state = useOverlayState({ isOpen, onOpenChange });
  useRootOverlayCleanup(isOpen);

  return (
    <Drawer state={state}>
      <Drawer.Backdrop variant='blur' isDismissable={isDismissable}>
        <Drawer.Content placement={placement}>
          <Drawer.Dialog aria-label={String(title)} className={className}>
            <Drawer.Handle />
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <div>
                <Drawer.Heading>{title}</Drawer.Heading>
                {description ? (
                  <p className='mt-1 text-sm leading-5 text-muted'>
                    {description}
                  </p>
                ) : null}
              </div>
            </Drawer.Header>
            {children ? <Drawer.Body>{children}</Drawer.Body> : null}
            {footer ? <Drawer.Footer>{footer}</Drawer.Footer> : null}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

interface AppTabsItem {
  key: string;
  label: ReactNode;
  isDisabled?: boolean;
}

interface AppTabsProps
  extends Omit<TabsProps, 'children' | 'onSelectionChange'> {
  ariaLabel: string;
  items: AppTabsItem[];
  onSelectionChange?: (key: string) => void;
}

export function AppTabs({
  ariaLabel,
  items,
  selectedKey,
  onSelectionChange,
  variant = 'secondary',
  className,
  ...props
}: AppTabsProps) {
  const handleSelectionChange = (key: Key) => {
    onSelectionChange?.(String(key));
  };

  return (
    <Tabs
      className={className}
      selectedKey={selectedKey}
      variant={variant}
      onSelectionChange={handleSelectionChange}
      {...props}
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label={ariaLabel}>
          {items.map((item, index) => (
            <Tabs.Tab
              key={item.key}
              id={item.key}
              isDisabled={item.isDisabled}
            >
              {index > 0 ? <Tabs.Separator /> : null}
              {item.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}

export function AppFilterTabs({
  ...props
}: AppTabsProps) {
  return (
    <ScrollShadow
      orientation='horizontal'
      hideScrollBar
      className='w-full min-w-0'
    >
      <AppTabs {...props} />
    </ScrollShadow>
  );
}
