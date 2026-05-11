---
name: tickets
description: "Skill for the Tickets area of 15_Plume_SAV. 94 symbols across 50 files."
---

# Tickets

94 symbols | 50 files | Cohesion: 69%

## When to Use

- Working with code in `apps/`
- Understanding how createClient, getSchoolTickets, getWorkshopTickets work
- Modifying tickets-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/queries.ts` | attachPhotosToList, getSchoolTickets, getWorkshopTickets, toNumber, normaliseSchool (+12) |
| `apps/sav/features/tickets/email.ts` | escapeHtml, escapeBlock, urgencyLabel, clientConfirmationHTML, schoolNotificationHTML (+4) |
| `apps/sav/features/tickets/messages-unread.ts` | getClientUnreadTotal, getClientInboxThreads, readLastReadAt, attachUnreadCounts |
| `apps/sav/features/tickets/actions/school.ts` | saveDiagnosisAction, saveSchoolChecklistAction, applySchoolResolutionAction |
| `apps/sav/app/(plume)/plume/page.tsx` | daysSince, findStagnantTickets, PlumeDashboardPage |
| `apps/sav/features/tickets/messages-unread-plume.ts` | loadReadMap, getPlumeUnreadTotal, getPlumeInboxThreads |
| `apps/sav/features/tickets/utils.ts` | statusGte, buildJourneySteps, getStatusStep |
| `apps/sav/features/tickets/messages-unread-workshop.ts` | getWorkshopUnreadTotal, getWorkshopInboxThreads |
| `apps/sav/features/tickets/messages-unread-school.ts` | getSchoolUnreadTotal, getSchoolInboxThreads |
| `apps/sav/features/auth/queries.ts` | getCurrentUserSchool, getCurrentUserWorkshop |

## Entry Points

Start here when exploring this area:

- **`createClient`** (Function) — `apps/sav/lib/supabase/server.ts:10`
- **`getSchoolTickets`** (Function) — `apps/sav/features/tickets/queries.ts:414`
- **`getWorkshopTickets`** (Function) — `apps/sav/features/tickets/queries.ts:452`
- **`getClientUnreadTotal`** (Function) — `apps/sav/features/tickets/messages-unread.ts:72`
- **`getClientInboxThreads`** (Function) — `apps/sav/features/tickets/messages-unread.ts:121`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `createClient` | Function | `apps/sav/lib/supabase/server.ts` | 10 |
| `getSchoolTickets` | Function | `apps/sav/features/tickets/queries.ts` | 414 |
| `getWorkshopTickets` | Function | `apps/sav/features/tickets/queries.ts` | 452 |
| `getClientUnreadTotal` | Function | `apps/sav/features/tickets/messages-unread.ts` | 72 |
| `getClientInboxThreads` | Function | `apps/sav/features/tickets/messages-unread.ts` | 121 |
| `getWorkshopUnreadTotal` | Function | `apps/sav/features/tickets/messages-unread-workshop.ts` | 27 |
| `getWorkshopInboxThreads` | Function | `apps/sav/features/tickets/messages-unread-workshop.ts` | 58 |
| `getSchoolUnreadTotal` | Function | `apps/sav/features/tickets/messages-unread-school.ts` | 23 |
| `getSchoolInboxThreads` | Function | `apps/sav/features/tickets/messages-unread-school.ts` | 55 |
| `getCurrentUserSchool` | Function | `apps/sav/features/auth/queries.ts` | 53 |
| `getCurrentUserWorkshop` | Function | `apps/sav/features/auth/queries.ts` | 111 |
| `loginAction` | Function | `apps/sav/features/auth/actions.ts` | 15 |
| `logoutAction` | Function | `apps/sav/features/auth/actions.ts` | 45 |
| `handleSubmit` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 129 |
| `saveWorkshopChecklistAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 24 |
| `saveDiagnosisAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 31 |
| `saveSchoolChecklistAction` | Function | `apps/sav/features/tickets/actions/school.ts` | 69 |
| `assignWorkshopForCommunicationAction` | Function | `apps/sav/features/tickets/actions/admin.ts` | 28 |
| `WorkshopMessagesNavButton` | Function | `apps/sav/app/(workshop)/_components/WorkshopMessagesNavButton.tsx` | 4 |
| `WorkshopPage` | Function | `apps/sav/app/(workshop)/workshop/page.tsx` | 6 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SchoolStepPanel → CreateClient` | cross_community | 7 |
| `SchoolStepPanel → EnrichWithCoords` | cross_community | 7 |
| `SchoolStepPanel → FormatSchoolAddress` | cross_community | 7 |
| `WorkshopStepPanel → CreateClient` | cross_community | 6 |
| `WorkshopStepPanel → EnrichWithCoords` | cross_community | 6 |
| `WorkshopStepPanel → FormatSchoolAddress` | cross_community | 6 |
| `WorkshopStepPanel → RequestStatusToSavStatus` | cross_community | 5 |
| `HandleSubmit → ToNumber` | cross_community | 5 |
| `HandleSubmit → EscapeHtml` | cross_community | 5 |
| `HandleReassign → CreateClient` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Auth | 4 calls |
| Messages | 3 calls |
| Plume | 3 calls |
| Actions | 1 calls |

## How to Explore

1. `gitnexus_context({name: "createClient"})` — see callers and callees
2. `gitnexus_query({query: "tickets"})` — find related execution flows
3. Read key files listed above for implementation details
