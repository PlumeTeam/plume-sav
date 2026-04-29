'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WizardWingInfo, WizardProblem, WizardPhoto, ProblemCategory, UrgencyLevel } from './types'

interface WizardState {
  currentStep: number
  wingInfo: WizardWingInfo
  problem: WizardProblem
  photos: WizardPhoto[]
  // Files are NOT persisted — only previews (data URLs) survive a page refresh
  _photoFiles: File[]
}

interface WizardActions {
  setStep: (step: number) => void
  setWingInfo: (info: Partial<WizardWingInfo>) => void
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
}

const defaultState: WizardState = {
  currentStep: 1,
  wingInfo: defaultWingInfo,
  problem: defaultProblem,
  photos: [],
  _photoFiles: [],
}

export const useWizardStore = create<WizardState & WizardActions>()(
  persist(
    (set) => ({
      ...defaultState,

      setStep: (step) => set({ currentStep: step }),

      setWingInfo: (info) =>
        set((s) => ({ wingInfo: { ...s.wingInfo, ...info } })),

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
      name: 'plume-ticket-wizard-draft',
      storage: createJSONStorage(() => {
        // Safe access: localStorage may not be available during SSR
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
        currentStep: state.currentStep,
        wingInfo: state.wingInfo,
        problem: state.problem,
        photos: state.photos,
      }),
    }
  )
)
