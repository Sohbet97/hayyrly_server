import { useSelector } from 'react-redux'

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

// Reactive palette for use inside React components — unlike the mutable `TZ`
// singleton above, this subscribes to the redux theme so the component
// re-renders whenever it changes (instead of relying on an unrelated re-render
// to pick up the mutation).
export function useTZ() {
  const theme = useSelector(state => state.ui.theme)
  return theme === 'dark' ? TZ_DARK : TZ_LIGHT
}

// Status definitions
export const STATUS = {
  pending:   { ru: 'Ожидает',   tk: 'Garaşýar',  ck: 'muted',  bk: 'surface3' },
  created:   { ru: 'Ожидает',   tk: 'Garaşýar',  ck: 'muted',  bk: 'surface3' },
  assigned:  { ru: 'Назначен',  tk: 'Bellenen',   ck: 'violet', bk: 'violetSoft' },
  accepted:  { ru: 'Принят',    tk: 'Kabul',      ck: 'violet', bk: 'violetSoft' },
  arrived:   { ru: 'Прибыл',    tk: 'Geldi',      ck: 'amber',  bk: 'amberSoft' },
  on_way:    { ru: 'В пути',    tk: 'Ýolda',      ck: 'navy',   bk: 'navySoft' },
  completed: { ru: 'Завершён',  tk: 'Tamamlandy', ck: 'green',  bk: 'greenSoft' },
  cancelled:           { ru: 'Отменён', tk: 'Ýatyryldy', ck: 'red', bk: 'redSoft' },
  cancelled_by_user:   { ru: 'Отменён (клиент)',  tk: 'Ýatyryldy (müşderi)', ck: 'red', bk: 'redSoft' },
  cancelled_by_driver: { ru: 'Отменён (водитель)', tk: 'Ýatyryldy (sürüji)',  ck: 'red', bk: 'redSoft' },
  online:    { ru: 'Онлайн',    tk: 'Onlaýn',     ck: 'green',  bk: 'greenSoft' },
  busy:      { ru: 'Занят',     tk: 'Meşgul',     ck: 'amber',  bk: 'amberSoft' },
  offline:   { ru: 'Офлайн',    tk: 'Oflaýn',     ck: 'muted',  bk: 'surface3' },
  approved:  { ru: 'Одобрено',  tk: 'Tassyklandy', ck: 'green', bk: 'greenSoft' },
  rejected:  { ru: 'Отклонено', tk: 'Ret edildi', ck: 'red',   bk: 'redSoft' },
  paid:      { ru: 'Оплачено',  tk: 'Tölendi',    ck: 'green', bk: 'greenSoft' },
  refunded:  { ru: 'Возвращено', tk: 'Yzyna gaýtaryldy', ck: 'red', bk: 'redSoft' },
}

export function statusColors(s) {
  const def = STATUS[s] || STATUS.pending
  return { c: TZ[def.ck], bg: TZ[def.bk] }
}
