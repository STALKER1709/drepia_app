import { useEffect, useState } from 'react'
import { useAuth } from '../auth'

interface Point {
  id: number
  name: string
  type: string
}

interface WeeklyRow {
  id: number
  weekStart: string
  weekEnd: string
  pointId: number
  marketName: string
  species: string
  direction: string
  place: string
  effectif: number
  prixMoyen: string | null
}

function startOfWeek(): string {
  const d = new Date()
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().slice(0, 10)
}
function endOfWeek(start: string): string {
  const d = new Date(start)
  d.setDate(d.getDate() + 6)
  return d.toISOString().slice(0, 10)
}

const SPECIES = ['Bovins', 'Ovins', 'Caprins', 'Porcins', 'Volaille']

export default function WeeklyEntry(): JSX.Element {
  const { user } = useAuth()
  const [weekStart, setWeekStart] = useState(startOfWeek())
  const [weekEnd, setWeekEnd] = useState(endOfWeek(startOfWeek()))
  const [points, setPoints] = useState<Point[]>([])
  const [rows, setRows] = useState<WeeklyRow[]>([])
  const [form, setForm] = useState({
    pointId: 0,
    species: 'Bovins',
    direction: 'entree',
    place: '',
    effectif: '',
    prixMoyen: ''
  })

  useEffect(() => {
    window.api.ref.points().then((p) => {
      setPoints(p as Point[])
      if ((p as Point[]).length > 0) setForm((f) => ({ ...f, pointId: (p as Point[])[0].id }))
    })
  }, [])

  const refresh = (): void => {
    window.api.weekly.list(weekStart, weekEnd).then((r) => setRows(r as WeeklyRow[]))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, weekEnd])

  const addRow = async (): Promise<void> => {
    if (!form.pointId || !form.place || !form.effectif) return
    await window.api.weekly.create({
      weekStart,
      weekEnd,
      pointId: form.pointId,
      species: form.species,
      direction: form.direction,
      place: form.place,
      effectif: Number(form.effectif),
      prixMoyen: form.prixMoyen || null,
      createdBy: user?.id
    })
    setForm((f) => ({ ...f, place: '', effectif: '', prixMoyen: '' }))
    refresh()
  }

  const removeRow = async (id: number): Promise<void> => {
    await window.api.weekly.delete(id)
    refresh()
  }

  return (
    <div>
      <h1 className="page-title">Saisie hebdomadaire</h1>
      <p className="subtitle">
        Situation hebdomadaire des mouvements de betail (entrees / sorties) dans les marches a betail et abattoirs.
      </p>

      <div className="card">
        <div className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Debut de semaine</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => {
                setWeekStart(e.target.value)
                setWeekEnd(endOfWeek(e.target.value))
              }}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Fin de semaine</label>
            <input type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} />
          </div>
        </div>

        <div className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Marche / point</label>
            <select value={form.pointId} onChange={(e) => setForm({ ...form, pointId: Number(e.target.value) })}>
              {points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Espece</label>
            <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
              {SPECIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Sens</label>
            <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
              <option value="entree">Entree</option>
              <option value="sortie">Sortie</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{form.direction === 'entree' ? 'Provenance' : 'Destination'}</label>
            <input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Adamaoua, Kye-Osi..." />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Effectif (tetes)</label>
            <input type="number" value={form.effectif} onChange={(e) => setForm({ ...form, effectif: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Prix moyen</label>
            <input value={form.prixMoyen} onChange={(e) => setForm({ ...form, prixMoyen: e.target.value })} placeholder="400 000 Fcfa/tete" />
          </div>
          <button onClick={addRow}>Ajouter</button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Marche</th>
            <th>Espece</th>
            <th>Sens</th>
            <th>Provenance / Destination</th>
            <th>Effectif</th>
            <th>Prix moyen</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.marketName}</td>
              <td>{r.species}</td>
              <td>{r.direction === 'sortie' ? 'Sortie' : 'Entree'}</td>
              <td>{r.place}</td>
              <td>{r.effectif}</td>
              <td>{r.prixMoyen ?? '-'}</td>
              <td>
                <button className="secondary" onClick={() => removeRow(r.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7}>Aucun mouvement saisi pour cette semaine.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
