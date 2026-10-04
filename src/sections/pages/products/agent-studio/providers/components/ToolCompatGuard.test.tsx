// @vitest-environment jsdom
/**
 * ToolCompatGuard — renders EXACTLY when pinned tools exceed the model's
 * capabilities: pinnedToolCount > 0 && capabilities.tools === false.
 * All other combinations render nothing (doc 20 §3.2 — warn, don't forbid).
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ToolCompatGuard } from './ToolCompatGuard';

const TOOLS = { tools: true, vision: true, reasoning: false, structured_output: true };
const NO_TOOLS = { tools: false, vision: true, reasoning: false, structured_output: true };

describe('ToolCompatGuard', () => {
  it('renders nothing when no tools are pinned (nothing to be incompatible with)', () => {
    const { container } = render(
      <ToolCompatGuard
        modelCapabilities={NO_TOOLS}
        pinnedToolCount={0}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the model supports tools', () => {
    const { container } = render(
      <ToolCompatGuard
        modelCapabilities={TOOLS}
        pinnedToolCount={3}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the amber guard with the exact badge copy when pinned tools exceed capabilities', () => {
    render(
      <ToolCompatGuard
        modelCapabilities={NO_TOOLS}
        pinnedToolCount={3}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText('Incompatible: no tool support')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('3 pinned tools');
  });

  it('uses the singular noun for one pinned tool', () => {
    render(
      <ToolCompatGuard
        modelCapabilities={NO_TOOLS}
        pinnedToolCount={1}
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('alert').textContent).toContain('1 pinned tool');
  });

  it('confirm proceeds, cancel backs out — explicit confirmation required', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ToolCompatGuard
        modelCapabilities={NO_TOOLS}
        pinnedToolCount={2}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select anyway' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Choose another' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
