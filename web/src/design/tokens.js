export const TZ_LIGHT = {
  navy:       '#0E2A4D',
  navyDk:     '#091E38',
  navyMid:    '#1B3A66',
  navySoft:   '#E8EEF7',
  navyTint:   '#F4F7FB',
  orange:     '#F26B1F',
  orangeSoft: '#FFF1E6',
  orangeDk:   '#C8500F',
  green:      '#1B8F5A',
  greenSoft:  '#E5F4ED',
  amber:      '#C98612',
  amberSoft:  '#FCF1DA',
  red:        '#C24536',
  redSoft:    '#FBE8E4',
  violet:     '#5B4FC9',
  violetSoft: '#ECEAFB',
  ink:        '#0C1828',
  text:       '#1B2A3D',
  body:       '#3D4D63',
  muted:      '#6A7689',
  faint:      '#9BA6B6',
  line:       '#E3E7EE',
  lineSoft:   '#EEF1F6',
  surface:    '#FFFFFF',
  surface2:   '#F7F8FB',
  surface3:   '#F1F4F9',
  sans:       '"Manrope", -apple-system, system-ui, sans-serif',
  mono:       '"JetBrains Mono", ui-monospace, monospace',
}

export const TZ_DARK = {
  navy:       '#3F7BE6',
  navyDk:     '#2C5FC2',
  navyMid:    '#5B92EC',
  navySoft:   '#1C3358',
  navyTint:   '#172742',
  orange:     '#F7822F',
  orangeSoft: '#3A2614',
  orangeDk:   '#FFA463',
  green:      '#3FBE7C',
  greenSoft:  '#14301F',
  amber:      '#E2A53A',
  amberSoft:  '#33280F',
  red:        '#E76A59',
  redSoft:    '#39201B',
  violet:     '#8B7DF0',
  violetSoft: '#221F3D',
  ink:        '#EAF1FB',
  text:       '#D6E1F0',
  body:       '#A7B7CE',
  muted:      '#7C8DA6',
  faint:      '#586A85',
  line:       '#283A55',
  lineSoft:   '#1E2C44',
  surface:    '#16243D',
  surface2:   '#0E1A2E',
  surface3:   '#1E2F4A',
  sans:       '"Manrope", -apple-system, system-ui, sans-serif',
  mono:       '"JetBrains Mono", ui-monospace, monospace',
}

export const TZ = { ...TZ_LIGHT }

export function applyTheme(mode) {
  const src = mode === 'dark' ? TZ_DARK : TZ_LIGHT
  Object.assign(TZ, src)
  document.body.style.background = mode === 'dark' ? '#0A1424' : '#F0EEE9'
}

// Status definitions
export const STATUS = {
  pending:   { ru: 'Garaşýar',  tk: 'Garaşýar',  ck: 'muted',  bk: 'surface3' },
  created:   { ru: 'Garaşýar',  tk: 'Garaşýar',  ck: 'muted',  bk: 'surface3' },
  assigned:  { ru: 'Bellenen',  tk: 'Bellenen',   ck: 'violet', bk: 'violetSoft' },
  accepted:  { ru: 'Kabul',     tk: 'Kabul',      ck: 'violet', bk: 'violetSoft' },
  arrived:   { ru: 'Geldi',     tk: 'Geldi',      ck: 'amber',  bk: 'amberSoft' },
  on_way:    { ru: 'Ýolda',     tk: 'Ýolda',      ck: 'navy',   bk: 'navySoft' },
  completed: { ru: 'Tamamlandy',tk: 'Tamamlandy', ck: 'green',  bk: 'greenSoft' },
  cancelled:           { ru: 'Ýatyryldy', tk: 'Ýatyryldy', ck: 'red', bk: 'redSoft' },
  cancelled_by_user:   { ru: 'Ýatyryldy (müşderi)', tk: 'Ýatyryldy (müşderi)', ck: 'red', bk: 'redSoft' },
  cancelled_by_driver: { ru: 'Ýatyryldy (sürüji)',  tk: 'Ýatyryldy (sürüji)',  ck: 'red', bk: 'redSoft' },
  online:    { ru: 'Onlaýn',    tk: 'Onlaýn',     ck: 'green',  bk: 'greenSoft' },
  busy:      { ru: 'Meşgul',    tk: 'Meşgul',     ck: 'amber',  bk: 'amberSoft' },
  offline:   { ru: 'Oflaýn',    tk: 'Oflaýn',     ck: 'muted',  bk: 'surface3' },
}

export function statusColors(s) {
  const def = STATUS[s] || STATUS.pending
  return { c: TZ[def.ck], bg: TZ[def.bk] }
}
