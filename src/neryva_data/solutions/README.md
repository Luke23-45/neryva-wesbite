# Solutions Page Data

## Purpose

This directory defines the content model for the Solutions page.

The Solutions page is the commercial surface of the site. It should show what Neryva can build, how those systems map to enterprise needs, and how the company turns research into delivery.

## Recommended Data Architecture

Use a page manifest plus section-level JSON files.

Recommended layout:

```text
src/neryva_data/solutions/
  README.md
  plan.md
  refactor_plan.md
  page.json
  sections/
    hero.json
    offerings.json
    delivery_model.json
    proof_points.json
    contact_cta.json
  products/
    README.md
    plan.md
    refactor_plan.md
    catalog.json
    *.json
```

## Section Model

### `page.json`

Page-level metadata and section order.

### `sections/hero.json`

The first-view commercial statement.

Expected responsibilities:

- company-facing headline,
- short value proposition,
- primary CTA,
- secondary CTA,
- visual direction.

### `sections/offerings.json`

The actual solution categories.

Expected responsibilities:

- solution names,
- short descriptions,
- the enterprise value each one serves,
- optional status labels if a category is still early.

### `sections/delivery_model.json`

How Neryva works with customers.

Expected responsibilities:

- engagement stages,
- delivery expectations,
- what customers should expect from a project or pilot.

### `sections/proof_points.json`

The credibility layer.

Expected responsibilities:

- what makes the company credible,
- how research informs delivery,
- what kinds of evidence should accompany a solution.

This section should avoid fake case studies.

### `sections/contact_cta.json`

The final conversion block.

Expected responsibilities:

- short closing message,
- contact route,
- optional enterprise inquiry note.

## Content Rules

- Keep the page commercial, but honest.
- Do not claim products or customers that do not exist.
- Do not turn the page into research copy.
- Do not use inflated language without a clear operational meaning.
- If an offering is early, label it clearly.

## Product Subdirectory

The `products` subdirectory should hold the product catalog and individual product detail data.

It exists because the Solutions index page is not the same thing as a product detail page.

The pattern should be:

- `/solutions` for the overview,
- `/solutions/$slug` for product detail pages,
- `products/catalog.json` for the list of available solutions,
- one JSON file per product for the detail content.

## Page Role In The Site

The Solutions page should do three things well:

- show what Neryva sells,
- connect those offerings to the research foundation,
- give enterprise visitors a clear route to contact the company.
