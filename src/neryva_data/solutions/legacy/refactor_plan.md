# Solutions Page Refactor Plan

## Goal

Build the Solutions page around the new foundation and the new data architecture so the commercial story is clear and distinct from Research.

## Refactor Strategy

The Solutions page should present Neryva as a research-led enterprise AI company with concrete offerings.

Primary changes:

- move the page content away from the legacy content model,
- make the commercial surface explicit,
- avoid any research-page language leaking into the page,
- keep the offerings concrete but honest,
- keep the page focused on enterprise value.

The product catalog should be introduced as a separate subdirectory so the site can support both the overview and product detail pages without creating a separate singular `/solution` route.

## Implementation Order

1. Create the new `src/neryva_data/solutions` structure.
2. Define the page manifest and section files.
3. Write the hero copy to establish the commercial positioning.
4. Define the offerings as clear solution categories.
5. Add a delivery model section so customers understand how work starts and progresses.
6. Add a proof points section that explains the research-to-product relationship without inventing evidence.
7. Finish with a direct contact CTA for enterprise inquiries.
8. Add `solutions/products` as the canonical product catalog and product-detail source.

## Design Notes

- Keep the page clean and serious.
- Avoid a landing-page tone that feels inflated or vague.
- Make the offerings easy to scan.
- Keep the content focused on what Neryva can build now or build credibly next.

## Risk Areas

- It is easy to overclaim product readiness on a commercial page.
- It is easy to make the page sound like generic consulting if the offerings are too broad.
- The page should not duplicate the Research page.

## Success Criteria

The Solutions page refactor is complete when:

- the page clearly shows what Neryva sells,
- the offerings are concrete and honest,
- the delivery model is understandable,
- the page stays distinct from Research,
- the page uses the new `neryva_data` structure.
