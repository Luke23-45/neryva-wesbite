import type { NavItem } from '@types';
import mainNavData from '@neryva_data/common/navbar/nav_data.json';
import footerData from '@neryva_data/common/navigation_footer.json';

export function getMainNav(): NavItem[] {
  return mainNavData;
}

export function getFooterNav() {
  return footerData;
}
