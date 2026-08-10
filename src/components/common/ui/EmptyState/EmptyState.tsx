import type { ReactNode } from 'react';
import { EmptyWrap, IconWrap, Title, Description, Action } from './EmptyState.styles';

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <EmptyWrap>
      {icon && <IconWrap>{icon}</IconWrap>}
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {action && <Action>{action}</Action>}
    </EmptyWrap>
  );
}
