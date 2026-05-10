---
name: tickets
description: "Skill for the Tickets area of 15_Plume_SAV. 77 symbols across 36 files."
---

# Tickets

77 symbols | 36 files | Cohesion: 72%

## When to Use

- Working with code in `apps/`
- Understanding how getPartnerSchoolById, getTicketDetail, markTicketReadByClientAction work
- Modifying tickets-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/queries.ts` | toNumber, normaliseSchool, enrichWithCoords, formatSchoolAddress, getPartnerSchoolById (+12) |
| `apps/sav/features/tickets/email.ts` | escapeHtml, escapeBlock, urgencyLabel, clientConfirmationHTML, schoolNotificationHTML (+5) |
| `apps/sav/features/tickets/actions/_helpers.ts` | deriveServiceType, formatWingHistory, buildRichDescription, resolutionToRequestStatus |
| `apps/sav/app/(plume)/plume/page.tsx` | daysSince, findStagnantTickets, PlumeDashboardPage |
| `apps/sav/features/tickets/messages-unread-plume.ts` | loadReadMap, getPlumeUnreadTotal, getPlumeInboxThreads |
| `apps/sav/features/tickets/utils.ts` | statusGte, buildJourneySteps, getStatusStep |
| `apps/sav/app/(client)/client/ticket-created/[id]/page.tsx` | readClientShippingAddress, TicketCreatedPage |
| `apps/sav/app/(client)/client/ticket/[id]/page.tsx` | readClientShippingAddress, TicketDetailPage |
| `apps/sav/features/auth/identity.ts` | stringOrNull, resolveClientIdentity |
| `apps/sav/features/tickets/messages-unread.ts` | readLastReadAt, attachUnreadCounts |

## Entry Points

Start here when exploring this area:

- **`getPartnerSchoolById`** (Function) — `apps/sav/features/tickets/queries.ts:197`
- **`getTicketDetail`** (Function) — `apps/sav/features/tickets/queries.ts:392`
- **`markTicketReadByClientAction`** (Function) — `apps/sav/features/tickets/messages-actions.ts:17`
- **`TicketCreatedPage`** (Function) — `apps/sav/app/(client)/client/ticket-created/[id]/page.tsx:26`
- **`TicketDetailPage`** (Function) — `apps/sav/app/(client)/client/ticket/[id]/page.tsx:29`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getPartnerSchoolById` | Function | `apps/sav/features/tickets/queries.ts` | 197 |
| `getTicketDetail` | Function | `apps/sav/features/tickets/queries.ts` | 392 |
| `markTicketReadByClientAction` | Function | `apps/sav/features/tickets/messages-actions.ts` | 17 |
| `TicketCreatedPage` | Function | `apps/sav/app/(client)/client/ticket-created/[id]/page.tsx` | 26 |
| `TicketDetailPage` | Function | `apps/sav/app/(client)/client/ticket/[id]/page.tsx` | 29 |
| `ClientConversationPage` | Function | `apps/sav/app/(client)/client/messages/[id]/page.tsx` | 13 |
| `sendClientConfirmationEmail` | Function | `apps/sav/features/tickets/email.ts` | 221 |
| `sendSchoolNotificationEmail` | Function | `apps/sav/features/tickets/email.ts` | 242 |
| `deriveServiceType` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 30 |
| `formatWingHistory` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 112 |
| `buildRichDescription` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 150 |
| `createTicketAction` | Function | `apps/sav/features/tickets/actions/creation.ts` | 33 |
| `getPartnerSchools` | Function | `apps/sav/features/tickets/queries.ts` | 81 |
| `getClientWings` | Function | `apps/sav/features/tickets/queries.ts` | 336 |
| `getAllTickets` | Function | `apps/sav/features/tickets/queries.ts` | 499 |
| `getTicketStats` | Function | `apps/sav/features/tickets/queries.ts` | 517 |
| `resolveClientIdentity` | Function | `apps/sav/features/auth/identity.ts` | 33 |
| `PlumeDashboardPage` | Function | `apps/sav/app/(plume)/plume/page.tsx` | 83 |
| `ClientPage` | Function | `apps/sav/app/(client)/client/page.tsx` | 9 |
| `NewTicketPage` | Function | `apps/sav/app/(wizard)/client/new-ticket/page.tsx` | 5 |

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
| `TicketDetailPage → ToNumber` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Actions | 22 calls |
| Auth | 4 calls |
| Messages | 3 calls |
| Plume | 3 calls |

## How to Explore

1. `gitnexus_context({name: "getPartnerSchoolById"})` — see callers and callees
2. `gitnexus_query({query: "tickets"})` — find related execution flows
3. Read key files listed above for implementation details
