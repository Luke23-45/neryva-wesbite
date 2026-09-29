# Provider Brand Icons

Third-party brand marks for the Agent Studio console (integrations + channels).
Created 2026-09-29 for the modal→dedicated-section migration.

## Usage

```tsx
import { NotionIcon, SlackIcon } from '@/assets/brand/providers';

<NotionIcon size={36} />
```

All icons accept `size` (default 24) and spread `SVGProps<SVGSVGElement>`.
All are decorative (`aria-hidden="true"`).

## Icons

| Icon | Component | Source | Brand color(s) | Theme behavior |
|---|---|---|---|---|
| Notion | `NotionIcon` | [Official Notion developer docs header SVG](https://developers.notion.com/) (lockup "Developer Docs" text omitted) | Monochrome (`currentColor`; Notion ships black/white variants) | Adapts via `currentColor` |
| Google Drive | `GoogleDriveIcon` | [Wikimedia Commons — File:Google Drive icon (2020).svg](https://commons.wikimedia.org/wiki/File:Google_Drive_icon_(2020).svg) | Blue `#0066DA`/`#2684FC`, Green `#00AC47`/`#00832D`, Red `#EA4335`, Yellow `#FFBA00` | Fixed (official tri-color) |
| SharePoint | `SharePointIcon` | [Microsoft Fabric brand icons CDN](https://static2.sharepointonline.com/files/fabric/assets/brand-icons/product/svg/sharepoint_48x1.svg) (the icon SharePoint Online itself serves) | Teal gradient `#058f92`/`#038489`/`#026d71`, circles `#036c70`/`#1a9ba1`/`#37c6d0`, white "S" | Fixed (official product icon) |
| Confluence | `ConfluenceIcon` | [Atlassian logo library](https://atlassian.design/foundations/logos) (`confluence_app.zip` → `SVG/Confluence_icon.svg`) | Blue tile `#1868DB`, white glyph | Fixed (official app icon) |
| Zendesk | `ZendeskIcon` | [Zendesk official CDN](https://d1eipm3vz40hy0.cloudfront.net/images/logos/favicons/zendesk-icon.svg) (zendesk.com's own site icon) | Theme-adaptive `currentColor` (white in dark mode, per official asset) | Adapts via `currentColor` |
| Slack | `SlackIcon` | [Slack media kit (official CDN)](https://a.slack-edge.com/9cc0056/marketing/img/nav/logo.svg) | Blue `#00B3FF`, Green `#41B658`, Magenta `#E3066A`, Yellow `#FCC003` | Fixed (official four-color) |
| Sitemap | `SitemapIcon` | Original design (no brand exists) | `currentColor` | Adapts to theme |
| WhatsApp | `WhatsAppIcon` | [whatsapp.com inline logo lockup](https://www.whatsapp.com/brand) (glyph paths verbatim; wordmark omitted) | Green `#00E676`, white `#FFFFFF` | Fixed |
| Messenger | `MessengerIcon` | [Simple Icons](https://simpleicons.org/icons/messenger) — **unresolvable**: Meta bot-gates all official brand resources (see notes) | `#0866FF` | Fixed |
| Telegram | `TelegramIcon` | [Official Telegram press kit](https://telegram.org/press) (`Logo.svg` from the linked logo archive) | Gradient `#2AABEE` → `#229ED9`, white plane | Fixed (official full-color mark) |
| Web widget | `WebWidgetIcon` | Original design (no brand exists) | `currentColor` | Adapts to theme |

## Sourcing notes

- **Notion** uses the cube mark from Notion's own developer documentation
  header SVG (path data verbatim; lockup text omitted). Notion's brand is
  monochrome, so the component renders via `currentColor` (black on light
  themes, white on dark — matching Notion's own light/dark header variants).
- **SharePoint** uses the official 48px product icon from Microsoft's own
  Fabric brand-icons CDN — the exact SVG SharePoint Online serves.
- **Confluence** uses the official app icon from Atlassian's logo library
  (`confluence_app.zip`), downloaded from atlassian.design.
- **Zendesk** uses Zendesk's own site-icon SVG from Zendesk's official CDN
  (referenced by zendesk.com's own pages). The asset is theme-adaptive
  (`currentColor`, white in dark mode); its embedded dark-mode `<style>` was
  deliberately omitted — inlined in a page it would recolor every `<path>`
  document-wide.
- **WhatsApp** uses the glyph paths (green bubble + white ring/phone) verbatim
  from the official logo lockup served inline on whatsapp.com itself; the
  "WhatsApp" wordmark paths are omitted and the viewBox is cropped to the
  glyph bounds.
- **Telegram** uses `Logo.svg` from the official Telegram press kit archive
  linked on telegram.org/press — full-color gradient mark, not the
  single-color redraw.
- **Messenger** is unresolvable: Meta bot-gates every official brand-resource
  surface (brand.meta.com, meta.com/brand, messenger.com, m.me,
  developers.facebook.com). The existing component is left untouched rather
  than substituted with another approximation.
- **Google Drive** uses the official 2020 tri-color mark from Wikimedia Commons
  (Simple Icons only carries the monochrome version, which would violate the
  correct-colors requirement).
- **Slack** uses the official four-color mark from Slack's own media kit CDN
  (Simple Icons only carries the monochrome version).
- **Sitemap** and **Web widget** have no brand; the marks are original neutral
  designs that adapt to the theme via `currentColor`.
- No Lucide fallbacks. No approximations. If a brand mark cannot be sourced
  officially, the slot stays empty.

## Trademark notice

All brand marks remain the property of their respective owners and are used
only to identify the integration/channel. Inclusion does not imply sponsorship
or endorsement.
