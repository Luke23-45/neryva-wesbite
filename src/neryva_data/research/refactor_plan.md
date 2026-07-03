# Research Page Refactor Plan

## Goal

Rebuild the Research page around the new foundation and the new data architecture while removing the legacy research dataset dependency.

## Refactor Strategy

The Research page should preserve the current structural idea while replacing the legacy content source and tightening the copy.

Primary changes:

- move the page off `src/data`,
- replace legacy research data with `src/neryva_data/research`,
- keep the page focused on research only,
- ensure the four domains are presented as research programs,
- remove any fake publication or news-like material.

## Implementation Order

1. Create the new Research page directory under `src/neryva_data`.
2. Define the page manifest and section files.
3. Replace the legacy agenda, program areas, open problems, and papers data with the new data source.
4. Rewrite the hero copy to reflect the foundation.
5. Keep the research taxonomy broad, but disciplined.
6. Make empty publication states explicit if there are no real papers yet.
7. Remove legacy content that makes the page sound like a product page or a fabricated lab feed.

## Design Notes

- Preserve the existing premium editorial structure where it still helps.
- Keep the page dense enough to feel serious without becoming crowded.
- Let the section order communicate the logic of the research agenda.
- Avoid any language that turns the page into a solutions pitch.

## Risk Areas

- The legacy data currently contains fabricated or overconfident publication-style content.
- The page has several data entry points, so the new structure must be consistent across all of them.
- The empty-state handling for papers must feel intentional, not like a broken page.

## Success Criteria

The Research page refactor is complete when:

- the page reads as a serious research surface,
- the research domains are clearly organized,
- open problems are visible,
- the papers area can be empty without failing,
- the page uses the new `neryva_data` structure,
- no legacy hallucinated research claims remain.

