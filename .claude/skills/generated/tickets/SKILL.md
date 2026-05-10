---
name: tickets
description: "Skill for the Tickets area of 15_Plume_SAV. 97 symbols across 51 files."
---

# Tickets

97 symbols | 51 files | Cohesion: 72%

## When to Use

- Working with code in `apps/`
- Understanding how createClient, loginAction, logoutAction work
- Modifying tickets-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/queries.ts` | getClientWings, getClientTickets, toNumber, normaliseSchool, enrichWithCoords (+12) |
| `apps/sav/features/tickets/email.ts` | escapeHtml, escapeBlock, urgencyLabel, clientConfirmationHTML, schoolNotificationHTML (+2) |
| `apps/sav/features/tickets/actions/admin.ts` | assignWorkshopForCommunicationAction, ensurePlumeAdmin, adminReassignSchoolAction, adminCloseTicketAction, adminRemindSchoolAction |
| `apps/sav/features/tickets/messages-unread.ts` | readLastReadAt, attachUnreadCounts, getClientUnreadTotal, getClientInboxThreads |
| `apps/sav/app/(plume)/plume/AdminTicketActions.tsx` | handleReassign, handleClose, handleRemind |
| `apps/sav/app/(plume)/plume/page.tsx` | daysSince, findStagnantTickets, PlumeDashboardPage |
| `apps/sav/features/tickets/messages-unread-plume.ts` | loadReadMap, getPlumeUnreadTotal, getPlumeInboxThreads |
| `apps/sav/features/tickets/utils.ts` | statusGte, buildJourneySteps, getStatusStep |
| `apps/sav/features/auth/actions.ts` | loginAction, logoutAction |
| `apps/sav/features/tickets/messages-unread-workshop.ts` | getWorkshopUnreadTotal, getWorkshopInboxThreads |

## Entry Points

Start here when exploring this area:

- **`createClient`** (Function) — `apps/sav/lib/supabase/server.ts:10`
- **`loginAction`** (Function) — `apps/sav/features/auth/actions.ts:15`
- **`logoutAction`** (Function) — `apps/sav/features/auth/actions.ts:45`
- **`getClientWings`** (Function) — `apps/sav/features/tickets/queries.ts:336`
- **`getClientTickets`** (Function) — `apps/sav/features/tickets/queries.ts:373`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createClient` | Function | `apps/sav/lib/supabase/server.ts` | 10 |
| `loginAction` | Function | `apps/sav/features/auth/actions.ts` | 15 |
| `logoutAction` | Function | `apps/sav/features/auth/actions.ts` | 45 |
| `getClientWings` | Function | `apps/sav/features/tickets/queries.ts` | 336 |
| `getClientTickets` | Function | `apps/sav/features/tickets/queries.ts` | 373 |
| `attachUnreadCounts` | Function | `apps/sav/features/tickets/messages-unread.ts` | 28 |
| `getClientUnreadTotal` | Function | `apps/sav/features/tickets/messages-unread.ts` | 72 |
| `getClientInboxThreads` | Function | `apps/sav/features/tickets/messages-unread.ts` | 121 |
| `getWorkshopUnreadTotal` | Function | `apps/sav/features/tickets/messages-unread-workshop.ts` | 27 |
| `getWorkshopInboxThreads` | Function | `apps/sav/features/tickets/messages-unread-workshop.ts` | 58 |
| `getSchoolUnreadTotal` | Function | `apps/sav/features/tickets/messages-unread-school.ts` | 23 |
| `getSchoolInboxThreads` | Function | `apps/sav/features/tickets/messages-unread-school.ts` | 55 |
| `handleSubmit` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 129 |
| `requestStatusToSavStatus` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 37 |
| `saveWorkshopChecklistAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 24 |
| `saveDiagnosisAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 31 |
| `saveSchoolChecklistAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 69 |
| `updateTicketStatusAction` | Function | `apps/sav/features/tickets/actions/messaging.ts` | 55 |
| `assignWorkshopForCommunicationAction` | Function | `apps/sav/features/tickets/actions/admin.ts` | 28 |
| `adminReassignSchoolAction` | Function | `apps/sav/features/tickets/actions/admin.ts` | 86 |

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
| `HandleSubmit → ToNumber` | cross_community | 5 |
| `HandleSubmit → EscapeHtml` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Auth | 5 calls |
| Messages | 3 calls |
| Plume | 3 calls |
| Actions | 2 calls |

## How to Explore

1. `gitnexus_context({name: "createClient"})` — see callers and callees
2. `gitnexus_query({query: "tickets"})` — find related execution flows
3. Read key files listed above for implementation details
