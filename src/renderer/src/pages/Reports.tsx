import { useState } from 'react'
import { useAuth } from '../auth'

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

type ReportType = 'journalier' | 'hebdomadaire' | 'mensuel'

export default function Reports(): JSX.Element {
  const { user } = useAuth()
  const [type, setType] = useState<ReportType>('journalier')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [weekStart, setWeekStart] = useState(startOfWeek())
  const [weekEnd, setWeekEnd] = useState(endOfWeek(startOfWeek()))
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ html: string; pdfPath: string; docxPath: string } | null>(null)

  const generate = async (): Promise<void> => {
    setLoading(true)
    setResult(null)
    try {
      let res
      if (type === 'journalier') res = await window.api.report.generateDaily(date, user?.id || 0)
      else if (type === 'hebdomadaire') res = await window.api.report.generateWeekly(weekStart, weekEnd, user?.id || 0)
      else res = await window.api.report.generateMonthly(month, user?.id || 0)
      setResult(res as never)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">Generation des rapports</h1>
      <p className="subtitle">Produisez le rapport journalier, hebdomadaire ou mensuel en un clic, avec tableaux et graphes, exporte en PDF et Word.</p>

      <div className="card">
        <div className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Type de rapport</label>
            <select value={type} onChange={(e) => setType(e.target.value as ReportType)}>
              <option value="journalier">Journalier</option>
              <option value="hebdomadaire">Hebdomadaire</option>
              <option value="mensuel">Mensuel (Inventaire)</option>
            </select>
          </div>

          {type === 'journalier' && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}

          {type === 'hebdomadaire' && (
            <>
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
            </>
          )}

          {type === 'mensuel' && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Mois</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
          )}

          <button onClick={generate} disabled={loading}>
            {loading ? 'Generation en cours...' : 'Generer le rapport'}
          </button>
        </div>
      </div>

      {result && (
        <div className="card">
          <h3>Rapport genere</h3>
          <p>
            PDF : <code>{result.pdfPath}</code>
            <br />
            Word : <code>{result.docxPath}</code>
          </p>
          <iframe className="preview" srcDoc={result.html} title="Apercu du rapport" />
        </div>
      )}
    </div>
  )
}
