import { createSlice } from '@reduxjs/toolkit'

export const STORAGE_KEY = 'hayyrly:ui'

function loadInitialState() {
  const defaults = { lang: 'tk', theme: 'light' }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return {
      lang: saved?.lang === 'ru' ? 'ru' : defaults.lang,
      theme: saved?.theme === 'dark' ? 'dark' : defaults.theme,
    }
  } catch {
    return defaults
  }
}

const initialState = loadInitialState()

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLang(state, action) {
      state.lang = action.payload
    },
    setTheme(state, action) {
      state.theme = action.payload
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
  },
})

export const { setLang, setTheme, toggleTheme } = uiSlice.actions
export default uiSlice.reducer
