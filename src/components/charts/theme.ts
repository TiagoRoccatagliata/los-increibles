// Paleta categórica validada (modo dark, superficie #0f172a) — orden fijo, nunca ciclada.
export const SERIES = [
  '#3987e5', // blue
  '#008300', // green
  '#d55181', // magenta
  '#c98500', // yellow
  '#199e70', // aqua
  '#d95926', // orange
  '#9085e9', // violet
  '#e66767', // red
] as const

// Par divergente (polaridad +/-)
export const DIVERGING = { pos: '#3987e5', neg: '#e66767' } as const

export const INK = {
  primary: '#ffffff',
  secondary: '#c3c2b7',
  muted: '#898781',
  grid: '#2c2c2a',
  axis: '#383835',
  surface: '#0f172a', // slate-900: superficie de las cards
} as const
