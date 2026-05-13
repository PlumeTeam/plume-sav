// Modèle de données de la checklist diagnostic technique atelier (v2).
// Inspiré de la procédure AIRDESIGN (Nachprüfanweisung) mais adapté à Plume.
//
// Stocké sous forme JSON dans service_requests.workshop_checklist avec le
// discriminator `version: 2`. Les anciens payloads (sans version, structure
// { checkedIds, notes }) restent lisibles mais ne sont plus produits.

import { z } from 'zod'

// ─── Types ───────────────────────────────────────────────────────────────────

export type Instrument = 'jdc' | 'kretschmer'
export type PorositySeverity =
  | 'new'        // 🟢 Neuf
  | 'good'       // 🟢 Bon
  | 'worn'       // 🟡 Usé
  | 'very_worn'  // 🟠 Très usé
  | 'critical'   // 🔴 Critique

export type OverallState =
  | 'new'             // Neuf
  | 'good'            // Bon
  | 'worn_ok'         // Usé conforme
  | 'very_worn'       // Très usé — contrôle rapproché
  | 'not_airworthy'   // Non navigable

export type BinaryGoodDefect = 'good' | 'defect'
export type SpeedSystemState = 'ok' | 'ko' | 'na'
export type RiserGeneralState = 'good' | 'worn' | 'damaged'

export type RuptureLineKey =
  | 'main_a' | 'main_b' | 'middle_a' | 'middle_b' | 'top_a' | 'top_b'

export const RUPTURE_LINE_LABELS: Record<RuptureLineKey, string> = {
  main_a:   'Main A',
  main_b:   'Main B',
  middle_a: 'Middle A',
  middle_b: 'Middle B',
  top_a:    'Top A',
  top_b:    'Top B',
}

export interface PorosityMeasurements {
  centralCell:  number | null   // secondes
  cell5Left:    number | null
  cell5Right:   number | null
  cell10Left:   number | null
  cell10Right:  number | null
  trailingEdge: number | null
}

export interface VisualPanel {
  tears:                  boolean | null
  stretchedZones:         boolean | null
  wear:                   boolean | null
  coatingDefect:          boolean | null
  previousRepairs:        boolean | null
  previousRepairsDetail:  string
}

export interface RuptureTest {
  line:          RuptureLineKey
  ruptureValue:  number | null  // daN
  conform:       boolean | null
}

export interface WorkshopChecklistPayload {
  version: 2
  identification: {
    certificationLabelPresent: boolean | null
    serialNumberVerified:      boolean | null
  }
  canopy: {
    porosity: {
      instrument:   Instrument | null
      measurements: PorosityMeasurements
    }
    tearResistance: {
      extradosG: number | null
      intradosG: number | null
    }
    visualExtrados: VisualPanel
    visualIntrados: VisualPanel
    internalRibs: {
      seams:           BinaryGoodDefect | null
      partitions:      BinaryGoodDefect | null
      reinforcements: BinaryGoodDefect | null
    }
  }
  risers: {
    generalState:     RiserGeneralState | null
    seams:            boolean | null
    maillonsClosed:   boolean | null
    speedSystem:      SpeedSystemState | null
    brakePulleys:     boolean | null
    lengthsConform:   boolean | null
    lengthsDeviation: number | null  // mm
  }
  lines: {
    ruptureTests: RuptureTest[]
    visual: {
      seams:           BinaryGoodDefect | null
      sheathsIntact:   boolean | null
      wearZones:       boolean | null
      wearLocation:    string
      lengthsConform:  boolean | null
      maxDeviation:    number | null  // mm
    }
  }
  trim: {
    flatInspection:        boolean | null
    flatInspectionNote:    string
    brakeLength:           boolean | null
    brakeLengthDeviation:  number | null  // mm
    groundInflation:       boolean | null
    groundInflationNote:   string
  }
  conclusion: {
    overallState:      OverallState | null
    repairsDone:       boolean | null
    repairsDoneDetail: string
    generalRemarks:    string
    inspectorName:     string
    completedAt:       string | null
  }
}

// ─── Valeurs par défaut ──────────────────────────────────────────────────────

function emptyVisualPanel(): VisualPanel {
  return {
    tears:                 null,
    stretchedZones:        null,
    wear:                  null,
    coatingDefect:         null,
    previousRepairs:       null,
    previousRepairsDetail: '',
  }
}

export function emptyWorkshopChecklist(): WorkshopChecklistPayload {
  return {
    version: 2,
    identification: {
      certificationLabelPresent: null,
      serialNumberVerified:      null,
    },
    canopy: {
      porosity: {
        instrument:   null,
        measurements: {
          centralCell:  null,
          cell5Left:    null,
          cell5Right:   null,
          cell10Left:   null,
          cell10Right:  null,
          trailingEdge: null,
        },
      },
      tearResistance: { extradosG: null, intradosG: null },
      visualExtrados: emptyVisualPanel(),
      visualIntrados: emptyVisualPanel(),
      internalRibs:   { seams: null, partitions: null, reinforcements: null },
    },
    risers: {
      generalState:     null,
      seams:            null,
      maillonsClosed:   null,
      speedSystem:      null,
      brakePulleys:     null,
      lengthsConform:   null,
      lengthsDeviation: null,
    },
    lines: {
      ruptureTests: [],
      visual: {
        seams:          null,
        sheathsIntact:  null,
        wearZones:      null,
        wearLocation:   '',
        lengthsConform: null,
        maxDeviation:   null,
      },
    },
    trim: {
      flatInspection:       null,
      flatInspectionNote:   '',
      brakeLength:          null,
      brakeLengthDeviation: null,
      groundInflation:      null,
      groundInflationNote:  '',
    },
    conclusion: {
      overallState:      null,
      repairsDone:       null,
      repairsDoneDetail: '',
      generalRemarks:    '',
      inspectorName:     '',
      completedAt:       null,
    },
  }
}

// Lit un payload depuis service_requests.workshop_checklist (Json). Si la
// version est différente de 2 (ancien payload, ou payload corrompu), on
// retourne un payload vide — on ne perd pas le ticket pour autant.
export function readWorkshopChecklist(raw: unknown): WorkshopChecklistPayload {
  if (raw && typeof raw === 'object' && (raw as Record<string, unknown>).version === 2) {
    // Merge avec le squelette vide pour que les nouveaux champs aient
    // toujours une valeur — robuste aux migrations partielles côté DB.
    return { ...emptyWorkshopChecklist(), ...(raw as Partial<WorkshopChecklistPayload>) }
  }
  return emptyWorkshopChecklist()
}

// ─── Échelle porosité ────────────────────────────────────────────────────────
//
// JDC          : >350s neuf · 150-350 bon · 40-150 usé · 10-40 très usé · <10 critique
// Kretschmer   : >800s neuf · 450-800 bon · 100-450 usé · 60-100 très usé · <60 critique
//
// Source : procédure AIRDESIGN. Plume aligne ses seuils sur cette grille.

export const POROSITY_THRESHOLDS = {
  jdc:        { newAbove: 350, goodAbove: 150, wornAbove: 40,  veryWornAbove: 10 },
  kretschmer: { newAbove: 800, goodAbove: 450, wornAbove: 100, veryWornAbove: 60 },
} as const

export function porositySeverity(
  seconds: number | null,
  instrument: Instrument | null,
): PorositySeverity | null {
  if (seconds == null || instrument == null) return null
  const t = POROSITY_THRESHOLDS[instrument]
  if (seconds >= t.newAbove)       return 'new'
  if (seconds >= t.goodAbove)      return 'good'
  if (seconds >= t.wornAbove)      return 'worn'
  if (seconds >= t.veryWornAbove)  return 'very_worn'
  return 'critical'
}

// Seuil de déclenchement de la résistance au déchirement (Bettsometer).
// Si la pire mesure de porosité est en dessous, on demande le test résistance.
export function shouldShowBettsometer(
  measurements: PorosityMeasurements,
  instrument: Instrument | null,
): boolean {
  if (!instrument) return false
  const trigger = instrument === 'jdc' ? 50 : 100
  const all = Object.values(measurements).filter((v): v is number => typeof v === 'number')
  if (all.length === 0) return false
  return Math.min(...all) < trigger
}

// Seuil minimal de tenue déchirure (Bettsometer)
export const TEAR_RESISTANCE_MIN_G = 600

// ─── Labels affichables ──────────────────────────────────────────────────────

export const POROSITY_LABELS: Record<PorositySeverity, string> = {
  new:       'Neuf',
  good:      'Bon',
  worn:      'Usé',
  very_worn: 'Très usé',
  critical:  'Critique',
}

export const POROSITY_EMOJI: Record<PorositySeverity, string> = {
  new:       '🟢',
  good:      '🟢',
  worn:      '🟡',
  very_worn: '🟠',
  critical:  '🔴',
}

export const OVERALL_STATE_LABELS: Record<OverallState, string> = {
  new:            'Neuf',
  good:           'Bon',
  worn_ok:        'Usé conforme',
  very_worn:      'Très usé — contrôle rapproché',
  not_airworthy:  'Non navigable',
}

// ─── Progression par section ─────────────────────────────────────────────────
//
// Pour chaque section, on compte les "slots renseignés / slots attendus" et
// on expose ça en badge UI. Un champ texte est considéré rempli si > 0 char ;
// un champ booléen / select si non null ; un nombre si non null.

function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  return true
}

export interface SectionProgress {
  filled: number
  total:  number
}

export function progressIdentification(p: WorkshopChecklistPayload['identification']): SectionProgress {
  const slots = [p.certificationLabelPresent, p.serialNumberVerified]
  return { filled: slots.filter(isFilled).length, total: slots.length }
}

export function progressCanopy(p: WorkshopChecklistPayload['canopy']): SectionProgress {
  const slots: unknown[] = [
    p.porosity.instrument,
    p.porosity.measurements.centralCell,
    p.porosity.measurements.cell5Left,
    p.porosity.measurements.cell5Right,
    p.porosity.measurements.cell10Left,
    p.porosity.measurements.cell10Right,
    p.porosity.measurements.trailingEdge,
    p.visualExtrados.tears, p.visualExtrados.stretchedZones, p.visualExtrados.wear,
    p.visualExtrados.coatingDefect, p.visualExtrados.previousRepairs,
    p.visualIntrados.tears, p.visualIntrados.stretchedZones, p.visualIntrados.wear,
    p.visualIntrados.coatingDefect, p.visualIntrados.previousRepairs,
    p.internalRibs.seams, p.internalRibs.partitions, p.internalRibs.reinforcements,
  ]
  return { filled: slots.filter(isFilled).length, total: slots.length }
}

export function progressRisers(p: WorkshopChecklistPayload['risers']): SectionProgress {
  const slots = [
    p.generalState, p.seams, p.maillonsClosed,
    p.speedSystem, p.brakePulleys, p.lengthsConform,
  ]
  return { filled: slots.filter(isFilled).length, total: slots.length }
}

export function progressLines(p: WorkshopChecklistPayload['lines']): SectionProgress {
  const visualSlots = [
    p.visual.seams, p.visual.sheathsIntact, p.visual.wearZones, p.visual.lengthsConform,
  ]
  const ruptureSlot = p.ruptureTests.length > 0 ? 1 : 0
  return {
    filled: visualSlots.filter(isFilled).length + ruptureSlot,
    total:  visualSlots.length + 1,
  }
}

export function progressTrim(p: WorkshopChecklistPayload['trim']): SectionProgress {
  const slots = [p.flatInspection, p.brakeLength, p.groundInflation]
  return { filled: slots.filter(isFilled).length, total: slots.length }
}

export function progressConclusion(p: WorkshopChecklistPayload['conclusion']): SectionProgress {
  const slots = [p.overallState, p.repairsDone, p.inspectorName]
  return { filled: slots.filter(isFilled).length, total: slots.length }
}

// ─── Validation Zod (server side) ────────────────────────────────────────────

const visualPanelSchema = z.object({
  tears:                 z.boolean().nullable(),
  stretchedZones:        z.boolean().nullable(),
  wear:                  z.boolean().nullable(),
  coatingDefect:         z.boolean().nullable(),
  previousRepairs:       z.boolean().nullable(),
  previousRepairsDetail: z.string().max(2000).default(''),
})

// On laisse Zod inférer le type (les .default('') créent un input
// `string | undefined` qui n'égale pas exactement WorkshopChecklistPayload).
// L'app utilise le type WorkshopChecklistPayload comme contrat source ;
// le schéma sert uniquement au check runtime côté server.
export const workshopChecklistPayloadSchema = z.object({
  version: z.literal(2),
  identification: z.object({
    certificationLabelPresent: z.boolean().nullable(),
    serialNumberVerified:      z.boolean().nullable(),
  }),
  canopy: z.object({
    porosity: z.object({
      instrument:   z.enum(['jdc', 'kretschmer']).nullable(),
      measurements: z.object({
        centralCell:  z.number().min(0).max(10000).nullable(),
        cell5Left:    z.number().min(0).max(10000).nullable(),
        cell5Right:   z.number().min(0).max(10000).nullable(),
        cell10Left:   z.number().min(0).max(10000).nullable(),
        cell10Right:  z.number().min(0).max(10000).nullable(),
        trailingEdge: z.number().min(0).max(10000).nullable(),
      }),
    }),
    tearResistance: z.object({
      extradosG: z.number().min(0).max(10000).nullable(),
      intradosG: z.number().min(0).max(10000).nullable(),
    }),
    visualExtrados: visualPanelSchema,
    visualIntrados: visualPanelSchema,
    internalRibs: z.object({
      seams:          z.enum(['good', 'defect']).nullable(),
      partitions:     z.enum(['good', 'defect']).nullable(),
      reinforcements: z.enum(['good', 'defect']).nullable(),
    }),
  }),
  risers: z.object({
    generalState:     z.enum(['good', 'worn', 'damaged']).nullable(),
    seams:            z.boolean().nullable(),
    maillonsClosed:   z.boolean().nullable(),
    speedSystem:      z.enum(['ok', 'ko', 'na']).nullable(),
    brakePulleys:     z.boolean().nullable(),
    lengthsConform:   z.boolean().nullable(),
    lengthsDeviation: z.number().min(0).max(1000).nullable(),
  }),
  lines: z.object({
    ruptureTests: z.array(z.object({
      line:         z.enum(['main_a', 'main_b', 'middle_a', 'middle_b', 'top_a', 'top_b']),
      ruptureValue: z.number().min(0).max(1000).nullable(),
      conform:      z.boolean().nullable(),
    })).max(20),
    visual: z.object({
      seams:          z.enum(['good', 'defect']).nullable(),
      sheathsIntact:  z.boolean().nullable(),
      wearZones:      z.boolean().nullable(),
      wearLocation:   z.string().max(500).default(''),
      lengthsConform: z.boolean().nullable(),
      maxDeviation:   z.number().min(0).max(1000).nullable(),
    }),
  }),
  trim: z.object({
    flatInspection:       z.boolean().nullable(),
    flatInspectionNote:   z.string().max(2000).default(''),
    brakeLength:          z.boolean().nullable(),
    brakeLengthDeviation: z.number().min(0).max(1000).nullable(),
    groundInflation:      z.boolean().nullable(),
    groundInflationNote:  z.string().max(2000).default(''),
  }),
  conclusion: z.object({
    overallState:      z.enum(['new', 'good', 'worn_ok', 'very_worn', 'not_airworthy']).nullable(),
    repairsDone:       z.boolean().nullable(),
    repairsDoneDetail: z.string().max(5000).default(''),
    generalRemarks:    z.string().max(5000).default(''),
    inspectorName:     z.string().max(200).default(''),
    completedAt:       z.string().nullable(),
  }),
})
