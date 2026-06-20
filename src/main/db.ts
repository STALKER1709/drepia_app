import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

const DEPARTMENTS = [
  'HAUTE SANAGA', 'LEKIE', 'MBAM ET INOUBOU', 'MBAM ET KIM', 'MEFOU ET AFAMBA',
  'MEFOU ET AKONO', 'MFOUNDI', 'NYONG ET KELLE', 'NYONG ET MFOUMOU', "NYONG ET SO'O"
]

let db: Database.Database

export function getDb(): Database.Database {
  if (db) return db
  const userDataDir = app.getPath('userData')
  if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true })
  const dbPath = path.join(userDataDir, 'drepia.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  migrate(db)
  seed(db)
  return db
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','agent','superviseur','lecture')),
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS collection_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'marche'
    );

    CREATE TABLE IF NOT EXISTS daily_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      species TEXT NOT NULL,
      pointId INTEGER NOT NULL REFERENCES collection_points(id),
      category TEXT NOT NULL,
      nombre REAL NOT NULL DEFAULT 0,
      quantiteT REAL,
      ecart REAL,
      tendance TEXT,
      prix TEXT,
      createdBy INTEGER REFERENCES users(id),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS weekly_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      weekStart TEXT NOT NULL,
      weekEnd TEXT NOT NULL,
      marketName TEXT NOT NULL,
      species TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('entree','sortie')),
      place TEXT NOT NULL,
      effectif REAL NOT NULL DEFAULT 0,
      prixMoyen TEXT,
      createdBy INTEGER REFERENCES users(id),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_grid_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tableId TEXT NOT NULL,
      month TEXT NOT NULL,
      departmentId INTEGER NOT NULL REFERENCES departments(id),
      columnKey TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0,
      UNIQUE(tableId, month, departmentId, columnKey)
    );

    CREATE TABLE IF NOT EXISTS inventory_log_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tableId TEXT NOT NULL,
      month TEXT NOT NULL,
      data TEXT NOT NULL,
      createdBy INTEGER REFERENCES users(id),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('journalier','hebdomadaire','mensuel')),
      periodLabel TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdBy INTEGER REFERENCES users(id),
      pdfPath TEXT,
      docxPath TEXT
    );
  `)
}

function seed(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number }
  if (userCount.c === 0) {
    const insert = db.prepare(
      'INSERT INTO users (fullName, username, passwordHash, role) VALUES (?,?,?,?)'
    )
    insert.run('Administrateur DREPIA', 'admin', bcrypt.hashSync('admin123', 10), 'admin')
    insert.run('Agent de saisie', 'agent', bcrypt.hashSync('agent123', 10), 'agent')
    insert.run('Superviseur', 'superviseur', bcrypt.hashSync('superviseur123', 10), 'superviseur')
  }

  const deptCount = db.prepare('SELECT COUNT(*) AS c FROM departments').get() as { c: number }
  if (deptCount.c === 0) {
    const insert = db.prepare('INSERT INTO departments (name) VALUES (?)')
    for (const d of DEPARTMENTS) insert.run(d)
  }

  const pointCount = db.prepare('SELECT COUNT(*) AS c FROM collection_points').get() as { c: number }
  if (pointCount.c === 0) {
    const insert = db.prepare('INSERT INTO collection_points (name, type) VALUES (?,?)')
    const defaultPoints: Array<[string, string]> = [
      ['Abattoir (SODEPA)', 'abattoir'],
      ['Marche Nkol-ewoe (Mvog-Ada)', 'marche'],
      ['Marche 8eme (Tsinga)', 'marche'],
      ['Marche Etoudi', 'marche'],
      ['Marche Mendong', 'marche']
    ]
    for (const [name, type] of defaultPoints) insert.run(name, type)
  }
}
