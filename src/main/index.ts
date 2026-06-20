import { app, BrowserWindow, shell } from 'electron'
import path from 'path'
import { is } from './utils/env'
import { getDb } from './db'
import { registerIpcHandlers } from './ipc'

// Report generation relies on offscreen BrowserWindows (chart rendering, PDF
// export). GPU acceleration is unnecessary for this workload and its absence
// on some machines/headless setups can make offscreen rendering unreliable,
// so software rendering is used unconditionally for consistency.
app.disableHardwareAcceleration()

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  win.once('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  getDb()
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
