import fs from 'fs'
import { getOffscreenWindow } from './offscreenWindow'

export async function htmlToPdfFile(html: string, outPath: string): Promise<void> {
  const win = getOffscreenWindow()
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  const buffer = await win.webContents.printToPDF({
    printBackground: true,
    landscape: false,
    pageSize: 'A4',
    margins: { top: 0, bottom: 0, left: 0, right: 0 }
  })
  fs.writeFileSync(outPath, buffer)
}
