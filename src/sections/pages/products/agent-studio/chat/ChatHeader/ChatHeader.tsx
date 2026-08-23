import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { ease } from '@styles/motion';
import {
  Bar,
  LeftCluster,
  Crumbs,
  Crumb,
  CrumbDivider,
  ModelButton,
  ModelBadge,
  ModelName,
  ModelChevron,
  ModelOptionName,
} from './ChatHeader.styles';
import { Popover, PopoverPanel, MenuItem, MenuIcon, MenuLabel } from '../../Popover/Popover.styles';

type Model = {
  id: string;
  name: string;
  badge: string;
  hue: 'emerald' | 'azure' | 'lilac' | 'amethyst';
};

const models: Model[] = [
  { id: 'reasoner', name: 'Neryva Reasoner', badge: 'Pro', hue: 'lilac' },
  { id: 'instant', name: 'Neryva Instant', badge: 'Fast', hue: 'emerald' },
  { id: 'research', name: 'Neryva Researcher', badge: 'Beta', hue: 'azure' },
];

export function ChatHeader() {
  const [activeId, setActiveId] = useState(models[0].id);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = models.find((m) => m.id === activeId) ?? models[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <Bar>
      <LeftCluster>
        <Crumbs aria-label="Breadcrumb">
          <Crumb>Studio</Crumb>
          <CrumbDivider aria-hidden="true">/</CrumbDivider>
          <Crumb>Untitled thread</Crumb>
        </Crumbs>

        <Popover ref={menuRef}>
          <ModelButton
            as={motion.button}
            whileTap={{ scale: 0.985 }}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <ModelBadge $hue={current.hue}>{current.badge}</ModelBadge>
            <ModelName>{current.name}</ModelName>
            <ModelChevron $open={open} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </ModelChevron>
          </ModelButton>
          <AnimatePresence>
            {open && (
              <PopoverPanel
                role="listbox"
                aria-label="Model"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: ease.premium }}
                $width={240}
                $align="left"
              >
                {models.map((m) => {
                  const selected = m.id === activeId;
                  return (
                    <MenuItem
                      key={m.id}
                      as="button"
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setActiveId(m.id);
                        setOpen(false);
                      }}
                    >
                      <MenuIcon>
                        <ModelBadge $hue={m.hue}>{m.badge}</ModelBadge>
                      </MenuIcon>
                      <MenuLabel>
                        <ModelOptionName>{m.name}</ModelOptionName>
                      </MenuLabel>
                      {selected && <Check size={13} strokeWidth={2} aria-hidden="true" />}
                    </MenuItem>
                  );
                })}
              </PopoverPanel>
            )}
          </AnimatePresence>
        </Popover>
      </LeftCluster>
    </Bar>
  );
}
