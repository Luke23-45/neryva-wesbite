import { NotAvailableBlurb, NotAvailableNote, NotAvailableTitle, NotAvailableWrap } from './BuilderInspector.styles';

/**
 * Honest not-yet-available panel (LEDGER.md §8.8/§8.9 — Context and Response
 * render for visual parity, deferred D5/D6). No buttons, no fake actions
 * (C5): the node is tracked for a later release and there is nothing to
 * configure here.
 */
export function NotAvailablePanel({ title, blurb }: { title: string; blurb: string }) {
  return (
    <NotAvailableWrap>
      <NotAvailableTitle>
        {title} isn&rsquo;t available in this release yet.
      </NotAvailableTitle>
      <NotAvailableBlurb>{blurb}</NotAvailableBlurb>
      <NotAvailableNote>This node is tracked for a later release — nothing to configure here.</NotAvailableNote>
    </NotAvailableWrap>
  );
}
