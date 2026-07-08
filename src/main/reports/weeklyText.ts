import { WeeklyMovementRow } from '@shared/types'

interface MarketSpeciesGroup {
  marketName: string
  species: string
  weekStart: string
  weekEnd: string
  entrees: WeeklyMovementRow[]
  sorties: WeeklyMovementRow[]
}

function groupRows(rows: WeeklyMovementRow[]): MarketSpeciesGroup[] {
  const map = new Map<string, MarketSpeciesGroup>()
  for (const r of rows) {
    const key = `${r.marketName}__${r.species}`
    if (!map.has(key)) {
      map.set(key, {
        marketName: r.marketName,
        species: r.species,
        weekStart: r.weekStart,
        weekEnd: r.weekEnd,
        entrees: [],
        sorties: []
      })
    }
    const g = map.get(key)!
    if (r.direction === 'entree') g.entrees.push(r)
    else g.sorties.push(r)
  }
  return Array.from(map.values())
}

function sum(rows: WeeklyMovementRow[]): number {
  return rows.reduce((acc, r) => acc + (r.effectif || 0), 0)
}

function uniquePlaces(rows: WeeklyMovementRow[]): string[] {
  return Array.from(new Set(rows.map((r) => r.place))).filter(Boolean)
}

function fmtDate(d: string): string {
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString('fr-FR')
}

/**
 * Generates the analysis paragraph for one market/species group, following
 * the phrasing pattern observed in the official weekly "AU" reports.
 */
export function generateAnalysisParagraph(group: MarketSpeciesGroup): string {
  const totalEntree = sum(group.entrees)
  const totalSortie = sum(group.sorties)
  const provenances = uniquePlaces(group.entrees)
  const destinations = uniquePlaces(group.sorties)
  const period = `${fmtDate(group.weekStart)} au ${fmtDate(group.weekEnd)}`

  const entreeTxt =
    provenances.length > 0
      ? ` en provenance de ${provenances.join(', ')}`
      : ''
  const sortieTxt =
    destinations.length > 0
      ? ` vers ${destinations.join(', ')}`
      : ''

  return (
    `Analyse : Au cours de la semaine du ${period}, ${totalEntree} ${group.species} ` +
    `ont été enregistrés à l'entrée du marché de ${group.marketName}${entreeTxt}. ` +
    `Pendant la même période, ${totalSortie} têtes de ${group.species} sont sorties ` +
    `du marché de ${group.marketName}${sortieTxt}.`
  )
}

export interface WeeklyMarketSection {
  marketName: string
  species: string
  totalEntree: number
  totalSortie: number
  entreeRows: WeeklyMovementRow[]
  sortieRows: WeeklyMovementRow[]
  prixMoyen: string | null
  analysis: string
}

function firstPrice(rows: WeeklyMovementRow[]): string | null {
  const withPrice = rows.find((r) => r.prixMoyen && r.prixMoyen.trim() !== '')
  return withPrice?.prixMoyen ?? null
}

export function buildWeeklySections(rows: WeeklyMovementRow[]): WeeklyMarketSection[] {
  return groupRows(rows).map((g) => ({
    marketName: g.marketName,
    species: g.species,
    totalEntree: sum(g.entrees),
    totalSortie: sum(g.sorties),
    entreeRows: g.entrees,
    sortieRows: g.sorties,
    prixMoyen: firstPrice([...g.entrees, ...g.sorties]),
    analysis: generateAnalysisParagraph(g)
  }))
}
