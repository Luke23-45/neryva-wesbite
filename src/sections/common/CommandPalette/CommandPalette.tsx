import { useEffect, useState, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { Search as SearchIcon, ArrowRight } from 'lucide-react';
import { ease } from '@styles/motion';
import {
  Overlay,
  Palette,
  SearchRow,
  SearchIcon as SearchIconWrap,
  SearchInput,
  KbdHint,
  Kbd,
  Results,
  Section,
  SectionLabel,
  Item,
  ItemIcon,
  ItemBody,
  ItemTitle,
  ItemSub,
  ItemShortcut,
  ActiveArrow,
  Empty,
  Footer,
  FooterLeft,
  FooterRight,
} from './CommandPalette.styles';

export type CommandItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  to: string;
  section: string;
  shortcut?: string[];
  onSelect?: () => void;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  brand: 'studio' | 'deploy';
};

export function CommandPalette({ open, onClose, items, brand }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.subtitle?.toLowerCase().includes(q) ?? false) ||
        it.section.toLowerCase().includes(q),
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const out: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!out[item.section]) out[item.section] = [];
      out[item.section].push(item);
    }
    return out;
  }, [filtered]);

  const flat = useMemo(() => filtered, [filtered]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Focus input on open
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, flat.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flat[active];
        if (item) {
          if (item.onSelect) item.onSelect();
          else navigate({ to: item.to });
          onClose();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, flat, active, navigate, onClose]);

  // Reset active when filtered changes
  useEffect(() => {
    setActive(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <Overlay
          onClick={onClose}
          as={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: ease.premium }}
        >
          <Palette
            onClick={(e) => e.stopPropagation()}
            as={motion.div}
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: ease.premium }}
          >
            <SearchRow>
              <SearchIconWrap>
                <SearchIcon size={15} strokeWidth={1.7} />
              </SearchIconWrap>
              <SearchInput
                ref={inputRef}
                placeholder={brand === 'studio' ? 'Search agents, conversations, settings…' : 'Search pipelines, deployments, regions…'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <KbdHint>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                to navigate
                <Kbd>↵</Kbd>
                to open
              </KbdHint>
            </SearchRow>

            <Results>
              {flat.length === 0 ? (
                <Empty>No results for "{query}"</Empty>
              ) : (
                Object.entries(grouped).map(([section, list]) => (
                  <Section key={section}>
                    <SectionLabel>{section}</SectionLabel>
                    {list.map((it) => {
                      const idx = flat.indexOf(it);
                      return (
                        <Item
                          key={it.id}
                          type="button"
                          $active={idx === active}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => {
                            if (it.onSelect) it.onSelect();
                            else navigate({ to: it.to });
                            onClose();
                          }}
                        >
                          <ItemIcon $active={idx === active}>{it.icon}</ItemIcon>
                          <ItemBody>
                            <ItemTitle>{it.title}</ItemTitle>
                            {it.subtitle && <ItemSub>{it.subtitle}</ItemSub>}
                          </ItemBody>
                          {it.shortcut && (
                            <ItemShortcut>
                              {it.shortcut.map((k) => (
                                <Kbd key={k}>{k}</Kbd>
                              ))}
                            </ItemShortcut>
                          )}
                          {idx === active && (
                            <ActiveArrow aria-hidden="true"><ArrowRight size={12} strokeWidth={1.7} /></ActiveArrow>
                          )}
                        </Item>
                      );
                    })}
                  </Section>
                ))
              )}
            </Results>

            <Footer>
              <FooterLeft>
                <span>
                  <Kbd>esc</Kbd>to close
                </span>
              </FooterLeft>
              <FooterRight>
                {brand === 'studio' ? 'Neryva Studio' : 'Neryva Deploy'} · command palette
              </FooterRight>
            </Footer>
          </Palette>
        </Overlay>
      )}
    </AnimatePresence>
  );
}
