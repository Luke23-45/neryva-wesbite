# Solutions Product Catalog

## Purpose

This directory defines the product-level content for the Solutions area.

The Solutions index page explains the overall commercial direction. This directory holds the product catalog and the content for each individual solution page.

## Recommended Data Architecture

Use a catalog file plus one JSON file per product.

Recommended layout:

```text
src/neryva_data/solutions/products/
  README.md
  plan.md
  refactor_plan.md
  catalog.json
  enterprise-ai-assistant.json
  knowledge-search-system.json
  ai-efficiency-deployment.json
  domain-ai-solutions.json
```

## Content Rules

- Keep product names concrete and readable.
- Do not invent shipped customers or false launch status.
- Use `status` to distinguish core offerings from emerging ones.
- Keep the catalog aligned with the Solutions overview page.

