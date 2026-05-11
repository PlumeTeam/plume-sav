---
name: id
description: "Skill for the [id] area of 15_Plume_SAV. 20 symbols across 10 files."
---

# [id]

20 symbols | 10 files | Cohesion: 83%

## When to Use

- Working with code in `apps/`
- Understanding how markWingReceivedSchoolAction, startSchoolCheckAction, acknowledgeTicketAction work
- Modifying [id]-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | SchoolResolutionPanel, resolveSubmissionPayload, handleSubmit, labelForChoice, ReadOnlySummary (+1) |
| `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | SchoolStepPanel, executeStep, handleStep, handleScanSuccess |
| `apps/sav/features/tickets/actions/school.ts` | markWingReceivedSchoolAction, startSchoolCheckAction |
| `apps/sav/app/(school)/school/ticket/[id]/SchoolActions.tsx` | handleSubmit, handleSend |
| `apps/sav/features/tickets/actions/lifecycle.ts` | acknowledgeTicketAction |
| `apps/sav/features/tickets/actions/messaging.ts` | addRoleMessageAction |
| `apps/sav/features/tickets/components/PlumeNoteComposer.tsx` | handleSubmit |
| `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopActionBar.tsx` | handleSendMessage |
| `apps/sav/app/(workshop)/workshop/messages/[id]/WorkshopMessageComposer.tsx` | handleSubmit |
| `apps/sav/app/(school)/school/ticket/[id]/SchoolMessageComposer.tsx` | handleSubmit |

## Entry Points

Start here when exploring this area:

- **`markWingReceivedSchoolAction`** (Function) — `apps/sav/features/tickets/actions/school.ts:246`
- **`startSchoolCheckAction`** (Function) — `apps/sav/features/tickets/actions/school.ts:265`
- **`acknowledgeTicketAction`** (Function) — `apps/sav/features/tickets/actions/lifecycle.ts:23`
- **`SchoolStepPanel`** (Function) — `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx:104`
- **`executeStep`** (Function) — `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx:119`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `markWingReceivedSchoolAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 246 |
| `startSchoolCheckAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 265 |
| `acknowledgeTicketAction` | Function | `apps/sav/features/tickets/actions/lifecycle.ts` | 23 |
| `SchoolStepPanel` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | 104 |
| `executeStep` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | 119 |
| `handleStep` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | 153 |
| `handleScanSuccess` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | 162 |
| `addRoleMessageAction` | Function | `apps/sav/features/tickets/actions/messaging.ts` | 110 |
| `handleSubmit` | Function | `apps/sav/features/tickets/components/PlumeNoteComposer.tsx` | 50 |
| `handleSendMessage` | Function | `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopActionBar.tsx` | 61 |
| `handleSubmit` | Function | `apps/sav/app/(workshop)/workshop/messages/[id]/WorkshopMessageComposer.tsx` | 20 |
| `handleSubmit` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolMessageComposer.tsx` | 22 |
| `SchoolResolutionPanel` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 84 |
| `resolveSubmissionPayload` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 106 |
| `handleSubmit` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 121 |
| `handleSubmit` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolActions.tsx` | 157 |
| `handleSend` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolActions.tsx` | 257 |
| `labelForChoice` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 353 |
| `ReadOnlySummary` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 365 |
| `resolutionMeta` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 401 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SchoolStepPanel → CreateClient` | cross_community | 7 |
| `SchoolStepPanel → EnrichWithCoords` | cross_community | 7 |
| `SchoolStepPanel → FormatSchoolAddress` | cross_community | 7 |
| `SchoolStepPanel → RequestStatusToSavStatus` | cross_community | 6 |
| `HandleSubmit → ToNumber` | cross_community | 5 |
| `HandleSubmit → EscapeHtml` | cross_community | 5 |
| `HandleSubmit → CreateClient` | cross_community | 4 |
| `HandleSubmit → EnrichWithCoords` | cross_community | 4 |
| `HandleSubmit → FormatSchoolAddress` | cross_community | 4 |
| `HandleSendMessage → CreateClient` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Actions | 3 calls |
| Tickets | 2 calls |
| Auth | 1 calls |
| Messages | 1 calls |

## How to Explore

1. `gitnexus_context({name: "markWingReceivedSchoolAction"})` — see callers and callees
2. `gitnexus_query({query: "[id]"})` — find related execution flows
3. Read key files listed above for implementation details
