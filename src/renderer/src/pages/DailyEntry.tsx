import { useEffect, useState } from 'react'
import { useAuth } from '../auth'

interface Point {
  id: number
  name: string
  type: string
}

interface DailyRow {
  id: number
  date: string
  species: string
  pointId: number
  pointName: string
  category: string
  nombre: number
  quantiteT: number | null
  ecart: number | null
  tendance: string | null
  prix: string | null
  direction: string
  place: string | null
}

const TODAY = new Date().toISOString().slice(0, 10)

export default function DailyEntry(): JSX.Element {
  const { user } = useAuth()
  const [date, setDate] = useState(TODAY)
  const [points, setPoints] = useState<Point[]>([])
  const [rows, setRows] = useState<DailyRow[]>([])
  const [form, setForm] = useState({
    species: '',
    pointId: 0,
    category: 'abattage',
    nombre: '',
    quantiteT: '',
    ecart: '',
    tendance: 'STABLE',
    prix: '',
    direction: 'entree',
    place: ''
  })

  useEffect(() => {
    window.api.ref.points().then((p) => {
      setPoints(p as Point[])
      if ((p as Point[]).length > 0) setForm((f) => ({ ...f, pointId: (p as Point[])[0].id }))
    })
  }, [])

  useEffect(() => {
    window.api.daily.list(date).then((r) => setRows(r as DailyRow[]))
  }, [date])

  const refresh = (): void => {
    window.api.daily.list(date).then((r) => setRows(r as DailyRow[]))
  }

  const addRow = async (): Promise<void> => {
    if (!form.species || !form.pointId || !form.nombre) return
    await window.api.daily.create({
      date,
      species: form.species,
      pointId: form.pointId,
      category: form.category,
      nombre: Number(form.nombre),
      quantiteT: form.quantiteT ? Number(form.quantiteT) : null,
      ecart: form.ecart ? Number(form.ecart) : null,
      tendance: form.tendance,
      prix: form.prix || null,
      direction: form.direction,
      place: form.place || null,
      createdBy: user?.id
    })
    setForm((f) => ({ ...f, species: '', nombre: '', quantiteT: '', ecart: '', prix: '', place: '' }))
    refresh()
  }

  const removeRow = async (id: number): Promise<void> => {
    await window.api.daily.delete(id)
    refresh()
  }

  return (
    <div>
      <h1 className="page-title">Saisie journaliere</h1>
      <p className="subtitle">Veille de disponibilite des animaux et leurs produits.</p>

      <div className="card">
        <div className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Categorie</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="abattage">Abattage controle</option>
              <option value="sur_pied">Animal sur pied (arrivee)</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Espece</label>
            <input value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} placeholder="Bovine, Porcine..." />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Point de collecte</label>
            <select value={form.pointId} onChange={(e) => setForm({ ...form, pointId: Number(e.target.value) })}>
              {points.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nombre (tetes)</label>
            <input type="number" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Quantite (T)</label>
            <input type="number" value={form.quantiteT} onChange={(e) => setForm({ ...form, quantiteT: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Ecart / jour precedent</label>
            <input type="number" value={form.ecart} onChange={(e) => setForm({ ...form, ecart: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Tendance</label>
            <select value={form.tendance} onChange={(e) => setForm({ ...form, tendance: e.target.value })}>
              <option value="HAUSSE">Hausse</option>
              <option value="BAISSE">Baisse</option>
              <option value="STABLE">Stable</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Prix</label>
            <input value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} placeholder="2500 Fcfa/kg" />
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
            <input
              value={form.place}
              onChange={(e) => setForm({ ...form, place: e.target.value })}
              placeholder="Optionnel - utilise pour le rapport hebdomadaire"
            />
          </div>
          <button onClick={addRow}>Ajouter</button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Categorie</th>
            <th>Espece</th>
            <th>Point</th>
            <th>Nombre</th>
            <th>Quantite (T)</th>
            <th>Ecart</th>
            <th>Tendance</th>
            <th>Prix</th>
            <th>Sens</th>
            <th>Lieu</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.category}</td>
              <td>{r.species}</td>
              <td>{r.pointName}</td>
              <td>{r.nombre}</td>
              <td>{r.quantiteT ?? '-'}</td>
              <td>{r.ecart ?? '-'}</td>
              <td>{r.tendance ?? '-'}</td>
              <td>{r.prix ?? '-'}</td>
              <td>{r.direction === 'sortie' ? 'Sortie' : 'Entree'}</td>
              <td>{r.place ?? '-'}</td>
              <td>
                <button className="secondary" onClick={() => removeRow(r.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={11}>Aucune donnee saisie pour cette date.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
