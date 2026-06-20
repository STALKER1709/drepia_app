import fs from 'fs'
import path from 'path'
import { getOffscreenWindow } from './offscreenWindow'

export interface SimpleChartInput {
  type: 'bar' | 'line' | 'pie'
  title: string
  labels: string[]
  datasets: Array<{ label: string; data: number[]; color?: string }>
}

const PALETTE = ['#1f6f3d', '#c0392b', '#2980b9', '#f39c12', '#8e44ad', '#16a085', '#7f8c8d']
const WIDTH = 760
const HEIGHT = 380

let chartJsSource: string | null = null
function loadChartJs(): string {
  if (chartJsSource) return chartJsSource
  // chart.js's package.json "exports" map doesn't expose "./dist/chart.umd.js"
  // directly, so resolve the package's main entry (which IS exported) and
  // derive the UMD bundle path from its directory instead.
  const mainEntry = require.resolve('chart.js')
  const distPath = path.join(path.dirname(mainEntry), 'chart.umd.js')
  chartJsSource = fs.readFileSync(distPath, 'utf-8')
  return chartJsSource
}

/**
 * Renders a Chart.js chart to a PNG buffer using a hidden Electron BrowserWindow
 * (Chromium's own canvas), avoiding any native node-canvas dependency.
 */
export async function renderChartPng(input: SimpleChartInput): Promise<Buffer> {
  const config = {
    type: input.type,
    data: {
      labels: input.labels,
      datasets: input.datasets.map((ds, i) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: input.type === 'pie' ? PALETTE : ds.color || PALETTE[i % PALETTE.length],
        borderColor: ds.color || PALETTE[i % PALETTE.length],
        borderWidth: 1
      }))
    },
    options: {
      animation: false,
      responsive: false,
      plugins: {
        title: { display: true, text: input.title, font: { size: 16 } },
        legend: { display: input.datasets.length > 1 || input.type === 'pie' }
      },
      scales: input.type === 'pie' ? undefined : { y: { beginAtZero: true } }
    }
  }

  const html = `<!doctype html>
<html><head><meta charset="utf-8" /></head>
<body style="margin:0;background:#fff;">
<canvas id="c" width="${WIDTH}" height="${HEIGHT}"></canvas>
<script>${loadChartJs()}</script>
<script>
  const ctx = document.getElementById('c').getContext('2d');
  new Chart(ctx, ${JSON.stringify(config)});
</script>
</body></html>`

  const win = getOffscreenWindow()
  win.setContentSize(WIDTH, HEIGHT)
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
  // Let Chart.js finish its render pass.
  await new Promise((resolve) => setTimeout(resolve, 250))
  const image = await win.webContents.capturePage({ x: 0, y: 0, width: WIDTH, height: HEIGHT })
  return image.toPNG()
}
