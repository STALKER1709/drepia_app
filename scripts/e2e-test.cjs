require('tsx/cjs')
const { app } = require('electron')
const path = require('path')
const fs = require('fs')

app.disableHardwareAcceleration()

app.whenReady().then(() => {
  ;(async () => {
    try {
      const { getDb } = require('../src/main/db')
      const db = getDb()

      const dept = db.prepare('SELECT * FROM departments LIMIT 1').get()
      const point = db.prepare('SELECT * FROM collection_points LIMIT 1').get()
      const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get()

      const date = '2026-04-11'
      db.prepare(
        `INSERT INTO daily_entries (date, species, pointId, category, nombre, quantiteT, ecart, tendance, prix, createdBy)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      ).run(date, 'Bovine', point.id, 'abattage', 124, 24.18, -16.77, 'BAISSE', '2500 Fcfa', admin.id)

      db.prepare(
        `INSERT INTO weekly_movements (weekStart, weekEnd, marketName, species, direction, place, effectif, prixMoyen, createdBy)
         VALUES (?,?,?,?,?,?,?,?,?)`
      ).run('2026-04-06', '2026-04-12', 'Etoudi', 'bovins', 'entree', 'ADAMAOUA', 1300, null, admin.id)
      db.prepare(
        `INSERT INTO weekly_movements (weekStart, weekEnd, marketName, species, direction, place, effectif, prixMoyen, createdBy)
         VALUES (?,?,?,?,?,?,?,?,?)`
      ).run('2026-04-06', '2026-04-12', 'Etoudi', 'bovins', 'sortie', 'KYE-OSI', 120, null, admin.id)

      db.prepare(
        `INSERT INTO inventory_grid_values (tableId, month, departmentId, columnKey, value) VALUES (?,?,?,?,?)`
      ).run('T1_1', '2026-01', dept.id, 'bovins', 15343)
      db.prepare(
        `INSERT INTO inventory_grid_values (tableId, month, departmentId, columnKey, value) VALUES (?,?,?,?,?)`
      ).run('T2_1', '2026-01', dept.id, 'bovins_abattus', 152)
      db.prepare(`INSERT INTO inventory_log_entries (tableId, month, data, createdBy) VALUES (?,?,?,?)`).run(
        'T3_1',
        '2026-01',
        JSON.stringify({ departement: dept.name, maladie: 'Avitaminose', foyers: 9, touche: 58 }),
        admin.id
      )

      const outDir = fs.mkdtempSync('/tmp/drepia-e2e-out-')

      const { buildDailyReportHtml } = require('../src/main/reports/dailyReport')
      const { buildWeeklyReportHtml } = require('../src/main/reports/weeklyReport')
      const { buildMonthlyReportHtml } = require('../src/main/reports/monthlyReport')
      const { htmlToPdfFile } = require('../src/main/reports/pdfExport')
      const { dailyReportToDocx, weeklyReportToDocx, monthlyReportToDocx } = require('../src/main/reports/docxExport')

      const dailyEntries = db
        .prepare(
          `SELECT de.*, cp.name AS pointName FROM daily_entries de JOIN collection_points cp ON cp.id = de.pointId WHERE de.date = ?`
        )
        .all(date)
      const dailyHtml = await buildDailyReportHtml({ date, entries: dailyEntries })
      await htmlToPdfFile(dailyHtml, path.join(outDir, 'daily.pdf'))
      await dailyReportToDocx({ date, entries: dailyEntries }, path.join(outDir, 'daily.docx'))
      console.log('DAILY OK', fs.statSync(path.join(outDir, 'daily.pdf')).size, fs.statSync(path.join(outDir, 'daily.docx')).size)

      const weeklyRows = db
        .prepare(`SELECT * FROM weekly_movements WHERE weekStart = ? AND weekEnd = ?`)
        .all('2026-04-06', '2026-04-12')
      const weeklyHtml = await buildWeeklyReportHtml({ weekStart: '2026-04-06', weekEnd: '2026-04-12', rows: weeklyRows })
      await htmlToPdfFile(weeklyHtml, path.join(outDir, 'weekly.pdf'))
      await weeklyReportToDocx({ weekStart: '2026-04-06', weekEnd: '2026-04-12', rows: weeklyRows }, path.join(outDir, 'weekly.docx'))
      console.log('WEEKLY OK', fs.statSync(path.join(outDir, 'weekly.pdf')).size, fs.statSync(path.join(outDir, 'weekly.docx')).size)

      const departments = db.prepare('SELECT * FROM departments ORDER BY name').all()
      const gridValues = new Map()
      const gridRows = db.prepare('SELECT * FROM inventory_grid_values WHERE month = ?').all('2026-01')
      for (const r of gridRows) gridValues.set(`${r.tableId}|${r.departmentId}|${r.columnKey}`, r.value)
      const logEntries = new Map()
      const logRows = db.prepare('SELECT * FROM inventory_log_entries WHERE tableId = ? AND month = ?').all('T3_1', '2026-01')
      logEntries.set('T3_1', logRows.map((r) => JSON.parse(r.data)))

      const monthlyData = { month: '2026-01', departments, gridValues, logEntries }
      const monthlyHtml = await buildMonthlyReportHtml(monthlyData)
      await htmlToPdfFile(monthlyHtml, path.join(outDir, 'monthly.pdf'))
      await monthlyReportToDocx(monthlyData, path.join(outDir, 'monthly.docx'))
      console.log('MONTHLY OK', fs.statSync(path.join(outDir, 'monthly.pdf')).size, fs.statSync(path.join(outDir, 'monthly.docx')).size)

      console.log('E2E_SUCCESS', outDir)
      app.exit(0)
    } catch (err) {
      console.error('E2E_FAILURE', err)
      app.exit(1)
    }
  })()
})
