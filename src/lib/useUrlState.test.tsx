import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { useUrlState } from './useUrlState';

function Probe() {
  const [value, setValue] = useUrlState('q', { default: '' });
  return (
    <div>
      <output data-testid="value">{value || '(empty)'}</output>
      <button type="button" onClick={() => setValue('hello')}>set</button>
      <button type="button" onClick={() => setValue('')}>clear</button>
    </div>
  );
}

async function renderProbe(initial?: string) {
  window.history.replaceState(null, '', initial ?? '/');
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Probe });
  const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute]) });
  await router.load();
  render(<RouterProvider router={router} />);
  return router;
}

describe('useUrlState', () => {
  it('writes the value into the URL on set', async () => {
    await renderProbe();
    fireEvent.click(screen.getByRole('button', { name: 'set' }));
    await screen.findByText('hello');
    expect(window.location.search).toBe('?q=hello');
  });

  it('removes the key from the URL when reset to the default', async () => {
    await renderProbe('/?q=hello&other=keep');
    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    await screen.findByText('(empty)');
    expect(window.location.search).toBe('?other=keep');
  });

  it('reads an initial value from the URL (deep link)', async () => {
    await renderProbe('/?q=prefilled');
    expect(screen.getByTestId('value').textContent).toBe('prefilled');
  });
});
