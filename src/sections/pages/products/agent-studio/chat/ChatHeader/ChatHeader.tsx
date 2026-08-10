import { useState } from 'react';
import { motion } from 'framer-motion';
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
  RightCluster,
  IconAction,
} from './ChatHeader.styles';

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
  const [active] = useState(models[0].id);
  const [open, setOpen] = useState(false);
  const current = models.find((m) => m.id === active) ?? models[0];

  return (
    <Bar>
      <LeftCluster>
        <Crumbs aria-label="Breadcrumb">
          <Crumb>Studio</Crumb>
          <CrumbDivider aria-hidden="true">/</CrumbDivider>
          <Crumb>Untitled thread</Crumb>
        </Crumbs>

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
      </LeftCluster>

      <RightCluster>
        <IconAction aria-label="Share">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconAction>
        <IconAction aria-label="Settings">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1.04 1.56V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1.11-1.56 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 005 14.6 1.7 1.7 0 003.44 13.56H3a2 2 0 110-4h.09A1.7 1.7 0 005 8.44 1.7 1.7 0 004.66 6.57l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009.36 4.08 1.7 1.7 0 0010.43 2.52V2a2 2 0 014 0v.09a1.7 1.7 0 001.04 1.56 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.92 9.36 1.7 1.7 0 0021.48 10.43H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.51 1.04z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </IconAction>
        <IconAction aria-label="Account">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </IconAction>
      </RightCluster>
    </Bar>
  );
}
