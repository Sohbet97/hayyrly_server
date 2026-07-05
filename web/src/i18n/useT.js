import { useSelector } from 'react-redux'
import { translate } from './strings.js'

export function useT() {
  const lang = useSelector(state => state.ui.lang)
  return (path) => translate(lang, path)
}
