'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WizardWingInfo, WizardWingHistory, WizardProblem, WizardPhoto } from './types'

// Conversational flow — one question per screen.
// The actual sequence shown is computed by buildWizardFlow() based on the
// user's answers (e.g. 'behaviors' is skipped for visual problems).
export type StepId =
  | 'wing'
  | 'wing-history'
  | 'problem-category'
  | 'behaviors'
  | 'description'
  | 'urgency'
  | 'photos'
  | 'school'
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
  'delivery':         "Remise de l'aile",
  'message':          "Message à l'école",
  'review':           'Récapitulatif',
}

export function buildWizardFlow(problemCategory: string | undefined): StepId[] {
  const flow: StepId[] = ['wing', 'wing-history', 'problem-category']
  if (problemCategory === 'other') flow.push('behaviors')
  flow.push('description', 'urgency', 'photos', 'school', 'delivery', 'message', 'review')
  return flow
}

interface WizardState {
  currentStepId: StepId
  wingInfo: WizardWingInfo
  wingHistory: WizardWingHistory
  problem: WizardProblem
  photos: WizardPhoto[]
  // Files are NOT persisted — only previews (data URLs) survive a page refresh
  _photoFiles: File[]
}

interface WizardActions {
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
  referentSchoolId: null,
  schoolChangeReasonCode: undefined,
  schoolChangeReasonNote: undefined,
  deliveryMethod: undefined,
}

const defaultWingHistory: WizardWingHistory = {}

const defaultState: WizardState = {
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
      // Bumped to v2 when the wizard switched from index-based to id-based steps.
      name: 'plume-ticket-wizard-draft-v2',
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
        currentStepId: state.currentStepId,
        wingInfo: state.wingInfo,
        wingHistory: state.wingHistory,
        problem: state.problem,
        photos: state.photos,
      }),
    }
  )
)
