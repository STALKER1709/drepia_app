import { useEffect, useState } from 'react'
import { Role, User } from '@shared/types'

export default function UsersAdmin(): JSX.Element {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({ fullName: '', username: '', password: '', role: 'agent' as Role })

  const refresh = (): void => {
    window.api.auth.listUsers().then((u) => setUsers(u as User[]))
  }
  useEffect(refresh, [])

  const addUser = async (): Promise<void> => {
    if (!form.fullName || !form.username || !form.password) return
    await window.api.auth.createUser(form.fullName, form.username, form.password, form.role)
    setForm({ fullName: '', username: '', password: '', role: 'agent' })
    refresh()
  }

  const toggleActive = async (u: User): Promise<void> => {
    await window.api.auth.setUserActive(u.id, !u.active)
    refresh()
  }

  return (
    <div>
      <h1 className="page-title">Gestion des utilisateurs</h1>
      <p className="subtitle">Creez les comptes et attribuez un role a chaque membre du service.</p>

      <div className="card">
        <div className="toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nom complet</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Identifiant</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Mot de passe</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="admin">Administrateur</option>
              <option value="agent">Agent de saisie</option>
              <option value="superviseur">Superviseur</option>
              <option value="lecture">Lecture seule</option>
            </select>
          </div>
          <button onClick={addUser}>Creer le compte</button>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Identifiant</th>
            <th>Role</th>
            <th>Statut</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.fullName}</td>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>{u.active ? 'Actif' : 'Desactive'}</td>
              <td>
                <button className="secondary" onClick={() => toggleActive(u)}>
                  {u.active ? 'Desactiver' : 'Reactiver'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
