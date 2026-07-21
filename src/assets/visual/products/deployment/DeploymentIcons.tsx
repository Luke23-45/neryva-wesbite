import type { SVGProps } from 'react';
import {
  CloudCog as CloudCogLucide,
  Server as ServerLucide,
  Cpu as CpuLucide,
  Workflow as WorkflowLucide,
  ShieldCheck as ShieldCheckLucide,
  Gauge as GaugeLucide,
  Activity as ActivityLucide,
  KeyRound as KeyRoundLucide,
  FileCheck as FileCheckLucide,
  Headphones as HeadphonesLucide,
  HardDriveDownload as HardDriveDownloadLucide,
} from 'lucide-react';

import {
  BrandVoiceIcon,
  KnowledgeIcon,
  GuardrailsIcon,
  WorkflowIcon,
  HeadsetIcon,
  PeopleIcon,
  BadgeIcon,
  WorkflowAgentIcon,
} from '@assets/visual/products/enterprise/EnterpriseCapabilityIcons';

type IconProps = SVGProps<SVGSVGElement>;
type IconFactory = React.FC<IconProps>;

const lucideIcon = (C: React.ComponentType<{ size?: number; strokeWidth?: number }>): IconFactory =>
  (() => <C size={22} strokeWidth={1.5} />) as unknown as IconFactory;

const pixelIcon = (C: React.FC<IconProps>): IconFactory =>
  (props: IconProps) => <C width={22} height={22} {...props} />;

export const DeploymentUseCaseIcons: Record<string, IconFactory> = {
  cloudcog: lucideIcon(CloudCogLucide),
  server: lucideIcon(ServerLucide),
  cpu: lucideIcon(CpuLucide),
  workflow: lucideIcon(WorkflowLucide),
};

export const DeploymentCapabilityIcons: Record<string, IconFactory> = {
  cpu: lucideIcon(CpuLucide),
  gauge: lucideIcon(GaugeLucide),
  activity: lucideIcon(ActivityLucide),
  shieldcheck: lucideIcon(ShieldCheckLucide),
  filecheck: lucideIcon(FileCheckLucide),
  workflow: lucideIcon(WorkflowLucide),
  harddrivedownload: lucideIcon(HardDriveDownloadLucide),
  keyround: lucideIcon(KeyRoundLucide),
  headphones: lucideIcon(HeadphonesLucide),
  managedops: pixelIcon(WorkflowAgentIcon),

  brandvoice: pixelIcon(BrandVoiceIcon),
  knowledge: pixelIcon(KnowledgeIcon),
  guardrails: pixelIcon(GuardrailsIcon),
  workflowgear: pixelIcon(WorkflowIcon),
  headset: pixelIcon(HeadsetIcon),
  people: pixelIcon(PeopleIcon),
  badge: pixelIcon(BadgeIcon),
  workflowagent: pixelIcon(WorkflowAgentIcon),

  palette: pixelIcon(BrandVoiceIcon),
  database: pixelIcon(KnowledgeIcon),
  shieldalert: pixelIcon(GuardrailsIcon),
  users: pixelIcon(PeopleIcon),
  badgecheck: pixelIcon(BadgeIcon),
  settings2: pixelIcon(WorkflowIcon),
  'workflow-agent': pixelIcon(WorkflowAgentIcon),
};
