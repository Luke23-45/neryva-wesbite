import type { ReactNode } from 'react';
import { PanelRoot, PanelHeader, PanelTitle, PanelSubtitle, PanelBody, PanelAside } from './Panel.styles';

type Props = {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export function Panel({ title, subtitle, action, children }: Props) {
  const hasHeader = title != null || subtitle != null || action != null;
  return (
    <PanelRoot>
      {hasHeader && (
        <PanelHeader>
          <div style={{ minWidth: 0 }}>
            {title != null && <PanelTitle>{title}</PanelTitle>}
            {subtitle != null && <PanelSubtitle>{subtitle}</PanelSubtitle>}
          </div>
          {action && <PanelAside>{action}</PanelAside>}
        </PanelHeader>
      )}
      <PanelBody>{children}</PanelBody>
    </PanelRoot>
  );
}
