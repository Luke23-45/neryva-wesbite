export const colors = {
  // Core surfaces
  paper: '#F7F5EF',
  surface: '#FFFFFF',
  surfaceAlt: '#ECEFF1',

  // Text
  ink: '#111418',
  inkSoft: '#3D454D',
  muted: '#6F7882',

  // Borders
  line: '#D8DEE3',
  lineStrong: '#AEB8C2',

  // Emphasis
  graphite: '#171B21',

  // Accents
  blue: '#2458D3',
  blueHover: '#163C96',
  teal: '#0B7F79',
  amber: '#D99100',
  red: '#B42318',
  green: '#1F7A4D',

  // Focus
  focusRing: 'rgba(36, 88, 211, 0.32)',

  // Dark section palette
  dark: {
    bg: '#171B21',
    text: '#F7F5EF',
    muted: '#BCC7D1',
    line: 'rgba(247, 245, 239, 0.16)',
    accent: '#7DB7FF',
  },

  // Program accent markers
  program: {
    llm: '#2458D3',
    robotics: '#0B7F79',
    clinical: '#1F7A4D',
    energy: '#D99100',
  },
} as const;

export type Colors = typeof colors;
