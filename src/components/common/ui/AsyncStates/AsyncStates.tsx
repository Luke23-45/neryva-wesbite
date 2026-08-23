/**
 * Async-state plumbing for engine-backed views (plan A5): a query-state
 * switcher over the existing Skeleton/EmptyState primitives, an ErrorState,
 * and a route-level ErrorBoundary. Engine views render <QueryView> instead
 * of hand-rolling loading/error/empty for every table.
 */
import { Component, ReactNode, ErrorInfo } from 'react';
import styled from 'styled-components';
import type { UseQueryResult } from '@tanstack/react-query';
import { Skeleton } from '../Skeleton/Skeleton';
import { EmptyState } from '../EmptyState/EmptyState';
import { ActionButton } from '../ActionButton/ActionButton';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
`;

const ErrorTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
`;

const ErrorDescription = styled.p`
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
  max-width: 420px;
  word-break: break-word;
`;

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <ErrorWrap>
      <AlertTriangle size={20} opacity={0.6} />
      <ErrorTitle>{title}</ErrorTitle>
      {message && <ErrorDescription>{message}</ErrorDescription>}
      {onRetry && (
        <ActionButton variant="secondary" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </ActionButton>
      )}
    </ErrorWrap>
  );
}

/** The query-state switcher: loading skeleton → error retry → empty → content. */
export function QueryView<T>({
  query,
  skeleton,
  empty,
  isEmpty,
  children,
}: {
  query: UseQueryResult<T>;
  skeleton?: ReactNode;
  empty?: { title: string; description?: string };
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) {
    return <>{skeleton ?? <Skeleton $h="220px" $r="12px" />}</>;
  }
  if (query.isError) {
    return <ErrorState message={(query.error as Error).message} onRetry={() => void query.refetch()} />;
  }
  if (isEmpty && isEmpty(query.data)) {
    return <EmptyState icon={<RefreshCw size={18} opacity={0.5} />} title={empty?.title ?? 'Nothing here yet'} description={empty?.description} />;
  }
  return <>{children(query.data)}</>;
}

interface BoundaryState {
  error: Error | null;
}

/** Route-level boundary — a render crash degrades the page, never the app. */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[platform] render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title="This view failed to render"
          message={this.state.error.message}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}