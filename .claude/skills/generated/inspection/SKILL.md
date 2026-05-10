---
name: inspection
description: "Skill for the Inspection area of 15_Plume_SAV. 7 symbols across 2 files."
---

# Inspection

7 symbols | 2 files | Cohesion: 100%

## When to Use

- Working with code in `apps/`
- Understanding how showRipstopHint, CheckWizard, go work
- Modifying inspection-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/inspection/CheckWizard.tsx` | CheckWizard, go, skipPhase2, skipPhase3, toneClasses (+1) |
| `apps/sav/features/tickets/inspection/steps.ts` | showRipstopHint |

## Entry Points

Start here when exploring this area:

- **`showRipstopHint`** (Function) — `apps/sav/features/tickets/inspection/steps.ts:128`
- **`CheckWizard`** (Function) — `apps/sav/features/tickets/inspection/CheckWizard.tsx:60`
- **`go`** (Function) — `apps/sav/features/tickets/inspection/CheckWizard.tsx:80`
- **`skipPhase2`** (Function) — `apps/sav/features/tickets/inspection/CheckWizard.tsx:89`
- **`skipPhase3`** (Function) — `apps/sav/features/tickets/inspection/CheckWizard.tsx:93`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `showRipstopHint` | Function | `apps/sav/features/tickets/inspection/steps.ts` | 128 |
| `CheckWizard` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 60 |
| `go` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 80 |
| `skipPhase2` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 89 |
| `skipPhase3` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 93 |
| `toneClasses` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 677 |
| `SegmentedChoice` | Function | `apps/sav/features/tickets/inspection/CheckWizard.tsx` | 695 |

## How to Explore

1. `gitnexus_context({name: "showRipstopHint"})` — see callers and callees
2. `gitnexus_query({query: "inspection"})` — find related execution flows
3. Read key files listed above for implementation details
