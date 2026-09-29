import type { SVGProps } from 'react';

type BrandIconProps = SVGProps<SVGSVGElement> & {
  /** Icon size in pixels (width and height). @default 24 */
  size?: number;
};

// Sitemap — custom neutral mark (no brand exists).
// Original design: hierarchy tree (root node branching to child nodes).
// Uses currentColor so it adapts to light/dark theme.
export function SitemapIcon({ size = 24, ...props }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="5" r="2.2" />
      <path d="M12 7.2v2.3" />
      <path d="M5 9.5h14" />
      <path d="M5 9.5V14" />
      <path d="M12 9.5V14" />
      <path d="M19 9.5V14" />
      <circle cx="5" cy="16.2" r="2.2" />
      <circle cx="12" cy="16.2" r="2.2" />
      <circle cx="19" cy="16.2" r="2.2" />
    </svg>
  );
}
