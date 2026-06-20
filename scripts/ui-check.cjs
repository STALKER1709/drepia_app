require('tsx/cjs')
const { app, BrowserWindow } = require('electron')
const path = require('path')

app.disableHardwareAcceleration()

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function shot(win, outPath) {
  const img = await win.webContents.capturePage()
  require('fs').writeFileSync(outPath, img.toPNG())
  console.log('SHOT', outPath)
}

function setInputValue(win, selector, value) {
  return win.webContents.executeJavaScript(`
    (function(){
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('input not found: ' + ${JSON.stringify(selector)});
      const proto = Object.getPrototypeOf(el);
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
    })();
  `)
}

function click(win, selector) {
  return win.webContents.executeJavaScript(`
    (function(){
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error('element not found: ' + ${JSON.stringify(selector)});
      el.click();
    })();
  `)
}

function clickNavByText(win, text) {
  return win.webContents.executeJavaScript(`
    (function(){
      const links = Array.from(document.querySelectorAll('.sidebar a'));
      const link = links.find(a => a.textContent.trim() === ${JSON.stringify(text)});
      if (!link) throw new Error('nav link not found: ' + ${JSON.stringify(text)});
      link.click();
    })();
  `)
}

function clickButtonByText(win, text) {
  return win.webContents.executeJavaScript(`
    (function(){
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.trim().startsWith(${JSON.stringify(text)}));
      if (!btn) throw new Error('button not found: ' + ${JSON.stringify(text)});
      btn.click();
    })();
  `)
}

app.whenReady().then(async () => {
  try {
    const { getDb } = require('../src/main/db')
    const { registerIpcHandlers } = require('../src/main/ipc')
    getDb()
    registerIpcHandlers()

    const win = new BrowserWindow({
      width: 1280,
      height: 860,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../out/preload/index.js'),
        sandbox: false,
        offscreen: true
      }
    })
    win.webContents.on('console-message', (_e, level, message) => {
      if (level >= 2) console.log('RENDERER_CONSOLE', level, message)
    })

    await win.loadFile(path.join(__dirname, '../out/renderer/index.html'))
    await sleep(600)
    await shot(win, '/tmp/ui-01-login.png')

    await setInputValue(win, '.login-card input', 'admin')
    await setInputValue(win, '.login-card input[type=password]', 'admin123')
    await click(win, '.login-card button[type=submit]')
    await sleep(700)
    await shot(win, '/tmp/ui-02-dashboard.png')

    await clickNavByText(win, 'Saisie journaliere')
    await sleep(500)
    await shot(win, '/tmp/ui-03-daily-entry.png')

    await clickNavByText(win, 'Saisie hebdomadaire')
    await sleep(500)
    await shot(win, '/tmp/ui-04-weekly-entry.png')

    await clickNavByText(win, 'Saisie mensuelle (Inventaire)')
    await sleep(500)
    await shot(win, '/tmp/ui-05-monthly-entry.png')

    await clickNavByText(win, 'Generation des rapports')
    await sleep(500)
    await shot(win, '/tmp/ui-06-reports.png')

    await clickButtonByText(win, 'Generer le rapport')
    await sleep(1500)
    await shot(win, '/tmp/ui-07-report-generated.png')

    await clickNavByText(win, 'Utilisateurs')
    await sleep(500)
    await shot(win, '/tmp/ui-08-users.png')

    console.log('UI_CHECK_SUCCESS')
    app.exit(0)
  } catch (e) {
    console.error('UI_CHECK_FAIL', e)
    app.exit(1)
  }
})
