import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth'
import { GridTableDef, LogTableDef, TableDef } from '@shared/types'

interface Department {
  id: number
  name: string
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export default function MonthlyEntry(): JSX.Element {
  const { user } = useAuth()
  const [month, setMonth] = useState(currentMonth())
  const [tables, setTables] = useState<TableDef[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [activeSection, setActiveSection] = useState<string>('')
  const [activeTableId, setActiveTableId] = useState<string>('')

  useEffect(() => {
    window.api.ref.inventoryTableDefs().then((defs) => {
      setTables(defs as TableDef[])
      const first = (defs as TableDef[])[0]
      if (first) {
        setActiveSection(first.section)
        setActiveTableId(first.id)
      }
    })
    window.api.ref.departments().then((d) => setDepartments(d as Department[]))
  }, [])

  const sections = useMemo(() => Array.from(new Set(tables.map((t) => t.section))), [tables])
  const tablesInSection = useMemo(() => tables.filter((t) => t.section === activeSection), [tables, activeSection])
  const activeTable = useMemo(() => tables.find((t) => t.id === activeTableId), [tables, activeTableId])

  return (
    <div>
      <h1 className="page-title">Saisie mensuelle - Inventaire statistique</h1>
      <p className="subtitle">Donnees par departement pour le rapport mensuel d&apos;inventaire.</p>

      <div className="card">
        <div className="field" style={{ maxWidth: 200 }}>
          <label>Mois</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
      </div>

      <div className="tabs">
        {sections.map((s) => (
          <button
            key={s}
            className={s === activeSection ? 'active' : ''}
            onClick={() => {
              setActiveSection(s)
              const first = tables.find((t) => t.section === s)
              if (first) setActiveTableId(first.id)
            }}
          >
            {s.replace('SECTION ', 'S')}
          </button>
        ))}
      </div>

      <div className="tabs">
        {tablesInSection.map((t) => (
          <button key={t.id} className={t.id === activeTableId ? 'active' : ''} onClick={() => setActiveTableId(t.id)}>
            {t.title.replace(/^Tableau\s?[\d.]*:?\s?/i, '')}
          </button>
        ))}
      </div>

      {activeTable && activeTable.kind === 'grid' && (
        <GridTableEditor def={activeTable as GridTableDef} month={month} departments={departments} />
      )}
      {activeTable && activeTable.kind === 'log' && (
        <LogTableEditor def={activeTable as LogTableDef} month={month} createdBy={user?.id || 0} />
      )}
    </div>
  )
}

function GridTableEditor({
  def,
  month,
  departments
}: {
  def: GridTableDef
  month: string
  departments: Department[]
}): JSX.Element {
  const [values, setValues] = useState<Record<string, number>>({})
  const isComputed = def.id === 'T2_1'

  useEffect(() => {
    const fetcher = isComputed ? window.api.inventory.t2_1Get(month) : window.api.inventory.gridGet(def.id, month)
    fetcher.then((rows) => {
      const map: Record<string, number> = {}
      for (const r of rows as Array<{ departmentId: number; columnKey: string; value: number }>) {
        map[`${r.departmentId}|${r.columnKey}`] = r.value
      }
      setValues(map)
    })
  }, [def.id, month, isComputed])

  const onChange = (deptId: number, colKey: string, raw: string): void => {
    const val = raw === '' ? 0 : Number(raw)
    setValues((v) => ({ ...v, [`${deptId}|${colKey}`]: val }))
  }

  const onBlurSave = (deptId: number, colKey: string): void => {
    const val = values[`${deptId}|${colKey}`] ?? 0
    window.api.inventory.gridSet(def.id, month, deptId, colKey, val)
  }

  return (
    <div className="card">
      <h3>{def.title}</h3>
      {def.note && <p className="subtitle">{def.note}</p>}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Departement</th>
              {def.columns.map((c) => (
                <th key={c.key}>{c.group ? `${c.group} - ${c.label}` : c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                {def.columns.map((c) => (
                  <td key={c.key}>
                    {isComputed ? (
                      values[`${d.id}|${c.key}`] ?? 0
                    ) : (
                      <input
                        type="number"
                        style={{ width: 90 }}
                        value={values[`${d.id}|${c.key}`] ?? ''}
                        onChange={(e) => onChange(d.id, c.key, e.target.value)}
                        onBlur={() => onBlurSave(d.id, c.key)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LogTableEditor({
  def,
  month,
  createdBy
}: {
  def: LogTableDef
  month: string
  createdBy: number
}): JSX.Element {
  const [rows, setRows] = useState<Array<Record<string, unknown> & { id: number }>>([])
  const emptyForm = (): Record<string, string> => Object.fromEntries(def.fields.map((f) => [f.key, '']))
  const [form, setForm] = useState<Record<string, string>>(emptyForm())

  const refresh = (): void => {
    window.api.inventory.logList(def.id, month).then((r) => setRows(r as never))
  }
  useEffect(refresh, [def.id, month])

  const addRow = async (): Promise<void> => {
    const data: Record<string, unknown> = {}
    for (const f of def.fields) {
      data[f.key] = f.type === 'number' ? Number(form[f.key] || 0) : form[f.key]
    }
    await window.api.inventory.logAdd(def.id, month, data, createdBy)
    setForm(emptyForm())
    refresh()
  }

  const removeRow = async (id: number): Promise<void> => {
    await window.api.inventory.logDelete(id)
    refresh()
  }

  return (
    <div className="card">
      <h3>{def.title}</h3>
      {def.note && <p className="subtitle">{def.note}</p>}
      <div className="toolbar">
        {def.fields.map((f) => (
          <div key={f.key} className="field" style={{ marginBottom: 0 }}>
            <label>{f.label}</label>
            <input
              type={f.type === 'number' ? 'number' : 'text'}
              value={form[f.key] ?? ''}
              onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            />
          </div>
        ))}
        <button onClick={addRow}>Ajouter</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            {def.fields.map((f) => (
              <th key={f.key}>{f.label}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {def.fields.map((f) => (
                <td key={f.key}>{String(r[f.key] ?? '')}</td>
              ))}
              <td>
                <button className="secondary" onClick={() => removeRow(r.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={def.fields.length + 1}>Aucune donnee saisie pour ce mois.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
