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

const LUCIDE_STYLE = {
  width: 22,
  height: 22,
  strokeWidth: 1.5,
  'aria-hidden': true,
} as const;

function LucideIcon(Component: React.ComponentType<{ size?: number; strokeWidth?: number }>) {
  return function LucideIconRender(props: IconProps) {
    return <Component {...LUCIDE_STYLE} {...props} />;
  };
}

function PixelIcon(Component: React.ComponentType<IconProps>) {
  return function PixelIconRender(props: IconProps) {
    return <Component width={22} height={22} {...props} />;
  };
}

export const DeploymentUseCaseIcons: Record<string, React.FC<IconProps>> = {
  cloudcog: LucideIcon(CloudCogLucide),
  server: LucideIcon(ServerLucide),
  cpu: LucideIcon(CpuLucide),
  workflow: LucideIcon(WorkflowLucide),
};

export const DeploymentCapabilityIcons: Record<string, React.FC<IconProps>> = {
  cpu: LucideIcon(CpuLucide),
  gauge: LucideIcon(GaugeLucide),
  activity: LucideIcon(ActivityLucide),
  shieldcheck: LucideIcon(ShieldCheckLucide),
  filecheck: LucideIcon(FileCheckLucide),
  workflow: LucideIcon(WorkflowLucide),
  managedops: PixelIcon(WorkflowAgentIcon),

  harddrivedownload: LucideIcon(HardDriveDownloadLucide),
  workflowspecialist: LucideIcon(HeadphonesLucide),
  keyround: LucideIcon(KeyRoundLucide),
  headphones: LucideIcon(HeadphonesLucide),

  brandvoice: PixelIcon(BrandVoiceIcon),
  knowledge: PixelIcon(KnowledgeIcon),
  guardrails: PixelIcon(GuardrailsIcon),
  workflowgear: PixelIcon(WorkflowIcon),
  headset: PixelIcon(HeadsetIcon),
  people: PixelIcon(PeopleIcon),
  badge: PixelIcon(BadgeIcon),
  workflowagent: PixelIcon(WorkflowAgentIcon),

  palette: PixelIcon(BrandVoiceIcon),
  database: PixelIcon(KnowledgeIcon),
  shieldalert: PixelIcon(GuardrailsIcon),
  users: PixelIcon(PeopleIcon),
  badgecheck: PixelIcon(BadgeIcon),
  settings2: PixelIcon(WorkflowIcon),
  'workflow-agent': PixelIcon(WorkflowAgentIcon),
};
