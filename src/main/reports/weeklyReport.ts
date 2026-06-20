import { WeeklyMovementRow } from '@shared/types'
import { buildWeeklySections } from './weeklyText'
import { renderChartPng } from './charts'
import { imgTag, pageShell } from './htmlTemplate'

export interface WeeklyReportData {
  weekStart: string
  weekEnd: string
  rows: WeeklyMovementRow[]
}

function movementTable(section: { entreeRows: WeeklyMovementRow[]; sortieRows: WeeklyMovementRow[] }): string {
  const maxLen = Math.max(section.entreeRows.length, section.sortieRows.length, 1)
  const rowsHtml: string[] = []
  for (let i = 0; i < maxLen; i++) {
    const e = section.entreeRows[i]
    const s = section.sortieRows[i]
    rowsHtml.push(
      `<tr><td class="label">${e?.place ?? ''}</td><td>${e?.effectif ?? ''}</td>` +
        `<td class="label">${s?.place ?? ''}</td><td>${s?.effectif ?? ''}</td></tr>`
    )
  }
  return `<table>
    <thead><tr><th class="label">Provenance</th><th>Effectif</th><th class="label">Destination</th><th>Effectif</th></tr></thead>
    <tbody>${rowsHtml.join('')}</tbody>
  </table>`
}

export async function buildWeeklyReportHtml(data: WeeklyReportData): Promise<string> {
  const sections = buildWeeklySections(data.rows)
  const parts: string[] = []
  let counter = 1
  for (const sec of sections) {
    const png = await renderChartPng({
      type: 'bar',
      title: `${sec.species} - ${sec.marketName}`,
      labels: ['Entrees', 'Sorties'],
      datasets: [{ label: 'Effectif', data: [sec.totalEntree, sec.totalSortie] }]
    })
    parts.push(`
      <h3>${counter}- Mouvements des ${sec.species} au marche de ${sec.marketName}</h3>
      ${movementTable(sec)}
      <p class="analysis">${sec.analysis}</p>
      ${imgTag(png.toString('base64'), `${sec.species} ${sec.marketName}`)}
    `)
    counter++
  }

  const fmt = (d: string): string => new Date(d).toLocaleDateString('fr-FR')
  const body = `
    <h1>Situation hebdomadaire des activites dans les marches a betail,<br/>abattoirs et aires d'abattage de la Region du Centre</h1>
    <p class="meta">Semaine du ${fmt(data.weekStart)} au ${fmt(data.weekEnd)}</p>
    <p>J'ai l'honneur de vous tenir, par la presente, la synthese hebdomadaire des mouvements de betail
    au niveau des principaux marches controles de bovins, ovins, caprins, porcins et volailles pour le
    compte de la semaine du ${fmt(data.weekStart)} au ${fmt(data.weekEnd)}.</p>
    ${parts.join('\n')}
  `
  return pageShell('Rapport hebdomadaire', body)
}
