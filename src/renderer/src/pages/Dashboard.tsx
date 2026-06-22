import { useEffect, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import { useAuth } from '../auth'

interface DashboardSummary {
  dailyAbattages: Array<{ date: string; total: number }>
  speciesBreakdown: Array<{ species: string; total: number }>
  weeklyMovements: Array<{ direction: string; total: number }>
}

function useChart(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  summary: DashboardSummary | null,
  build: (ctx: HTMLCanvasElement, summary: DashboardSummary) => Chart
): void {
  useEffect(() => {
    if (!canvasRef.current || !summary) return
    const chart = build(canvasRef.current, summary)
    return () => chart.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary])
}

export default function Dashboard(): JSX.Element {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    window.api.dashboard.summary().then((s: DashboardSummary) => setSummary(s))
  }, [])

  const abattagesRef = useRef<HTMLCanvasElement>(null)
  const speciesRef = useRef<HTMLCanvasElement>(null)
  const movementsRef = useRef<HTMLCanvasElement>(null)

  useChart(abattagesRef, summary, (ctx, s) =>
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: s.dailyAbattages.map((r) => r.date.slice(5)),
        datasets: [
          {
            label: 'Abattages controles',
            data: s.dailyAbattages.map((r) => r.total),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37,99,235,0.15)',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    })
  )

  useChart(speciesRef, summary, (ctx, s) =>
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: s.speciesBreakdown.map((r) => r.species),
        datasets: [
          {
            data: s.speciesBreakdown.map((r) => r.total),
            backgroundColor: ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']
          }
        ]
      },
      options: { responsive: true }
    })
  )

  useChart(movementsRef, summary, (ctx, s) =>
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: s.weeklyMovements.map((r) => (r.direction === 'sortie' ? 'Sortie' : 'Entree')),
        datasets: [
          {
            label: 'Effectif',
            data: s.weeklyMovements.map((r) => r.total),
            backgroundColor: ['#16a34a', '#dc2626']
          }
        ]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    })
  )

  return (
    <div>
      <h1 className="page-title">Bienvenue, {user?.fullName}</h1>
      <p className="subtitle">
        Application de saisie et de generation automatique des rapports journaliers, hebdomadaires et mensuels de la
        DREPIA Centre.
      </p>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
          <div className="card">
            <h3>Abattages controles - 7 derniers jours</h3>
            <canvas ref={abattagesRef} />
          </div>
          <div className="card">
            <h3>Repartition par espece - 30 derniers jours</h3>
            <canvas ref={speciesRef} />
          </div>
          <div className="card">
            <h3>Mouvements de marche - 7 derniers jours</h3>
            <canvas ref={movementsRef} />
          </div>
        </div>
      )}

      <div className="card">
        <h3>Comment proceder</h3>
        <ol>
          <li>Saisissez les donnees du jour (y compris les mouvements entree/sortie par marche) via "Saisie journaliere".</li>
          <li>Completez l&apos;inventaire mensuel via "Saisie mensuelle" - les abattages controles y sont calcules automatiquement a partir des saisies journalieres.</li>
          <li>Rendez-vous dans "Generation des rapports" pour produire le rapport journalier, hebdomadaire ou mensuel en un clic : le rapport hebdomadaire est lui aussi recalcule a partir des saisies journalieres.</li>
          <li>Chaque rapport est exporte automatiquement en PDF et en Word, avec tableaux et graphes.</li>
        </ol>
      </div>
    </div>
  )
}
