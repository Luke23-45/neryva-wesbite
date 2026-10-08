import {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';
import {
  CheckIcon,
  ChevronWrap,
  FieldError,
  FieldHint,
  FieldLabel,
  FieldWrap,
  GutterSlot,
  HiddenInput,
  ItemBody,
  ItemDescription,
  ItemIconSlot,
  ItemLabel,
  MenuItemRow,
  MenuPanel,
  MenuScroll,
  MenuTrigger,
  SectionDivider,
  SectionTitle,
  SelectTrigger,
  TriggerPlaceholder,
  TriggerText,
} from './Dropdown.styles';

/* ------------------------------------------------------------------ */
/* Public model                                                        */
/* ------------------------------------------------------------------ */

export type DropdownItem = {
  value: string;
  label: ReactNode;
  /** Leading icon, rendered at 16px. Keep flat, minimal, currentColor SVGs. */
  icon?: ReactNode;
  /** Secondary line under the label, dimmed. */
  description?: string;
  disabled?: boolean;
  /** Destructive actions render in system red (#f87171). */
  destructive?: boolean;
  /** Type-ahead match text. Defaults to the string label, else the value. */
  searchText?: string;
};

export type DropdownSection = {
  title?: string;
  items: DropdownItem[];
};

type OpenProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type BaseProps = OpenProps & {
  items?: DropdownItem[];
  sections?: DropdownSection[];
  disabled?: boolean;
  /** Max menu height before internal scroll. Default 320. */
  menuMaxHeight?: number;
  'aria-label'?: string;
};

export type DropdownSelectProps = BaseProps & {
  variant: 'select';
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, item: DropdownItem) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
  /** Renders a hidden input carrying the value for native form submits. */
  name?: string;
  /** Passed through to the hidden input for native form validation. */
  required?: boolean;
  id?: string;
};

export type DropdownMenuProps = BaseProps & {
  variant: 'menu';
  /** Fixed trigger title (pull-down buttons show no selection state). */
  title: ReactNode;
  onAction?: (value: string, item: DropdownItem) => void;
  /** Mirror of ActionButton's secondary/ghost chrome. Default 'secondary'. */
  buttonStyle?: 'secondary' | 'ghost';
};

export type DropdownTriggerProps = BaseProps & {
  variant: 'trigger';
  /** Single element that accepts a ref (e.g. an icon button). Cloned with
      menu wiring — its own onClick still fires. */
  trigger: ReactElement;
  onAction?: (value: string, item: DropdownItem) => void;
};

export type DropdownProps = DropdownSelectProps | DropdownMenuProps | DropdownTriggerProps;

/* ------------------------------------------------------------------ */
/* Icons (flat, minimal, currentColor)                                  */
/* ------------------------------------------------------------------ */

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.25L7 8.75L10.5 5.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckmarkIcon() {
  return (
    <CheckIcon aria-hidden="true">
      <svg viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M2.5 7.25L5.75 10.5L11.5 3.75"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </CheckIcon>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function itemSearchText(item: DropdownItem): string {
  if (item.searchText) return item.searchText.toLowerCase();
  if (typeof item.label === 'string') return item.label.toLowerCase();
  return item.value.toLowerCase();
}

/** Guarded matchMedia hook — jsdom has no matchMedia; never throw there. */
function usePrefersReducedMotionSafe(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    return undefined;
  }, []);
  return reduced;
}

/** Assigns a DOM node to an external ref (callback or object). Module-level
    so render never touches ref objects directly. */
function setExternalRef<T>(ref: Ref<T> | null | undefined, instance: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') ref(instance);
  else ref.current = instance;
}

const MENU_GAP = 6;
const VIEWPORT_MARGIN = 8;

type MenuPosition = { top: number; left: number; minWidth?: number };

function computeMenuPosition(
  triggerRect: DOMRect,
  menuWidth: number,
  menuHeight: number,
): MenuPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top = triggerRect.bottom + MENU_GAP;
  // Flip to top when the menu would overflow the bottom and fits above.
  if (
    top + menuHeight > vh - VIEWPORT_MARGIN &&
    triggerRect.top - MENU_GAP - menuHeight >= VIEWPORT_MARGIN
  ) {
    top = triggerRect.top - MENU_GAP - menuHeight;
  } else {
    top = Math.min(top, Math.max(VIEWPORT_MARGIN, vh - VIEWPORT_MARGIN - menuHeight));
  }
  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, triggerRect.left),
    Math.max(VIEWPORT_MARGIN, vw - VIEWPORT_MARGIN - menuWidth),
  );
  return { top, left };
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/*                                                                     */
/* One menu engine, three Apple-HIG variants:                          */
/*   select  — pop-up button (forms): shows the current selection,     */
/*             selected option marked with a checkmark.                */
/*   menu    — pull-down button (actions): fixed title, no selection.  */
/*   trigger — headless: caller-supplied trigger element.              */
/* ------------------------------------------------------------------ */

type FlatItem = { item: DropdownItem; sectionIndex: number };

export const Dropdown = forwardRef<HTMLElement, DropdownProps>(function Dropdown(props, forwardedRef) {
  const {
    items,
    sections,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    disabled = false,
    menuMaxHeight = 320,
    'aria-label': ariaLabel,
  } = props;

  const variant = props.variant;
  const isSelect = variant === 'select';
  const selectProps = isSelect ? (props as DropdownSelectProps) : null;

  // -- ids -------------------------------------------------------------
  const generatedId = useId();
  const baseId = selectProps?.id ?? generatedId;
  const menuId = `${baseId}-menu`;
  const hintId = selectProps?.hint ? `${baseId}-hint` : undefined;
  const errorId = selectProps?.error ? `${baseId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  // -- open state (controlled / uncontrolled) ---------------------------
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );

  // -- select value (controlled / uncontrolled) --------------------------
  const [valueState, setValueState] = useState(selectProps?.defaultValue ?? '');
  const value = selectProps
    ? (selectProps.value !== undefined ? selectProps.value : valueState)
    : '';

  // -- flattened items ---------------------------------------------------
  const normalizedSections: DropdownSection[] = useMemo(() => {
    if (sections) return sections;
    return [{ items: items ?? [] }];
  }, [sections, items]);

  const flat: FlatItem[] = useMemo(() => {
    const out: FlatItem[] = [];
    normalizedSections.forEach((section, sectionIndex) => {
      section.items.forEach((item) => out.push({ item, sectionIndex }));
    });
    return out;
  }, [normalizedSections]);

  /** Flat index lookup keyed by `${sectionIndex}:${value}`. */
  const flatIndexOf = useMemo(() => {
    const map = new Map<string, number>();
    flat.forEach((f, i) => map.set(`${f.sectionIndex}:${f.item.value}`, i));
    return map;
  }, [flat]);

  const hasIcons = useMemo(() => flat.some((f) => f.item.icon), [flat]);
  const enabledIndices = useMemo(
    () => flat.map((f, i) => (f.item.disabled ? -1 : i)).filter((i) => i >= 0),
    [flat],
  );

  const itemDomId = useCallback((flatIndex: number) => `${menuId}-item-${flatIndex}`, [menuId]);

  // -- highlight -----------------------------------------------------------
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const moveHighlight = useCallback(
    (from: number | null, dir: 1 | -1) => {
      if (enabledIndices.length === 0) return;
      if (from === null) {
        setHighlighted(enabledIndices[dir === 1 ? 0 : enabledIndices.length - 1]);
        return;
      }
      const pos = enabledIndices.indexOf(from);
      const next = pos + dir;
      // Clamp at the ends (Apple menu convention — no wraparound).
      if (next < 0 || next >= enabledIndices.length) return;
      setHighlighted(enabledIndices[next]);
    },
    [enabledIndices],
  );

  // Initial highlight on open, derived during render rather than in the
  // layout effect: whenever `open` flips on, the highlight resets to the
  // current selection (select variant) or the first enabled item. The
  // effect re-derived this on every dep change while open, which could
  // snap the highlight back out from under keyboard navigation — the open
  // transition is the only moment this should ever apply.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const selectedIdx = isSelect
        ? flat.findIndex((f) => f.item.value === value && !f.item.disabled)
        : -1;
      setHighlighted(selectedIdx >= 0 ? selectedIdx : (enabledIndices[0] ?? null));
    } else {
      setHighlighted(null);
    }
  }

  // -- refs ------------------------------------------------------------------
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typeahead = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: '',
    timer: null,
  });
  const returnFocusRef = useRef(false);

  // -- positioning -------------------------------------------------------------
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const reposition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const panelEl = panelRef.current;
    if (!triggerEl || !panelEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const pos = computeMenuPosition(rect, panelEl.offsetWidth, panelEl.offsetHeight);
    // Select variant: menu min-width matches the trigger (Apple pop-up).
    setPosition({ ...pos, minWidth: isSelect ? rect.width : undefined });
  }, [isSelect]);

  // -- open / close --------------------------------------------------------------
  const close = useCallback(
    (returnFocus: boolean) => {
      returnFocusRef.current = returnFocus;
      setOpen(false);
    },
    [setOpen],
  );

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen(!open);
  }, [disabled, open, setOpen]);

  const activate = useCallback(
    (flatIndex: number) => {
      const entry = flat[flatIndex];
      if (!entry || entry.item.disabled) return;
      const { item } = entry;
      if (selectProps) {
        if (selectProps.value === undefined) setValueState(item.value);
        selectProps.onChange?.(item.value, item);
      } else {
        (props as DropdownMenuProps | DropdownTriggerProps).onAction?.(item.value, item);
      }
      close(true);
    },
    [flat, selectProps, props, close],
  );

  // Position + focus on open; listeners while open. The initial highlight
  // is set during render (see the open-transition block above).
  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    listRef.current?.focus();

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        close(false);
      }
    };
    const onScrollOrResize = () => reposition();
    // Reposition on scroll/resize — never close.
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, reposition, close]);

  // Return focus to the trigger when requested (Escape / activation).
  useEffect(() => {
    if (!open && returnFocusRef.current) {
      returnFocusRef.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  // Scroll the highlighted row into view.
  useEffect(() => {
    if (open && highlighted !== null) {
      document.getElementById(itemDomId(highlighted))?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [open, highlighted, itemDomId]);

  // -- keyboard --------------------------------------------------------------------
  const onListKeyDown = (e: ReactKeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveHighlight(highlighted, 1);
        return;
      case 'ArrowUp':
        e.preventDefault();
        moveHighlight(highlighted, -1);
        return;
      case 'Home':
        e.preventDefault();
        setHighlighted(enabledIndices[0] ?? null);
        return;
      case 'End':
        e.preventDefault();
        setHighlighted(enabledIndices[enabledIndices.length - 1] ?? null);
        return;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlighted !== null) activate(highlighted);
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close(true);
        return;
      case 'Tab':
        close(false);
        return;
      default:
        break;
    }
    // Type-ahead: 500ms buffer, cycles repeated characters.
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const ch = e.key.toLowerCase();
      const t = typeahead.current;
      if (t.timer) clearTimeout(t.timer);
      const nextBuffer = t.buffer + ch;
      const repeated = nextBuffer.split('').every((c) => c === ch);
      const query = repeated ? ch : nextBuffer;
      t.buffer = nextBuffer;
      t.timer = setTimeout(() => {
        t.buffer = '';
        t.timer = null;
      }, 500);
      const pool = enabledIndices;
      let startAt = 0;
      if (repeated && highlighted !== null) {
        const pos = pool.indexOf(highlighted);
        if (pos >= 0) startAt = (pos + 1) % pool.length;
      }
      for (let k = 0; k < pool.length; k++) {
        const idx = pool[(startAt + k) % pool.length];
        if (itemSearchText(flat[idx].item).startsWith(query)) {
          setHighlighted(idx);
          break;
        }
      }
    }
  };

  // -- render ------------------------------------------------------------------------
  const reduceMotion = usePrefersReducedMotionSafe();

  const selectedItem = isSelect ? flat.find((f) => f.item.value === value)?.item : undefined;

  const menuRole = isSelect ? 'listbox' : 'menu';
  const itemRole = isSelect ? 'option' : 'menuitem';

  const renderMenuItems = () =>
    normalizedSections.map((section, s) => (
      <div key={section.title ?? `section-${s}`} role="group" aria-label={section.title}>
        {s > 0 && <SectionDivider role="separator" />}
        {section.title && <SectionTitle>{section.title}</SectionTitle>}
        {section.items.map((item) => {
          const flatIndex = flatIndexOf.get(`${s}:${item.value}`) ?? -1;
          const isHighlighted = highlighted === flatIndex;
          const isSelected = isSelect && item.value === value;
          return (
            <MenuItemRow
              key={item.value}
              id={itemDomId(flatIndex)}
              role={itemRole}
              aria-selected={isSelect ? isSelected : undefined}
              aria-disabled={item.disabled || undefined}
              $highlighted={isHighlighted}
              $disabled={!!item.disabled}
              $destructive={!!item.destructive}
              onClick={() => {
                if (!item.disabled) activate(flatIndex);
              }}
              onMouseMove={() => {
                if (!item.disabled && highlighted !== flatIndex) setHighlighted(flatIndex);
              }}
            >
              {isSelect && <GutterSlot>{isSelected ? <CheckmarkIcon /> : null}</GutterSlot>}
              {hasIcons && <ItemIconSlot>{item.icon ?? null}</ItemIconSlot>}
              <ItemBody>
                <ItemLabel>{item.label}</ItemLabel>
                {item.description && <ItemDescription>{item.description}</ItemDescription>}
              </ItemBody>
            </MenuItemRow>
          );
        })}
      </div>
    ));

  const menu = open
    ? createPortal(
        <MenuPanel
          ref={panelRef}
          role="presentation"
          initial={reduceMotion ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.12, ease: 'easeOut' }}
          style={
            {
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              minWidth: position?.minWidth,
              visibility: position ? 'visible' : 'hidden',
            } as CSSProperties
          }
        >
          <MenuScroll style={{ maxHeight: menuMaxHeight }}>
            <div
              ref={listRef}
              id={menuId}
              role={menuRole}
              aria-label={ariaLabel}
              aria-activedescendant={highlighted !== null ? itemDomId(highlighted) : undefined}
              tabIndex={-1}
              onKeyDown={onListKeyDown}
            >
              {renderMenuItems()}
            </div>
          </MenuScroll>
        </MenuPanel>,
        document.body,
      )
    : null;

  // The trigger-variant element's own ref, read from props (never .current).
  const customTrigger = variant === 'trigger' ? (props as DropdownTriggerProps).trigger : null;
  const customTriggerRef = customTrigger
    ? (customTrigger as { ref?: Ref<HTMLElement | null> }).ref
    : undefined;

  /**
   * Single ref callback for every trigger flavor — assigns the node to the
   * internal ref and forwards to external refs. Runs in React's commit
   * phase; render never touches ref objects directly.
   */
  const wireTriggerRef = useCallback(
    (instance: HTMLElement | null) => {
      triggerRef.current = instance;
      setExternalRef(customTriggerRef, instance);
      setExternalRef(forwardedRef, instance);
    },
    [customTriggerRef, forwardedRef],
  );

  if (variant === 'trigger') {
    const { trigger } = props as DropdownTriggerProps;
    if (!isValidElement(trigger)) {
      throw new Error('Dropdown variant="trigger" requires a single React element as `trigger`.');
    }
    const originalOnClick = (trigger.props as { onClick?: (e: unknown) => void }).onClick;
    // Wiring props for the cloned trigger — ref is included explicitly
    // because React 18's Attributes type does not carry it.
    type TriggerWireProps = {
      onClick?: (e: unknown) => void;
      ref?: Ref<HTMLElement | null>;
      'aria-haspopup'?: 'menu';
      'aria-expanded'?: boolean;
      'aria-controls'?: string;
    };
    const triggerEl = trigger as ReactElement<TriggerWireProps>;
    return (
      <>
        {/* eslint-disable-next-line react-hooks/refs -- React 18's cloneElement
            only attaches the ref; it is read at commit, not during render.
            (The rule assumes React 19 ref-as-prop semantics.) */}
        {cloneElement(triggerEl, {
          ref: wireTriggerRef,
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': menuId,
          onClick: (e: unknown) => {
            originalOnClick?.(e);
            toggle();
          },
        })}
        {menu}
      </>
    );
  }

  if (variant === 'menu') {
    const menuProps = props as DropdownMenuProps;
    return (
      <>
        <MenuTrigger
          type="button"
          ref={wireTriggerRef}
          $ghost={menuProps.buttonStyle === 'ghost'}
          $open={open}
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          disabled={disabled}
          onClick={toggle}
        >
          <TriggerText>{menuProps.title}</TriggerText>
          <ChevronWrap $open={open}>
            <ChevronDownIcon />
          </ChevronWrap>
        </MenuTrigger>
        {menu}
      </>
    );
  }

  // variant === 'select' — Apple pop-up button for forms.
  const sp = props as DropdownSelectProps;
  const triggerContent = selectedItem ? (
    <TriggerText>{selectedItem.label}</TriggerText>
  ) : (
    <TriggerPlaceholder>{sp.placeholder ?? 'Select…'}</TriggerPlaceholder>
  );
  return (
    <FieldWrap>
      {sp.label && <FieldLabel htmlFor={baseId}>{sp.label}</FieldLabel>}
      <SelectTrigger
        type="button"
        id={baseId}
        ref={wireTriggerRef}
        $hasError={!!sp.error}
        $open={open}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-invalid={sp.error ? true : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={toggle}
      >
        {triggerContent}
        <ChevronWrap $open={open}>
          <ChevronDownIcon />
        </ChevronWrap>
      </SelectTrigger>
      {/* Hint persists alongside the error (mirrors TextInput K-BUG5):
          guidance must not vanish exactly when the field is invalid. */}
      {sp.hint ? <FieldHint id={hintId}>{sp.hint}</FieldHint> : null}
      {sp.error ? (
        <FieldError id={errorId} role="alert">
          {sp.error}
        </FieldError>
      ) : null}
      {sp.name ? (
        <HiddenInput
          tabIndex={-1}
          aria-hidden="true"
          name={sp.name}
          value={value}
          required={sp.required}
          onChange={() => undefined}
          onFocus={() => triggerRef.current?.focus()}
        />
      ) : null}
      {menu}
    </FieldWrap>
  );
});

Dropdown.displayName = 'Dropdown';
