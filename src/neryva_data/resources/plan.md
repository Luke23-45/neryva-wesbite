# Resources Page Data Plan

## Objective

Define the Resources page content before implementation so the page can be rebuilt without relying on the legacy dataset.

## Final Content Model

The Resources page should use page-level metadata plus section-level JSON files.

Recommended files:

- `page.json`
- `sections/hero.json`
- `sections/writing.json`
- `sections/open_source.json`
- `sections/reading_lists.json`

## Section Responsibilities

### Hero

Purpose:

- establish the page as the reference and publication surface,
- set expectations that the content is technical and curated.

Content requirements:

- label,
- headline,
- short description,
- visual note.

### Writing

Purpose:

- surface technical writing and essays,
- provide an early-stage empty state if there are no articles yet.

Content requirements:

- article list,
- metadata,
- early-stage message.

### Open Source

Purpose:

- surface repositories or code artifacts,
- make technical work visible without fabricating releases.

Content requirements:

- repository list,
- purpose,
- link if available,
- early-stage message if empty.

### Reading Lists

Purpose:

- provide curated reading around the research agenda,
- help users move from the site into deeper technical context.

Content requirements:

- topic groups,
- items per group,
- optional year or author if relevant.

## Content Standards

- Keep the page curated, not noisy.
- Avoid fake publication feeds.
- Avoid promotional copy.
- Keep the content aligned with the research agenda and foundation.
- Use placeholders only when the page is genuinely not ready yet.

## Validation Criteria

Before implementation, the Resources page data should satisfy all of the following:

- the page reads as a curated publication surface,
- writing, open source, and reading lists are clearly separated,
- empty states are acceptable where needed,
- no fabricated publications or repositories are introduced,
- the structure can support later incremental additions.

