import { useEffect, useState } from 'react'

interface Point {
  id: number
  name: string
  type: string
  departmentId: number | null
}

interface Department {
  id: number
  name: string
}

interface Props {
  value: number
  onChange: (id: number) => void
  label?: string
}

const POINT_TYPES: Array<{ value: string; label: string }> = [
  { value: 'marche', label: 'Marche' },
  { value: 'abattoir', label: 'Abattoir / aire d\'abattage' },
  { value: 'embarquement', label: 'Point d\'embarquement' },
  { value: 'debarquement', label: 'Point de debarquement' }
]

/**
 * Market / collection point picker that also lets the user create a new one
 * on the fly. Newly created points are persisted (collection_points) and
 * immediately selected, so they stay available for later entries.
 */
export default function PointSelect({ value, onChange, label = 'Marche / point' }: Props): JSX.Element {
  const [points, setPoints] = useState<Point[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'marche', departmentId: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    window.api.ref.departments().then((d) => {
      const list = d as Department[]
      setDepartments(list)
      if (list.length > 0) setForm((f) => (f.departmentId ? f : { ...f, departmentId: list[0].id }))
    })
  }, [])

  useEffect(() => {
    window.api.ref.points().then((p) => {
      const list = p as Point[]
      setPoints(list)
      if (!value && list.length > 0) onChange(list[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async (): Promise<void> => {
    const name = form.name.trim()
    if (!name) {
      setError('Le nom du marche est obligatoire.')
      return
    }
    if (points.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setError('Ce marche existe deja.')
      return
    }
    await window.api.ref.addPoint(name, form.type, form.departmentId)
    const refreshed = (await window.api.ref.points()) as Point[]
    setPoints(refreshed)
    const created = refreshed.find((p) => p.name.toLowerCase() === name.toLowerCase())
    if (created) onChange(created.id)
    setForm((f) => ({ ...f, name: '' }))
    setError('')
    setAdding(false)
  }

  return (
    <>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>{label}</label>
        <div style={{ display: 'flex', gap: 4 }}>
          <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
            {points.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            {points.length === 0 && <option value={0}>Aucun marche enregistre</option>}
          </select>
          <button
            type="button"
            className={adding ? 'secondary' : ''}
            title="Ajouter un nouveau marche"
            onClick={() => {
              setError('')
              setAdding((a) => !a)
            }}
          >
            {adding ? 'Annuler' : '+ Nouveau'}
          </button>
        </div>
      </div>

      {adding && (
        <div style={{ flexBasis: '100%' }}>
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              background: '#eef5ee',
              padding: 12,
              borderRadius: 4
            }}
          >
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Nom du nouveau marche</label>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save()
                }}
                placeholder="Marche de Mfou..."
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {POINT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Departement</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: Number(e.target.value) })}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={save}>
              Enregistrer le marche
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </>
  )
}
