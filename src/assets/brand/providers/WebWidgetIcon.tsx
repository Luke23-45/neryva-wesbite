import type { SVGProps } from 'react';

type BrandIconProps = SVGProps<SVGSVGElement> & {
  /** Icon size in pixels (width and height). @default 24 */
  size?: number;
};

// Web widget — custom neutral mark (no brand exists).
// Original design: browser window with traffic lights and content lines.
// Uses currentColor so it adapts to light/dark theme.
export function WebWidgetIcon({ size = 24, ...props }: BrandIconProps) {
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
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 9.5h18" />
      <circle cx="5.8" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="11.2" cy="7.2" r="0.9" fill="currentColor" stroke="none" />
      <path d="M6 13.5h9" />
      <path d="M6 16h6" />
    </svg>
  );
}
