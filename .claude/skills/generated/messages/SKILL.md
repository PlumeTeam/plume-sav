---
name: messages
description: "Skill for the Messages area of 15_Plume_SAV. 10 symbols across 7 files."
---

# Messages

10 symbols | 7 files | Cohesion: 82%

## When to Use

- Working with code in `apps/`
- Understanding how formatDateTime, buildLocationEvents, WingLocationCard work
- Modifying messages-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/components/WingLocationCard.tsx` | buildGlsUrl, buildLocationEvents, WingLocationCard |
| `apps/sav/app/(plume)/plume/messages/page.tsx` | plumeTargetUrl, PlumeThreadRow |
| `apps/sav/features/tickets/utils.ts` | formatDateTime |
| `apps/sav/features/tickets/components/CommentThread.tsx` | CommentThread |
| `apps/sav/app/(workshop)/workshop/messages/page.tsx` | WorkshopThreadRow |
| `apps/sav/app/(school)/school/messages/page.tsx` | SchoolThreadRow |
| `apps/sav/app/(client)/client/messages/page.tsx` | ThreadRow |

## Entry Points

Start here when exploring this area:

- **`formatDateTime`** (Function) — `apps/sav/features/tickets/utils.ts:11`
- **`buildLocationEvents`** (Function) — `apps/sav/features/tickets/components/WingLocationCard.tsx:44`
- **`WingLocationCard`** (Function) — `apps/sav/features/tickets/components/WingLocationCard.tsx:144`
- **`CommentThread`** (Function) — `apps/sav/features/tickets/components/CommentThread.tsx:19`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `formatDateTime` | Function | `apps/sav/features/tickets/utils.ts` | 11 |
| `buildLocationEvents` | Function | `apps/sav/features/tickets/components/WingLocationCard.tsx` | 44 |
| `WingLocationCard` | Function | `apps/sav/features/tickets/components/WingLocationCard.tsx` | 144 |
| `CommentThread` | Function | `apps/sav/features/tickets/components/CommentThread.tsx` | 19 |
| `buildGlsUrl` | Function | `apps/sav/features/tickets/components/WingLocationCard.tsx` | 39 |
| `WorkshopThreadRow` | Function | `apps/sav/app/(workshop)/workshop/messages/page.tsx` | 54 |
| `SchoolThreadRow` | Function | `apps/sav/app/(school)/school/messages/page.tsx` | 54 |
| `plumeTargetUrl` | Function | `apps/sav/app/(plume)/plume/messages/page.tsx` | 53 |
| `PlumeThreadRow` | Function | `apps/sav/app/(plume)/plume/messages/page.tsx` | 57 |
| `ThreadRow` | Function | `apps/sav/app/(client)/client/messages/page.tsx` | 56 |

## How to Explore

1. `gitnexus_context({name: "formatDateTime"})` — see callers and callees
2. `gitnexus_query({query: "messages"})` — find related execution flows
3. Read key files listed above for implementation details
