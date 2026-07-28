import { DailyEntryRow } from '@shared/types'
import { renderChartPng } from './charts'
import { imgTag, pageShell } from './htmlTemplate'

export interface DailyReportData {
  date: string
  entries: Array<DailyEntryRow & { pointName: string }>
  /** Previous day's "animaux sur pied" grand total, for that section's ecart row. */
  previousSurPiedTotal?: number | null
}

type Row = DailyEntryRow & { pointName: string }

const round3 = (n: number): number => Number(n.toFixed(3))
const signed = (n: number): string => `${n > 0 ? '+' : ''}${round3(n)}`

/** Section I : Abattages controles (ecart en tonnes, prix du kg). */
function abattageTable(rows: Row[]): string {
  if (rows.length === 0) return ''
  const totalNombre = rows.reduce((a, r) => a + (r.nombre || 0), 0)
  const totalQte = rows.reduce((a, r) => a + (r.quantiteT || 0), 0)
  return `
  <h3>Abattages Controles</h3>
  <table>
    <thead><tr>
      <th class="label">Espece</th><th class="label">Point de collecte</th>
      <th>Nombre abattue (en tetes)</th><th>Quantite de viande (T)</th>
      <th>Ecart (T) sur la journee precedente</th><th>Tendance du jour</th><th>Prix du kg</th>
    </tr></thead>
    <tbody>
      ${rows
        .map(
          (r) => `<tr>
        <td class="label">${r.species}</td><td class="label">${r.pointName}</td>
        <td>${r.nombre}</td><td>${r.quantiteT ?? '-'}</td>
        <td>${r.ecart == null ? '-' : signed(r.ecart)}</td>
        <td>${r.tendance ?? '-'}</td><td class="price">${r.prix ?? '-'}</td>
      </tr>`
        )
        .join('')}
      <tr class="total-row">
        <td class="label" colspan="2">TOTAL du jour</td>
        <td>${totalNombre}</td><td>${round3(totalQte)}</td><td></td><td></td><td></td>
      </tr>
    </tbody>
  </table>`
}

/**
 * Section II : Animaux sur pied (arrivee). The official form lists embarkation
 * points, then closes with TOTAL / ecart / tendance summary rows.
 */
function surPiedTable(rows: Row[], previousTotal: number | null): string {
  if (rows.length === 0) return ''
  const total = rows.reduce((a, r) => a + (r.nombre || 0), 0)
  const ecart = previousTotal == null ? null : total - previousTotal
  const prix = rows.find((r) => r.prix)?.prix
  return `
  <h3>Animaux Sur Pied (arrivee)</h3>
  <table>
    <thead><tr>
      <th class="label">Point d'embarquement</th><th>Nombre de tetes</th><th>Prix Moyen</th>
    </tr></thead>
    <tbody>
      ${rows
        .map(
          (r, i) => `<tr>
        <td class="label">${r.place ?? r.pointName}</td><td>${r.nombre}</td>
        ${i === 0 ? `<td class="price" rowspan="${rows.length}">${prix ?? '-'}</td>` : ''}
      </tr>`
        )
        .join('')}
      <tr class="total-row"><td class="label">TOTAL du jour</td><td>${total}</td><td></td></tr>
      <tr class="total-row">
        <td class="label">Ecart sur la journee precedente</td>
        <td>${ecart == null ? '-' : signed(ecart)}</td><td></td>
      </tr>
      <tr class="total-row">
        <td class="label">Tendance du jour</td>
        <td>${ecart == null ? '-' : ecart > 0 ? 'HAUSSE' : ecart < 0 ? 'BAISSE' : 'STABLE'}</td><td></td>
      </tr>
    </tbody>
  </table>`
}

/** Sections III & IV : ecart exprime en tetes, prix moyen. */
function tetesTable(rows: Row[], title: string): string {
  if (rows.length === 0) return ''
  const totalNombre = rows.reduce((a, r) => a + (r.nombre || 0), 0)
  const totalEcart = rows.reduce((a, r) => a + (r.ecart || 0), 0)
  return `
  <h3>${title}</h3>
  <table>
    <thead><tr>
      <th class="label">Espece</th><th class="label">Point de collecte</th><th>Nombre</th>
      <th>Ecart (Tetes) sur la journee precedente</th><th>Tendance du jour</th><th>Prix Moyen</th>
    </tr></thead>
    <tbody>
      ${rows
        .map(
          (r) => `<tr>
        <td class="label">${r.species}</td><td class="label">${r.pointName}</td>
        <td>${r.nombre}</td><td>${r.ecart == null ? '-' : signed(r.ecart)}</td>
        <td>${r.tendance ?? '-'}</td><td class="price">${r.prix ?? '-'}</td>
      </tr>`
        )
        .join('')}
      <tr class="total-row">
        <td class="label" colspan="2">Total</td>
        <td>${totalNombre}</td><td>${signed(totalEcart)}</td>
        <td>${totalEcart > 0 ? 'HAUSSE' : totalEcart < 0 ? 'BAISSE' : 'STABLE'}</td><td></td>
      </tr>
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
    ${abattageTable(abattage)}
    ${surPiedTable(surPied, data.previousSurPiedTotal ?? null)}
    ${tetesTable(data.entries.filter((r) => r.category === 'porc_volaille'), 'Porcins et Poulet de chair')}
    ${tetesTable(data.entries.filter((r) => r.category === 'petit_ruminant'), 'Petits Ruminants')}
    ${chartImgs.join('\n')}
    <p class="footer-note">NB : RAS = 0 (Zero).</p>
  `
  return pageShell('Rapport journalier', body)
}
