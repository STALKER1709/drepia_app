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
      const etoudiPoint = db.prepare("SELECT * FROM collection_points WHERE name LIKE '%Etoudi%'").get() || point
      const admin = db.prepare("SELECT * FROM users WHERE username = 'admin'").get()

      const date = '2026-04-11'
      db.prepare(
        `INSERT INTO daily_entries (date, species, pointId, category, nombre, quantiteT, ecart, tendance, prix, direction, place, createdBy)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
      ).run(date, 'Bovine', point.id, 'abattage', 124, 24.18, -16.77, 'BAISSE', '2500 Fcfa', 'entree', null, admin.id)

      // Weekly market movements are now captured as daily entries (direction + place)
      // instead of a separate weekly entry, then rolled up for the weekly report.
      db.prepare(
        `INSERT INTO daily_entries (date, species, pointId, category, nombre, direction, place, createdBy)
         VALUES (?,?,?,?,?,?,?,?)`
      ).run('2026-04-08', 'bovins', etoudiPoint.id, 'sur_pied', 1300, 'entree', 'ADAMAOUA', admin.id)
      db.prepare(
        `INSERT INTO daily_entries (date, species, pointId, category, nombre, direction, place, createdBy)
         VALUES (?,?,?,?,?,?,?,?)`
      ).run('2026-04-09', 'bovins', etoudiPoint.id, 'sur_pied', 120, 'sortie', 'KYE-OSI', admin.id)

      db.prepare(
        `INSERT INTO inventory_grid_values (tableId, month, departmentId, columnKey, value) VALUES (?,?,?,?,?)`
      ).run('T1_1', '2026-01', dept.id, 'bovins', 15343)
      // Tableau 2.1 (Abattages controles) is now derived from daily abattage entries
      // instead of being entered directly into inventory_grid_values.
      db.prepare(
        `INSERT INTO daily_entries (date, species, pointId, category, nombre, direction, place, createdBy)
         VALUES (?,?,?,?,?,?,?,?)`
      ).run('2026-01-15', 'Bovins', point.id, 'abattage', 152, 'entree', null, admin.id)
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

      const weekStart = '2026-04-06'
      const weekEnd = '2026-04-12'
      const weeklyDailyRows = db
        .prepare(
          `SELECT de.*, cp.name AS pointName FROM daily_entries de
           JOIN collection_points cp ON cp.id = de.pointId
           WHERE de.date >= ? AND de.date <= ? AND de.place IS NOT NULL AND de.place != ''`
        )
        .all(weekStart, weekEnd)
      const weeklyRows = weeklyDailyRows.map((r) => ({
        weekStart,
        weekEnd,
        marketName: r.pointName,
        species: r.species,
        direction: r.direction === 'sortie' ? 'sortie' : 'entree',
        place: r.place,
        effectif: r.nombre,
        prixMoyen: r.prix
      }))
      const weeklyHtml = await buildWeeklyReportHtml({ weekStart, weekEnd, rows: weeklyRows })
      await htmlToPdfFile(weeklyHtml, path.join(outDir, 'weekly.pdf'))
      await weeklyReportToDocx({ weekStart, weekEnd, rows: weeklyRows }, path.join(outDir, 'weekly.docx'))
      console.log('WEEKLY OK', fs.statSync(path.join(outDir, 'weekly.pdf')).size, fs.statSync(path.join(outDir, 'weekly.docx')).size)

      const { computeAbattageGrid } = require('../src/main/reports/abattageAggregation')
      const departments = db.prepare('SELECT * FROM departments ORDER BY name').all()
      const gridValues = new Map()
      const gridRows = db
        .prepare('SELECT * FROM inventory_grid_values WHERE month = ? AND tableId != ?')
        .all('2026-01', 'T2_1')
      for (const r of gridRows) gridValues.set(`${r.tableId}|${r.departmentId}|${r.columnKey}`, r.value)
      for (const r of computeAbattageGrid(db, '2026-01')) gridValues.set(`T2_1|${r.departmentId}|${r.columnKey}`, r.value)
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
