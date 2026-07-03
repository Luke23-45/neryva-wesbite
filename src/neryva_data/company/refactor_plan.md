# Company Page Refactor Plan

## Goal

Rebuild the Company page around the new foundation and the new data architecture while removing the old lab-centric assumptions.

## Refactor Strategy

The Company page should be an identity and trust page, not a generic About page and not a recruitment page.

Primary changes:

- move the page off the legacy `src/data` model,
- update the language from lab-centric to company-centric,
- keep mission, values, team, and contact in one place,
- avoid fake staffing claims,
- keep the page concise and credible.

## Implementation Order

1. Create the new `src/neryva_data/company` structure.
2. Define the page manifest and section files.
3. Write the hero and mission copy to match the foundation.
4. Define the values with a restrained, factual tone.
5. Document the team state honestly without inventing people.
6. Finish with a clear contact CTA.

## Design Notes

- Keep the page simple and premium.
- Use clear hierarchy instead of decorative clutter.
- Do not make the page feel like a hiring brochure.
- Do not make it sound like a fake leadership page.

## Risk Areas

- The legacy content uses lab language that no longer matches the foundation.
- Team content is easy to overclaim if details are not finalized.
- The page should not duplicate the Solutions or Research pages.

## Success Criteria

The Company page refactor is complete when:

- the page reflects the research-led enterprise identity,
- the mission and values are aligned with the foundation,
- the team section stays honest,
- the page uses the new `neryva_data` structure.

