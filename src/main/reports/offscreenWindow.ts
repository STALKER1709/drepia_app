import { BrowserWindow } from 'electron'

// Report generation (chart rendering + PDF export) loads HTML into a hidden
// BrowserWindow. In some environments, destroying the last open BrowserWindow
// and immediately creating a new offscreen one causes the next load to fail
// with ERR_FAILED, so a single instance is reused for the app's lifetime
// instead of creating/destroying one per render.
let win: BrowserWindow | null = null

export function getOffscreenWindow(): BrowserWindow {
  if (win && !win.isDestroyed()) return win
  win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } })
  return win
}
