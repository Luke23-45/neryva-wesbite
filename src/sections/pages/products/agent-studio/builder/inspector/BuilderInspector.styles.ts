import { Link } from '@tanstack/react-router';
import styled from 'styled-components';

/**
 * v10 inspector chrome (LEDGER.md §4 I1): panel #0D1117, 360px wide, flat
 * colors only (C1). Cards #10151D, borders #1E2530/#232B39, text
 * #E9EDF3/#C6CEDA/#A6B0BF/#7C8698, primary #2F7FE0 flat.
 */

export const Panel = styled.aside`
  width: 360px;
  flex: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #0d1117;
  border-left: 1px solid #1e2530;
  overflow-y: auto;
`;

export const InspectorHead = styled.div`
  padding: 16px 16px 14px;
  border-bottom: 1px solid #1e2530;
`;

export const HeadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const HeadIconTile = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ $color }) => `color-mix(in srgb, ${$color} 14%, transparent)`};
  color: ${({ $color }) => $color};
`;

export const HeadText = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const HeadTitle = styled.h2`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #e9edf3;
  line-height: 1.3;
`;

export const MetaLine = styled.span`
  margin-top: 2px;
  font-size: 10px;
  color: #7c8698;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const Head = styled.div`
  padding: 16px 16px 12px;
  border-bottom: 1px solid #1e2530;
`;

export const Title = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #e9edf3;
`;

export const Subtitle = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: #7c8698;
`;

export const Body = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: #a6b0bf;
  line-height: 1.6;
`;

export const PassTag = styled.span`
  align-self: flex-start;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid #232b39;
  color: #7c8698;
`;

/** Section eyebrow: 10px/600, letterspaced, muted (v10 caps treatment). */
export const CapsLabel = styled.div`
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.9px;
  text-transform: uppercase;
  color: #7c8698;
  margin-bottom: 8px;
`;

export const TypeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TypeRow = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #1e2530;
  background: #10151d;
  color: #e9edf3;
  font-family: inherit;
  text-align: left;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.55 : 1)};

  &:hover {
    border-color: #232b39;
  }

  &:focus-visible {
    outline: 2px solid #2f7fe0;
    outline-offset: 1px;
  }
`;

export const TypeDot = styled.span<{ $color: string }>`
  width: 9px;
  height: 9px;
  flex: none;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const TypeMain = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const TypeLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
`;

export const TypeBlurb = styled.span`
  font-size: 12px;
  color: #7c8698;
`;

export const TypeNote = styled.span`
  font-size: 10px;
  color: #7c8698;
  white-space: nowrap;
`;

export const ModelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #1e2530;
  background: #10151d;
  font-size: 13px;
  color: #e9edf3;
`;

export const EmptySelect = styled.div`
  padding: 24px 16px;
  text-align: center;
  color: #7c8698;
  font-size: 13px;
  line-height: 1.6;
`;

export const LockedWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid #1e2530;
  background: #10151d;
  font-size: 13px;
  line-height: 1.6;
  color: #a6b0bf;
`;

/* ── NotAvailablePanel (§8.8/§8.9 — honest, no actions) ─────────────── */

export const NotAvailableWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #1e2530;
  background: #10151d;
`;

export const NotAvailableTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #e9edf3;
  line-height: 1.5;
`;

export const NotAvailableBlurb = styled.div`
  font-size: 13px;
  color: #a6b0bf;
  line-height: 1.6;
`;

export const NotAvailableNote = styled.div`
  font-size: 12px;
  color: #7c8698;
  line-height: 1.6;
`;

/* ── Purpose extras: linked blueprint (I5), next steps (I6), CTA (I7) ── */

export const ExtrasSection = styled.section`
  display: flex;
  flex-direction: column;
`;

export const BlueprintCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #1e2530;
  background: #10151d;
`;

export const BlueprintTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const BlueprintIconTile = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: color-mix(in srgb, #d8b4fe 14%, transparent);
  color: #d8b4fe;
`;

export const BlueprintMeta = styled.span`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
`;

export const BlueprintSlug = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #e9edf3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const BlueprintSub = styled.span`
  font-size: 11px;
  color: #7c8698;
`;

export const GalleryLink = styled(Link)`
  font-size: 12px;
  font-weight: 600;
  color: #2f7fe0;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const NextStepsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const NextStepRow = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #1e2530;
  background: #10151d;
  color: #c6ceda;
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: #232b39;
  }

  &:focus-visible {
    outline: 2px solid #2f7fe0;
    outline-offset: 1px;
  }
`;

export const NextStepDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  flex: none;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const NextStepLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NextStepChevron = styled.span`
  display: inline-flex;
  flex: none;
  color: #7c8698;
`;

export const CtaButton = styled.button`
  width: 100%;
  padding: 11px 12px;
  border: 0;
  border-radius: 10px;
  background: #2f7fe0;
  color: #ffffff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #2b73c9;
  }

  &:focus-visible {
    outline: 2px solid #7fb3f0;
    outline-offset: 2px;
  }
`;
