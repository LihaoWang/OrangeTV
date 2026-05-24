import React, { createContext, useContext } from 'react';

type SelectionContextValue = {
  selectedKey?: React.Key;
  onSelectionChange?: (key: React.Key) => void;
};

const SelectionContext = createContext<SelectionContextValue>({});
const MenuActionContext = createContext<{
  onAction?: (key: React.Key) => void;
  selectedKeys?: Iterable<React.Key>;
}>({});
const SelectContext = createContext<{
  value?: React.Key | React.Key[] | null;
  onChange?: (value: React.Key | React.Key[] | null) => void;
}>({});

type OverlayStateValue = {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

const OverlayContext = createContext<OverlayStateValue | null>(null);

export const useOverlayState = ({
  isOpen = false,
  defaultOpen = false,
  onOpenChange,
}: {
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
} = {}): OverlayStateValue => {
  const openState = isOpen || defaultOpen;
  const setOpen = (nextIsOpen: boolean) => onOpenChange?.(nextIsOpen);

  return {
    isOpen: openState,
    setOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!openState),
  };
};

export const Button = ({
  children,
  onPress,
  onClick,
  isIconOnly: _isIconOnly,
  isDisabled,
  isPending: _isPending,
  variant: _variant,
  fullWidth: _fullWidth,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  onPress?: () => void;
  isIconOnly?: boolean;
  isDisabled?: boolean;
  isPending?: boolean;
  variant?: string;
  fullWidth?: boolean;
}) => (
  <button
    {...props}
    disabled={isDisabled}
    onClick={(event) => {
      onClick?.(event);
      onPress?.();
    }}
  >
    {typeof children === 'function'
      ? (children as (values: { isPending: boolean }) => React.ReactNode)({
          isPending: Boolean(_isPending),
        })
      : children}
  </button>
);

export const Label = ({
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label {...props}>{children}</label>
);

export const Form = ({
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) => (
  <form {...props}>{children}</form>
);

export const TextField = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { name?: string }) => (
  <div {...props}>{children}</div>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} />
);

const TabsRoot = ({
  children,
  selectedKey,
  onSelectionChange,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & SelectionContextValue) => (
  <SelectionContext.Provider value={{ selectedKey, onSelectionChange }}>
    <div {...props}>{children}</div>
  </SelectionContext.Provider>
);

const TabsListContainer = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;

const TabsList = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div role='tablist' {...props}>
    {children}
  </div>
);

const TabsTab = ({
  children,
  id,
  isDisabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  id: string;
  isDisabled?: boolean;
}) => {
  const { selectedKey, onSelectionChange } = useContext(SelectionContext);
  const selected = selectedKey === id;

  return (
    <button
      {...props}
      disabled={isDisabled}
      role='tab'
      aria-selected={selected}
      onClick={() => onSelectionChange?.(id)}
    >
      {children}
    </button>
  );
};

const TabsSeparator = () => <span aria-hidden='true' />;
const TabsIndicator = () => <span aria-hidden='true' />;
const TabsPanel = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div role='tabpanel' {...props}>
    {children}
  </div>
);

export const Tabs = Object.assign(TabsRoot, {
  ListContainer: TabsListContainer,
  List: TabsList,
  Tab: TabsTab,
  Separator: TabsSeparator,
  Indicator: TabsIndicator,
  Panel: TabsPanel,
});

export const Card = Object.assign(
  ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  {
    Header: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    Title: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 {...props}>{children}</h3>
    ),
    Description: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    Content: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    Footer: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  }
);

const ModalRoot = ({
  children,
  state,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { state?: OverlayStateValue }) => {
  const overlayState =
    state ||
    ({
      isOpen: true,
      setOpen: () => undefined,
      open: () => undefined,
      close: () => undefined,
      toggle: () => undefined,
    } satisfies OverlayStateValue);

  if (!overlayState.isOpen) return null;

  return (
    <OverlayContext.Provider value={overlayState}>
      <div {...props}>{children}</div>
    </OverlayContext.Provider>
  );
};

const ModalBackdrop = ({
  children,
  isDismissable: _isDismissable,
  variant: _variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  isDismissable?: boolean;
  variant?: string;
}) => <div {...props}>{children}</div>;

const ModalContainer = ({
  children,
  placement: _placement,
  scroll: _scroll,
  size: _size,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  placement?: string;
  scroll?: string;
  size?: string;
}) => <div {...props}>{children}</div>;

const ModalDialog = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div role='dialog' {...props}>
    {children}
  </div>
);

const OverlayCloseTrigger = ({
  children = 'Close',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const state = useContext(OverlayContext);

  return (
    <button {...props} onClick={() => state?.close()}>
      {children}
    </button>
  );
};

export const Modal = Object.assign(ModalRoot, {
  Backdrop: ModalBackdrop,
  Container: ModalContainer,
  Dialog: ModalDialog,
  CloseTrigger: OverlayCloseTrigger,
  Header: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  Icon: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  Heading: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
  Body: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  Footer: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
});

export const Drawer = Object.assign(ModalRoot, {
  Backdrop: ModalBackdrop,
  Content: ModalContainer,
  Dialog: ModalDialog,
  CloseTrigger: OverlayCloseTrigger,
  Handle: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div aria-hidden='true' {...props} />
  ),
  Header: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  Heading: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
  Body: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  Footer: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
});

const DropdownRoot = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;

const DropdownPopover = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;

const DropdownMenu = ({
  children,
  onAction,
  selectedKeys,
  selectionMode: _selectionMode,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  onAction?: (key: React.Key) => void;
  selectedKeys?: Iterable<React.Key>;
  selectionMode?: string;
}) => (
  <MenuActionContext.Provider value={{ onAction, selectedKeys }}>
    <div role='menu' {...props}>
      {children}
    </div>
  </MenuActionContext.Provider>
);

const DropdownItem = ({
  children,
  id,
  textValue,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
  id: React.Key;
  textValue?: string;
}) => {
  const { onAction, selectedKeys } = useContext(MenuActionContext);
  const selected = selectedKeys ? Array.from(selectedKeys).includes(id) : false;

  return (
    <button
      type='button'
      role='menuitem'
      aria-label={textValue}
      aria-selected={selected}
      {...props}
      onClick={() => onAction?.(id)}
    >
      {children}
    </button>
  );
};

export const Dropdown = Object.assign(DropdownRoot, {
  Popover: DropdownPopover,
  Menu: DropdownMenu,
  Item: Object.assign(DropdownItem, {
    Indicator: () => <span aria-hidden='true' />,
  }),
  ItemIndicator: () => <span aria-hidden='true' />,
});

const SelectRoot = ({
  children,
  value,
  onChange,
  fullWidth: _fullWidth,
  isDisabled: _isDisabled,
  variant: _variant,
  placeholder: _placeholder,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: React.Key | React.Key[] | null;
  onChange?: (value: React.Key | React.Key[] | null) => void;
  fullWidth?: boolean;
  isDisabled?: boolean;
  variant?: string;
  placeholder?: string;
}) => (
  <SelectContext.Provider value={{ value, onChange }}>
    <div {...props}>{children}</div>
  </SelectContext.Provider>
);

const SelectTrigger = ({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button type='button' role='combobox' aria-expanded='true' {...props}>
    {children}
  </button>
);

const SelectValue = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>;

const SelectIndicator = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span aria-hidden='true' {...props}>
    {children}
  </span>
);

const SelectPopover = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>;

const ListBoxRoot = ({
  children,
  selectionMode: _selectionMode,
  selectedKeys: _selectedKeys,
  onSelectionChange: _onSelectionChange,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  selectionMode?: string;
  selectedKeys?: Iterable<React.Key>;
  onSelectionChange?: (keys: Iterable<React.Key>) => void;
}) => (
  <div role='listbox' {...props}>
    {children}
  </div>
);

const ListBoxItem = ({
  children,
  id,
  textValue,
  isDisabled,
  ...props
}: React.HTMLAttributes<HTMLButtonElement> & {
  id: React.Key;
  textValue?: string;
  isDisabled?: boolean;
}) => {
  const { value, onChange } = useContext(SelectContext);
  const selected = Array.isArray(value)
    ? value.includes(id)
    : value === id;

  return (
    <button
      type='button'
      role='option'
      aria-label={textValue}
      aria-selected={selected}
      disabled={isDisabled}
      {...props}
      onClick={() => onChange?.(id)}
    >
      {children}
    </button>
  );
};

export const Select = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Indicator: SelectIndicator,
  Popover: SelectPopover,
});

export const ListBox = Object.assign(ListBoxRoot, {
  Root: ListBoxRoot,
  Item: Object.assign(ListBoxItem, {
    Indicator: () => <span aria-hidden='true' />,
  }),
  ItemIndicator: () => <span aria-hidden='true' />,
  Section: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
});

export const ScrollShadow = ({
  children,
  hideScrollBar: _hideScrollBar,
  orientation: _orientation,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  hideScrollBar?: boolean;
  orientation?: string;
}) => <div {...props}>{children}</div>;

export const Spinner = (props: React.HTMLAttributes<HTMLSpanElement>) => (
  <span role='status' {...props} />
);

const toastMock = () => 'toast-id';

export const Toast = {
  Provider: () => <div data-testid='heroui-toast-provider' />,
  toast: Object.assign(toastMock, {
    success: () => 'toast-id',
    danger: () => 'toast-id',
    warning: () => 'toast-id',
    info: () => 'toast-id',
    close: () => undefined,
    clear: () => undefined,
    pauseAll: () => undefined,
    resumeAll: () => undefined,
    getQueue: () => ({}),
  }),
};
