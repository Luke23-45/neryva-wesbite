# Research Page Data Plan

## Objective

Define the Research page content before implementation so the page can be rebuilt without using the legacy dataset.

## Final Content Model

The Research page should use page-level metadata plus section-level JSON files.

Recommended files:

- `page.json`
- `sections/hero.json`
- `sections/agenda.json`
- `sections/program_areas.json`
- `sections/open_problems.json`
- `sections/papers.json`

## Section Responsibilities

### Hero

Purpose:

- establish the page as the pure research surface,
- state the technical theme immediately,
- set the tone for the rest of the page.

Content requirements:

- eyebrow,
- headline,
- short descriptive framing,
- visual note.

### Agenda

Purpose:

- explain the technical philosophy behind the work,
- connect the research topics into one coherent direction.

Content requirements:

- one strong statement,
- compact, precise language,
- no commercial framing.

### Program Areas

Purpose:

- organize the research by domain,
- provide a fast-scanning structure for the page,
- keep the scope broad without making every area look equally mature.

Content requirements:

- four programs,
- title per program,
- cards or subtopics per program,
- descriptive labels or tags for scanability.

### Open Problems

Purpose:

- show unresolved technical questions,
- make the research honest about what is not solved yet.

Content requirements:

- question text,
- area mapping,
- stable identifiers.

### Papers

Purpose:

- expose published or in-preparation work,
- provide an empty state when the publication list is still early.

Content requirements:

- title,
- authors,
- venue,
- date,
- program,
- status,
- optional URL.

## Content Standards

- Keep the text direct and disciplined.
- Avoid promotional phrasing.
- Avoid claims that sound like product marketing.
- Use placeholder or empty states only where the page is genuinely early.
- Keep the research agenda aligned with the company foundation.

## Validation Criteria

Before implementation, the Research page data should satisfy all of the following:

- the page reads as research-only,
- the four domains are present and clearly organized,
- open problems are visible,
- papers can be empty without looking broken,
- no fake publication data is introduced,
- the content supports later implementation without needing a structural rewrite.

