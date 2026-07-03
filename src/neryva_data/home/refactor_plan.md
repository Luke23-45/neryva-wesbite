# Home Page Refactor Plan

## Goal

Rebuild the Home page around the new foundation and the new data architecture without carrying over the legacy content model.

## Refactor Strategy

The current Home page already has a useful visual layout. The refactor should preserve the structural strengths while replacing the legacy data and messaging.

Primary changes:

- move content out of the legacy `src/data` model,
- replace vague or fabricated copy,
- align the page with the research-led enterprise positioning,
- make `Research` and `Solutions` visible from the first screen,
- replace the legacy update/news block with proof-oriented content.

## Implementation Order

1. Create the new `src/neryva_data` content structure.
2. Define shared content in `common`.
3. Define the Home page manifest and section files.
4. Replace the legacy Home page data imports with the new data source.
5. Rewrite the Home hero copy to match the foundation.
6. Replace the old programs-style section with a research overview and/or solutions preview.
7. Replace the news-style updates block with selected work or proof-oriented content.
8. Update the final contact CTA to match the enterprise and research framing.
9. Remove or quarantine any legacy content that still leaks the old direction.

## Design Notes

- Keep the existing premium visual direction where it still works.
- Do not introduce dense UI noise just to fill space.
- Keep the Home page focused on hierarchy and clarity.
- Let the content carry the structure rather than overexplaining it.

## Risk Areas

- Legacy content may still be wired into multiple components.
- Some current copy and visuals are tied to the old company story.
- The page should not be refactored into a generic landing page with no substance.
- The data model should stay small enough to edit without confusion.

## Success Criteria

The Home page refactor is complete when:

- the page reads as a research-led enterprise AI company,
- the research and solutions paths are both obvious,
- the content is sourced from the new `neryva_data` structure,
- no legacy hallucinated copy remains on the page,
- the page can be updated without reintroducing ambiguous content.

