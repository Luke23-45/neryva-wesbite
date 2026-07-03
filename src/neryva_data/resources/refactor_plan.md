# Resources Page Refactor Plan

## Goal

Build the Resources page around the new foundation and the new data architecture while removing the legacy publication-style content model.

## Refactor Strategy

The Resources page should act as a serious publication library, not a marketing feed.

Primary changes:

- move the page off the legacy `src/data` model,
- keep the page focused on technical references,
- separate writing, code, and reading lists,
- use empty states instead of invented content,
- keep the tone technical and restrained.

## Implementation Order

1. Create the new `src/neryva_data/resources` structure.
2. Define the page manifest and section files.
3. Write the hero copy to set the page tone.
4. Define technical writing as its own section.
5. Define open source as its own section.
6. Define reading lists as its own section.
7. Make empty states explicit where the resource library is still early.

## Design Notes

- Keep the layout clean and scannable.
- Avoid turning the page into a noisy blog index.
- Keep the content curated and specific.
- Let the page feel like a library, not a feed.

## Risk Areas

- It is easy to accidentally drift into marketing copy.
- It is easy to invent publications or repos to make the page look full.
- The page should remain useful even when the dataset is sparse.

## Success Criteria

The Resources page refactor is complete when:

- the page reads as a technical reference library,
- writing, open source, and reading lists are clearly separated,
- empty states are intentional,
- the page uses the new `neryva_data` structure,
- no fabricated resource data remains.

