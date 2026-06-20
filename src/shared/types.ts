export type Role = 'admin' | 'agent' | 'superviseur' | 'lecture'

export interface User {
  id: number
  fullName: string
  username: string
  role: Role
  active: number
}

export interface Department {
  id: number
  name: string
}

export interface CollectionPoint {
  id: number
  name: string
  type: string // marche | abattoir | embarquement | debarquement
}

/** A column in a grid-type table. Nested headers are expressed via `group`. */
export interface GridColumn {
  key: string
  label: string
  group?: string
  unit?: string
}

/** Generic per-department grid table (covers most of the 28 monthly inventory tables). */
export interface GridTableDef {
  id: string
  section: string
  title: string
  note?: string
  rowScope: 'department' | 'point'
  columns: GridColumn[]
}

/** A field in a log-type table (free-form rows, not tied 1:1 to a department). */
export interface LogField {
  key: string
  label: string
  type: 'text' | 'number' | 'select'
  options?: string[]
}

/** Generic free-row log table (events, movements, disease outbreaks, etc.) */
export interface LogTableDef {
  id: string
  section: string
  title: string
  note?: string
  fields: LogField[]
}

export type TableDef = (GridTableDef & { kind: 'grid' }) | (LogTableDef & { kind: 'log' })

export interface DailyEntryRow {
  id?: number
  date: string
  species: string
  pointId: number
  category: 'abattage' | 'sur_pied' | 'autre'
  nombre: number
  quantiteT?: number | null
  ecart?: number | null
  tendance?: 'HAUSSE' | 'BAISSE' | 'STABLE' | null
  prix?: string | null
}

export interface WeeklyMovementRow {
  id?: number
  weekStart: string
  weekEnd: string
  marketName: string
  species: string
  direction: 'entree' | 'sortie'
  place: string // provenance ou destination
  effectif: number
  prixMoyen?: string | null
}

export interface ReportRecord {
  id: number
  type: 'journalier' | 'hebdomadaire' | 'mensuel'
  periodLabel: string
  createdAt: string
  createdBy: number
  pdfPath?: string | null
  docxPath?: string | null
}
