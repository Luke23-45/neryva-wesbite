import type { SVGProps } from 'react';

type BrandIconProps = SVGProps<SVGSVGElement> & {
  /** Icon size in pixels (width and height). @default 24 */
  size?: number;
};

// Zendesk brand mark.
// Source: Zendesk's own site icon, served from Zendesk's official CDN and
// referenced by zendesk.com's own pages:
// https://d1eipm3vz40hy0.cloudfront.net/images/logos/favicons/zendesk-icon.svg
// Path data verbatim; official viewBox 0 0 20 20. The official asset is
// theme-adaptive (fill="currentColor", white in dark mode) — kept as-is.
// (The asset's embedded dark-mode <style> is omitted: inlined it would target
// every <path> on the page.)
export function ZendeskIcon({ size = 24, ...props }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M9.442 6.904v9.294H1.75l7.692-9.294Zm0-3.334a3.857 3.857 0 0 1-3.846 3.846A3.857 3.857 0 0 1 1.75 3.57h7.692Zm1.282 12.63a3.857 3.857 0 0 1 3.846-3.847 3.857 3.857 0 0 1 3.847 3.846h-7.693Zm0-3.334V3.57h7.693l-7.693 9.295Z" />
    </svg>
  );
}
