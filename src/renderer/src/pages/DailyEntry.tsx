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

type Category = 'abattage' | 'sur_pied' | 'porc_volaille' | 'petit_ruminant'

const SECTIONS: Array<{ key: Category; label: string; fields: Record<string, boolean>; species: string[] }> = [
  {
    key: 'abattage',
    label: 'Abattages controles',
    fields: { quantiteT: true, ecart: true, tendance: true, prix: true, place: false },
    species: ['Bovine', 'Ovine', 'Caprine', 'Porcine', 'Volaille']
  },
  {
    key: 'sur_pied',
    label: 'Animaux sur pied (arrivee)',
    fields: { quantiteT: false, ecart: true, tendance: true, prix: true, place: true },
    species: ['Bovins', 'Ovins', 'Caprins', 'Porcins']
  },
  {
    key: 'porc_volaille',
    label: 'Porcins & Poulet de chair',
    fields: { quantiteT: false, ecart: true, tendance: true, prix: true, place: false },
    species: ['Porcins', 'Poulet de chair']
  },
  {
    key: 'petit_ruminant',
    label: 'Petits ruminants',
    fields: { quantiteT: false, ecart: true, tendance: true, prix: true, place: false },
    species: ['Ovins', 'Caprins']
  }
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(SECTIONS.map((s) => [s.key, s.label]))

export default function DailyEntry(): JSX.Element {
  const { user } = useAuth()
  const [date, setDate] = useState(TODAY)
  const [points, setPoints] = useState<Point[]>([])
  const [rows, setRows] = useState<DailyRow[]>([])
  const [active, setActive] = useState<Category>('abattage')
  const [form, setForm] = useState({
    species: '',
    pointId: 0,
    nombre: '',
    quantiteT: '',
    ecart: '',
    tendance: 'STABLE',
    prix: '',
    place: ''
  })

  const section = SECTIONS.find((s) => s.key === active)!

  useEffect(() => {
    window.api.ref.points().then((p) => {
      setPoints(p as Point[])
      if ((p as Point[]).length > 0) setForm((f) => ({ ...f, pointId: (p as Point[])[0].id }))
    })
  }, [])

  const refresh = (): void => {
    window.api.daily.list(date).then((r) => setRows(r as DailyRow[]))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const addRow = async (): Promise<void> => {
    if (!form.species || !form.pointId || !form.nombre) return
    await window.api.daily.create({
      date,
      species: form.species,
      pointId: form.pointId,
      category: active,
      nombre: Number(form.nombre),
      quantiteT: section.fields.quantiteT && form.quantiteT ? Number(form.quantiteT) : null,
      ecart: section.fields.ecart && form.ecart ? Number(form.ecart) : null,
      tendance: section.fields.tendance ? form.tendance : null,
      prix: form.prix || null,
      direction: 'entree',
      place: section.fields.place ? form.place || null : null,
      createdBy: user?.id
    })
    setForm((f) => ({ ...f, species: '', nombre: '', quantiteT: '', ecart: '', prix: '', place: '' }))
    refresh()
  }

  const removeRow = async (id: number): Promise<void> => {
    await window.api.daily.delete(id)
    refresh()
  }

  const sectionRows = rows.filter((r) => r.category === active)

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
      </div>

      <div className="tabs" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={active === s.key ? '' : 'secondary'}
            onClick={() => {
              setActive(s.key)
              setForm((f) => ({ ...f, species: '' }))
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card">
        <h3>{section.label}</h3>
        <div className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Espece</label>
            <input
              list={`species-${active}`}
              value={form.species}
              onChange={(e) => setForm({ ...form, species: e.target.value })}
              placeholder="Choisir ou saisir"
            />
            <datalist id={`species-${active}`}>
              {section.species.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
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
          {section.fields.quantiteT && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Quantite viande (T)</label>
              <input type="number" value={form.quantiteT} onChange={(e) => setForm({ ...form, quantiteT: e.target.value })} />
            </div>
          )}
          {section.fields.ecart && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Ecart / jour precedent</label>
              <input type="number" value={form.ecart} onChange={(e) => setForm({ ...form, ecart: e.target.value })} />
            </div>
          )}
          {section.fields.tendance && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Tendance</label>
              <select value={form.tendance} onChange={(e) => setForm({ ...form, tendance: e.target.value })}>
                <option value="HAUSSE">Hausse</option>
                <option value="BAISSE">Baisse</option>
                <option value="STABLE">Stable</option>
              </select>
            </div>
          )}
          {section.fields.place && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Provenance / point d&apos;embarquement</label>
              <input value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="Ngaoundere..." />
            </div>
          )}
          {section.fields.prix && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Prix</label>
              <input value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} placeholder="2500 Fcfa/kg" />
            </div>
          )}
          <button onClick={addRow}>Ajouter</button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Espece</th>
            <th>Point</th>
            <th>Nombre</th>
            {section.fields.quantiteT && <th>Quantite (T)</th>}
            {section.fields.ecart && <th>Ecart</th>}
            {section.fields.tendance && <th>Tendance</th>}
            {section.fields.place && <th>Provenance</th>}
            {section.fields.prix && <th>Prix</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sectionRows.map((r) => (
            <tr key={r.id}>
              <td>{r.species}</td>
              <td>{r.pointName}</td>
              <td>{r.nombre}</td>
              {section.fields.quantiteT && <td>{r.quantiteT ?? '-'}</td>}
              {section.fields.ecart && <td>{r.ecart ?? '-'}</td>}
              {section.fields.tendance && <td>{r.tendance ?? '-'}</td>}
              {section.fields.place && <td>{r.place ?? '-'}</td>}
              {section.fields.prix && <td>{r.prix ?? '-'}</td>}
              <td>
                <button className="secondary" onClick={() => removeRow(r.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          {sectionRows.length === 0 && (
            <tr>
              <td colSpan={9}>Aucune donnee saisie pour {CATEGORY_LABELS[active]} a cette date.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
