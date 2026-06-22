import Database from 'better-sqlite3'

/**
 * Maps free-text "espece" values entered in the daily slaughter ("abattage")
 * entries to the fixed column keys of the monthly Tableau 2.1, so the
 * monthly "Abattages controles" table can be derived from daily data instead
 * of entered a second time.
 */
const SPECIES_COLUMN_MAP: Array<{ test: RegExp; key: string }> = [
  { test: /^bovin/i, key: 'bovins_abattus' },
  { test: /^ovin/i, key: 'ovins_abattus' },
  { test: /^caprin/i, key: 'caprins_abattus' },
  { test: /^porcin/i, key: 'porcins_abattus' },
  { test: /^(volaill|poulet|poule)/i, key: 'volaille_abattue' }
]

export function speciesToAbattageColumn(species: string): string | null {
  const s = species.trim()
  const match = SPECIES_COLUMN_MAP.find((m) => m.test.test(s))
  return match ? match.key : null
}

export const ABATTAGE_COLUMN_LABELS: Record<string, string> = {
  bovins_abattus: 'Bovins',
  ovins_abattus: 'Ovins',
  caprins_abattus: 'Caprins',
  porcins_abattus: 'Porcins',
  volaille_abattue: 'Volaille',
  autres: 'Autres'
}

export interface AbattageGridRow {
  departmentId: number
  columnKey: string
  value: number
}

/**
 * Sums daily "abattage" entries for the given month, per department
 * (via the collection point's departmentId) and per espece column.
 * Backs Tableau 2.1 in both the monthly report and the read-only
 * Saisie mensuelle view.
 */
export function computeAbattageGrid(db: Database.Database, month: string): AbattageGridRow[] {
  const rows = db
    .prepare(
      `SELECT cp.departmentId AS departmentId, de.species AS species, SUM(de.nombre) AS total
       FROM daily_entries de
       JOIN collection_points cp ON cp.id = de.pointId
       WHERE de.category = 'abattage' AND substr(de.date, 1, 7) = ? AND cp.departmentId IS NOT NULL
       GROUP BY cp.departmentId, de.species`
    )
    .all(month) as Array<{ departmentId: number; species: string; total: number }>

  const totals = new Map<string, number>()
  for (const r of rows) {
    const columnKey = speciesToAbattageColumn(r.species)
    if (!columnKey) continue
    const key = `${r.departmentId}|${columnKey}`
    totals.set(key, (totals.get(key) || 0) + r.total)
  }

  return Array.from(totals.entries()).map(([key, value]) => {
    const [departmentId, columnKey] = key.split('|')
    return { departmentId: Number(departmentId), columnKey, value }
  })
}
