# Solutions Page Data Plan

## Objective

Define the Solutions page content before implementation so the page can be rebuilt without relying on the legacy dataset.

## Final Content Model

The Solutions page should use page-level metadata plus section-level JSON files.

Recommended files:

- `page.json`
- `sections/hero.json`
- `sections/offerings.json`
- `sections/delivery_model.json`
- `sections/proof_points.json`
- `sections/contact_cta.json`

The product catalog and detail data should live under `solutions/products/`.

## Section Responsibilities

### Hero

Purpose:

- state the commercial identity clearly,
- connect the page to the research-led foundation,
- give the user a simple next step.

Content requirements:

- headline,
- supporting paragraph,
- primary CTA,
- secondary CTA,
- optional visual note.

### Offerings

Purpose:

- list the solution categories Neryva can build,
- keep the page concrete and commercially readable.

Content requirements:

- solution title,
- short description,
- enterprise value statement,
- optional status when a category is early or emerging.

The offerings section should point into the product catalog, not replace it.

### Delivery Model

Purpose:

- explain how Neryva engages with customers,
- reduce ambiguity about how work gets scoped and delivered.

Content requirements:

- discovery phase,
- prototype or pilot phase,
- implementation phase,
- support or iteration phase.

### Proof Points

Purpose:

- show why the company is credible,
- connect the commercial work back to research and evidence.

Content requirements:

- research linkage,
- evaluation discipline,
- deployment focus,
- selective expertise.

Rules:

- do not invent customer logos,
- do not invent metrics,
- do not fabricate case studies.

### Contact CTA

Purpose:

- close the page with a direct business action,
- point users toward the contact route.

Content requirements:

- short message,
- contact email or link,
- optional note for enterprise inquiries.

## Content Standards

- Write for enterprise clarity.
- Keep the language specific and practical.
- Avoid research-only framing.
- Avoid hype.
- Keep the page aligned with the foundation document.

## Product Catalog Rule

The Solutions page is an overview.

Individual products or solution pages should be defined separately under `solutions/products/` so the site can support:

- `/solutions` for the index,
- `/solutions/$slug` for specific offerings.

## Validation Criteria

Before implementation, the Solutions page data should satisfy all of the following:

- the page reads as the commercial surface of the site,
- the offerings are concrete,
- the delivery model is clear,
- the proof points avoid fabrication,
- the content can be implemented without a structural rewrite later.
