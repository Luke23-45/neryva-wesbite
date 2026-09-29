export const zIndices = {
  base: 0,
  header: 100,
  mobileNav: 200,
  overlay: 300,
  modal: 400,
  popover: 450, // dropdowns, menus, command palette
  tooltip: 500,
  drawer: 600,  // drawers / sheets
  toast: 700,   // toasts — always topmost
} as const;

export type ZIndices = typeof zIndices;
