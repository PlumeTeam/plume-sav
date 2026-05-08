'use client'

import 'leaflet/dist/leaflet.css'
import { useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { PartnerWorkshop } from '../constants'

// Leaflet's default marker URLs 404 when not bundled — rebind to unpkg.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Coral teardrop in two states — the picker only ever shows affiliated workshops.
function teardrop(opts: { fill: string; ring?: string; shadow?: string; size?: number }) {
  const size   = opts.size ?? 32
  const ring   = opts.ring   ? `border:3px solid ${opts.ring};` : ''
  const shadow = opts.shadow ? `box-shadow:${opts.shadow};`     : ''
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${opts.fill};
      ${ring}
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      ${shadow}
    "></div>`,
    className: '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size - 2],
  })
}

const SELECTED_ICON = teardrop({ fill: '#C97D18', ring: '#fff', shadow: '0 4px 12px -2px rgba(201,125,24,0.6)' })
const DEFAULT_ICON  = teardrop({ fill: '#C97D18' })

interface WorkshopMapPickerProps {
  workshops:  PartnerWorkshop[]
  selectedId: string | null
  onSelect:   (id: string) => void
}

export default function WorkshopMapPicker({ workshops, selectedId, onSelect }: WorkshopMapPickerProps) {
  const placeable = useMemo(
    () => workshops.filter((w) =>
      typeof w.lat === 'number' && typeof w.lng === 'number'
    ),
    [workshops]
  )

  const center: [number, number] = useMemo(() => {
    const sel = placeable.find((w) => w.id === selectedId)
    if (sel) return [sel.lat, sel.lng]
    if (placeable.length === 0) return [45.5, 6.0]
    const lat = placeable.reduce((a, w) => a + w.lat, 0) / placeable.length
    const lng = placeable.reduce((a, w) => a + w.lng, 0) / placeable.length
    return [lat, lng]
  }, [placeable, selectedId])

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-brand-stone">
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '320px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnSelect center={center} />
        {placeable.map((w) => {
          const isSelected = w.id === selectedId
          return (
            <Marker
              key={w.id}
              position={[w.lat, w.lng]}
              icon={isSelected ? SELECTED_ICON : DEFAULT_ICON}
              eventHandlers={{ click: () => onSelect(w.id) }}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <p style={{ fontWeight: 600, color: '#3A3A3A', margin: 0 }}>{w.label}</p>
                  <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {[w.city, w.region].filter(Boolean).join(' · ')}
                  </p>
                  {w.address && (
                    <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                      {w.address}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelect(w.id)}
                    style={{
                      marginTop: 8,
                      padding: '6px 12px',
                      background: isSelected ? '#10b981' : '#C97D18',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    {isSelected ? '✓ Sélectionné' : 'Choisir cet atelier'}
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

function RecenterOnSelect({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 8), { duration: 0.5 })
  }, [map, center])
  return null
}
