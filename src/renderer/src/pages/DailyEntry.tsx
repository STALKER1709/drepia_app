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

interface SectionDef {
  key: Category
  label: string
  /** Unit of the "ecart sur la journee precedente" column, per the official form. */
  ecartUnit: 'T' | 'tetes'
  /** Section II is a list of embarkation points with summary rows at the bottom. */
  summaryStyle?: boolean
  fields: { quantiteT: boolean; ecart: boolean; tendance: boolean; prix: boolean; place: boolean }
  species: string[]
}

const SECTIONS: SectionDef[] = [
  {
    key: 'abattage',
    label: 'Abattages Controles',
    ecartUnit: 'T',
    fields: { quantiteT: true, ecart: true, tendance: true, prix: true, place: false },
    species: ['Bovine', 'Ovine', 'Caprine', 'Porcine', 'Volaille']
  },
  {
    key: 'sur_pied',
    label: 'Animaux Sur Pied (arrivee)',
    ecartUnit: 'tetes',
    summaryStyle: true,
    fields: { quantiteT: false, ecart: false, tendance: false, prix: true, place: true },
    species: ['Bovins', 'Ovins', 'Caprins', 'Porcins']
  },
  {
    key: 'porc_volaille',
    label: 'Porcins et Poulet de chair',
    ecartUnit: 'tetes',
    fields: { quantiteT: false, ecart: true, tendance: true, prix: true, place: false },
    species: ['Porcins', 'Poulet de chair']
  },
  {
    key: 'petit_ruminant',
    label: 'Petits Ruminants',
    ecartUnit: 'tetes',
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

function tendanceOf(ecart: number): string {
  return ecart > 0 ? 'HAUSSE' : ecart < 0 ? 'BAISSE' : 'STABLE'
}

export default function DailyEntry(): JSX.Element {
  const { user } = useAuth()
  const [date, setDate] = useState(TODAY)
  const [rows, setRows] = useState<DailyRow[]>([])
  const [active, setActive] = useState<Category>('abattage')
  const [fallbackPointId, setFallbackPointId] = useState(0)
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

  // "Animaux sur pied" has no per-row market column in the official form, but
  // the schema requires a collection point, so fall back to the first one.
  useEffect(() => {
    window.api.ref.points().then((p) => {
      const list = p as Array<{ id: number }>
      if (list.length > 0) setFallbackPointId(list[0].id)
    })
  }, [])

  const refresh = (): void => {
    window.api.daily.list(date).then((r) => setRows(r as DailyRow[]))
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  // --- Ecart automatique par ligne (sections I, III, IV) ---
  const [previous, setPrevious] = useState<{ date: string; nombre: number; quantiteT: number } | null>(null)
  useEffect(() => {
    if (section.summaryStyle || !form.species.trim() || !form.pointId) {
      setPrevious(null)
      return
    }
    window.api.daily
      .previousTotals(date, active, form.species, form.pointId)
      .then((p) => setPrevious(p as { date: string; nombre: number; quantiteT: number } | null))
  }, [active, date, form.species, form.pointId, section.summaryStyle])

  const todayQuantiteT = computedQuantiteT ?? (form.quantiteT ? Number(form.quantiteT) : null)
  const computedEcart =
    previous == null
      ? null
      : section.ecartUnit === 'T'
        ? todayQuantiteT != null
          ? todayQuantiteT - previous.quantiteT
          : null
        : form.nombre
          ? Number(form.nombre) - previous.nombre
          : null
  const autoTendance = computedEcart == null ? null : tendanceOf(computedEcart)

  // --- Totaux de section (section II : Animaux sur pied) ---
  const sectionRows = rows.filter((r) => r.category === active)
  const totalNombre = sectionRows.reduce((a, r) => a + (r.nombre || 0), 0)
  const totalQuantiteT = sectionRows.reduce((a, r) => a + (r.quantiteT || 0), 0)

  const [prevSectionTotal, setPrevSectionTotal] = useState<{ date: string; total: number } | null>(null)
  useEffect(() => {
    if (!section.summaryStyle) {
      setPrevSectionTotal(null)
      return
    }
    window.api.daily
      .previousSectionTotal(date, active)
      .then((p) => setPrevSectionTotal(p as { date: string; total: number } | null))
  }, [active, date, section.summaryStyle, rows.length])

  const sectionEcart = prevSectionTotal ? totalNombre - prevSectionTotal.total : null

  const addRow = async (): Promise<void> => {
    if (!form.nombre) return
    if (section.summaryStyle ? !form.place.trim() : !form.species.trim() || !form.pointId) return
    await window.api.daily.create({
      date,
      species: form.species || section.species[0],
      pointId: form.pointId || fallbackPointId,
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
    setForm((f) => ({ ...f, nombre: '', quantiteT: '', ecart: '', place: '' }))
    refresh()
  }

  const removeRow = async (id: number): Promise<void> => {
    await window.api.daily.delete(id)
    refresh()
  }

  const ecartLabel = `Ecart (${section.ecartUnit === 'T' ? 'T' : 'Tetes'}) sur la journee precedente`

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

      <div className="tabs">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={active === s.key ? 'active' : ''}
            onClick={() => {
              setActive(s.key)
              setForm((f) => ({ ...f, species: '', nombre: '', place: '' }))
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card">
        <h3>{section.label}</h3>
        <div className="toolbar">
          {!section.summaryStyle && (
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
          )}
          {!section.summaryStyle && (
            <PointSelect
              label="Point de collecte"
              value={form.pointId}
              onChange={(id) => setForm((f) => ({ ...f, pointId: id }))}
            />
          )}
          {section.fields.place && (
            <div className="field" style={{ marginBottom: 0, minWidth: 280 }}>
              <label>Point d&apos;embarquement (et transport)</label>
              <input
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
                placeholder="Ngaoundal / par route 05 camions"
              />
            </div>
          )}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{section.summaryStyle ? 'Nombre de tetes' : 'Nombre abattue (en tetes)'}</label>
            <input type="number" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          {section.fields.quantiteT && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Quantite de viande (T){autoCoef != null ? ' (auto)' : ''}</label>
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
                {ecartLabel}
                {computedEcart != null ? ' (auto)' : ''}
              </label>
              {computedEcart != null ? (
                <input
                  type="number"
                  value={Number(computedEcart.toFixed(3))}
                  readOnly
                  title={`Calcul automatique par rapport au ${previous?.date}`}
                  style={{ background: '#eef5ee' }}
                />
              ) : (
                <input type="number" value={form.ecart} onChange={(e) => setForm({ ...form, ecart: e.target.value })} />
              )}
              {previous && (
                <span style={{ fontSize: 11, color: '#666' }}>
                  Veille ({previous.date}) :{' '}
                  {section.ecartUnit === 'T' ? `${previous.quantiteT} T` : `${previous.nombre} tetes`}
                </span>
              )}
            </div>
          )}
          {section.fields.tendance && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Tendance du jour{autoTendance ? ' (auto)' : ''}</label>
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
          {section.fields.prix && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{active === 'abattage' ? 'Prix du kg' : 'Prix Moyen'}</label>
              <input
                value={form.prix}
                onChange={(e) => setForm({ ...form, prix: e.target.value })}
                placeholder={active === 'abattage' ? '3000 Fcfa avec os / 3500 sans os' : '400 000 Fcfa'}
              />
            </div>
          )}
          <button onClick={addRow}>Ajouter</button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            {section.summaryStyle ? (
              <th>Point d&apos;embarquement</th>
            ) : (
              <>
                <th>Espece</th>
                <th>Point de collecte</th>
              </>
            )}
            <th>{section.summaryStyle ? 'Nombre de tetes' : 'Nombre'}</th>
            {section.fields.quantiteT && <th>Quantite de viande (T)</th>}
            {section.fields.ecart && <th>{ecartLabel}</th>}
            {section.fields.tendance && <th>Tendance du jour</th>}
            {section.fields.prix && <th>{active === 'abattage' ? 'Prix du kg' : 'Prix Moyen'}</th>}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sectionRows.map((r) => (
            <tr key={r.id}>
              {section.summaryStyle ? (
                <td>{r.place ?? '-'}</td>
              ) : (
                <>
                  <td>{r.species}</td>
                  <td>{r.pointName}</td>
                </>
              )}
              <td>{r.nombre}</td>
              {section.fields.quantiteT && <td>{r.quantiteT ?? '-'}</td>}
              {section.fields.ecart && <td>{r.ecart ?? '-'}</td>}
              {section.fields.tendance && <td>{r.tendance ?? '-'}</td>}
              {section.fields.prix && <td style={{ whiteSpace: 'pre-line' }}>{r.prix ?? '-'}</td>}
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

          {sectionRows.length > 0 && (
            <>
              <tr style={{ fontWeight: 'bold', background: '#eef5ee' }}>
                <td colSpan={section.summaryStyle ? 1 : 2}>TOTAL du jour</td>
                <td>{totalNombre}</td>
                {section.fields.quantiteT && <td>{Number(totalQuantiteT.toFixed(3))}</td>}
                {section.fields.ecart && <td />}
                {section.fields.tendance && <td />}
                {section.fields.prix && <td />}
                <td />
              </tr>
              {section.summaryStyle && (
                <>
                  <tr style={{ fontWeight: 'bold' }}>
                    <td>Ecart sur la journee precedente</td>
                    <td>
                      {sectionEcart == null
                        ? '-'
                        : `${sectionEcart > 0 ? '+' : ''}${sectionEcart}`}
                    </td>
                    {section.fields.prix && <td />}
                    <td />
                  </tr>
                  <tr style={{ fontWeight: 'bold' }}>
                    <td>Tendance du jour</td>
                    <td>{sectionEcart == null ? '-' : tendanceOf(sectionEcart)}</td>
                    {section.fields.prix && <td />}
                    <td />
                  </tr>
                </>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
