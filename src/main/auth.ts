import bcrypt from 'bcryptjs'
import { getDb } from './db'
import { Role, User } from '@shared/types'

export interface LoginResult {
  ok: boolean
  user?: User
  error?: string
}

export function login(username: string, password: string): LoginResult {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM users WHERE username = ? AND active = 1')
    .get(username) as
    | { id: number; fullName: string; username: string; passwordHash: string; role: Role; active: number }
    | undefined
  if (!row) return { ok: false, error: 'Utilisateur introuvable ou desactive.' }
  const valid = bcrypt.compareSync(password, row.passwordHash)
  if (!valid) return { ok: false, error: 'Mot de passe incorrect.' }
  return {
    ok: true,
    user: { id: row.id, fullName: row.fullName, username: row.username, role: row.role, active: row.active }
  }
}

export function listUsers(): User[] {
  const db = getDb()
  return db.prepare('SELECT id, fullName, username, role, active FROM users').all() as User[]
}

export function createUser(fullName: string, username: string, password: string, role: Role): User {
  const db = getDb()
  const hash = bcrypt.hashSync(password, 10)
  const info = db
    .prepare('INSERT INTO users (fullName, username, passwordHash, role) VALUES (?,?,?,?)')
    .run(fullName, username, hash, role)
  return { id: info.lastInsertRowid as number, fullName, username, role, active: 1 }
}

export function setUserActive(id: number, active: boolean): void {
  getDb().prepare('UPDATE users SET active = ? WHERE id = ?').run(active ? 1 : 0, id)
}

export function resetPassword(id: number, newPassword: string): void {
  const hash = bcrypt.hashSync(newPassword, 10)
  getDb().prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hash, id)
}
