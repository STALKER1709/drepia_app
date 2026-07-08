# DREPIA Rapports

Application desktop offline (Electron + React + SQLite) pour la saisie des donnees
et la generation automatique des rapports **journaliers**, **hebdomadaires** et
**mensuels** de la Delegation Regionale de l'Elevage, des Peches et des Industries
Animales (DREPIA) - Region du Centre.

## Fonctionnalites

- Connexion avec roles : Administrateur, Agent de saisie, Superviseur, Lecture seule.
- Saisie journaliere : organisee en 4 sections (abattages controles, animaux sur
  pied, porcins & poulet de chair, petits ruminants) fideles a la "Veille de
  disponibilite".
- Saisie hebdomadaire : module independant de saisie des mouvements de marche
  (entrees/sorties par marche et espece, provenance/destination, prix moyen). Le
  rapport hebdomadaire est genere directement a partir de ces donnees.
- Saisie mensuelle : les 28 tableaux de l'inventaire statistique (cheptel, volailles,
  peche, abattages, services veterinaires, import/export...), pilotee par des
  definitions de tableaux generiques (`src/shared/inventoryTables.ts`). Le tableau
  des abattages controles est calcule automatiquement a partir de la saisie
  journaliere.
- Generation en un clic des rapports avec tableaux fideles aux documents officiels
  et graphes (Chart.js), exportes simultanement en **PDF** et **Word (.docx)**.
- Fonctionnement 100% hors-ligne (base SQLite locale).

## Demarrage

```bash
npm install
npm run dev      # mode developpement
npm run build    # compilation
npm run dist      # generation de l'installeur (electron-builder)
```

## Comptes par defaut (a changer apres la premiere connexion)

| Identifiant   | Mot de passe      | Role           |
|---------------|-------------------|----------------|
| admin         | admin123          | Administrateur |
| agent         | agent123          | Agent de saisie|
| superviseur   | superviseur123    | Superviseur    |

## Architecture

- `src/main` : process principal Electron (base SQLite, authentification, IPC,
  generation des rapports PDF/DOCX, rendu des graphes).
- `src/preload` : pont securise expose au renderer (`window.api`).
- `src/renderer` : interface React (saisie, generation des rapports, administration).
- `src/shared` : types et definitions de tableaux partages entre main et renderer.

Les rapports generes (PDF + Word) sont enregistres dans le dossier
`Documents/DREPIA_Rapports` de l'utilisateur.
