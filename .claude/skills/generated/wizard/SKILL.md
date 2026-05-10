---
name: wizard
description: "Skill for the Wizard area of 15_Plume_SAV. 29 symbols across 15 files."
---

# Wizard

29 symbols | 15 files | Cohesion: 95%

## When to Use

- Working with code in `apps/`
- Understanding how createClient, LoginForm, handleCreateTicket work
- Modifying wizard-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/components/wizard/WingScanCard.tsx` | reset, WingScanCard, findWingBySerial, resolveSerial, handleCameraDecode (+1) |
| `apps/sav/features/tickets/components/wizard/TicketWizard.tsx` | cancel, go, next, back |
| `apps/sav/features/tickets/components/wizard/StepWingInfo.tsx` | formatModelName, StepWingInfo, selectWing, handleScanResolved |
| `apps/sav/features/tickets/components/wizard/StepPhotos.tsx` | StepPhotos, handlePhoto |
| `apps/sav/features/tickets/components/wizard/StepDescription.tsx` | StepDescription, stripBehaviorPrefix |
| `apps/sav/features/tickets/components/wizard/StepBehaviors.tsx` | StepBehaviors, toggle |
| `apps/sav/lib/supabase/client.ts` | createClient |
| `apps/sav/features/auth/components/LoginForm.tsx` | LoginForm |
| `apps/sav/features/tickets/components/WingCard.tsx` | handleCreateTicket |
| `apps/sav/features/tickets/actions/messaging.ts` | addMessageAction |

## Entry Points

Start here when exploring this area:

- **`createClient`** (Function) — `apps/sav/lib/supabase/client.ts:4`
- **`LoginForm`** (Function) — `apps/sav/features/auth/components/LoginForm.tsx:12`
- **`handleCreateTicket`** (Function) — `apps/sav/features/tickets/components/WingCard.tsx:14`
- **`addMessageAction`** (Function) — `apps/sav/features/tickets/actions/messaging.ts:27`
- **`reset`** (Function) — `apps/sav/features/tickets/components/wizard/WingScanCard.tsx:95`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createClient` | Function | `apps/sav/lib/supabase/client.ts` | 4 |
| `LoginForm` | Function | `apps/sav/features/auth/components/LoginForm.tsx` | 12 |
| `handleCreateTicket` | Function | `apps/sav/features/tickets/components/WingCard.tsx` | 14 |
| `addMessageAction` | Function | `apps/sav/features/tickets/actions/messaging.ts` | 27 |
| `reset` | Function | `apps/sav/features/tickets/components/wizard/WingScanCard.tsx` | 95 |
| `cancel` | Function | `apps/sav/features/tickets/components/wizard/TicketWizard.tsx` | 60 |
| `handleSubmit` | Function | `apps/sav/features/tickets/components/wizard/StepReview.tsx` | 31 |
| `action` | Function | `apps/sav/app/(client)/client/ticket/[id]/MessageForm.tsx` | 17 |
| `middleware` | Function | `apps/sav/middleware.ts` | 3 |
| `updateSession` | Function | `apps/sav/lib/supabase/middleware.ts` | 4 |
| `onKey` | Function | `apps/sav/features/tickets/components/PhotoLightbox.tsx` | 25 |
| `go` | Function | `apps/sav/features/tickets/components/wizard/TicketWizard.tsx` | 47 |
| `next` | Function | `apps/sav/features/tickets/components/wizard/TicketWizard.tsx` | 57 |
| `back` | Function | `apps/sav/features/tickets/components/wizard/TicketWizard.tsx` | 58 |
| `WingScanCard` | Function | `apps/sav/features/tickets/components/wizard/WingScanCard.tsx` | 61 |
| `findWingBySerial` | Function | `apps/sav/features/tickets/components/wizard/WingScanCard.tsx` | 64 |
| `resolveSerial` | Function | `apps/sav/features/tickets/components/wizard/WingScanCard.tsx` | 69 |
| `handleCameraDecode` | Function | `apps/sav/features/tickets/components/wizard/WingScanCard.tsx` | 82 |
| `runDemoScan` | Function | `apps/sav/features/tickets/components/wizard/WingScanCard.tsx` | 89 |
| `StepWingInfo` | Function | `apps/sav/features/tickets/components/wizard/StepWingInfo.tsx` | 21 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleSubmit → StringOrNull` | cross_community | 4 |
| `HandleSubmit → FormatWingHistory` | cross_community | 4 |
| `Action → CreateClient` | cross_community | 3 |
| `HandleSubmit → CreateClient` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Tickets | 1 calls |
| Components | 1 calls |
| Actions | 1 calls |

## How to Explore

1. `gitnexus_context({name: "createClient"})` — see callers and callees
2. `gitnexus_query({query: "wizard"})` — find related execution flows
3. Read key files listed above for implementation details
