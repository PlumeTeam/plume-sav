---
name: actions
description: "Skill for the Actions area of 15_Plume_SAV. 24 symbols across 10 files."
---

# Actions

24 symbols | 10 files | Cohesion: 77%

## When to Use

- Working with code in `apps/`
- Understanding how generateSavShippingLabelAction, ShippingLabelButton, buildFormData work
- Modifying actions-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/actions/shipping.ts` | clientShippingAddressOrNull, generatePlaceholderLabel, resolveSchoolAddress, resolveWorkshopAddress, resolveClientAddress (+1) |
| `apps/sav/features/tickets/actions/workshop.ts` | markWingReceivedWorkshopAction, startWorkshopDiagnosisAction, startWorkshopRepairAction, markWorkshopDoneAction |
| `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | ShippingLabelButton, buildFormData, handleGenerate |
| `apps/sav/features/tickets/actions/_helpers.ts` | deriveServiceType, formatWingHistory, buildRichDescription |
| `apps/sav/features/tickets/actions/lifecycle.ts` | markWingReturnedAction, markTicketCompletedAction |
| `apps/sav/features/auth/identity.ts` | stringOrNull, resolveClientIdentity |
| `apps/sav/features/tickets/actions/_step-advance.ts` | advanceTicketStep |
| `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopStepPanel.tsx` | handleStep |
| `apps/sav/features/tickets/email.ts` | sendSchoolNotificationEmail |
| `apps/sav/features/tickets/actions/creation.ts` | createTicketAction |

## Entry Points

Start here when exploring this area:

- **`generateSavShippingLabelAction`** (Function) — `apps/sav/features/tickets/actions/shipping.ts:153`
- **`ShippingLabelButton`** (Function) — `apps/sav/features/tickets/components/ShippingLabelButton.tsx:51`
- **`buildFormData`** (Function) — `apps/sav/features/tickets/components/ShippingLabelButton.tsx:84`
- **`handleGenerate`** (Function) — `apps/sav/features/tickets/components/ShippingLabelButton.tsx:97`
- **`advanceTicketStep`** (Function) — `apps/sav/features/tickets/actions/_step-advance.ts:36`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `generateSavShippingLabelAction` | Function | `apps/sav/features/tickets/actions/shipping.ts` | 153 |
| `ShippingLabelButton` | Function | `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | 51 |
| `buildFormData` | Function | `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | 84 |
| `handleGenerate` | Function | `apps/sav/features/tickets/components/ShippingLabelButton.tsx` | 97 |
| `advanceTicketStep` | Function | `apps/sav/features/tickets/actions/_step-advance.ts` | 36 |
| `markWingReceivedWorkshopAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 50 |
| `startWorkshopDiagnosisAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 66 |
| `startWorkshopRepairAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 82 |
| `markWorkshopDoneAction` | Function | `apps/sav/features/tickets/actions/workshop.ts` | 97 |
| `markWingReturnedAction` | Function | `apps/sav/features/tickets/actions/lifecycle.ts` | 40 |
| `markTicketCompletedAction` | Function | `apps/sav/features/tickets/actions/lifecycle.ts` | 67 |
| `handleStep` | Function | `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopStepPanel.tsx` | 93 |
| `resolveClientIdentity` | Function | `apps/sav/features/auth/identity.ts` | 33 |
| `sendSchoolNotificationEmail` | Function | `apps/sav/features/tickets/email.ts` | 242 |
| `deriveServiceType` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 30 |
| `formatWingHistory` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 112 |
| `buildRichDescription` | Function | `apps/sav/features/tickets/actions/_helpers.ts` | 150 |
| `createTicketAction` | Function | `apps/sav/features/tickets/actions/creation.ts` | 33 |
| `clientShippingAddressOrNull` | Function | `apps/sav/features/tickets/actions/shipping.ts` | 61 |
| `generatePlaceholderLabel` | Function | `apps/sav/features/tickets/actions/shipping.ts` | 77 |

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
| `HandleSubmit → StringOrNull` | cross_community | 4 |
| `HandleSubmit → FormatWingHistory` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Tickets | 9 calls |
| [id] | 1 calls |

## How to Explore

1. `gitnexus_context({name: "generateSavShippingLabelAction"})` — see callers and callees
2. `gitnexus_query({query: "actions"})` — find related execution flows
3. Read key files listed above for implementation details
