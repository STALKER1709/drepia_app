import { TableDef } from './types'

/**
 * Definitions of the 28 tables of the monthly "Inventaire" report.
 * Grid tables = one row per department, values per column.
 * Log tables = free-form rows (events, movements) entered by the user.
 * This mirrors the structure of the uploaded "Inventaire_janvier_2026.docx".
 */
export const INVENTORY_TABLES: TableDef[] = [
  {
    kind: 'grid', id: 'T1_1', section: 'SECTION 1: PRODUCTION ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 1.1: Effectifs du cheptel', rowScope: 'department',
    columns: ['Bovins', 'Ovins', 'Caprins', 'Porcins', 'Asins', 'Lapins', 'Felins', 'Canins', 'Escargots', 'Camelins', 'Aulacodes', 'Cobayes', 'Primates', 'Equins', 'Mouches', 'Tortues', 'Rats']
      .map((l) => ({ key: l.toLowerCase(), label: l }))
  },
  {
    kind: 'grid', id: 'T1_2', section: 'SECTION 1: PRODUCTION ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 1.2: Effectif de la volaille', rowScope: 'department',
    columns: ['Poulet de chair', 'Poulet ponte', 'Poulet villageois', 'Autres volailles']
      .map((l) => ({ key: l.toLowerCase().replace(/\s+/g, '_'), label: l }))
  },
  {
    kind: 'grid', id: 'T1_3', section: 'SECTION 1: PRODUCTION ANIMALES ET HALIEUTIQUES',
    title: "Tableau 1.3: Production locale de poussins d'un jour",
    note: 'Les reproducteurs sont les poules et les coqs destines a produire les oeufs a couver.',
    rowScope: 'department',
    columns: [
      { key: 'repro_ponte', label: 'Effectif reproducteurs', group: 'Ponte' },
      { key: 'repro_chair', label: 'Effectif reproducteurs', group: 'Chair' },
      { key: 'oeufs_couver_ponte', label: "Oeufs a couver produits", group: 'Ponte' },
      { key: 'oeufs_couver_chair', label: "Oeufs a couver produits", group: 'Chair' },
      { key: 'poussins_ponte', label: "Poussins d'un jour produits", group: 'Ponte' },
      { key: 'poussins_chair', label: "Poussins d'un jour produits", group: 'Chair' }
    ]
  },
  {
    kind: 'grid', id: 'T1_4', section: 'SECTION 1: PRODUCTION ANIMALES ET HALIEUTIQUES',
    title: "Tableau 1.4: Production d'oeufs de table", rowScope: 'department',
    columns: [
      { key: 'pondeuses_presentes', label: 'Pondeuses presentes' },
      { key: 'poules_reformees', label: 'Poules reformees' },
      { key: 'oeufs_produits', label: "Nombre d'oeufs produits" }
    ]
  },
  {
    kind: 'grid', id: 'T1_5', section: 'SECTION 1: PRODUCTION ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 1.5: Production de poulets de chair', rowScope: 'department',
    columns: [
      { key: 'chair_present', label: 'Poulets presents', group: 'Elevage chair' },
      { key: 'chair_sortis', label: 'Poulets sortis', group: 'Elevage chair' },
      { key: 'pondeuses_present', label: 'Pondeuses presentes', group: 'Elevage pondeuses' },
      { key: 'pondeuses_reforme', label: 'Reformees', group: 'Elevage pondeuses' },
      { key: 'oeufs_produits', label: "Oeufs produits", group: 'Elevage pondeuses' }
    ]
  },
  {
    kind: 'grid', id: 'T1_6', section: 'SECTION 1: PRODUCTION ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 1.6: Production de la peche de capture (en tonnes)', rowScope: 'department',
    columns: [
      { key: 'peche_continentale', label: 'Peche continentale' },
      { key: 'peche_maritime_artisanale', label: 'Peche maritime artisanale et semi-industrielle' },
      { key: 'peche_maritime_industrielle', label: 'Peche maritime industrielle' }
    ]
  },
  {
    kind: 'grid', id: 'T1_7', section: 'SECTION 1: PRODUCTION ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 1.7: Production de poissons de la pisciculture', rowScope: 'department',
    columns: [
      { key: 'etangs_actifs', label: 'Etangs actifs' },
      { key: 'etangs_inactifs', label: 'Etangs inactifs' },
      { key: 'superficies_m2', label: 'Superficies (m2)' },
      { key: 'tilapia', label: 'Tilapia' },
      { key: 'poisson_vipere', label: 'Poisson vipere' },
      { key: 'silure', label: 'Silure' },
      { key: 'kanga', label: 'Kanga' },
      { key: 'clarias', label: 'Clarias' },
      { key: 'carpes', label: 'Carpes' },
      { key: 'kabila', label: 'Kabila' },
      { key: 'production_tonnes', label: 'Production de poisson (T)' }
    ]
  },
  {
    kind: 'grid', id: 'T2_1', section: 'SECTION 2: INDUSTRIES ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 2.1: Statistiques sur les abattages controles', rowScope: 'department',
    note: 'Valeurs calculees automatiquement a partir des abattages controles saisis dans la Saisie journaliere.',
    columns: ['Bovins abattus', 'Ovins abattus', 'Caprins abattus', 'Porcins abattus', 'Volaille abattue']
      .map((l) => ({ key: l.toLowerCase().replace(/\s+/g, '_'), label: l }))
  },
  {
    kind: 'grid', id: 'T2_2', section: 'SECTION 2: INDUSTRIES ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 2.2: Production de provende (en tonnes)', rowScope: 'department',
    columns: ['Poulet chair', 'Poulet ponte', 'Porc', 'Bovins', 'Poisson', 'Lapin', 'Cheval']
      .map((l) => ({ key: l.toLowerCase().replace(/\s+/g, '_'), label: l, group: 'Aliments complets' }))
  },
  {
    kind: 'grid', id: 'T2_3', section: 'SECTION 2: INDUSTRIES ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 2.3: Champs fourragers', rowScope: 'department',
    columns: [
      { key: 'nombre_champs', label: 'Nombre de champs fourragers' },
      { key: 'superficie_ha', label: 'Superficie (Ha) totale' },
      { key: 'production_foin', label: 'Production de foin (T)' }
    ]
  },
  {
    kind: 'grid', id: 'T2_4', section: 'SECTION 2: INDUSTRIES ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 2.4: Production de lait, de la peau et du miel', rowScope: 'department',
    columns: [
      { key: 'lait_frais', label: 'Lait frais (litre)' },
      { key: 'peaux_bovin', label: 'Peaux bovin' },
      { key: 'peaux_petits_ruminants', label: 'Peaux petits ruminants' },
      { key: 'miel', label: 'Miel (litre)' }
    ]
  },
  {
    kind: 'grid', id: 'T2_5', section: 'SECTION 2: INDUSTRIES ANIMALES ET HALIEUTIQUES',
    title: 'Tableau 2.5: Industries animales et halieutiques (transformation)', rowScope: 'department',
    columns: [
      { key: 'transfo_viande', label: 'Viande transformee (T)' },
      { key: 'transfo_lait', label: 'Lait transforme (litre)' },
      { key: 'transfo_peaux', label: 'Peaux transformees (unite)' },
      { key: 'transfo_poisson_fume', label: 'Poisson fume (T)' }
    ]
  },
  {
    kind: 'log', id: 'T3_1', section: 'SECTION 3: SERVICES VETERINAIRES',
    title: 'Tableau 3.1: Protection sanitaire',
    fields: [
      { key: 'departement', label: 'Departement', type: 'text' },
      { key: 'maladie', label: 'Maladie', type: 'text' },
      { key: 'localisation', label: 'Localisation', type: 'text' },
      { key: 'foyers', label: 'Nombre de foyers', type: 'number' },
      { key: 'touche', label: 'Effectif touche', type: 'number' },
      { key: 'morts', label: 'Animaux morts', type: 'number' },
      { key: 'saisie', label: 'Animaux saisis', type: 'number' },
      { key: 'mesures', label: 'Mesures prises', type: 'text' }
    ]
  },
  {
    kind: 'log', id: 'T3_2', section: 'SECTION 3: SERVICES VETERINAIRES',
    title: 'Tableau 3.2: Vaccinations par les services du MINEPIA',
    fields: [
      { key: 'departement', label: 'Departement', type: 'text' },
      { key: 'maladie', label: 'Maladie', type: 'text' },
      { key: 'espece', label: 'Espece', type: 'text' },
      { key: 'vaccin', label: 'Vaccin utilise', type: 'text' },
      { key: 'effectif_vaccine', label: 'Effectif vaccine', type: 'number' },
      { key: 'localites', label: 'Localites', type: 'text' }
    ]
  },
  {
    kind: 'log', id: 'T3_3', section: 'SECTION 3: SERVICES VETERINAIRES',
    title: 'Tableau 3.3: Activites des cliniques et partenaires prives',
    fields: [
      { key: 'departement', label: 'Departement', type: 'text' },
      { key: 'clinique', label: 'Clinique / Partenaire prive', type: 'text' },
      { key: 'activite', label: 'Activite', type: 'text' },
      { key: 'espece', label: 'Espece', type: 'text' },
      { key: 'maladie', label: 'Maladie', type: 'text' },
      { key: 'effectif', label: 'Effectif', type: 'number' }
    ]
  },
  {
    kind: 'log', id: 'T3_4', section: 'SECTION 3: SERVICES VETERINAIRES',
    title: "Tableau 3.4: Inspection des denrees d'origine animale et halieutique",
    fields: [
      { key: 'departement', label: 'Departement', type: 'text' },
      { key: 'denree', label: 'Denree', type: 'text' },
      { key: 'qte_inspectee', label: 'Quantite inspectee', type: 'number' },
      { key: 'qte_saisie', label: 'Quantite saisie', type: 'number' },
      { key: 'unite', label: 'Unite', type: 'text' }
    ]
  },
  {
    kind: 'log', id: 'T4_1', section: 'SECTION 4: IMPORT/EXPORT/TRANSIT DE BETAIL',
    title: 'Tableau 4.1: Exportation de betail sur pied',
    note: "Animaux d'origine camerounaise sortant du territoire national.",
    fields: [
      { key: 'departement', label: 'Departement', type: 'text' },
      { key: 'espece', label: 'Espece', type: 'text' },
      { key: 'provenance', label: 'Point de provenance', type: 'text' },
      { key: 'destination', label: 'Destination', type: 'text' },
      { key: 'effectif', label: 'Effectif', type: 'number' }
    ]
  },
  {
    kind: 'log', id: 'T4_3', section: 'SECTION 4: IMPORT/EXPORT/TRANSIT DE BETAIL',
    title: 'Tableau 4.3: Circulation interne',
    note: "Animaux qui partent d'un departement a un autre.",
    fields: [
      { key: 'departement', label: 'Departement', type: 'text' },
      { key: 'espece', label: 'Espece', type: 'text' },
      { key: 'provenance', label: 'Point de provenance', type: 'text' },
      { key: 'destination', label: 'Ville de destination', type: 'text' },
      { key: 'mode', label: 'Mode de deplacement', type: 'text' },
      { key: 'effectif', label: 'Effectif', type: 'number' }
    ]
  },
  {
    kind: 'log', id: 'T4_4', section: 'SECTION 4: IMPORT/EXPORT/TRANSIT DE BETAIL',
    title: 'Tableau 4.4: Circulation externe',
    note: "Animaux qui partent d'une Region a une autre.",
    fields: [
      { key: 'departement', label: 'Departement', type: 'text' },
      { key: 'espece', label: 'Espece', type: 'text' },
      { key: 'depart', label: 'Point de depart', type: 'text' },
      { key: 'destination', label: 'Ville de destination', type: 'text' },
      { key: 'mode', label: 'Mode de deplacement', type: 'text' },
      { key: 'effectif', label: 'Effectif', type: 'number' }
    ]
  },
  {
    kind: 'log', id: 'T4_5', section: 'SECTION 4: IMPORT/EXPORT/TRANSIT DE BETAIL',
    title: 'Mouvement interieur des animaux',
    fields: [
      { key: 'espece', label: 'Espece', type: 'text' },
      { key: 'point_depart', label: 'Point de depart', type: 'text' },
      { key: 'destination', label: 'Destination', type: 'text' },
      { key: 'mode', label: 'Mode de deplacement', type: 'text' },
      { key: 'effectif', label: 'Effectif mois en cours', type: 'number' }
    ]
  },
  {
    kind: 'log', id: 'T4_6', section: 'SECTION 4: IMPORT/EXPORT/TRANSIT DE BETAIL',
    title: 'Debarquements',
    fields: [
      { key: 'espece', label: 'Espece', type: 'text' },
      { key: 'point_debarquement', label: 'Point de debarquement', type: 'text' },
      { key: 'provenance', label: 'Provenance', type: 'text' },
      { key: 'mode', label: 'Mode de deplacement', type: 'text' },
      { key: 'effectif', label: 'Effectif mois en cours', type: 'number' }
    ]
  },
  {
    kind: 'grid', id: 'T5_1', section: 'SECTION 5: INSPECTION - VIANDES ET DERIVES',
    title: 'Tableau 5.1: Inspection viandes et derives (volet 1)', rowScope: 'department',
    columns: [
      { key: 'bovine_inspectee', label: 'Qte inspectee', group: 'Viande bovine (T)' },
      { key: 'bovine_saisie', label: 'Qte saisie', group: 'Viande bovine (T)' },
      { key: 'volaille_inspectee', label: 'Qte inspectee', group: 'Viande de volailles (T)' },
      { key: 'volaille_saisie', label: 'Qte saisie', group: 'Viande de volailles (T)' },
      { key: 'porcine_inspectee', label: 'Qte inspectee', group: 'Viande porcine (T)' },
      { key: 'porcine_saisie', label: 'Qte saisie', group: 'Viande porcine (T)' },
      { key: 'ovine_inspectee', label: 'Qte inspectee', group: 'Viande ovine (T)' },
      { key: 'ovine_saisie', label: 'Qte saisie', group: 'Viande ovine (T)' },
      { key: 'petits_ruminants_inspectee', label: 'Qte inspectee', group: 'Viande petits ruminants (T)' },
      { key: 'petits_ruminants_saisie', label: 'Qte saisie', group: 'Viande petits ruminants (T)' },
      { key: 'derives_inspectee', label: 'Qte inspectee', group: 'Derives de viande (T)' },
      { key: 'derives_saisie', label: 'Qte saisie', group: 'Derives de viande (T)' },
      { key: 'poisson_frais_inspectee', label: 'Qte inspectee', group: 'Poissons frais (T)' },
      { key: 'poisson_frais_saisie', label: 'Qte saisie', group: 'Poissons frais (T)' },
      { key: 'miel_inspectee', label: 'Qte inspectee', group: 'Miel (litre)' },
      { key: 'miel_saisie', label: 'Qte saisie', group: 'Miel (litre)' }
    ]
  },
  {
    kind: 'grid', id: 'T5_2', section: 'SECTION 5: INSPECTION - VIANDES ET DERIVES',
    title: 'Tableau 5.2: Inspection - poissons, conserves, oeufs, lait', rowScope: 'department',
    columns: [
      { key: 'poisson_congele_inspectee', label: 'Qte inspectee', group: 'Poissons congeles (T)' },
      { key: 'poisson_congele_saisie', label: 'Qte saisie', group: 'Poissons congeles (T)' },
      { key: 'conserves_inspectee', label: 'Qte inspectee', group: 'Conserves (boites)' },
      { key: 'conserves_saisie', label: 'Qte saisie', group: 'Conserves (boites)' },
      { key: 'oeuf_table_inspectee', label: 'Qte inspectee', group: 'Oeufs de table (unite)' },
      { key: 'oeuf_table_saisie', label: 'Qte saisie', group: 'Oeufs de table (unite)' },
      { key: 'derives_poisson_inspectee', label: 'Qte inspectee', group: 'Derives de poisson (T)' },
      { key: 'derives_poisson_saisie', label: 'Qte saisie', group: 'Derives de poisson (T)' },
      { key: 'lait_poudre_inspectee', label: 'Qte inspectee', group: 'Lait en poudre (pieces)' },
      { key: 'lait_poudre_saisie', label: 'Qte saisie', group: 'Lait en poudre (pieces)' },
      { key: 'lait_concentre_inspectee', label: 'Qte inspectee', group: 'Lait concentre (boites)' },
      { key: 'lait_concentre_saisie', label: 'Qte saisie', group: 'Lait concentre (boites)' },
      { key: 'charcuterie_inspectee', label: 'Qte inspectee', group: 'Produits de charcuterie (T)' },
      { key: 'charcuterie_saisie', label: 'Qte saisie', group: 'Produits de charcuterie (T)' },
      { key: 'sardine_inspectee', label: 'Qte inspectee', group: 'Sardine (T)' },
      { key: 'sardine_saisie', label: 'Qte saisie', group: 'Sardine (T)' }
    ]
  },
  {
    kind: 'grid', id: 'T5_3', section: 'SECTION 5: INSPECTION - VIANDES ET DERIVES',
    title: 'Tableau 5.3: Inspection - conserves diverses', rowScope: 'department',
    columns: [
      { key: 'boites_conserve_inspectee', label: 'Qte inspectee', group: 'Boites de conserve' },
      { key: 'boites_conserve_saisie', label: 'Qte saisie', group: 'Boites de conserve' },
      { key: 'beurres_inspectee', label: 'Qte inspectee', group: 'Beurres (boites)' },
      { key: 'beurres_saisie', label: 'Qte saisie', group: 'Beurres (boites)' },
      { key: 'mayonnaise_inspectee', label: 'Qte inspectee', group: 'Mayonnaise (T)' },
      { key: 'mayonnaise_saisie', label: 'Qte saisie', group: 'Mayonnaise (T)' },
      { key: 'biscuits_inspectee', label: 'Qte inspectee', group: 'Biscuits (T)' },
      { key: 'biscuits_saisie', label: 'Qte saisie', group: 'Biscuits (T)' },
      { key: 'crevettes_inspectee', label: 'Qte inspectee', group: 'Crevettes (T)' },
      { key: 'crevettes_saisie', label: 'Qte saisie', group: 'Crevettes (T)' },
      { key: 'crabe_inspectee', label: 'Qte inspectee', group: 'Crabe (T)' },
      { key: 'crabe_saisie', label: 'Qte saisie', group: 'Crabe (T)' },
      { key: 'yaourt_inspectee', label: 'Qte inspectee', group: 'Yaourt (pots)' },
      { key: 'yaourt_saisie', label: 'Qte saisie', group: 'Yaourt (pots)' },
      { key: 'fromagerie_inspectee', label: 'Qte inspectee', group: 'Fromagerie (T)' },
      { key: 'fromagerie_saisie', label: 'Qte saisie', group: 'Fromagerie (T)' },
      { key: 'fromage_inspectee', label: 'Qte inspectee', group: 'Fromage (T)' },
      { key: 'fromage_saisie', label: 'Qte saisie', group: 'Fromage (T)' }
    ]
  },
  {
    kind: 'grid', id: 'T5_4', section: 'SECTION 5: INSPECTION - VIANDES ET DERIVES',
    title: 'Tableau 5.4: Inspection - carcasses et produits braises', rowScope: 'department',
    columns: [
      { key: 'poisson_etang_inspectee', label: 'Qte inspectee', group: "Poisson d'etang (T)" },
      { key: 'poisson_etang_saisie', label: 'Qte saisie', group: "Poisson d'etang (T)" },
      { key: 'carcasse_bovine_inspectee', label: 'Qte inspectee', group: 'Carcasse bovine (tete)' },
      { key: 'carcasse_bovine_saisie', label: 'Qte saisie', group: 'Carcasse bovine (tete)' },
      { key: 'carcasse_ovine_inspectee', label: 'Qte inspectee', group: 'Carcasse ovine (tete)' },
      { key: 'carcasse_ovine_saisie', label: 'Qte saisie', group: 'Carcasse ovine (tete)' },
      { key: 'carcasse_porcine_inspectee', label: 'Qte inspectee', group: 'Carcasse porcine (tete)' },
      { key: 'carcasse_porcine_saisie', label: 'Qte saisie', group: 'Carcasse porcine (tete)' },
      { key: 'carcasse_volaille_inspectee', label: 'Qte inspectee', group: 'Carcasse volaille (tete)' },
      { key: 'carcasse_volaille_saisie', label: 'Qte saisie', group: 'Carcasse volaille (tete)' },
      { key: 'porc_braise_inspectee', label: 'Qte inspectee', group: 'Porc braise (Kg)' },
      { key: 'porc_braise_saisie', label: 'Qte saisie', group: 'Porc braise (Kg)' },
      { key: 'poulet_braise_inspectee', label: 'Qte inspectee', group: 'Poulet braise (Kg)' },
      { key: 'poulet_braise_saisie', label: 'Qte saisie', group: 'Poulet braise (Kg)' },
      { key: 'poulet_congele_inspectee', label: 'Qte inspectee', group: 'Poulet congele/PAC (Kg)' },
      { key: 'poulet_congele_saisie', label: 'Qte saisie', group: 'Poulet congele/PAC (Kg)' },
      { key: 'saucisson_inspectee', label: 'Qte inspectee', group: 'Saucisson (Kg)' },
      { key: 'saucisson_saisie', label: 'Qte saisie', group: 'Saucisson (Kg)' }
    ]
  },
  {
    kind: 'grid', id: 'T5_5', section: 'SECTION 5: INSPECTION - VIANDES ET DERIVES',
    title: 'Tableau 5.5: Inspection - decoupes et gibier', rowScope: 'department',
    columns: [
      { key: 'decoupe_poulet_inspectee', label: 'Qte inspectee', group: 'Decoupe de poulets (Kg)' },
      { key: 'decoupe_poulet_saisie', label: 'Qte saisie', group: 'Decoupe de poulets (Kg)' },
      { key: 'viande_brousse_inspectee', label: 'Qte inspectee', group: 'Viande de brousse fumee (Kg)' },
      { key: 'viande_brousse_saisie', label: 'Qte saisie', group: 'Viande de brousse fumee (Kg)' },
      { key: 'peaux_inspectee', label: 'Qte inspectee', group: 'Peaux (unite)' },
      { key: 'peaux_saisie', label: 'Qte saisie', group: 'Peaux (unite)' },
      { key: 'gibier_inspectee', label: 'Qte inspectee', group: 'Gibier (T)' },
      { key: 'gibier_saisie', label: 'Qte saisie', group: 'Gibier (T)' },
      { key: 'chocolat_inspectee', label: 'Qte inspectee', group: 'Chocolat (boites)' },
      { key: 'chocolat_saisie', label: 'Qte saisie', group: 'Chocolat (boites)' },
      { key: 'boeuf_fume_inspectee', label: 'Qte inspectee', group: 'Viande de boeuf fume (T)' },
      { key: 'boeuf_fume_saisie', label: 'Qte saisie', group: 'Viande de boeuf fume (T)' },
      { key: 'mackerels_inspectee', label: 'Qte inspectee', group: 'Mackerels (T)' },
      { key: 'mackerels_saisie', label: 'Qte saisie', group: 'Mackerels (T)' },
      { key: 'caprine_inspectee', label: 'Qte inspectee', group: 'Viande caprine (T)' },
      { key: 'caprine_saisie', label: 'Qte saisie', group: 'Viande caprine (T)' },
      { key: 'jambon_inspectee', label: 'Qte inspectee', group: 'Jambon (T)' },
      { key: 'jambon_saisie', label: 'Qte saisie', group: 'Jambon (T)' }
    ]
  }
]

export const SECTIONS = Array.from(new Set(INVENTORY_TABLES.map((t) => t.section)))
