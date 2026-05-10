---
name: wizard
description: "Skill for the Wizard area of 15_Plume_SAV. 15 symbols across 8 files."
---

# Wizard

15 symbols | 8 files | Cohesion: 96%

## When to Use

- Working with code in `apps/`
- Understanding how middleware, updateSession, onKey work
- Modifying wizard-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/components/wizard/TicketWizard.tsx` | go, next, back |
| `apps/sav/features/tickets/components/wizard/StepWingInfo.tsx` | formatModelName, StepWingInfo, selectWing |
| `apps/sav/features/tickets/components/wizard/StepPhotos.tsx` | StepPhotos, handlePhoto |
| `apps/sav/features/tickets/components/wizard/StepDescription.tsx` | StepDescription, stripBehaviorPrefix |
| `apps/sav/features/tickets/components/wizard/StepBehaviors.tsx` | StepBehaviors, toggle |
| `apps/sav/middleware.ts` | middleware |
| `apps/sav/lib/supabase/middleware.ts` | updateSession |
| `apps/sav/features/tickets/components/PhotoLightbox.tsx` | onKey |

## Entry Points

Start here when exploring this area:

- **`middleware`** (Function) — `apps/sav/middleware.ts:3`
- **`updateSession`** (Function) — `apps/sav/lib/supabase/middleware.ts:4`
- **`onKey`** (Function) — `apps/sav/features/tickets/components/PhotoLightbox.tsx:25`
- **`go`** (Function) — `apps/sav/features/tickets/components/wizard/TicketWizard.tsx:47`
- **`next`** (Function) — `apps/sav/features/tickets/components/wizard/TicketWizard.tsx:57`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `middleware` | Function | `apps/sav/middleware.ts` | 3 |
| `updateSession` | Function | `apps/sav/lib/supabase/middleware.ts` | 4 |
| `onKey` | Function | `apps/sav/features/tickets/components/PhotoLightbox.tsx` | 25 |
| `go` | Function | `apps/sav/features/tickets/components/wizard/TicketWizard.tsx` | 47 |
| `next` | Function | `apps/sav/features/tickets/components/wizard/TicketWizard.tsx` | 57 |
| `back` | Function | `apps/sav/features/tickets/components/wizard/TicketWizard.tsx` | 58 |
| `StepWingInfo` | Function | `apps/sav/features/tickets/components/wizard/StepWingInfo.tsx` | 20 |
| `selectWing` | Function | `apps/sav/features/tickets/components/wizard/StepWingInfo.tsx` | 27 |
| `StepPhotos` | Function | `apps/sav/features/tickets/components/wizard/StepPhotos.tsx` | 13 |
| `handlePhoto` | Function | `apps/sav/features/tickets/components/wizard/StepPhotos.tsx` | 17 |
| `StepDescription` | Function | `apps/sav/features/tickets/components/wizard/StepDescription.tsx` | 15 |
| `StepBehaviors` | Function | `apps/sav/features/tickets/components/wizard/StepBehaviors.tsx` | 12 |
| `toggle` | Function | `apps/sav/features/tickets/components/wizard/StepBehaviors.tsx` | 16 |
| `formatModelName` | Function | `apps/sav/features/tickets/components/wizard/StepWingInfo.tsx` | 12 |
| `stripBehaviorPrefix` | Function | `apps/sav/features/tickets/components/wizard/StepDescription.tsx` | 81 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Components | 1 calls |

## How to Explore

1. `gitnexus_context({name: "middleware"})` — see callers and callees
2. `gitnexus_query({query: "wizard"})` — find related execution flows
3. Read key files listed above for implementation details
