'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WizardWingInfo, WizardWingHistory, WizardProblem, WizardPhoto, RequestType } from './types'

// Conversational flow — one question per screen.
// The actual sequence shown is computed by buildWizardFlow() based on the
// user's request type, problem category, and warranty status.
export type StepId =
  | 'wing'
  | 'wing-history'
  | 'problem-category'
  | 'behaviors'
  | 'description'
  | 'urgency'
  | 'photos'
  | 'school'
  | 'workshop'
  | 'delivery'
  | 'message'
  | 'review'

export const STEP_LABELS: Record<StepId, string> = {
  'wing':             'Votre aile',
  'wing-history':     "Historique de l'aile",
  'problem-category': 'Type de problème',
  'behaviors':        'Comportements',
  'description':      'Description',
  'urgency':          'Urgence',
  'photos':           'Photos',
  'school':           'École partenaire',
  'workshop':         'Atelier',
  'delivery':         "Remise de l'aile",
  'message':          'Message',
  'review':           'Récapitulatif',
}

// Durée de la garantie standard (en années). Migration warranty au-delà de 2 ans
// jusqu'à 3 ans → également pris en charge sous garantie étendue. Au-delà, le
// défaut de fabrication doit être routé vers un atelier.
export const WARRANTY_YEARS  = 2
export const EXTENDED_WARRANTY_YEARS = 3

export interface WarrantyStatus {
  /** True when la garantie standard est encore valide (< 2 ans). */
  underWarranty:         boolean
  /** True quand l'aile est entre 2 et 3 ans → garantie étendue. */
  underExtendedWarranty: boolean
  /** True quand purchaseDate > 3 ans → hors garantie. */
  outOfWarranty:         boolean
  /** Années écoulées (arrondi inférieur). null si purchaseDate invalide. */
  yearsSincePurchase:    number | null
}

export function computeWarranty(purchaseDate: string | null | undefined): WarrantyStatus {
  if (!purchaseDate) {
    return { underWarranty: false, underExtendedWarranty: false, outOfWarranty: false, yearsSincePurchase: null }
  }
  const ts = Date.parse(purchaseDate)
  if (Number.isNaN(ts)) {
    return { underWarranty: false, underExtendedWarranty: false, outOfWarranty: false, yearsSincePurchase: null }
  }
  const now    = Date.now()
  const years  = (now - ts) / (1000 * 60 * 60 * 24 * 365.25)
  const yearsFloor = Math.max(0, Math.floor(years))
  return {
    underWarranty:         years <  WARRANTY_YEARS,
    underExtendedWarranty: years >= WARRANTY_YEARS && years <  EXTENDED_WARRANTY_YEARS,
    outOfWarranty:         years >= EXTENDED_WARRANTY_YEARS,
    yearsSincePurchase:    yearsFloor,
  }
}

interface BuildFlowOptions {
  requestType:     RequestType
  problemCategory?: string
  purchaseDate?:   string | null
}

// buildWizardFlow décide la séquence d'étapes selon le type de demande
// (+ la garantie pour 'manufacturing_defect'). L'étape 'wing-history'
// (heures de vol, conditions subies) est demandée pour les 3 types :
// l'atelier en a besoin même pour une réparation ponctuelle.
//
// - repair               : aile → historique → description+photos → atelier → livraison → message → récap
// - inspection           : aile → historique → atelier → livraison → message → récap
// - manufacturing_defect : aile → description+photos → comportements → historique
//                           → (école si sous garantie standard/étendue) OU (atelier sinon)
//                           → livraison → message → récap
export function buildWizardFlow(opts: BuildFlowOptions): StepId[] {
  const { requestType, purchaseDate } = opts

  if (requestType === 'repair') {
    return ['wing', 'wing-history', 'description', 'photos', 'workshop', 'delivery', 'message', 'review']
  }

  if (requestType === 'inspection') {
    return ['wing', 'wing-history', 'workshop', 'delivery', 'message', 'review']
  }

  // manufacturing_defect — Sous garantie (standard ou étendue) → école Plume,
  // hors garantie (> 3 ans) → atelier directement.
  const warranty = computeWarranty(purchaseDate)
  const destination: StepId = warranty.outOfWarranty ? 'workshop' : 'school'

  return [
    'wing',
    'description',
    'photos',
    'behaviors',
    'wing-history',
    destination,
    'delivery',
    'message',
    'review',
  ]
}

interface WizardState {
  /** Type de demande SAV — set au démarrage du wizard depuis l'URL (?type=). */
  requestType:   RequestType
  currentStepId: StepId
  wingInfo: WizardWingInfo
  wingHistory: WizardWingHistory
  problem: WizardProblem
  photos: WizardPhoto[]
  // Files are NOT persisted — only previews (data URLs) survive a page refresh
  _photoFiles: File[]
}

interface WizardActions {
  setRequestType: (type: RequestType) => void
  setStepId: (id: StepId) => void
  setWingInfo: (info: Partial<WizardWingInfo>) => void
  setWingHistory: (history: Partial<WizardWingHistory>) => void
  setProblem: (problem: Partial<WizardProblem>) => void
  addPhoto: (photo: WizardPhoto, file: File) => void
  removePhoto: (index: number) => void
  updatePhotoType: (index: number, photoType: WizardPhoto['photoType']) => void
  setPhotoFiles: (files: File[]) => void
  reset: () => void
}

const defaultWingInfo: WizardWingInfo = {
  wingBrand: '',
  wingModel: '',
  wingSize: '',
  wingSerial: '',
  wingColor: '',
  purchaseDate: '',
  flightHours: '',
}

const defaultProblem: WizardProblem = {
  problemCategory: '',
  problemDescription: '',
  urgency: 'normal',
  wingBehaviors: [],
  partnerSchoolId: undefined,
  partnerWorkshopId: undefined,
  referentSchoolId: null,
  schoolChangeReasonCode: undefined,
  schoolChangeReasonNote: undefined,
  deliveryMethod: undefined,
}

const defaultWingHistory: WizardWingHistory = {}

const defaultState: WizardState = {
  requestType: 'manufacturing_defect',
  currentStepId: 'wing',
  wingInfo: defaultWingInfo,
  wingHistory: defaultWingHistory,
  problem: defaultProblem,
  photos: [],
  _photoFiles: [],
}

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set) => ({
      ...defaultState,

      setRequestType: (type) => set({ requestType: type }),

      setStepId: (id) => set({ currentStepId: id }),

      setWingInfo: (info) =>
        set((s) => ({ wingInfo: { ...s.wingInfo, ...info } })),

      setWingHistory: (history) =>
        set((s) => ({ wingHistory: { ...s.wingHistory, ...history } })),

      setProblem: (problem) =>
        set((s) => ({ problem: { ...s.problem, ...problem } })),

      addPhoto: (photo, file) =>
        set((s) => ({
          photos: [...s.photos, photo],
          _photoFiles: [...s._photoFiles, file],
        })),

      removePhoto: (index) =>
        set((s) => ({
          photos: s.photos.filter((_, i) => i !== index),
          _photoFiles: s._photoFiles.filter((_, i) => i !== index),
        })),

      updatePhotoType: (index, photoType) =>
        set((s) => ({
          photos: s.photos.map((p, i) => (i === index ? { ...p, photoType } : p)),
        })),

      setPhotoFiles: (files) => set({ _photoFiles: files }),

      reset: () => set(defaultState),
    }),
    {
      // v3 : surfaceContact array (multi-select), requestType + partnerWorkshopId
      // pour les 3 flows (repair / inspection / manufacturing_defect). v2 drafts
      // auto-discarded — acceptable en mode démo, pas de vrai client.
      name: 'plume-ticket-wizard-draft-v3',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          }
        }
        return localStorage
      }),
      // Don't persist File objects (non-serializable)
      partialize: (state) => ({
        requestType: state.requestType,
        currentStepId: state.currentStepId,
        wingInfo: state.wingInfo,
        wingHistory: state.wingHistory,
        problem: state.problem,
        photos: state.photos,
      }),
    }
  )
)
