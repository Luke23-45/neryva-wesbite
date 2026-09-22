/**
 * Keyed registry for the enterprise capability icon set.
 *
 * Lives apart from EnterpriseCapabilityIcons.tsx (which exports only
 * components) so the icon module stays fast-refresh clean: components and
 * the keyed registry are separate exports in separate files.
 */
import type { IconProps } from './EnterpriseCapabilityIcons';
import {
  BrandVoiceIcon,
  KnowledgeIcon,
  GuardrailsIcon,
  WorkflowIcon,
  HeadsetIcon,
  PeopleIcon,
  BadgeIcon,
  WorkflowAgentIcon,
} from './EnterpriseCapabilityIcons';

/* ════════════════════════════════════════════════════════════════════
   REGISTRY — keyed by semantic name (lowercase) + lucide fallback names
   ────────────────────────────────────────────────────────────────────
   Fixed a real bug from the previous version: 'workflow' was defined
   twice in this object (once for WorkflowIcon, once as a lucide-name
   alias for WorkflowAgentIcon), so the second definition silently
   overwrote the first at runtime — anything looking up
   EnterpriseIcons['workflow'] got the pipeline icon, not the gears.
   Resolved by giving the pipeline icon its own semantic key and
   reserving the lucide fallback name 'workflow' for it instead, since
   Lucide's own "Workflow" icon is a node/flow diagram — a closer
   match to WorkflowAgentIcon than to the gear icon anyway.
   ════════════════════════════════════════════════════════════════════ */

export const EnterpriseIcons: Record<string, React.FC<IconProps>> = {
  // Capabilities
  brandvoice: BrandVoiceIcon,
  knowledge: KnowledgeIcon,
  guardrails: GuardrailsIcon,
  workflow: WorkflowIcon,
  // Use Cases
  headset: HeadsetIcon,
  people: PeopleIcon,
  badge: BadgeIcon,
  workflowagent: WorkflowAgentIcon,
  // Lucide fallback mapping (backward compat)
  palette: BrandVoiceIcon,
  audiolines: BrandVoiceIcon,
  database: KnowledgeIcon,
  shieldalert: GuardrailsIcon,
  settings2: WorkflowIcon,
  users: PeopleIcon,
  badgecheck: BadgeIcon,
  'workflow-agent': WorkflowAgentIcon,
};
