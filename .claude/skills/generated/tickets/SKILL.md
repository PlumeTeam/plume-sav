---
name: tickets
description: "Skill for the Tickets area of 15_Plume_SAV. 138 symbols across 54 files."
---

# Tickets

138 symbols | 54 files | Cohesion: 74%

## When to Use

- Working with code in `apps/`
- Understanding how createClient, getClientUnreadTotal, getClientInboxThreads work
- Modifying tickets-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/actions.ts` | requestStatusToSavStatus, addMessageAction, updateTicketStatusAction, saveDiagnosisAction, saveSchoolChecklistAction (+28) |
| `apps/sav/features/tickets/queries.ts` | toNumber, normaliseSchool, enrichWithCoords, formatSchoolAddress, getPartnerSchoolById (+12) |
| `apps/sav/features/tickets/email.ts` | escapeHtml, escapeBlock, urgencyLabel, clientConfirmationHTML, schoolNotificationHTML (+5) |
| `apps/sav/features/tickets/messages-unread.ts` | getClientUnreadTotal, getClientInboxThreads, readLastReadAt, attachUnreadCounts |
| `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | SchoolResolutionPanel, resolveSubmissionPayload, handleSubmit, labelForChoice |
| `apps/sav/app/(plume)/plume/AdminTicketActions.tsx` | handleReassign, handleClose, handleRemind |
| `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | ShippingLabelButton, buildFormData, handleGenerate |
| `apps/sav/app/(plume)/plume/page.tsx` | daysSince, findStagnantTickets, PlumeDashboardPage |
| `apps/sav/features/tickets/messages-unread-plume.ts` | loadReadMap, getPlumeUnreadTotal, getPlumeInboxThreads |
| `apps/sav/features/tickets/utils.ts` | statusGte, buildJourneySteps, getStatusStep |

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
| `addMessageAction` | Function | `apps/sav/features/tickets/actions.ts` | 401 |
| `updateTicketStatusAction` | Function | `apps/sav/features/tickets/actions.ts` | 429 |
| `saveDiagnosisAction` | Function | `apps/sav/features/tickets/actions.ts` | 552 |
| `saveSchoolChecklistAction` | Function | `apps/sav/features/tickets/actions.ts` | 590 |
| `saveWorkshopChecklistAction` | Function | `apps/sav/features/tickets/actions.ts` | 766 |
| `assignWorkshopForCommunicationAction` | Function | `apps/sav/features/tickets/actions.ts` | 1455 |
| `adminReassignSchoolAction` | Function | `apps/sav/features/tickets/actions.ts` | 1513 |
| `adminCloseTicketAction` | Function | `apps/sav/features/tickets/actions.ts` | 1557 |
| `adminRemindSchoolAction` | Function | `apps/sav/features/tickets/actions.ts` | 1621 |
| `loginAction` | Function | `apps/sav/features/auth/actions.ts` | 15 |
| `logoutAction` | Function | `apps/sav/features/auth/actions.ts` | 45 |
| `handleSubmit` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 129 |
| `WorkshopMessagesNavButton` | Function | `apps/sav/app/(workshop)/_components/WorkshopMessagesNavButton.tsx` | 4 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `SchoolStepPanel → CreateClient` | cross_community | 6 |
| `SchoolStepPanel → EnrichWithCoords` | cross_community | 6 |
| `SchoolStepPanel → FormatSchoolAddress` | cross_community | 6 |
| `WorkshopStepPanel → CreateClient` | cross_community | 6 |
| `WorkshopStepPanel → EnrichWithCoords` | cross_community | 6 |
| `WorkshopStepPanel → FormatSchoolAddress` | cross_community | 6 |
| `SchoolStepPanel → RequestStatusToSavStatus` | cross_community | 5 |
| `WorkshopStepPanel → RequestStatusToSavStatus` | cross_community | 5 |
| `HandleSubmit → ToNumber` | cross_community | 5 |
| `HandleSubmit → EscapeHtml` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Auth | 5 calls |
| Messages | 4 calls |
| Plume | 3 calls |

## How to Explore

1. `gitnexus_context({name: "createClient"})` — see callers and callees
2. `gitnexus_query({query: "tickets"})` — find related execution flows
3. Read key files listed above for implementation details
