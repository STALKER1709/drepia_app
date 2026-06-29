import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { DailyReportData } from './dailyReport'
import { WeeklyReportData } from './weeklyReport'
import { buildWeeklySections } from './weeklyText'
import { MonthlyReportData } from './monthlyReport'
import { INVENTORY_TABLES, SECTIONS } from '@shared/inventoryTables'
import { GridTableDef, LogTableDef } from '@shared/types'
import { renderChartPng } from './charts'

function logoBuffer(): Buffer {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'minepia-logo.png')]
    : [
        path.join(__dirname, '..', '..', 'resources', 'minepia-logo.png'),
        path.join(__dirname, '..', '..', '..', 'resources', 'minepia-logo.png')
      ]
  const logoPath = candidates.find((p) => fs.existsSync(p)) ?? candidates[0]
  return fs.readFileSync(logoPath)
}

function letterheadParagraphs(): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: logoBuffer(), transformation: { width: 70, height: 70 } })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'REPUBLIQUE DU CAMEROUN', bold: true }),
        new TextRun({ text: '  -  Paix-Travail-Patrie' })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Delegation Regionale de l\'Elevage, des Peches et des Industries Animales - Region du Centre', italics: true })]
    })
  ]
}

function titleParagraph(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER })
}

function headingParagraph(text: string, level: typeof HeadingLevel.HEADING_2 = HeadingLevel.HEADING_2): Paragraph {
  return new Paragraph({ text, heading: level })
}

function simpleTable(headers: string[], rows: string[][]): Table {
  const mkRow = (cells: string[], header = false): TableRow =>
    new TableRow({
      children: cells.map(
        (c) =>
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: c, bold: header })] })],
            width: { size: 100 / cells.length, type: WidthType.PERCENTAGE }
          })
      )
    })
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [mkRow(headers, true), ...rows.map((r) => mkRow(r))]
  })
}

function imageParagraph(png: Buffer): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ data: png, transformation: { width: 500, height: 250 } })]
  })
}

async function saveDoc(children: Paragraph[] | Array<Paragraph | Table>, outPath: string): Promise<void> {
  const doc = new Document({
    sections: [{ children: children as Array<Paragraph | Table> }]
  })
  const buffer = await Packer.toBuffer(doc)
  fs.writeFileSync(outPath, buffer)
}

export async function dailyReportToDocx(data: DailyReportData, outPath: string): Promise<void> {
  const children: Array<Paragraph | Table> = [
    ...letterheadParagraphs(),
    titleParagraph('Veille de disponibilite des animaux et leurs produits'),
    new Paragraph({ text: `Donnees du ${new Date(data.date).toLocaleDateString('fr-FR')}`, alignment: AlignmentType.RIGHT })
  ]

  for (const [category, label] of [
    ['abattage', 'Abattages controles'],
    ['sur_pied', 'Animaux sur pied (arrivee)']
  ] as const) {
    const rows = data.entries.filter((r) => r.category === category)
    if (rows.length === 0) continue
    children.push(headingParagraph(label))
    children.push(
      simpleTable(
        ['Espece', 'Point de collecte', 'Nombre', 'Quantite (T)', 'Ecart', 'Tendance', 'Prix'],
        rows.map((r) => [
          r.species,
          r.pointName,
          String(r.nombre),
          String(r.quantiteT ?? '-'),
          String(r.ecart ?? '-'),
          r.tendance ?? '-',
          r.prix ?? '-'
        ])
      )
    )
    const png = await renderChartPng({
      type: 'bar',
      title: label,
      labels: rows.map((r) => r.species),
      datasets: [{ label: 'Nombre', data: rows.map((r) => r.nombre) }]
    })
    children.push(imageParagraph(png))
  }

  await saveDoc(children, outPath)
}

export async function weeklyReportToDocx(data: WeeklyReportData, outPath: string): Promise<void> {
  const sections = buildWeeklySections(data.rows)
  const fmt = (d: string): string => new Date(d).toLocaleDateString('fr-FR')
  const children: Array<Paragraph | Table> = [
    ...letterheadParagraphs(),
    titleParagraph("Situation hebdomadaire des activites dans les marches a betail, abattoirs et aires d'abattage de la Region du Centre"),
    new Paragraph({ text: `Semaine du ${fmt(data.weekStart)} au ${fmt(data.weekEnd)}`, alignment: AlignmentType.RIGHT })
  ]

  let counter = 1
  for (const sec of sections) {
    children.push(headingParagraph(`${counter}- Mouvements des ${sec.species} au marche de ${sec.marketName}`))
    const maxLen = Math.max(sec.entreeRows.length, sec.sortieRows.length, 1)
    const rows: string[][] = []
    for (let i = 0; i < maxLen; i++) {
      const e = sec.entreeRows[i]
      const s = sec.sortieRows[i]
      rows.push([e?.place ?? '', String(e?.effectif ?? ''), s?.place ?? '', String(s?.effectif ?? '')])
    }
    children.push(simpleTable(['Provenance', 'Effectif', 'Destination', 'Effectif'], rows))
    children.push(new Paragraph({ text: sec.analysis, alignment: AlignmentType.JUSTIFIED }))
    const png = await renderChartPng({
      type: 'bar',
      title: `${sec.species} - ${sec.marketName}`,
      labels: ['Entrees', 'Sorties'],
      datasets: [{ label: 'Effectif', data: [sec.totalEntree, sec.totalSortie] }]
    })
    children.push(imageParagraph(png))
    counter++
  }

  await saveDoc(children, outPath)
}

export async function monthlyReportToDocx(data: MonthlyReportData, outPath: string): Promise<void> {
  const monthLabel = new Date(`${data.month}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const children: Array<Paragraph | Table> = [
    ...letterheadParagraphs(),
    titleParagraph('Inventaire statistique mensuel - Region du Centre'),
    new Paragraph({ text: `Periode : ${monthLabel}`, alignment: AlignmentType.RIGHT })
  ]

  for (const section of SECTIONS) {
    children.push(headingParagraph(section))
    const tables = INVENTORY_TABLES.filter((t) => t.section === section)
    for (const t of tables) {
      children.push(new Paragraph({ text: t.title, heading: HeadingLevel.HEADING_3 }))
      if (t.note) children.push(new Paragraph({ children: [new TextRun({ text: t.note, italics: true })] }))
      if (t.kind === 'grid') {
        const def = t as GridTableDef
        children.push(
          simpleTable(
            ['Departement', ...def.columns.map((c) => c.label)],
            data.departments.map((d) => [
              d.name,
              ...def.columns.map((c) => String(data.gridValues.get(`${def.id}|${d.id}|${c.key}`) ?? 0))
            ])
          )
        )
      } else {
        const def = t as LogTableDef
        const rows = data.logEntries.get(def.id) || []
        if (rows.length > 0) {
          children.push(
            simpleTable(
              def.fields.map((f) => f.label),
              rows.map((r) => def.fields.map((f) => String(r[f.key] ?? '')))
            )
          )
        } else {
          children.push(
            new Paragraph({ children: [new TextRun({ text: 'Aucune donnee saisie pour ce tableau ce mois-ci.', italics: true })] })
          )
        }
      }
    }
  }

  await saveDoc(children, outPath)
}
