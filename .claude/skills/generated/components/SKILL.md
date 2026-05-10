---
name: components
description: "Skill for the Components area of 15_Plume_SAV. 18 symbols across 9 files."
---

# Components

18 symbols | 9 files | Cohesion: 94%

## When to Use

- Working with code in `apps/`
- Understanding how getSupabasePublicUrl, TicketCard, PhotoLightbox work
- Modifying components-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `apps/sav/features/tickets/components/ScanGateModal.tsx` | ScanGateModal, checkSerial, handleCameraDecode, handleManualConfirm |
| `apps/sav/features/tickets/components/ClientDeclarationView.tsx` | parseDescription, urgencyTone, ClientDeclarationView |
| `apps/sav/app/(plume)/plume/AdminTicketActions.tsx` | AdminTicketActions, close |
| `apps/sav/features/tickets/components/QRCameraScanner.tsx` | QRCameraScanner, startCamera |
| `apps/sav/features/tickets/components/PhotoCapture.tsx` | handleFile, handleInputChange |
| `apps/sav/features/tickets/components/DiagnosisChecklist.tsx` | DiagnosisChecklist, toggle |
| `apps/sav/features/tickets/utils.ts` | getSupabasePublicUrl |
| `apps/sav/features/tickets/components/TicketCard.tsx` | TicketCard |
| `apps/sav/features/tickets/components/PhotoLightbox.tsx` | PhotoLightbox |

## Entry Points

Start here when exploring this area:

- **`getSupabasePublicUrl`** (Function) — `apps/sav/features/tickets/utils.ts:22`
- **`TicketCard`** (Function) — `apps/sav/features/tickets/components/TicketCard.tsx:14`
- **`PhotoLightbox`** (Function) — `apps/sav/features/tickets/components/PhotoLightbox.tsx:11`
- **`AdminTicketActions`** (Function) — `apps/sav/app/(plume)/plume/AdminTicketActions.tsx:20`
- **`close`** (Function) — `apps/sav/app/(plume)/plume/AdminTicketActions.tsx:39`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getSupabasePublicUrl` | Function | `apps/sav/features/tickets/utils.ts` | 22 |
| `TicketCard` | Function | `apps/sav/features/tickets/components/TicketCard.tsx` | 14 |
| `PhotoLightbox` | Function | `apps/sav/features/tickets/components/PhotoLightbox.tsx` | 11 |
| `AdminTicketActions` | Function | `apps/sav/app/(plume)/plume/AdminTicketActions.tsx` | 20 |
| `close` | Function | `apps/sav/app/(plume)/plume/AdminTicketActions.tsx` | 39 |
| `ScanGateModal` | Function | `apps/sav/features/tickets/components/ScanGateModal.tsx` | 61 |
| `checkSerial` | Function | `apps/sav/features/tickets/components/ScanGateModal.tsx` | 78 |
| `handleCameraDecode` | Function | `apps/sav/features/tickets/components/ScanGateModal.tsx` | 83 |
| `handleManualConfirm` | Function | `apps/sav/features/tickets/components/ScanGateModal.tsx` | 96 |
| `ClientDeclarationView` | Function | `apps/sav/features/tickets/components/ClientDeclarationView.tsx` | 110 |
| `QRCameraScanner` | Function | `apps/sav/features/tickets/components/QRCameraScanner.tsx` | 40 |
| `startCamera` | Function | `apps/sav/features/tickets/components/QRCameraScanner.tsx` | 56 |
| `handleFile` | Function | `apps/sav/features/tickets/components/PhotoCapture.tsx` | 22 |
| `handleInputChange` | Function | `apps/sav/features/tickets/components/PhotoCapture.tsx` | 63 |
| `DiagnosisChecklist` | Function | `apps/sav/features/tickets/components/DiagnosisChecklist.tsx` | 22 |
| `toggle` | Function | `apps/sav/features/tickets/components/DiagnosisChecklist.tsx` | 39 |
| `parseDescription` | Function | `apps/sav/features/tickets/components/ClientDeclarationView.tsx` | 35 |
| `urgencyTone` | Function | `apps/sav/features/tickets/components/ClientDeclarationView.tsx` | 95 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Plume | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getSupabasePublicUrl"})` — see callers and callees
2. `gitnexus_query({query: "components"})` — find related execution flows
3. Read key files listed above for implementation details
