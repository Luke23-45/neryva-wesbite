# Events Page Data

## Purpose

This directory defines the content model for the Events page.

The Events page should list talks, workshops, demos, or other company events only when they are real and scheduled.

## Recommended Data Architecture

Use a page manifest plus section-level JSON files.

Recommended layout:

```text
src/neryva_data/events/
  README.md
  plan.md
  refactor_plan.md
  page.json
  sections/
    hero.json
    events_list.json
```

## Content Rules

- Do not invent conferences, webinars, or release events.
- Empty is acceptable when there are no real events to publish.
- Keep the page clean and factual.

