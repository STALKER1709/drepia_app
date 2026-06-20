import { DailyEntryRow } from '@shared/types'
import { renderChartPng } from './charts'
import { imgTag, pageShell } from './htmlTemplate'

export interface DailyReportData {
  date: string
  entries: Array<DailyEntryRow & { pointName: string }>
}

function table(rows: Array<DailyEntryRow & { pointName: string }>, category: string, title: string): string {
  const filtered = rows.filter((r) => r.category === category)
  if (filtered.length === 0) return ''
  return `
  <h3>${title}</h3>
  <table>
    <thead><tr>
      <th class="label">Espece</th><th class="label">Point de collecte</th><th>Nombre</th>
      <th>Quantite (T)</th><th>Ecart</th><th>Tendance</th><th>Prix</th>
    </tr></thead>
    <tbody>
      ${filtered
        .map(
          (r) => `<tr>
        <td class="label">${r.species}</td><td class="label">${r.pointName}</td>
        <td>${r.nombre}</td><td>${r.quantiteT ?? '-'}</td><td>${r.ecart ?? '-'}</td>
        <td>${r.tendance ?? '-'}</td><td>${r.prix ?? '-'}</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>`
}

export async function buildDailyReportHtml(data: DailyReportData): Promise<string> {
  const abattage = data.entries.filter((r) => r.category === 'abattage')
  const surPied = data.entries.filter((r) => r.category === 'sur_pied')

  const chartImgs: string[] = []
  if (abattage.length > 0) {
    const png = await renderChartPng({
      type: 'bar',
      title: 'Abattages controles du jour (par espece)',
      labels: abattage.map((r) => r.species),
      datasets: [{ label: 'Nombre abattu', data: abattage.map((r) => r.nombre) }]
    })
    chartImgs.push(imgTag(png.toString('base64'), 'Abattages controles'))
  }
  if (surPied.length > 0) {
    const png = await renderChartPng({
      type: 'bar',
      title: 'Animaux sur pied - arrivees du jour',
      labels: surPied.map((r) => `${r.species} (${r.pointName})`),
      datasets: [{ label: 'Effectif', data: surPied.map((r) => r.nombre) }]
    })
    chartImgs.push(imgTag(png.toString('base64'), 'Animaux sur pied'))
  }

  const body = `
    <h1>Veille de disponibilite des animaux et leurs produits</h1>
    <p class="meta">Donnees du ${new Date(data.date).toLocaleDateString('fr-FR')}</p>
    ${table(data.entries, 'abattage', 'Abattages controles')}
    ${table(data.entries, 'sur_pied', 'Animaux sur pied (arrivee)')}
    ${chartImgs.join('\n')}
    <p class="footer-note">NB : RAS = 0 (Zero).</p>
  `
  return pageShell('Rapport journalier', body)
}
