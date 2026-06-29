import fs from 'fs'
import path from 'path'
import { app } from 'electron'

function logoDataUri(): string {
  const candidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'minepia-logo.png')]
    : [
        path.join(__dirname, '..', '..', 'resources', 'minepia-logo.png'),
        path.join(__dirname, '..', '..', '..', 'resources', 'minepia-logo.png')
      ]
  const logoPath = candidates.find((p) => fs.existsSync(p)) ?? candidates[0]
  const base64 = fs.readFileSync(logoPath).toString('base64')
  return `data:image/png;base64,${base64}`
}

export function pageShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: 'Times New Roman', Georgia, serif; font-size: 12px; color: #111; }
  .letterhead { display: flex; justify-content: space-between; align-items: center; font-size: 10px; text-align: center; margin-bottom: 16px; }
  .letterhead div { width: 40%; white-space: pre-line; }
  .letterhead img { width: 70px; height: 70px; object-fit: contain; }
  h1 { font-size: 16px; text-align: center; text-transform: uppercase; margin: 18px 0; }
  h2 { font-size: 14px; border-bottom: 1px solid #1f6f3d; padding-bottom: 2px; margin-top: 22px; color: #1f6f3d; }
  h3 { font-size: 13px; margin-top: 14px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 11px; }
  th, td { border: 1px solid #888; padding: 3px 5px; text-align: center; }
  th { background: #eef5ee; font-weight: bold; }
  td.label, th.label { text-align: left; }
  p.analysis { text-align: justify; margin: 6px 0 14px; }
  .chart-img { display: block; margin: 10px auto; max-width: 100%; }
  .section-title { background: #1f6f3d; color: white; padding: 4px 8px; font-size: 13px; margin-top: 24px; }
  .meta { text-align: right; font-size: 11px; margin-bottom: 10px; }
  .footer-note { font-size: 10px; color: #555; margin-top: 4px; }
</style>
</head>
<body>
<div class="letterhead">
  <div>REPUBLIQUE DU CAMEROUN
Paix-Travail-Patrie
------
REGION DU CENTRE
------
DELEGATION REGIONALE DE L'ELEVAGE,
DES PECHES ET DES INDUSTRIES ANIMALES
------
SERVICE DES ENQUETES ET DES STATISTIQUES</div>
  <img src="${logoDataUri()}" alt="Logo MINEPIA" />
  <div>REPUBLIC OF CAMEROON
Peace-Work-Fatherland
------
CENTRE REGION
------
REGIONAL DELEGATION OF LIVESTOCK,
FISHERIES AND ANIMAL INDUSTRIES
------
SERVICE OF SURVEYS AND STATISTICS</div>
</div>
${bodyHtml}
</body>
</html>`
}

export function imgTag(base64Png: string, alt: string): string {
  return `<img class="chart-img" src="data:image/png;base64,${base64Png}" alt="${alt}" />`
}
