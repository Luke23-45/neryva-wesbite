export const spacing = {
  s1: '4px',
  s2: '8px',
  s3: '12px',
  s4: '16px',
  s5: '24px',
  s6: '32px',
  s7: '48px',
  s8: '64px',
  s9: '96px',
  s10: '128px',
  s11: '160px',
  s12: '200px',
  // Explicit gap-fillers for dense app surfaces (added during the Agent Studio
  // foundation pass). The s1–s12 positional scale is used by marketing/layout
  // files and is unchanged; these named keys fill the steps dense UI actually
  // needs. Prefer s-tokens when the value matches.
  px2: '2px',
  px3: '3px',
  px5: '5px',
  px6: '6px',
  px7: '7px',
  px9: '9px',
  px10: '10px',
  px14: '14px',
  px18: '18px',
  px20: '20px',
  px22: '22px',
} as const;

export type Spacing = typeof spacing;
