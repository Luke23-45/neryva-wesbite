import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  MessagesSquare,
  Plug,
  Settings as SettingsIcon,
  Activity as ActivityIcon,
  BookOpen,
  Cpu,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Code2,
  Users,
  Activity,
  FlaskConical,
  Wrench,
  Ban,
} from 'lucide-react';

/**
 * Icon registry keyed by nav.json `icon` strings (extracted from StudioShell so
 * SidebarDomains/SidebarSection can render rows without importing the shell —
 * importing StudioShell here would be a cycle).
 */
export const iconMap = {
  dashboard: LayoutDashboard,
  chat: MessageSquare,
  agents: Bot,
  conversations: MessagesSquare,
  activity: ActivityIcon,
  integrations: Plug,
  settings: SettingsIcon,
  knowledge: BookOpen,
  models: Cpu,
  tools: Wrench,
  channels: MessagesSquare,
  approvals: ShieldCheck,
  analytics: BarChart3,
  compliance: ShieldCheck,
  templates: Sparkles,
  api: Code2,
  teams: Users,
  usage: Activity,
  evaluations: FlaskConical,
  blocks: Ban,
} as const;

export type StudioIconKey = keyof typeof iconMap;

/** Runtime-safe lookup for nav.json `icon` strings (unknown keys fall back, never crash). */
export function studioIcon(key: string) {
  return (iconMap as Record<string, (typeof iconMap)['dashboard']>)[key] ?? iconMap.dashboard;
}
