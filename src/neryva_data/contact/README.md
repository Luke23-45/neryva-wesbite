# Contact Page Data

## Purpose

This directory defines the content model for the Contact page.

The Contact page should give visitors a direct route to reach Neryva for enterprise inquiries, research collaboration, and general company contact.

## Recommended Data Architecture

Use a page manifest plus section-level JSON files.

Recommended layout:

```text
src/neryva_data/contact/
  README.md
  plan.md
  refactor_plan.md
  page.json
  sections/
    hero.json
    routes.json
    form.json
```

## Section Model

### `page.json`

Page-level metadata and section order.

### `sections/hero.json`

The first-view contact statement.

Expected responsibilities:

- page label,
- headline,
- short description.

### `sections/routes.json`

The contact route block.

Expected responsibilities:

- direct contact paths,
- press or partnership routes if needed,
- security or privacy routes if needed.

This section should avoid fake support-center language.

### `sections/form.json`

The contact form content.

Expected responsibilities:

- field labels,
- field placeholders,
- submission copy,
- short disclaimer.

## Content Rules

- Keep the page practical and direct.
- Do not use fake support links.
- Do not invent a help center or community forum unless one actually exists.
- Keep the contact paths relevant to the current stage of the company.

