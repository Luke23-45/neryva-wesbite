import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

afterEach(() => {
  cleanup();
});

// jsdom has no DOMMatrixReadOnly; @xyflow/system reads `m22` (zoom) from
// `new window.DOMMatrixReadOnly(style.transform)` inside updateNodeInternals
// whenever the ResizeObserver mock fires. The zoom is 1 in tests — no CSS
// matrix parsing needed.
if (typeof window !== 'undefined' && typeof (window as { DOMMatrixReadOnly?: unknown }).DOMMatrixReadOnly === 'undefined') {
  (window as { DOMMatrixReadOnly?: unknown }).DOMMatrixReadOnly = class DOMMatrixReadOnly {
    readonly m22 = 1;
    constructor(_transform?: string) {
      // Intentionally unparsed: test viewport is always zoom 1.
    }
  };
}

// jsdom has no layout, so a no-op ResizeObserver leaves measured components
// (React Flow nodes) unmeasured forever — and RF hides edges until their
// nodes measure. Fire once per observe() with a plausible box so canvas
// tests render the way a real browser would.
if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = class ResizeObserver {
    private callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe(target: Element): void {
      const contentRect = {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        top: 0,
        right: 200,
        bottom: 100,
        left: 0,
        toJSON: () => ({}),
      };
      this.callback(
        [{ target, contentRect } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve(): void {}
    disconnect(): void {}
  };
}

