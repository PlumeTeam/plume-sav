---
name: actions
description: "Skill for the Actions area of 15_Plume_SAV. 31 symbols across 12 files."
---

# Actions

31 symbols | 12 files | Cohesion: 71%

## When to Use

- Working with code in `apps/`
- Understanding how ShippingLabelButton, buildFormData, handleGenerate work
- Modifying actions-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/actions/shipping.ts` | clientShippingAddressOrNull, generatePlaceholderLabel, resolveSchoolAddress, resolveWorkshopAddress, resolveClientAddress (+1) |
| `apps/sav/features/tickets/actions/workshop.ts` | markWingReceivedWorkshopAction, startWorkshopDiagnosisAction, startWorkshopRepairAction, markWorkshopDoneAction |
| `apps/sav/features/tickets/actions/_helpers.ts` | deriveServiceType, formatWingHistory, buildRichDescription, requestStatusToSavStatus |
| `apps/sav/features/tickets/actions/admin.ts` | ensurePlumeAdmin, adminReassignSchoolAction, adminRemindSchoolAction, adminCloseTicketAction |
| `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | ShippingLabelButton, buildFormData, handleGenerate |
| `apps/sav/app/(plume)/plume/AdminTicketActions.tsx` | handleReassign, handleRemind, handleClose |
| `apps/sav/features/tickets/actions/lifecycle.ts` | markWingReturnedAction, markTicketCompletedAction |
| `apps/sav/features/tickets/actions/_step-advance.ts` | advanceTicketStep |
| `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopStepPanel.tsx` | handleStep |
| `apps/sav/features/tickets/email.ts` | sendSchoolNotificationEmail |

## Entry Points

Start here when exploring this area:

- **`ShippingLabelButton`** (Function) — `apps/sav/features/tickets/components/ShippingLabelButton.tsx:51`
- **`buildFormData`** (Function) — `apps/sav/features/tickets/components/ShippingLabelButton.tsx:84`
- **`handleGenerate`** (Function) — `apps/sav/features/tickets/components/ShippingLabelButton.tsx:97`
- **`generateSavShippingLabelAction`** (Function) — `apps/sav/features/tickets/actions/shipping.ts:153`
- **`advanceTicketStep`** (Function) — `apps/sav/features/tickets/actions/_step-advance.ts:36`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ShippingLabelButton` | Function | `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | 51 |
| `buildFormData` | Function | `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | 84 |
| `handleGenerate` | Function | `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | 97 |
| `generateSavShippingLabelAction` | Function | `apps/sav/features/tickets/actions/shipping.ts` | 153 |
| `advanceTicketStep` | Function | `apps/sav/features/tickets/actions/_step-advance.ts` | 36 |
| `markWingReceivedWorkshopAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 50 |
| `startWorkshopDiagnosisAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 66 |
| `startWorkshopRepairAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 82 |
| `markWorkshopDoneAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 97 |
| `markWingReturnedAction` | Function | `apps/sav/features/tickets/actions/lifecycle.ts` | 40 |
| `markTicketCompletedAction` | Function | `apps/sav/features/tickets/actions/lifecycle.ts` | 67 |
| `handleStep` | Function | `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopStepPanel.tsx` | 93 |
| `sendSchoolNotificationEmail` | Function | `apps/sav/features/tickets/email.ts` | 242 |
| `deriveServiceType` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 30 |
| `formatWingHistory` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 112 |
| `buildRichDescription` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 150 |
| `createTicketAction` | Function | `apps/sav/features/tickets/actions/creation.ts` | 33 |
| `adminReassignSchoolAction` | Function | `apps/sav/features/tickets/actions/admin.ts` | 86 |
| `adminRemindSchoolAction` | Function | `apps/sav/features/tickets/actions/admin.ts` | 194 |
| `handleReassign` | Function | `apps/sav/app/(plume)/plume/AdminTicketActions.tsx` | 45 |

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
| Tickets | 16 calls |
| Auth | 1 calls |

## How to Explore

1. `gitnexus_context({name: "ShippingLabelButton"})` — see callers and callees
2. `gitnexus_query({query: "actions"})` — find related execution flows
3. Read key files listed above for implementation details
