import type { ReactNode } from 'react';
import { PanelRoot, PanelHeader, PanelTitle, PanelSubtitle, PanelBody, PanelAside } from './Panel.styles';

type Props = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Panel({ title, subtitle, action, children }: Props) {
  return (
    <PanelRoot>
      {(title || subtitle || action) && (
        <PanelHeader>
          <div>
            {title && <PanelTitle>{title}</PanelTitle>}
            {subtitle && <PanelSubtitle>{subtitle}</PanelSubtitle>}
          </div>
          {action && <PanelAside>{action}</PanelAside>}
        </PanelHeader>
      )}
      <PanelBody>{children}</PanelBody>
    </PanelRoot>
  );
}
