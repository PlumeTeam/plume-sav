---
name: auth
description: "Skill for the Auth area of 15_Plume_SAV. 7 symbols across 6 files."
---

# Auth

7 symbols | 6 files | Cohesion: 67%

## When to Use

- Working with code in `apps/`
- Understanding how getCurrentUser, getCurrentUserRoles, WorkshopLayout work
- Modifying auth-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/auth/queries.ts` | getCurrentUser, getCurrentUserRoles |
| `apps/sav/app/(workshop)/layout.tsx` | WorkshopLayout |
| `apps/sav/app/(school)/layout.tsx` | SchoolLayout |
| `apps/sav/app/(plume)/layout.tsx` | PlumeLayout |
| `apps/sav/app/(client)/layout.tsx` | ClientLayout |
| `apps/sav/app/(select-dashboard)/select-dashboard/page.tsx` | SelectDashboardPage |

## Entry Points

Start here when exploring this area:

- **`getCurrentUser`** (Function) — `apps/sav/features/auth/queries.ts:19`
- **`getCurrentUserRoles`** (Function) — `apps/sav/features/auth/queries.ts:25`
- **`WorkshopLayout`** (Function) — `apps/sav/app/(workshop)/layout.tsx:9`
- **`SchoolLayout`** (Function) — `apps/sav/app/(school)/layout.tsx:9`
- **`PlumeLayout`** (Function) — `apps/sav/app/(plume)/layout.tsx:5`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getCurrentUser` | Function | `apps/sav/features/auth/queries.ts` | 19 |
| `getCurrentUserRoles` | Function | `apps/sav/features/auth/queries.ts` | 25 |
| `WorkshopLayout` | Function | `apps/sav/app/(workshop)/layout.tsx` | 9 |
| `SchoolLayout` | Function | `apps/sav/app/(school)/layout.tsx` | 9 |
| `PlumeLayout` | Function | `apps/sav/app/(plume)/layout.tsx` | 5 |
| `ClientLayout` | Function | `apps/sav/app/(client)/layout.tsx` | 7 |
| `SelectDashboardPage` | Function | `apps/sav/app/(select-dashboard)/select-dashboard/page.tsx` | 25 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `HandleReassign → CreateClient` | cross_community | 5 |
| `HandleClose → CreateClient` | cross_community | 5 |
| `HandleRemind → CreateClient` | cross_community | 5 |
| `HandleSendMessage → CreateClient` | cross_community | 4 |
| `HandleSubmit → CreateClient` | cross_community | 4 |
| `WorkshopLayout → CreateClient` | cross_community | 3 |
| `SchoolLayout → CreateClient` | cross_community | 3 |
| `SelectDashboardPage → CreateClient` | cross_community | 3 |
| `PlumeLayout → CreateClient` | cross_community | 3 |
| `ClientLayout → CreateClient` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Tickets | 4 calls |

## How to Explore

1. `gitnexus_context({name: "getCurrentUser"})` — see callers and callees
2. `gitnexus_query({query: "auth"})` — find related execution flows
3. Read key files listed above for implementation details
