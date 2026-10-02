import type { ReactNode } from 'react';
import { EmptyWrap, IconWrap, Title, Description, Action } from './EmptyState.styles';

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /**
   * Heading level for the title (default 'h4'). Callers whose page outline
   * needs the empty-state title higher pass 'h2' or 'h3'.
   */
  titleAs?: 'h2' | 'h3' | 'h4';
};

export function EmptyState({ icon, title, description, action, titleAs = 'h4' }: Props) {
  return (
    <EmptyWrap>
      {icon && <IconWrap>{icon}</IconWrap>}
      <Title as={titleAs}>{title}</Title>
      {description && <Description>{description}</Description>}
      {action && <Action>{action}</Action>}
    </EmptyWrap>
  );
}
