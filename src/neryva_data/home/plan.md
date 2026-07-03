# Home Page Data Plan

## Objective

Define the Home page content before implementation so the page can be rebuilt without relying on the legacy dataset.

## Final Content Model

The Home page should use section files rather than one large content blob.

Recommended files:

- `page.json`
- `sections/hero.json`
- `sections/research_overview.json`
- `sections/solutions_preview.json`
- `sections/selected_work.json`
- `sections/contact_cta.json`

## Section Responsibilities

### Hero

Purpose:

- state the company identity immediately,
- establish the enterprise and research-led framing,
- give the user two clear next actions.

Content requirements:

- headline,
- supporting paragraph,
- primary CTA,
- secondary CTA,
- optional visual note.

### Research Overview

Purpose:

- show the research agenda at a high level,
- communicate breadth without pretending all areas are equally mature,
- link into the Research page.

Content requirements:

- section title,
- short intro,
- list of research areas,
- one to two sentence descriptions per area.

### Solutions Preview

Purpose:

- show what Neryva sells,
- make the enterprise direction visible from the homepage,
- route business-minded visitors into the Solutions page.

Content requirements:

- section title,
- short intro,
- solution categories,
- short descriptions,
- CTA to the Solutions page.

### Selected Work

Purpose:

- replace the legacy news-style block with a proof-oriented block,
- surface research notes, experiments, open problems, or prototype updates,
- show the company is building real work rather than marketing copy.

Content requirements:

- item type,
- title,
- short description,
- date or status,
- destination link if available.

Rules:

- do not fabricate customer news,
- do not fabricate launch announcements,
- do not use future-dated items unless they are clearly planned and labeled as such,
- do not present placeholders as real achievements.

### Contact CTA

Purpose:

- close the page with a simple action,
- point the user to contact or partnership routes.

Content requirements:

- short message,
- contact email or link,
- optional note for research collaboration or enterprise inquiries.

## Shared Data Dependencies

The Home page should be able to reuse shared data from `common` for:

- site identity,
- navigation labels,
- contact details,
- shared CTA text,
- shared footer text if needed.

## Content Standards

- Write for clarity first.
- Keep each block compact and intentional.
- Avoid filler language.
- Keep the copy aligned with the foundation document.
- Use placeholder content only when the implementation needs shape before the final text exists.

## Validation Criteria

Before implementation, the Home page data should satisfy all of the following:

- every section has a clear purpose,
- the page has a clear content order,
- the research and solutions paths are both visible,
- no fake company claims are introduced,
- no section depends on hallucinated data,
- the data can be filled in incrementally without reworking the structure.

