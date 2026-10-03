// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { JSX } from 'react';
import { render, screen } from '@testing-library/react';
import { agentStudioRoute } from './routes';

/**
 * P1 flow-chrome: an unauthenticated cold load of any /agent-studio/* route
 * (e.g. /agent-studio/agents/:id/build) spends the session gate's async
 * beforeLoad inside requireEngineSession — up to ~12s in the silent-auth
 * iframe timeout on a dead session. With no pending UI the shell sat on a
 * blank white page until the /auth redirect fired. The shell route must
 * render real loading chrome in that window — never blank.
 */
describe('agent-studio shell gate pending state', () => {
  it('defines a pending component for the session-gate window', () => {
    expect(agentStudioRoute.options.pendingComponent).toBeTruthy();
  });

  it('renders visible loading chrome, not a blank page', () => {
    const Pending = agentStudioRoute.options.pendingComponent as () => JSX.Element;
    const { container } = render(<Pending />);
    // Accessible loading region with painted content behind it.
    expect(screen.getByLabelText('Loading agent studio')).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Loading agent studio"]')?.children.length).toBeGreaterThan(0);
  });
});
