# Solutions Product Catalog Refactor Plan

## Goal

Create the canonical product catalog and product-detail data source for the Solutions area.

## Refactor Strategy

- keep `/solutions` as the overview page,
- use `solutions/products` for product catalog and product details,
- avoid a separate `/solution` route,
- let product pages expand only when there is a real offering to describe.

