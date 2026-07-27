import { create } from 'zustand';

export type HeaderTheme = 'light' | 'dark';

interface UiState {
  isMobileNavOpen: boolean;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  headerTheme: HeaderTheme;
  setHeaderTheme: (theme: HeaderTheme) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobileNavOpen: false,
  toggleMobileNav: () => set((state) => ({ isMobileNavOpen: !state.isMobileNavOpen })),
  closeMobileNav: () => set({ isMobileNavOpen: false }),
  headerTheme: 'light',
  setHeaderTheme: (theme) => set({ headerTheme: theme }),
}));
