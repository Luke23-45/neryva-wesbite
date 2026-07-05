# Neryva Data Architecture

## Purpose

`src/neryva_data` is the new content source for the rebuilt Neryva website.

This directory replaces the legacy `src/data` content model. The goal is to keep the website data explicit, modular, and easy to review before implementation.

## Structure

The data is organized by page, with shared content isolated in `common`.

Recommended layout:

```text
src/neryva_data/
  common/
  home/
  research/
  solutions/
  resources/
  company/
```

## Conventions

- Keep each page directory focused on one page.
- Put reusable content in `common`.
- Keep content dense and specific.
- Prefer explicit section files over oversized mixed-purpose blobs.
- Use placeholder content only when it is clearly marked as placeholder and safe to replace later.
- Do not invent facts, claims, metrics, customers, or research results.

## Page Pattern

Each page directory should include:

- `README.md` for the page model and section map,
- `plan.md` for the page-specific content plan,
- `refactor_plan.md` for the implementation plan,
- a `page.json` or section JSON files when the page data is defined.

The exact JSON shape can vary by page, but the structure should always be documented before code changes begin.

