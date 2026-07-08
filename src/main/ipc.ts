import { ipcMain, app } from 'electron'
import fs from 'fs'
import path from 'path'
import { getDb } from './db'
import * as auth from './auth'
import { Role, WeeklyMovementRow } from '@shared/types'
import { INVENTORY_TABLES } from '@shared/inventoryTables'
import { buildDailyReportHtml } from './reports/dailyReport'
import { buildWeeklyReportHtml } from './reports/weeklyReport'
import { buildMonthlyReportHtml, MonthlyReportData } from './reports/monthlyReport'
import { htmlToPdfFile } from './reports/pdfExport'
import { dailyReportToDocx, weeklyReportToDocx, monthlyReportToDocx } from './reports/docxExport'
import { computeAbattageGrid, speciesToAbattageColumn, ABATTAGE_COLUMN_LABELS } from './reports/abattageAggregation'

function reportsDir(): string {
  const dir = path.join(app.getPath('documents'), 'DREPIA_Rapports')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function registerIpcHandlers(): void {
  // ---- Auth ----
  ipcMain.handle('auth:login', (_e, username: string, password: string) => auth.login(username, password))
  ipcMain.handle('auth:listUsers', () => auth.listUsers())
  ipcMain.handle('auth:createUser', (_e, fullName: string, username: string, password: string, role: Role) =>
    auth.createUser(fullName, username, password, role)
  )
  ipcMain.handle('auth:setUserActive', (_e, id: number, active: boolean) => auth.setUserActive(id, active))
  ipcMain.handle('auth:resetPassword', (_e, id: number, newPassword: string) => auth.resetPassword(id, newPassword))

  // ---- Reference data ----
  ipcMain.handle('ref:departments', () => getDb().prepare('SELECT * FROM departments ORDER BY name').all())
  ipcMain.handle('ref:points', () => getDb().prepare('SELECT * FROM collection_points ORDER BY name').all())
  ipcMain.handle('ref:addPoint', (_e, name: string, type: string, departmentId: number) =>
    getDb()
      .prepare('INSERT INTO collection_points (name, type, departmentId) VALUES (?,?,?)')
      .run(name, type, departmentId)
  )
  ipcMain.handle('ref:inventoryTableDefs', () => INVENTORY_TABLES)

  // ---- Dashboard ----
  ipcMain.handle('dashboard:summary', () => {
    const db = getDb()

    const dailyAbattages = db
      .prepare(
        `SELECT date, SUM(nombre) AS total FROM daily_entries
         WHERE category = 'abattage' AND date >= date('now', '-6 days')
         GROUP BY date ORDER BY date`
      )
      .all() as Array<{ date: string; total: number }>

    const speciesRows = db
      .prepare(
        `SELECT species, SUM(nombre) AS total FROM daily_entries
         WHERE category = 'abattage' AND date >= date('now', '-29 days')
         GROUP BY species`
      )
      .all() as Array<{ species: string; total: number }>
    const speciesTotals = new Map<string, number>()
    for (const r of speciesRows) {
      const key = speciesToAbattageColumn(r.species) || 'autres'
      speciesTotals.set(key, (speciesTotals.get(key) || 0) + r.total)
    }
    const speciesBreakdown = Array.from(speciesTotals.entries()).map(([key, total]) => ({
      species: ABATTAGE_COLUMN_LABELS[key] || key,
      total
    }))

    const weeklyMovements = db
      .prepare(
        `SELECT direction, SUM(nombre) AS total FROM daily_entries
         WHERE place IS NOT NULL AND place != '' AND date >= date('now', '-6 days')
         GROUP BY direction`
      )
      .all() as Array<{ direction: string; total: number }>

    return { dailyAbattages, speciesBreakdown, weeklyMovements }
  })

  // ---- Daily entries ----
  ipcMain.handle('daily:list', (_e, date: string) =>
    getDb()
      .prepare(
        `SELECT de.*, cp.name AS pointName FROM daily_entries de
         JOIN collection_points cp ON cp.id = de.pointId WHERE de.date = ? ORDER BY de.id`
      )
      .all(date)
  )
  ipcMain.handle(
    'daily:create',
    (
      _e,
      entry: {
        date: string
        species: string
        pointId: number
        category: string
        nombre: number
        quantiteT: number | null
        ecart: number | null
        tendance: string | null
        prix: string | null
        direction: string
        place: string | null
        createdBy: number
      }
    ) =>
      getDb()
        .prepare(
          `INSERT INTO daily_entries (date, species, pointId, category, nombre, quantiteT, ecart, tendance, prix, direction, place, createdBy)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
        )
        .run(
          entry.date,
          entry.species,
          entry.pointId,
          entry.category,
          entry.nombre,
          entry.quantiteT,
          entry.ecart,
          entry.tendance,
          entry.prix,
          entry.direction || 'entree',
          entry.place,
          entry.createdBy
        )
  )
  ipcMain.handle('daily:delete', (_e, id: number) => getDb().prepare('DELETE FROM daily_entries WHERE id = ?').run(id))

  // ---- Weekly movements (saisie hebdomadaire independante) ----
  ipcMain.handle('weekly:list', (_e, weekStart: string, weekEnd: string) =>
    getDb()
      .prepare(
        `SELECT wm.*, cp.name AS marketName FROM weekly_movements wm
         JOIN collection_points cp ON cp.id = wm.pointId
         WHERE wm.weekStart = ? AND wm.weekEnd = ? ORDER BY wm.id`
      )
      .all(weekStart, weekEnd)
  )
  ipcMain.handle(
    'weekly:create',
    (
      _e,
      entry: {
        weekStart: string
        weekEnd: string
        pointId: number
        species: string
        direction: string
        place: string
        effectif: number
        prixMoyen: string | null
        createdBy: number
      }
    ) =>
      getDb()
        .prepare(
          `INSERT INTO weekly_movements (weekStart, weekEnd, pointId, species, direction, place, effectif, prixMoyen, createdBy)
           VALUES (?,?,?,?,?,?,?,?,?)`
        )
        .run(
          entry.weekStart,
          entry.weekEnd,
          entry.pointId,
          entry.species,
          entry.direction === 'sortie' ? 'sortie' : 'entree',
          entry.place,
          entry.effectif,
          entry.prixMoyen,
          entry.createdBy
        )
  )
  ipcMain.handle('weekly:delete', (_e, id: number) =>
    getDb().prepare('DELETE FROM weekly_movements WHERE id = ?').run(id)
  )

  // ---- Monthly inventory ----
  ipcMain.handle('inventory:gridGet', (_e, tableId: string, month: string) =>
    getDb().prepare('SELECT * FROM inventory_grid_values WHERE tableId = ? AND month = ?').all(tableId, month)
  )
  ipcMain.handle('inventory:t2_1Get', (_e, month: string) => computeAbattageGrid(getDb(), month))
  ipcMain.handle(
    'inventory:gridSet',
    (_e, tableId: string, month: string, departmentId: number, columnKey: string, value: number) =>
      getDb()
        .prepare(
          `INSERT INTO inventory_grid_values (tableId, month, departmentId, columnKey, value)
           VALUES (?,?,?,?,?)
           ON CONFLICT(tableId, month, departmentId, columnKey) DO UPDATE SET value = excluded.value`
        )
        .run(tableId, month, departmentId, columnKey, value)
  )
  ipcMain.handle('inventory:logList', (_e, tableId: string, month: string) => {
    const rows = getDb()
      .prepare('SELECT * FROM inventory_log_entries WHERE tableId = ? AND month = ? ORDER BY id')
      .all(tableId, month) as Array<{ id: number; data: string }>
    return rows.map((r) => ({ id: r.id, ...JSON.parse(r.data) }))
  })
  ipcMain.handle(
    'inventory:logAdd',
    (_e, tableId: string, month: string, data: Record<string, unknown>, createdBy: number) =>
      getDb()
        .prepare('INSERT INTO inventory_log_entries (tableId, month, data, createdBy) VALUES (?,?,?,?)')
        .run(tableId, month, JSON.stringify(data), createdBy)
  )
  ipcMain.handle('inventory:logDelete', (_e, id: number) =>
    getDb().prepare('DELETE FROM inventory_log_entries WHERE id = ?').run(id)
  )

  // ---- Reports ----
  ipcMain.handle('report:listGenerated', () => getDb().prepare('SELECT * FROM reports ORDER BY id DESC').all())

  ipcMain.handle('report:generateDaily', async (_e, date: string, createdBy: number) => {
    const entries = getDb()
      .prepare(
        `SELECT de.*, cp.name AS pointName FROM daily_entries de
         JOIN collection_points cp ON cp.id = de.pointId WHERE de.date = ? ORDER BY de.id`
      )
      .all(date) as never[]
    const html = await buildDailyReportHtml({ date, entries: entries as never })
    const base = path.join(reportsDir(), `journalier_${date}`)
    await htmlToPdfFile(html, `${base}.pdf`)
    await dailyReportToDocx({ date, entries: entries as never }, `${base}.docx`)
    const info = getDb()
      .prepare('INSERT INTO reports (type, periodLabel, createdBy, pdfPath, docxPath) VALUES (?,?,?,?,?)')
      .run('journalier', date, createdBy, `${base}.pdf`, `${base}.docx`)
    return { id: info.lastInsertRowid, html, pdfPath: `${base}.pdf`, docxPath: `${base}.docx` }
  })

  ipcMain.handle('report:generateWeekly', async (_e, weekStart: string, weekEnd: string, createdBy: number) => {
    const savedRows = getDb()
      .prepare(
        `SELECT wm.*, cp.name AS marketName FROM weekly_movements wm
         JOIN collection_points cp ON cp.id = wm.pointId
         WHERE wm.weekStart = ? AND wm.weekEnd = ?
         ORDER BY wm.id`
      )
      .all(weekStart, weekEnd) as Array<{
      pointId: number
      marketName: string
      species: string
      direction: string
      place: string
      effectif: number
      prixMoyen: string | null
    }>
    const rows: WeeklyMovementRow[] = savedRows.map((r) => ({
      weekStart,
      weekEnd,
      pointId: r.pointId,
      marketName: r.marketName,
      species: r.species,
      direction: r.direction === 'sortie' ? 'sortie' : 'entree',
      place: r.place,
      effectif: r.effectif,
      prixMoyen: r.prixMoyen
    }))
    const html = await buildWeeklyReportHtml({ weekStart, weekEnd, rows })
    const base = path.join(reportsDir(), `hebdomadaire_${weekStart}_${weekEnd}`)
    await htmlToPdfFile(html, `${base}.pdf`)
    await weeklyReportToDocx({ weekStart, weekEnd, rows }, `${base}.docx`)
    const info = getDb()
      .prepare('INSERT INTO reports (type, periodLabel, createdBy, pdfPath, docxPath) VALUES (?,?,?,?,?)')
      .run('hebdomadaire', `${weekStart} au ${weekEnd}`, createdBy, `${base}.pdf`, `${base}.docx`)
    return { id: info.lastInsertRowid, html, pdfPath: `${base}.pdf`, docxPath: `${base}.docx` }
  })

  ipcMain.handle('report:generateMonthly', async (_e, month: string, createdBy: number) => {
    const db = getDb()
    const departments = db.prepare('SELECT * FROM departments ORDER BY name').all() as Array<{
      id: number
      name: string
    }>
    const gridValues = new Map<string, number>()
    // T2_1 ("Abattages controles") is derived from daily entries, not stored manually.
    const gridRows = db
      .prepare('SELECT * FROM inventory_grid_values WHERE month = ? AND tableId != ?')
      .all(month, 'T2_1') as Array<{ tableId: string; departmentId: number; columnKey: string; value: number }>
    for (const r of gridRows) gridValues.set(`${r.tableId}|${r.departmentId}|${r.columnKey}`, r.value)
    for (const r of computeAbattageGrid(db, month)) gridValues.set(`T2_1|${r.departmentId}|${r.columnKey}`, r.value)

    const logEntries = new Map<string, Array<Record<string, unknown>>>()
    for (const t of INVENTORY_TABLES) {
      if (t.kind !== 'log') continue
      const rows = db
        .prepare('SELECT * FROM inventory_log_entries WHERE tableId = ? AND month = ? ORDER BY id')
        .all(t.id, month) as Array<{ data: string }>
      logEntries.set(t.id, rows.map((r) => JSON.parse(r.data)))
    }

    const data: MonthlyReportData = { month, departments, gridValues, logEntries }
    const html = await buildMonthlyReportHtml(data)
    const base = path.join(reportsDir(), `mensuel_${month}`)
    await htmlToPdfFile(html, `${base}.pdf`)
    await monthlyReportToDocx(data, `${base}.docx`)
    const info = db
      .prepare('INSERT INTO reports (type, periodLabel, createdBy, pdfPath, docxPath) VALUES (?,?,?,?,?)')
      .run('mensuel', month, createdBy, `${base}.pdf`, `${base}.docx`)
    return { id: info.lastInsertRowid, html, pdfPath: `${base}.pdf`, docxPath: `${base}.docx` }
  })
}
