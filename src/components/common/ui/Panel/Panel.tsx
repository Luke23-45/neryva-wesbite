import type { ReactNode } from 'react';
import { PanelRoot, PanelHeader, PanelTitle, PanelSubtitle, PanelBody, PanelAside } from './Panel.styles';

type Props = {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  /** Removes PanelBody padding — for tables/lists that run edge to edge. */
  flush?: boolean;
  /**
   * Heading level for the title (default 'h3'). Pages whose title is the
   * first heading below the page h1 pass 'h2' to keep the outline valid.
   */
  titleAs?: 'h2' | 'h3' | 'h4';
  children?: ReactNode;
};

export function Panel({ title, subtitle, action, flush = false, titleAs = 'h3', children }: Props) {
  const hasHeader = title != null || subtitle != null || action != null;
  return (
    <PanelRoot>
      {hasHeader && (
        <PanelHeader>
          <div style={{ minWidth: 0 }}>
            {title != null && <PanelTitle as={titleAs}>{title}</PanelTitle>}
            {subtitle != null && <PanelSubtitle>{subtitle}</PanelSubtitle>}
          </div>
          {action && <PanelAside>{action}</PanelAside>}
        </PanelHeader>
      )}
      <PanelBody $flush={flush}>{children}</PanelBody>
    </PanelRoot>
  );
}
