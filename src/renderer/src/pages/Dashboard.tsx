import { useAuth } from '../auth'

export default function Dashboard(): JSX.Element {
  const { user } = useAuth()
  return (
    <div>
      <h1 className="page-title">Bienvenue, {user?.fullName}</h1>
      <p className="subtitle">
        Application de saisie et de generation automatique des rapports journaliers, hebdomadaires et mensuels de la
        DREPIA Centre.
      </p>
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
