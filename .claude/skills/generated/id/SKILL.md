---
name: id
description: "Skill for the [id] area of 15_Plume_SAV. 9 symbols across 7 files."
---

# [id]

9 symbols | 7 files | Cohesion: 89%

## When to Use

- Working with code in `apps/`
- Understanding how addRoleMessageAction, handleSubmit, handleSubmit work
- Modifying [id]-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/app/(school)/school/ticket/[id]/SchoolActions.tsx` | handleSubmit, handleSend |
| `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | ReadOnlySummary, resolutionMeta |
| `apps/sav/features/tickets/actions.ts` | addRoleMessageAction |
| `apps/sav/features/tickets/components/PlumeNoteComposer.tsx` | handleSubmit |
| `apps/sav/app/(workshop)/workshop/messages/[id]/WorkshopMessageComposer.tsx` | handleSubmit |
| `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopActionBar.tsx` | handleSendMessage |
| `apps/sav/app/(school)/school/ticket/[id]/SchoolMessageComposer.tsx` | handleSubmit |

## Entry Points

Start here when exploring this area:

- **`addRoleMessageAction`** (Function) — `apps/sav/features/tickets/actions.ts:484`
- **`handleSubmit`** (Function) — `apps/sav/features/tickets/components/PlumeNoteComposer.tsx:50`
- **`handleSubmit`** (Function) — `apps/sav/app/(workshop)/workshop/messages/[id]/WorkshopMessageComposer.tsx:20`
- **`handleSendMessage`** (Function) — `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopActionBar.tsx:61`
- **`handleSubmit`** (Function) — `apps/sav/app/(school)/school/ticket/[id]/SchoolMessageComposer.tsx:22`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `addRoleMessageAction` | Function | `apps/sav/features/tickets/actions.ts` | 484 |
| `handleSubmit` | Function | `apps/sav/features/tickets/components/PlumeNoteComposer.tsx` | 50 |
| `handleSubmit` | Function | `apps/sav/app/(workshop)/workshop/messages/[id]/WorkshopMessageComposer.tsx` | 20 |
| `handleSendMessage` | Function | `apps/sav/app/(workshop)/workshop/ticket/[id]/WorkshopActionBar.tsx` | 61 |
| `handleSubmit` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolMessageComposer.tsx` | 22 |
| `handleSubmit` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolActions.tsx` | 157 |
| `handleSend` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolActions.tsx` | 257 |
| `ReadOnlySummary` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 365 |
| `resolutionMeta` | Function | `apps/sav/app/(school)/school/ticket/[id]/SchoolResolutionPanel.tsx` | 401 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Tickets | 1 calls |
| Auth | 1 calls |

## How to Explore

1. `gitnexus_context({name: "addRoleMessageAction"})` — see callers and callees
2. `gitnexus_query({query: "[id]"})` — find related execution flows
3. Read key files listed above for implementation details
