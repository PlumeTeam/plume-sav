---
name: id
description: "Skill for the [id] area of 15_Plume_SAV. 24 symbols across 12 files."
---

# [id]

24 symbols | 12 files | Cohesion: 81%

## When to Use

- Working with code in `apps/`
- Understanding how sendClientStepUpdateEmail, resolutionToRequestStatus, applySchoolResolutionAction work
- Modifying [id]-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | SchoolResolutionPanel, resolveSubmissionPayload, handleSubmit, labelForChoice, ReadOnlySummary (+1) |
| `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | SchoolStepPanel, executeStep, handleStep, handleScanSuccess |
| `apps/sav/features/tickets/actions/school.ts` | applySchoolResolutionAction, markWingReceivedSchoolAction, startSchoolCheckAction |
| `apps/sav/features/tickets/email.ts` | stepUpdateHTML, sendClientStepUpdateEmail |
| `apps/sav/app/(school)/school/ticket/[id]/SchoolActions.tsx` | handleSubmit, handleSend |
| `apps/sav/features/tickets/actions/_helpers.ts` | resolutionToRequestStatus |
| `apps/sav/features/tickets/actions/lifecycle.ts` | acknowledgeTicketAction |
| `apps/sav/features/tickets/actions/messaging.ts` | addRoleMessageAction |
| `apps/sav/features/tickets/components/PlumeNoteComposer.tsx` | handleSubmit |
| `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopActionBar.tsx` | handleSendMessage |

## Entry Points

Start here when exploring this area:

- **`sendClientStepUpdateEmail`** (Function) — `apps/sav/features/tickets/email.ts:410`
- **`resolutionToRequestStatus`** (Function) — `apps/sav/features/tickets/actions/_helpers.ts:10`
- **`applySchoolResolutionAction`** (Function) — `apps/sav/features/tickets/actions/school.ts:95`
- **`SchoolResolutionPanel`** (Function) — `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx:84`
- **`resolveSubmissionPayload`** (Function) — `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx:106`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `sendClientStepUpdateEmail` | Function | `apps/sav/features/tickets/email.ts` | 410 |
| `resolutionToRequestStatus` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 10 |
| `applySchoolResolutionAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 95 |
| `SchoolResolutionPanel` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 84 |
| `resolveSubmissionPayload` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 106 |
| `handleSubmit` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 121 |
| `markWingReceivedSchoolAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 246 |
| `startSchoolCheckAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 265 |
| `acknowledgeTicketAction` | Function | `apps/sav/features/tickets/actions/lifecycle.ts` | 23 |
| `SchoolStepPanel` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | 83 |
| `executeStep` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | 95 |
| `handleStep` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | 121 |
| `handleScanSuccess` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolStepPanel.tsx` | 130 |
| `addRoleMessageAction` | Function | `apps/sav/features/tickets/actions/messaging.ts` | 110 |
| `handleSubmit` | Function | `apps/sav/features/tickets/components/PlumeNoteComposer.tsx` | 50 |
| `handleSendMessage` | Function | `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopActionBar.tsx` | 61 |
| `handleSubmit` | Function | `apps/sav/app/(workshop)/workshop/messages/[id]/WorkshopMessageComposer.tsx` | 20 |
| `handleSubmit` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolMessageComposer.tsx` | 22 |
| `stepUpdateHTML` | Function | `apps/sav/features/tickets/email.ts` | 367 |
| `labelForChoice` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 353 |

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
| `HandleSubmit → ResolutionToRequestStatus` | intra_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Tickets | 4 calls |
| Actions | 3 calls |
| Auth | 1 calls |
| Messages | 1 calls |

## How to Explore

1. `gitnexus_context({name: "sendClientStepUpdateEmail"})` — see callers and callees
2. `gitnexus_query({query: "[id]"})` — find related execution flows
3. Read key files listed above for implementation details
