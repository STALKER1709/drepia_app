import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from './auth'

const NAV_ITEMS: Array<{ to: string; label: string; roles: string[] }> = [
  { to: '/', label: 'Tableau de bord', roles: ['admin', 'agent', 'superviseur', 'lecture'] },
  { to: '/saisie/journalier', label: 'Saisie journaliere', roles: ['admin', 'agent', 'superviseur'] },
  { to: '/saisie/hebdomadaire', label: 'Saisie hebdomadaire', roles: ['admin', 'agent', 'superviseur'] },
  { to: '/saisie/mensuel', label: 'Saisie mensuelle (Inventaire)', roles: ['admin', 'agent', 'superviseur'] },
  { to: '/rapports', label: 'Generation des rapports', roles: ['admin', 'superviseur', 'lecture'] },
  { to: '/utilisateurs', label: 'Utilisateurs', roles: ['admin'] }
]

export default function Layout(): JSX.Element {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = (): void => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <div className="sidebar">
        <h2>DREPIA Centre</h2>
        {NAV_ITEMS.filter((item) => user && item.roles.includes(user.role)).map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')} end>
            {item.label}
          </NavLink>
        ))}
        <div className="user-info">
          {user?.fullName}
          <br />
          <span className="badge">{roleLabel(user?.role)}</span>
          <br />
          <button className="secondary" style={{ marginTop: 8, width: '100%' }} onClick={onLogout}>
            Deconnexion
          </button>
        </div>
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  )
}

function roleLabel(role?: string): string {
  switch (role) {
    case 'admin':
      return 'Administrateur'
    case 'agent':
      return 'Agent de saisie'
    case 'superviseur':
      return 'Superviseur'
    case 'lecture':
      return 'Lecture seule'
    default:
      return ''
  }
}
