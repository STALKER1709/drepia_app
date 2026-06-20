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
          <li>Saisissez les donnees du jour, de la semaine ou du mois via les menus "Saisie".</li>
          <li>Rendez-vous dans "Generation des rapports" pour produire le rapport correspondant en un clic.</li>
          <li>Chaque rapport est exporte automatiquement en PDF et en Word, avec tableaux et graphes.</li>
        </ol>
      </div>
    </div>
  )
}
