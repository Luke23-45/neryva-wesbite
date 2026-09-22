import 'styled-components';
import type { Theme } from './theme';

declare module 'styled-components' {
  // Module augmentation requires the interface form: a type alias cannot
  // declaration-merge with styled-components' own DefaultTheme, so
  // `export type DefaultTheme = Theme` silently leaves the theme empty
  // (TS2339 on every theme.app / typography / transitions / media access).
  // This empty-extension interface is the documented styled-components
  // augmentation pattern.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme {}
}
