import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import PointSelect from '../components/PointSelect'

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

// Rendement carcasse (kg de viande par tete abattue). La quantite (T) est
// calculee automatiquement pour ces especes : (nombre * coef) / 1000.
const ABATTAGE_COEF: Array<{ test: RegExp; coef: number }> = [
  { test: /^bovin/i, coef: 195 },
  { test: /^(volaill|poulet|poule)/i, coef: 2 }
]
function abattageCoef(species: string): number | null {
  const m = ABATTAGE_COEF.find((c) => c.test.test(species.trim()))
  return m ? m.coef : null
}

export default function DailyEntry(): JSX.Element {
  const { user } = useAuth()
  const [date, setDate] = useState(TODAY)
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
  const autoCoef = active === 'abattage' ? abattageCoef(form.species) : null
  const computedQuantiteT =
    autoCoef != null && form.nombre ? (Number(form.nombre) * autoCoef) / 1000 : null

  // Ecart automatique (%) par rapport a la derniere saisie anterieure pour la
  // meme espece et le meme point, dans les abattages controles.
  const [previous, setPrevious] = useState<{ date: string; total: number } | null>(null)
  useEffect(() => {
    if (active !== 'abattage' || !form.species.trim() || !form.pointId) {
      setPrevious(null)
      return
    }
    window.api.daily
      .previousAbattage(date, form.species, form.pointId)
      .then((p) => setPrevious(p as { date: string; total: number } | null))
  }, [active, date, form.species, form.pointId])

  const computedEcart =
    previous && previous.total > 0 && form.nombre
      ? ((Number(form.nombre) - previous.total) / previous.total) * 100
      : null
  const autoTendance =
    computedEcart == null ? null : computedEcart > 0 ? 'HAUSSE' : computedEcart < 0 ? 'BAISSE' : 'STABLE'

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
      quantiteT: section.fields.quantiteT
        ? autoCoef != null
          ? computedQuantiteT
          : form.quantiteT
            ? Number(form.quantiteT)
            : null
        : null,
      ecart: section.fields.ecart
        ? computedEcart != null
          ? Number(computedEcart.toFixed(3))
          : form.ecart
            ? Number(form.ecart)
            : null
        : null,
      tendance: section.fields.tendance ? (autoTendance ?? form.tendance) : null,
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
          <PointSelect
            label="Point de collecte"
            value={form.pointId}
            onChange={(id) => setForm((f) => ({ ...f, pointId: id }))}
          />
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nombre (tetes)</label>
            <input type="number" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          {section.fields.quantiteT && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Quantite viande (T){autoCoef != null ? ' (auto)' : ''}</label>
              {autoCoef != null ? (
                <input
                  type="number"
                  value={computedQuantiteT != null ? Number(computedQuantiteT.toFixed(3)) : ''}
                  readOnly
                  title={`Calcul automatique : (nombre x ${autoCoef}) / 1000`}
                  style={{ background: '#eef5ee' }}
                />
              ) : (
                <input type="number" value={form.quantiteT} onChange={(e) => setForm({ ...form, quantiteT: e.target.value })} />
              )}
            </div>
          )}
          {section.fields.ecart && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>
                Ecart / jour precedent (%)
                {computedEcart != null ? ' (auto)' : ''}
              </label>
              {computedEcart != null ? (
                <input
                  type="number"
                  value={Number(computedEcart.toFixed(3))}
                  readOnly
                  title={`Calcul automatique par rapport au ${previous?.date} (${previous?.total} tetes)`}
                  style={{ background: '#eef5ee' }}
                />
              ) : (
                <input type="number" value={form.ecart} onChange={(e) => setForm({ ...form, ecart: e.target.value })} />
              )}
              {active === 'abattage' && previous && (
                <span style={{ fontSize: 11, color: '#666' }}>
                  Veille : {previous.total} tetes le {previous.date}
                </span>
              )}
            </div>
          )}
          {section.fields.tendance && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Tendance{autoTendance ? ' (auto)' : ''}</label>
              <select
                value={autoTendance ?? form.tendance}
                disabled={autoTendance != null}
                onChange={(e) => setForm({ ...form, tendance: e.target.value })}
                style={autoTendance ? { background: '#eef5ee' } : undefined}
              >
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
