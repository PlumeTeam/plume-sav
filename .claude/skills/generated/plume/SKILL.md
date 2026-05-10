---
name: plume
description: "Skill for the Plume area of 15_Plume_SAV. 4 symbols across 3 files."
---

# Plume

4 symbols | 3 files | Cohesion: 60%

## When to Use

- Working with code in `apps/`
- Understanding how formatDate, AdminTicketTable, resetAndSet work
- Modifying plume-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/app/(plume)/plume/AdminTicketTable.tsx` | AdminTicketTable, resetAndSet |
| `apps/sav/features/tickets/utils.ts` | formatDate |
| `apps/sav/app/(workshop)/workshop/WorkshopKanban.tsx` | WorkshopTicketCard |

## Entry Points

Start here when exploring this area:

- **`formatDate`** (Function) — `apps/sav/features/tickets/utils.ts:2`
- **`AdminTicketTable`** (Function) — `apps/sav/app/(plume)/plume/AdminTicketTable.tsx:29`
- **`resetAndSet`** (Function) — `apps/sav/app/(plume)/plume/AdminTicketTable.tsx:93`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `formatDate` | Function | `apps/sav/features/tickets/utils.ts` | 2 |
| `AdminTicketTable` | Function | `apps/sav/app/(plume)/plume/AdminTicketTable.tsx` | 29 |
| `resetAndSet` | Function | `apps/sav/app/(plume)/plume/AdminTicketTable.tsx` | 93 |
| `WorkshopTicketCard` | Function | `apps/sav/app/(workshop)/workshop/WorkshopKanban.tsx` | 200 |

## How to Explore

1. `gitnexus_context({name: "formatDate"})` — see callers and callees
2. `gitnexus_query({query: "plume"})` — find related execution flows
3. Read key files listed above for implementation details
