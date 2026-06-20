import { GridTableDef, LogTableDef, TableDef } from '@shared/types'
import { INVENTORY_TABLES, SECTIONS } from '@shared/inventoryTables'
import { renderChartPng } from './charts'
import { imgTag, pageShell } from './htmlTemplate'

export interface MonthlyReportData {
  month: string // YYYY-MM
  departments: Array<{ id: number; name: string }>
  gridValues: Map<string, number> // key: `${tableId}|${departmentId}|${columnKey}`
  logEntries: Map<string, Array<Record<string, unknown>>> // key: tableId
}

function gridColumnGroups(def: GridTableDef): Array<{ group: string; cols: typeof def.columns }> {
  const groups: Array<{ group: string; cols: typeof def.columns }> = []
  for (const col of def.columns) {
    const groupName = col.group || ''
    let g = groups.find((x) => x.group === groupName)
    if (!g) {
      g = { group: groupName, cols: [] }
      groups.push(g)
    }
    g.cols.push(col)
  }
  return groups
}

function renderGridTable(def: GridTableDef, data: MonthlyReportData): string {
  const hasGroups = def.columns.some((c) => c.group)
  const groups = gridColumnGroups(def)

  const headerRows = hasGroups
    ? `<tr><th class="label" rowspan="2">Departement</th>${groups
        .map((g) => `<th colspan="${g.cols.length}">${g.group}</th>`)
        .join('')}</tr><tr>${groups.flatMap((g) => g.cols).map((c) => `<th>${c.label}</th>`).join('')}</tr>`
    : `<tr><th class="label">Departement</th>${def.columns.map((c) => `<th>${c.label}</th>`).join('')}</tr>`

  const bodyRows = data.departments
    .map((dept) => {
      const cells = def.columns
        .map((c) => {
          const v = data.gridValues.get(`${def.id}|${dept.id}|${c.key}`)
          return `<td>${v ?? 0}</td>`
        })
        .join('')
      return `<tr><td class="label">${dept.name}</td>${cells}</tr>`
    })
    .join('')

  return `<table><thead>${headerRows}</thead><tbody>${bodyRows}</tbody></table>`
}

function renderLogTable(def: LogTableDef, data: MonthlyReportData): string {
  const rows = data.logEntries.get(def.id) || []
  if (rows.length === 0) {
    return '<p class="footer-note">Aucune donnee saisie pour ce tableau ce mois-ci.</p>'
  }
  const header = `<tr>${def.fields.map((f) => `<th class="label">${f.label}</th>`).join('')}</tr>`
  const body = rows
    .map((row) => `<tr>${def.fields.map((f) => `<td class="label">${row[f.key] ?? ''}</td>`).join('')}</tr>`)
    .join('')
  return `<table><thead>${header}</thead><tbody>${body}</tbody></table>`
}

async function buildKeyCharts(data: MonthlyReportData): Promise<string[]> {
  const imgs: string[] = []

  const cheptel = INVENTORY_TABLES.find((t) => t.id === 'T1_1') as GridTableDef | undefined
  if (cheptel) {
    const mainCols = ['bovins', 'ovins', 'caprins', 'porcins']
    const datasets = mainCols.map((key) => ({
      label: cheptel.columns.find((c) => c.key === key)?.label || key,
      data: data.departments.map((d) => data.gridValues.get(`T1_1|${d.id}|${key}`) || 0)
    }))
    const png = await renderChartPng({
      type: 'bar',
      title: 'Effectifs du cheptel par departement',
      labels: data.departments.map((d) => d.name),
      datasets
    })
    imgs.push(imgTag(png.toString('base64'), 'Effectifs du cheptel'))
  }

  const abattages = INVENTORY_TABLES.find((t) => t.id === 'T2_1') as GridTableDef | undefined
  if (abattages) {
    const totals = abattages.columns.map((c) => ({
      label: c.label,
      total: data.departments.reduce((acc, d) => acc + (data.gridValues.get(`T2_1|${d.id}|${c.key}`) || 0), 0)
    }))
    const png = await renderChartPng({
      type: 'pie',
      title: 'Repartition des abattages controles du mois',
      labels: totals.map((t) => t.label),
      datasets: [{ label: 'Abattages', data: totals.map((t) => t.total) }]
    })
    imgs.push(imgTag(png.toString('base64'), 'Abattages controles'))
  }

  return imgs
}

export async function buildMonthlyReportHtml(data: MonthlyReportData): Promise<string> {
  const charts = await buildKeyCharts(data)
  const sectionsHtml = SECTIONS.map((section) => {
    const tables = INVENTORY_TABLES.filter((t) => t.section === section)
    const tablesHtml = tables
      .map((t) => {
        const inner = t.kind === 'grid' ? renderGridTable(t, data) : renderLogTable(t, data)
        const note = t.note ? `<p class="footer-note">${t.note}</p>` : ''
        return `<h3>${t.title}</h3>${note}${inner}`
      })
      .join('\n')
    return `<div class="section-title">${section}</div>${tablesHtml}`
  }).join('\n')

  const monthLabel = new Date(`${data.month}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const body = `
    <h1>Inventaire statistique mensuel - Region du Centre</h1>
    <p class="meta">Periode : ${monthLabel}</p>
    <h2>Synthese graphique</h2>
    ${charts.join('\n')}
    <h2>Tableaux detailles</h2>
    ${sectionsHtml}
  `
  return pageShell('Rapport mensuel', body)
}

export function allTableDefs(): TableDef[] {
  return INVENTORY_TABLES
}
