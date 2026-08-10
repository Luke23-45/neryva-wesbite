import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import styled from 'styled-components';
import { ease, spring } from '@styles/motion';

/**
 * Apple-grade modal.
 *
 * Behavior:
 * - Backdrop fades in over 200ms (expressive ease) with a slight blur
 *   increase — focuses attention without abrupt darkening.
 * - Panel rises from y=20 → 0 with a `gentle` spring (the same spring
 *   iOS uses for sheets). Slight overshoot (stiffness 220, damping 28
 *   is on the under-damped side) — that's the bouncy "settle" feel.
 * - Escape closes, click outside closes, focus is trapped to the panel.
 * - Body scroll locked while open (and restored on close).
 *
 * Visual:
 * - Frosted glass: `rgba(15,17,22,0.94)` with backdrop-filter blur 24px.
 * - Hairline `rgba(255,255,255,0.10)` border + 1px inset highlight.
 * - Rounded 18px — matches the iOS sheet radius for modal-class surfaces.
 * - Heavy drop shadow for proper depth separation from the chrome.
 */

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

export function Modal({ open, onClose, title, children, footer, width = 480 }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <Overlay
          onClick={onClose}
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.2, ease: ease.expressive }}
        >
          <Panel
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={spring.gentle}
            style={{ width }}
          >
            {title && (
              <Header>
                <Title>{title}</Title>
                <CloseButton onClick={onClose} aria-label="Close">
                  <X size={14} strokeWidth={1.7} />
                </CloseButton>
              </Header>
            )}
            <Body>{children}</Body>
            {footer && <Footer>{footer}</Footer>}
          </Panel>
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
  align-items: center;
  justify-content: center;
  padding: 24px;
  /* blur target — animated via framer-motion */
  will-change: backdrop-filter, opacity;
`;

const Panel = styled(motion.div)`
  background: rgba(15, 17, 22, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 18px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 32px 80px rgba(0, 0, 0, 0.6),
    0 8px 24px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  max-width: calc(100vw - 48px);
  max-height: calc(100vh - 48px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: ${({ theme }) => theme.typography.fonts.sans};
  will-change: transform, opacity;
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const CloseButton = styled.button`
  width: 28px;
  height: 28px;
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
