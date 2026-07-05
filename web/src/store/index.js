import { configureStore } from '@reduxjs/toolkit'
import uiReducer, { STORAGE_KEY } from './uiSlice.js'
import { applyTheme } from '../design/tokens.js'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
})

// Applied synchronously (not from a React effect) so the mutable TZ palette
// is already up to date by the time subscribed components re-render —
// otherwise the repaint lags one render behind the actual theme change.
applyTheme(store.getState().ui.theme)

store.subscribe(() => {
  const state = store.getState().ui
  applyTheme(state.theme)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
})
