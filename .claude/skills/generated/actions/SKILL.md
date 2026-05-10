---
name: actions
description: "Skill for the Actions area of 15_Plume_SAV. 48 symbols across 25 files."
---

# Actions

48 symbols | 25 files | Cohesion: 74%

## When to Use

- Working with code in `apps/`
- Understanding how createClient, getClientUnreadTotal, getClientInboxThreads work
- Modifying actions-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/actions/shipping.ts` | clientShippingAddressOrNull, generatePlaceholderLabel, resolveSchoolAddress, resolveWorkshopAddress, resolveClientAddress (+1) |
| `apps/sav/features/tickets/actions/workshop.ts` | saveWorkshopChecklistAction, markWingReceivedWorkshopAction, startWorkshopDiagnosisAction, startWorkshopRepairAction, markWorkshopDoneAction |
| `apps/sav/features/tickets/actions/admin.ts` | assignWorkshopForCommunicationAction, ensurePlumeAdmin, adminReassignSchoolAction, adminCloseTicketAction, adminRemindSchoolAction |
| `apps/sav/app/(plume)/plume/AdminTicketActions.tsx` | handleReassign, handleClose, handleRemind |
| `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | ShippingLabelButton, buildFormData, handleGenerate |
| `apps/sav/features/tickets/messages-unread.ts` | getClientUnreadTotal, getClientInboxThreads |
| `apps/sav/features/tickets/messages-unread-workshop.ts` | getWorkshopUnreadTotal, getWorkshopInboxThreads |
| `apps/sav/features/tickets/messages-unread-school.ts` | getSchoolUnreadTotal, getSchoolInboxThreads |
| `apps/sav/features/auth/actions.ts` | loginAction, logoutAction |
| `apps/sav/features/tickets/actions/school.ts` | saveDiagnosisAction, saveSchoolChecklistAction |

## Entry Points

Start here when exploring this area:

- **`createClient`** (Function) — `apps/sav/lib/supabase/server.ts:10`
- **`getClientUnreadTotal`** (Function) — `apps/sav/features/tickets/messages-unread.ts:72`
- **`getClientInboxThreads`** (Function) — `apps/sav/features/tickets/messages-unread.ts:121`
- **`getWorkshopUnreadTotal`** (Function) — `apps/sav/features/tickets/messages-unread-workshop.ts:27`
- **`getWorkshopInboxThreads`** (Function) — `apps/sav/features/tickets/messages-unread-workshop.ts:58`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createClient` | Function | `apps/sav/lib/supabase/server.ts` | 10 |
| `getClientUnreadTotal` | Function | `apps/sav/features/tickets/messages-unread.ts` | 72 |
| `getClientInboxThreads` | Function | `apps/sav/features/tickets/messages-unread.ts` | 121 |
| `getWorkshopUnreadTotal` | Function | `apps/sav/features/tickets/messages-unread-workshop.ts` | 27 |
| `getWorkshopInboxThreads` | Function | `apps/sav/features/tickets/messages-unread-workshop.ts` | 58 |
| `getSchoolUnreadTotal` | Function | `apps/sav/features/tickets/messages-unread-school.ts` | 23 |
| `getSchoolInboxThreads` | Function | `apps/sav/features/tickets/messages-unread-school.ts` | 55 |
| `loginAction` | Function | `apps/sav/features/auth/actions.ts` | 15 |
| `logoutAction` | Function | `apps/sav/features/auth/actions.ts` | 45 |
| `handleSubmit` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 129 |
| `requestStatusToSavStatus` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 37 |
| `saveWorkshopChecklistAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 24 |
| `saveDiagnosisAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 31 |
| `saveSchoolChecklistAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 69 |
| `updateTicketStatusAction` | Function | `apps/sav/features/tickets/actions/messaging.ts` | 55 |
| `assignWorkshopForCommunicationAction` | Function | `apps/sav/features/tickets/actions/admin.ts` | 28 |
| `adminReassignSchoolAction` | Function | `apps/sav/features/tickets/actions/admin.ts` | 86 |
| `adminCloseTicketAction` | Function | `apps/sav/features/tickets/actions/admin.ts` | 130 |
| `adminRemindSchoolAction` | Function | `apps/sav/features/tickets/actions/admin.ts` | 194 |
| `WorkshopMessagesNavButton` | Function | `apps/sav/app/(workshop)/_components/WorkshopMessagesNavButton.tsx` | 4 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SchoolStepPanel → CreateClient` | cross_community | 7 |
| `SchoolStepPanel → EnrichWithCoords` | cross_community | 7 |
| `SchoolStepPanel → FormatSchoolAddress` | cross_community | 7 |
| `SchoolStepPanel → RequestStatusToSavStatus` | cross_community | 6 |
| `WorkshopStepPanel → CreateClient` | cross_community | 6 |
| `WorkshopStepPanel → EnrichWithCoords` | cross_community | 6 |
| `WorkshopStepPanel → FormatSchoolAddress` | cross_community | 6 |
| `WorkshopStepPanel → RequestStatusToSavStatus` | cross_community | 5 |
| `HandleReassign → CreateClient` | cross_community | 5 |
| `HandleClose → CreateClient` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Tickets | 4 calls |
| Auth | 1 calls |

## How to Explore

1. `gitnexus_context({name: "createClient"})` — see callers and callees
2. `gitnexus_query({query: "actions"})` — find related execution flows
3. Read key files listed above for implementation details
