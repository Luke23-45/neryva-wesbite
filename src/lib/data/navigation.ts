import type { NavItem } from '@types';
import mainNavData from '@data/navigation/main.json';
import footerData from '@data/navigation/footer.json';

export function getMainNav(): NavItem[] {
  return mainNavData;
}

export function getFooterNav() {
  return footerData;
}
