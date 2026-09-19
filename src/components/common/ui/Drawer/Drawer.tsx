import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import styled from 'styled-components';
import { ease, spring } from '@styles/motion';

/**
 * Shared right-side drawer (C13 owns it; C10/C15 reuse it, never fork it).
 *
 * Contract (Modal's, adapted to a docked sheet):
 * - Escape closes, click outside closes, body scroll locked while open.
 * - Focus moves into the sheet on open and returns to the opener on close.
 * - Tab cycles inside the sheet (focus trap) — Modal documents this but
 *   only wires Escape; the drawer implements the trap for real.
 * - Docked right, full height; content scrolls inside the body.
 */

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 480 }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const panel = panelRef.current;
    // Focus the sheet itself first — close button reachable by Tab order.
    panel?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      // Selector already excludes disabled controls; hidden-element
      // filtering is left out so the trap stays testable in jsdom.
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)) as HTMLElement[];
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      // Return focus so keyboard users are never stranded by the close.
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <Overlay
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: ease.expressive }}
        >
          <Sheet
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 48, opacity: 0 }}
            transition={spring.gentle}
            style={{ width }}
          >
            {(title || subtitle) && (
              <Header>
                <div style={{ minWidth: 0 }}>
                  {title && <Title>{title}</Title>}
                  {subtitle && <Subtitle>{subtitle}</Subtitle>}
                </div>
                <CloseButton onClick={onClose} aria-label="Close">
                  <X size={14} strokeWidth={1.7} />
                </CloseButton>
              </Header>
            )}
            <Body>{children}</Body>
            {footer && <Footer>{footer}</Footer>}
          </Sheet>
        </Overlay>
      )}
    </AnimatePresence>
  );
}

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
`;

const Sheet = styled(motion.div)`
  background: rgba(15, 17, 22, 0.97);
  border-left: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: -32px 0 80px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  max-width: calc(100vw - 48px);
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  outline: none;
  will-change: transform, opacity;
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.005em;
  color: #f5f7fb;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(229, 231, 235, 0.6);
`;

const CloseButton = styled.button`
  width: 28px;
  height: 28px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: rgba(229, 231, 235, 0.55);
  border-radius: 8px;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #f5f7fb;
  }

  &:active {
    background: rgba(255, 255, 255, 0.10);
  }
`;

const Body = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  color: rgba(229, 231, 235, 0.85);
  font-size: 13.5px;
  line-height: 1.5;
`;

const Footer = styled.footer`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;
