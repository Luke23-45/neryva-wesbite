# Company Page Data

## Purpose

This directory defines the content model for the Company page.

The Company page is the identity and trust surface of the site. It should explain what Neryva is, why it exists, what values guide the work, who is involved, and how people can get in touch.

## Recommended Data Architecture

Use a page manifest plus section-level JSON files.

Recommended layout:

```text
src/neryva_data/company/
  README.md
  plan.md
  refactor_plan.md
  page.json
  sections/
    hero.json
    mission.json
    values.json
    team.json
    contact_cta.json
```

## Section Model

### `page.json`

Page-level metadata and section order.

### `sections/hero.json`

The first-view identity block.

Expected responsibilities:

- company label,
- headline,
- short description,
- visual note.

### `sections/mission.json`

The company mission and operating philosophy.

Expected responsibilities:

- the reason Neryva exists,
- the technical and commercial direction,
- the principles that guide the work.

### `sections/values.json`

The company values.

Expected responsibilities:

- short value statements,
- honest scope,
- clarity about how the company works.

### `sections/team.json`

The human layer.

Expected responsibilities:

- current team state,
- roles or functions when names are not ready,
- honest language about what is and is not finalized.

### `sections/contact_cta.json`

The closing action.

Expected responsibilities:

- contact route,
- partnership or career note if needed,
- clear next step.

## Content Rules

- Keep the language factual and restrained.
- Do not invent named team members unless they are real and approved.
- Do not present incomplete staffing as full organizational depth.
- Keep the page aligned with the foundation and the rest of the site.
- Avoid lab-only wording unless it is part of an internal or historical label.

## Page Role In The Site

The Company page should do three things well:

- explain the identity of Neryva,
- build trust through clear principles and team transparency,
- provide a direct route to contact or partnership.

