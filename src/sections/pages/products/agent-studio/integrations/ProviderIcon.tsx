import type { ComponentType } from 'react';
import type { ConnectorProvider } from '@hooks/studio/useSetupConnectors';
import {
  SitemapIcon,
  GoogleDriveIcon,
  SharePointIcon,
  ConfluenceIcon,
  NotionIcon,
  ZendeskIcon,
  SlackIcon,
} from '@/assets/brand/providers';

/**
 * Provider → official brand mark with theme-correct treatment.
 *
 * - Full-color marks (Drive, Slack, SharePoint, Confluence, Telegram,
 *   WhatsApp) render directly — their fills are fixed official brand colors
 *   that hold on any surface. Confluence's official mark is a blue tile
 *   (#1868DB) with a white glyph: no backdrop needed on the dark console.
 * - currentColor marks (Notion, Sitemap, Zendesk) inherit the surrounding
 *   text color, so they adapt to light/dark automatically. Zendesk's official
 *   site icon is theme-adaptive by design — it must NOT sit on a light tile,
 *   or it renders white-on-white in the dark console.
 */
const ICONS: Record<ConnectorProvider, ComponentType<{ size?: number }>> = {
  sitemap: SitemapIcon,
  google_drive: GoogleDriveIcon,
  sharepoint: SharePointIcon,
  confluence: ConfluenceIcon,
  notion: NotionIcon,
  zendesk: ZendeskIcon,
  slack: SlackIcon,
};

export function ProviderIcon({ provider }: { provider: ConnectorProvider }) {
  const Mark = ICONS[provider];
  if (!Mark) {
    return null;
  }
  return <Mark size={20} />;
}
